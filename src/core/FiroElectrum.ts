import {Platform} from 'react-native';
import {
  AbstractElectrum,
  BalanceModel,
  TransactionModel,
  FullTransactionModel,
  MintMetadataModel,
  AnonymitySetModel,
} from './AbstractElectrum';
import {network} from './FiroNetwork';
import AsyncStorage from '@react-native-community/async-storage';
import {AppStorage} from '../app-storage';
import DefaultPreference from 'react-native-default-preference';
import ElectrumClient from 'electrum-client';
import reverse from 'buffer-reverse';
import Logger from '../utils/logger';

const bitcoin = require('bitcoinjs-lib');

type Peer = {
  host: string;
  tcp: string | null;
  ssl: string | null;
};

const hardcodedPeers: Peer[] = [
  {host: '95.179.164.13', tcp: '51001', ssl: null},
];

/**
 * Returns random hardcoded electrum server guaranteed to work
 * at the time of writing.
 *
 * @returns {Promise<{tcp, host}|*>}
 */
async function getRandomHardcodedPeer(): Promise<Peer> {
  var index = Math.ceil(hardcodedPeers.length * Math.random()) - 1;
  return hardcodedPeers[index];
}

async function getSavedPeer(): Promise<Peer | null> {
  await DefaultPreference.setName('org.firo.mobilewallet');
  const host = await AsyncStorage.getItem(AppStorage.ELECTRUM_HOST);
  const port = await AsyncStorage.getItem(AppStorage.ELECTRUM_TCP_PORT);
  const sslPort = await AsyncStorage.getItem(AppStorage.ELECTRUM_SSL_PORT);
  if (host && (port || sslPort)) {
    return {host: host, tcp: port, ssl: sslPort};
  }
  return null;
}

async function savePeer(peer?: Peer) {
  if (!peer) {
    return;
  }

  await DefaultPreference.setName('org.firo.mobilewallet');
  await DefaultPreference.set(AppStorage.ELECTRUM_HOST, peer.host);
  if (peer.tcp) {
    await DefaultPreference.set(AppStorage.ELECTRUM_TCP_PORT, peer.tcp);
  }
  if (peer.ssl) {
    await DefaultPreference.set(AppStorage.ELECTRUM_SSL_PORT, peer.ssl);
  }
}

export default class FiroElectrum implements AbstractElectrum {
  mainClient: ElectrumClient = undefined;
  mainConnected = false;
  wasConnectedAtLeastOnce = false;
  serverName = false;

  latestBlockheight: number | false = false;
  latestBlockheightTimestamp: number = 0;

  txhashHeightCache: Map<string, number> = new Map();

  listeners: Array<() => void> = [];

  getLatestBlockHeight(): number {
    return this.latestBlockheight === false ? -1 : this.latestBlockheight;
  }

  async connectMain() {
    let peer = await getSavedPeer();
    if (peer === null) {
      peer = await getRandomHardcodedPeer();
    }

    try {
      await savePeer(peer);
      // RNWidgetCenter.reloadAllTimelines();
    } catch (e) {
      // Must be running on Android
      Logger.error('electrum_wallet:connectMain', e);
    }

    try {
      Logger.info(
        'electrum_wallet:connectMain',
        `begin connection ${JSON.stringify(peer)}`,
      );
      this.mainClient = new ElectrumClient(
        peer.ssl || peer.tcp,
        peer.host,
        peer.ssl ? 'tls' : 'tcp',
      );
      this.mainClient.onError = function () {
        if (Platform.OS === 'android' && this.mainConnected) {
          // android sockets are buggy and dont always issue CLOSE event, which actually makes the persistence code to reconnect.
          // so lets do it manually, but only if we were previously connected (mainConnected), otherwise theres other
          // code which does connection retries
          this.mainClient.close();
          this.mainConnected = false;
          setTimeout(() => {
            this.connectMain();
          }, 500);
          Logger.info(
            'electrum_wallet:connectMain',
            'reconnecting after socket error',
          );
          return;
        }
        this.mainConnected = false;
      };
      const ver = await this.mainClient.initElectrum({
        client: 'firo',
        version: '1.4',
      });
      if (ver && ver[0]) {
        Logger.info('electrum_wallet:connectMain', `connected to ${ver}`);
        this.serverName = ver[0];
        this.mainConnected = true;
        this.wasConnectedAtLeastOnce = true;
        // AsyncStorage.setItem(storageKey, JSON.stringify(peers));  TODO: refactor
      }
    } catch (e) {
      this.mainConnected = false;
      Logger.error(
        'electrum_wallet:connectMain',
        JSON.stringify(peer) + ' ' + e,
      );
    }

    this.runSubscribeLoop();

    if (!this.mainConnected) {
      Logger.warn('electrum_wallet:connectMain', 'retry');
      this.mainClient.close && this.mainClient.close();
      setTimeout(() => {
        this.connectMain();
      }, 5000);
    }
  }

