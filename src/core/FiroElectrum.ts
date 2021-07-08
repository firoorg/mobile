import {Platform} from 'react-native';
import {
  AbstractElectrum,
  BalanceModel,
  TransactionModel,
  FullTransactionModel,
} from './AbstractElectrum';
import AsyncStorage from '@react-native-community/async-storage';
import {AppStorage} from '../app-storage';
import DefaultPreference from 'react-native-default-preference';
const bitcoin = require('bitcoinjs-lib');
import ElectrumClient from 'electrum-client';
import reverse from 'buffer-reverse';

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
  disableBatching = false;

  latestBlockheight = false;
  latestBlockheightTimestamp: number = 0;

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
      console.log(e);
    }

    try {
      console.log('begin connection:', JSON.stringify(peer));
      this.mainClient = new ElectrumClient(
        peer.ssl || peer.tcp,
        peer.host,
        peer.ssl ? 'tls' : 'tcp',
      );
      console.log('mainClient:', this.mainClient);
      this.mainClient.onError = function () {
        if (Platform.OS === 'android' && this.mainConnected) {
          // android sockets are buggy and dont always issue CLOSE event, which actually makes the persistence code to reconnect.
          // so lets do it manually, but only if we were previously connected (mainConnected), otherwise theres other
          // code which does connection retries
          this.mainClient.close();
          this.mainConnected = false;
          setTimeout(this.connectMain, 500);
          console.log('reconnecting after socket error');
          return;
        }
        this.mainConnected = false;
      };
      const ver = await this.mainClient.initElectrum({
        client: 'firo',
        version: '1.4',
      });
      if (ver && ver[0]) {
        console.log('connected to ', ver);
        this.serverName = ver[0];
        this.mainConnected = true;
        this.wasConnectedAtLeastOnce = true;
        if (
          ver[0].startsWith('ElectrumPersonalServer') ||
          ver[0].startsWith('electrs')
        ) {
          // TODO: once they release support for batching - disable batching only for lower versions
          this.disableBatching = true;
        }
        const header = await this.mainClient.blockchainHeaders_subscribe();
        if (header && header.height) {
          this.latestBlockheight = header.height;
          this.latestBlockheightTimestamp = Math.floor(+new Date() / 1000);
        }
        // AsyncStorage.setItem(storageKey, JSON.stringify(peers));  TODO: refactor
      }
    } catch (e) {
      this.mainConnected = false;
      console.log('bad connection:', JSON.stringify(peer), e);
    }

    if (!this.mainConnected) {
      console.log('retry');
      this.mainClient.close && this.mainClient.close();
      setTimeout(this.connectMain, 500);
    }
  }

  async getBalanceByAddress(address: string): Promise<BalanceModel> {
    if (typeof this.mainClient === 'undefined' || this.mainClient === null) {
      throw new Error('Electrum client is not connected');
    }
    const script = bitcoin.address.toOutputScript(address, {pubKeyHash: 0x41});
    const hash = bitcoin.crypto.sha256(script);
    // eslint-disable-next-line no-undef
    const reversedHash = Buffer.from(reverse(hash));
    const balance = await this.mainClient.blockchainScripthash_getBalance(
      reversedHash.toString('hex'),
    );
    balance.addr = address;
    return balance;
  }

  async getTransactionsByAddress(
    address: string,
  ): Promise<Array<TransactionModel>> {
    if (typeof this.mainClient === 'undefined' || this.mainClient === null) {
      throw new Error('Electrum client is not connected');
    }
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

    return history;
  }

  async getTransactionsFullByAddress(
    address: string,
  ): Promise<Array<FullTransactionModel>> {
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

    return ret;
  }

  addressToScript(address: string): string {
    return bitcoin.address.toOutputScript(address, {pubKeyHash: 0x41});
  }
}

export const firoElectrum: AbstractElectrum = new FiroElectrum();