  private subscribeLoop = 0;
  private runSubscribeLoop() {
    Logger.info('electrum_wallet:runSubscribeLoop', 'start loop');
    clearInterval(this.subscribeLoop);
    this.subscribeLoop = setInterval(() => {
      this.checkForSubscribe();
    }, 5000);
  }

  private checkForSubscribe() {
    if (this.mainClient !== undefined && this.mainClient.status === 1) {
      if (
        this.mainClient.subscribe._events['blockchain.headers.subscribe'] ===
        undefined
      ) {
        this.subscribeHeaders();
      }
    }
  }

  private async subscribeHeaders() {
    Logger.info('electrum_wallet:subscribeHeaders', 'subscribe');
    this.mainClient.subscribe.on(
      'blockchain.headers.subscribe',
      (params: any) => {
        this.onHeaderChange(params[0]);
      },
    );
    const header = await this.mainClient.blockchainHeaders_subscribe();
    if (header && header.height) {
      this.onHeaderChange(header);
    }
  }

  private onHeaderChange(headerData: {height: number}) {
    if (this.latestBlockheight !== headerData.height) {
      this.latestBlockheight = headerData.height;
      this.latestBlockheightTimestamp = Math.floor(+new Date() / 1000);

      this.notifyListeners();
    }
  }

  private notifyListeners() {
    Logger.info(
      'electrum_wallet:notifyListeners',
      `listeners count ${this.listeners.length}`,
    );
    this.listeners.forEach(listener => {
      listener();
    });
  }

  addChangeListener(onChange: () => void): void {
    this.listeners.push(onChange);
  }

  removeChangeListener(onChange: () => void): void {
    this.listeners = this.listeners.filter(listener => {
      return listener !== onChange;
    });
  }

  async getBalanceByAddress(address: string): Promise<BalanceModel> {
    this.checkConnection('getBalanceByAddress');
    const script = bitcoin.address.toOutputScript(address, network);
    const hash = bitcoin.crypto.sha256(script);
    // eslint-disable-next-line no-undef
    const reversedHash = Buffer.from(reverse(hash));
    const balance = await this.mainClient.blockchainScripthash_getBalance(
      reversedHash.toString('hex'),
    );

    Logger.info('electrum_wallet:getBalanceByAddress', balance);
    return balance;
  }

  async getTransactionsByAddress(
    address: string,
  ): Promise<Array<TransactionModel>> {
    this.checkConnection('getTransactionsByAddress');
    const script = this.addressToScript(address);
    const hash = bitcoin.crypto.sha256(script);
    // eslint-disable-next-line no-undef
    const reversedHash = Buffer.from(reverse(hash));
    const history = await this.mainClient.blockchainScripthash_getHistory(
      reversedHash.toString('hex'),
    );
    // for (const h of history || []) {
    //   if (h.tx_hash) txhashHeightCache[h.tx_hash] = h.height; // cache tx height
    // }

    Logger.info('electrum_wallet:getTransactionsByAddress', history);
    return history;
  }

  async multiGetTransactionsByAddress(
    addresses: Array<string>,
    batchsize: number = 200,
  ): Promise<{ [address: string]: TransactionModel[] }> {
    this.checkConnection('multiGetTransactionsByAddress');

    const ret: { [address: string]: TransactionModel[] } = {}

    const chunks = splitIntoChunks(addresses, batchsize);
    for (const chunk of chunks) {
      const scripthashes = [];
      const scripthash2addr: { [revHash: string]: string } = {};
      for (const addr of chunk) {
        const script = bitcoin.address.toOutputScript(addr, network);
        const hash = bitcoin.crypto.sha256(script);
        // eslint-disable-next-line no-undef
        let reversedHash = Buffer.from(reverse(hash));
        let reversedHashHex = reversedHash.toString('hex');
        scripthashes.push(reversedHashHex);
        scripthash2addr[reversedHashHex] = addr;
      }

      const results = await this.mainClient.blockchainScripthash_getHistoryBatch(
        scripthashes,
      );

      for (const history of results) {
        if (history.error) {
          Logger.warn(
            'electrum_wallet:multiGetTransactionsByAddress',
            history.error,
          );
        }
        if (history.result.length > 0) {
          ret[scripthash2addr[history.param]] = history.result
        }
      }
    }

    Logger.info('electrum_wallet:multiGetTransactionsByAddress:return', ret);
    return ret;
  }

  async getTransactionsFullByAddress(
    address: string,
  ): Promise<Array<FullTransactionModel>> {
    this.checkConnection('getTransactionsFullByAddress');

    const txs = await this.getTransactionsByAddress(address);
    const ret = [];
    for (const tx of txs) {
      const full = await this.mainClient.blockchainTransaction_get(
        tx.tx_hash,
        true,
      );
      full.address = address;
      for (const input of full.vin) {
        // now we need to fetch previous TX where this VIN became an output, so we can see its amount
        const prevTxForVin = await this.mainClient.blockchainTransaction_get(
          input.txid,
          true,
        );
        if (
          prevTxForVin &&
          prevTxForVin.vout &&
          prevTxForVin.vout[input.vout]
        ) {
          input.value = prevTxForVin.vout[input.vout].value;
          // also, we extract destination address from prev output:
          if (
            prevTxForVin.vout[input.vout].scriptPubKey &&
            prevTxForVin.vout[input.vout].scriptPubKey.addresses
          ) {
            input.addresses =
              prevTxForVin.vout[input.vout].scriptPubKey.addresses;
          }
        }
      }

      for (const output of full.vout) {
        if (output.scriptPubKey && output.scriptPubKey.addresses) {
          output.addresses = output.scriptPubKey.addresses;
        }
      }
      full.inputs = full.vin;
      full.outputs = full.vout;
      // delete full.vin;
      // delete full.vout;
      // delete full.hex; // compact
      // delete full.hash; // compact
      ret.push(full);
    }

    Logger.info('electrum_wallet:getBalanceByAddress', ret);
    return ret;
  }

  async multiGetTransactionsFullByAddress(
    addresses: Array<string>,
    batchsize: number = 100,
    verbose: boolean = true,
  ): Promise<Array<FullTransactionModel>> {
    this.checkConnection('multiGetTransactionsFullByAddress');

    const ret = [];
    const txsMap = await this.multiGetTransactionsByAddress(
      addresses,
      batchsize,
    );
    const txId2Address: {[key: string]: string} = {};
    const txIds: string[] = [];
    for (const [key, value] of Object.entries(txsMap)) {
      const ids = value.map(element => {
        return element.tx_hash;
      });
      ids.forEach(id => {
        txIds.push(id);
        txId2Address[id] = key;
      });
    }
    const fullTxsMap = await this.multiGetTransactionByTxid(
      txIds,
      batchsize,
      verbose,
    );
    for (const [txid, fullTx] of Object.entries(fullTxsMap)) {
      fullTx.address = txId2Address[txid]!;
      for (const input of fullTx.vin) {
        if (!input.txid) {
          continue
        }
        // now we need to fetch previous TX where this VIN became an output, so we can see its amount
        const prevTxForVin = await this.mainClient.blockchainTransaction_get(
          input.txid,
          verbose,
        );
        if (
          prevTxForVin &&
          prevTxForVin.vout &&
          prevTxForVin.vout[input.vout]
        ) {
          input.value = prevTxForVin.vout[input.vout].value;
          // also, we extract destination address from prev output:
          if (
            prevTxForVin.vout[input.vout].scriptPubKey &&
            prevTxForVin.vout[input.vout].scriptPubKey.addresses
          ) {
            input.addresses =
              prevTxForVin.vout[input.vout].scriptPubKey.addresses;
          }
        }
      }

      for (const output of fullTx.vout) {
        if (output.scriptPubKey && output.scriptPubKey.addresses) {
          output.addresses = output.scriptPubKey.addresses;
        }
      }
      fullTx.inputs = fullTx.vin;
      fullTx.outputs = fullTx.vout;
      ret.push(fullTx);
    }

    Logger.info('electrum_wallet:multiGetTransactionsFullByAddress:return', ret);
    return ret;
  }

  async multiGetBalanceByAddress(
    addresses: Array<string>,
    batchsize: number = 200,
  ): Promise<BalanceModel> {
    this.checkConnection('multiGetBalanceByAddress');

    const ret = new BalanceModel();

    const chunks = splitIntoChunks(addresses, batchsize);
    for (const chunk of chunks) {
      const scripthashes = [];
      const scripthash2addr: Map<string, string> = new Map();
      for (const addr of chunk) {
        const script = bitcoin.address.toOutputScript(addr, network);
        const hash = bitcoin.crypto.sha256(script);
        // eslint-disable-next-line no-undef
        let reversedHash = Buffer.from(reverse(hash));
        let reversedHashHex = reversedHash.toString('hex');
        scripthashes.push(reversedHashHex);
        scripthash2addr.set(reversedHashHex, addr);
      }

      let balances = [];

      balances = await this.mainClient.blockchainScripthash_getBalanceBatch(
        scripthashes,
      );

      for (const bal of balances) {
        if (bal.error) {
          Logger.warn('electrum_wallet:multiGetBalanceByAddress', bal.error);
        }
        ret.confirmed += +bal.result.confirmed;
        ret.unconfirmed += +bal.result.unconfirmed;
        ret.addresses.set(scripthash2addr.get(bal.param)!, bal.result);
      }
    }

    Logger.info('electrum_wallet:multiGetBalanceByAddress', ret);
    return ret;
  }

  async multiGetHistoryByAddress(
    addresses: Array<string>,
    batchsize: number = 100,
  ): Promise<Map<string, Array<FullTransactionModel>>> {
    this.checkConnection('multiGetHistoryByAddress');

    const ret: Map<string, Array<FullTransactionModel>> = new Map();

    const chunks = splitIntoChunks(addresses, batchsize);
    for (const chunk of chunks) {
      const scripthashes = [];
      const scripthash2addr: Map<string, string> = new Map();
      for (const addr of chunk) {
        const script = bitcoin.address.toOutputScript(addr, network);
        const hash = bitcoin.crypto.sha256(script);
        // eslint-disable-next-line no-undef
        let reversedHash = Buffer.from(reverse(hash));
        let reversedHashHex = reversedHash.toString('hex');
        scripthashes.push(reversedHashHex);
        scripthash2addr.set(reversedHashHex, addr);
      }

      let results = [];

      results = await this.mainClient.blockchainScripthash_getHistoryBatch(
        scripthashes,
      );

      for (const history of results) {
        if (history.error) {
          Logger.warn(
            'electrum_wallet:multiGetHistoryByAddress',
            history.error,
          );
        }
        ret.set(scripthash2addr.get(history.param)!, history.result || []);
        for (const result of history.result || []) {
          if (result.tx_hash) {
            this.txhashHeightCache.set(result.tx_hash, result.height); // cache tx height
          }
        }

        for (const hist of ret.get(scripthash2addr.get(history.param)!) || []) {
          hist.address = scripthash2addr.get(history.param) || '';
        }
      }
    }

    Logger.info('electrum_wallet:multiGetHistoryByAddress', ret);
    return ret;
  }

  async multiGetTransactionByTxid(
    txids: Array<string>,
    batchsize: number = 45,
    verbose: boolean,
  ): Promise<{ [txId: string]: FullTransactionModel }> {
    this.checkConnection('multiGetTransactionByTxid');

    // this value is fine-tuned so althrough wallets in test suite will occasionally
    // throw 'response too large (over 1,000,000 bytes', test suite will pass
    verbose = verbose !== false;

    const ret: { [txId: string]: FullTransactionModel } = {};
    txids = [...new Set(txids)]; // deduplicate just for any case

    const chunks = splitIntoChunks(txids, batchsize);
    for (const chunk of chunks) {
      let results = [];

      results = await this.mainClient.blockchainTransaction_getBatch(
        chunk,
        verbose,
      );

      for (const txdata of results) {
        if (txdata.error && txdata.error.code === -32600) {
          // response too large
          // lets do single call, that should go through okay:
          txdata.result = await this.mainClient.blockchainTransaction_get(
            txdata.param,
            verbose,
          );
        }
        ret[txdata.param] = txdata.result;
      }
    }

    Logger.info('electrum_wallet:multiGetTransactionByTxid', ret);
    return ret;
  }

  async getUnspentTransactionsByAddress(
    address: string,
  ): Promise<Array<TransactionModel>> {
    this.checkConnection('getUnspentTransactionsByAddress');

    const script = bitcoin.address.toOutputScript(address, network);
    const hash = bitcoin.crypto.sha256(script);
    // eslint-disable-next-line no-undef
    const reversedHash = Buffer.from(reverse(hash));
    const listUnspent = await this.mainClient.blockchainScripthash_listunspent(
      reversedHash.toString('hex'),
    );

    Logger.info('electrum_wallet:getUnspentTransactionsByAddress', listUnspent);
    return listUnspent;
  }

  async multiGetUnspentTransactionsByAddress(
    addresses: Array<string>,
  ): Promise<{ [address: string]: TransactionModel[]}> {
    this.checkConnection('multiGetUnspentTransactionsByAddress');

    const scripthashes = [];
    const scripthash2addr: { [revHash: string]: string} = {};
    for (const address of addresses) {
      const script = bitcoin.address.toOutputScript(address, network);
      const hash = bitcoin.crypto.sha256(script);
      // eslint-disable-next-line no-undef
      let reversedHash = Buffer.from(reverse(hash));
      let reversedHashHex = reversedHash.toString('hex');
      scripthashes.push(reversedHashHex);
      scripthash2addr[reversedHashHex] = address;
    }
    const ret: { [address: string]: TransactionModel[]} = {};
    const listUnspent = await this.mainClient.blockchainScripthash_listunspentBatch(
      scripthashes,
    );
    for (const utxo of listUnspent) {
      if (utxo.result.length > 0) {
        ret[scripthash2addr[utxo.param]!] = utxo.result;
      }
    }
    Logger.info('electrum_wallet:multiGetUnspentTransactionsByAddress', ret);
    return ret;
  }

  async broadcast(hex: string): Promise<string> {
    this.checkConnection('broadcast');

    Logger.info('electrum_wallet:broadcast', hex);
    const broadcast: string = await this.mainClient.blockchainTransaction_broadcast(
      hex,
    );

    Logger.info('electrum_wallet:broadcast', broadcast);
    return broadcast;
  }

  async getMintMedata(publicCoins: string[]): Promise<MintMetadataModel[]> {
    this.checkConnection('getMintMedata');

    const mints: {pubcoin: string}[] = [];
    publicCoins.forEach(coin => {
      mints.push({pubcoin: coin});
    });

    const param = [];
    param.push({mints});

    const result = await this.mainClient.request(
      'sigma.getmintmetadata',
      param,
    );
    const ret = result.map((info: {}, index: number) => {
      const response = result[index];
      let groupId = -1;
      let height = -1;
      try {
        height = parseInt(Object.keys(response)[0], 10);
        groupId = response[height];
      } catch (e) {}

      return {
        height: height,
        anonimitySetId: groupId,
      };
    });

    Logger.info('electrum_wallet:getMintMedata', ret);
    return ret;
  }

  async getAnonymitySet(setId: number): Promise<AnonymitySetModel> {
    this.checkConnection('getAnonymitySet');

    const param = [];
    param.push(setId + '');
    const result = await this.mainClient.request(
      'sigma.getanonymityset',
      param,
    );

    Logger.info('electrum_wallet:getAnonymitySet', result);
    return result;
  }

  addressToScript(address: string): string {
    return bitcoin.address.toOutputScript(address, network);
  }

  private checkConnection(tag: string) {
    if (typeof this.mainClient === 'undefined' || this.mainClient === null) {
      Logger.error(`electrum_wallet:${tag}`, 'not connected');
      throw new Error('Electrum client is not connected');
    }
  }
}

const splitIntoChunks = function (
  arr: Array<string>,
  chunkSize: number,
): Array<string[]> {
  const groups: Array<string[]> = [];
  let i;
  for (i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
};

export const firoElectrum: AbstractElectrum = new FiroElectrum();
