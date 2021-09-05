import {
  AbstractWallet,
  FiroMintTxReturn,
  FiroSpendTxReturn,
  LelantusMintTxParams,
  LelantusSpendTxParams,
} from './AbstractWallet';
import {network, Network} from './FiroNetwork';
import BigNumber from 'bignumber.js';
import {randomBytes} from '../utils/crypto';
import {TransactionItem} from '../data/TransactionItem';
import {BalanceData} from '../data/BalanceData';
import {firoElectrum} from './FiroElectrum';
import {FullTransactionModel} from './AbstractElectrum';
import {BIP32Interface} from 'bip32/types/bip32';
import {LelantusWrapper} from './LelantusWrapper';
import {LelantusCoin} from '../data/LelantusCoin';
import {LelantusEntry} from '../data/LelantusEntry';

const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

const EXTERNAL_INDEX = 0;
const INTERNAL_INDEX = 1;
const MINT_INDEX = 2;
const JMINT_INDEX = 5;

const HEIGHT_NOT_SET = -1;

const TRANSACTION_LELANTUS = 8;

export class FiroWallet implements AbstractWallet {
  secret: string | undefined = undefined;
  seed: string = '';
  network: Network = network;
  balance: number = 0;
  unconfirmed_balance: number = 0;
  _lelantus_coins: {
    [txId: string]: LelantusCoin;
  } = {};
  utxo: Array<TransactionItem> = [];
  _lastTxFetch: number = 0;
  _lastBalanceFetch: Date = new Date();
  _balances_by_external_index: Array<BalanceData> = [];
  _balances_by_internal_index: Array<BalanceData> = [];
  _txs_by_external_index: Array<Array<TransactionItem>> = [];
  _txs_by_internal_index: Array<Array<TransactionItem>> = [];
  _address_to_wif_cache: {
    [key: string]: string;
  } = {};

  next_free_address_index = 0;
  next_free_change_address_index = 0;
  next_free_mint_index = 0;
  internal_addresses_cache: {
    [index: number]: string;
  } = {};
  external_addresses_cache: {
    [index: number]: string;
  } = {};
  _xPub: string = ''; // cache
  _node0: BIP32Interface | undefined = undefined;
  _node1: BIP32Interface | undefined = undefined;
  usedAddresses = [];
  gap_limit = 20;
  confirm_block_count = 2;

  async generate(): Promise<void> {
    const buf = await randomBytes(32);
    this.secret = bip39.entropyToMnemonic(buf);
    this.seed = (await bip39.mnemonicToSeed(this.secret)).toString('hex');
  }

  setSecret(secret: string): void {
    this.secret = secret;
  }

  getSecret(): string {
    if (this.secret === undefined) {
      throw Error('FiroWallet not initialize');
    }
    return this.secret;
  }

  getBalance() {
    const coins = [...Object.values(this._lelantus_coins)];
    return coins.reduce<number>(
      (previousValue: number, currentValue: LelantusCoin): number => {
        if (!currentValue.isUsed && currentValue.isConfirmed) {
          return previousValue + currentValue.value / 100000000;
        }
        return previousValue;
      },
      0,
    );
  }

  getUnconfirmedBalance() {
    const coins = [...Object.values(this._lelantus_coins)];
    return coins.reduce<number>(
      (previousValue: number, currentValue: LelantusCoin): number => {
        if (!currentValue.isUsed && !currentValue.isConfirmed) {
          return previousValue + currentValue.value / 100000000;
        }
        return previousValue;
      },
      0,
    );
  }

  async getXpub(): Promise<string> {
    if (this._xPub !== '') {
      return this._xPub;
    }

    const root = bitcoin.bip32.fromSeed(
      // eslint-disable-next-line no-undef
      Buffer.from(this.seed, 'hex'),
      this.network,
    );
    this._xPub = root
      .deriveHardened(44)
      .deriveHardened(136)
      .deriveHardened(0)
      .neutered()
      .toBase58();
    return this._xPub;
  }

  async createLelantusMintTx(
    params: LelantusMintTxParams,
  ): Promise<FiroMintTxReturn> {
    if (params.utxos.length === 0) {
      throw Error('there are no any unspent transaction is empty');
    }
    const keyPairs: Array<BIP32Interface> = [];
    const fee = 500000;
    let value: number = -fee;

    const tx = new bitcoin.Psbt({network: this.network});
    tx.setVersion(2);

    for (let index = 0; index < params.utxos.length; index++) {
      const input = params.utxos[index];
      const wif = await this._getWifForAddress(input.address);
      const keyPair = await this._getKeyPairFromWIF(wif);
      keyPairs[index] = keyPair;

      value += input.value;

      tx.addInput({
        hash: input.txId,
        index: input.index,
        sequence: 4294967294,
        // eslint-disable-next-line no-undef
        nonWitnessUtxo: Buffer.from(input.txHex, 'hex'),
      });
    }

    const mintKeyPair = this._getNode(MINT_INDEX, this.next_free_mint_index);
    const mintData = await LelantusWrapper.lelantusMint(
      mintKeyPair,
      this.next_free_mint_index,
      value,
    );

    console.log('value ctx', value);
    console.log('mintScript', mintData.script);
    tx.addOutput({
      // eslint-disable-next-line no-undef
      script: Buffer.from(mintData.script, 'hex'),
      value,
    });

    keyPairs.forEach((keypair, index) => {
      tx.signInput(index, keypair);
      tx.validateSignaturesOfInput(index);
    });
    tx.finalizeAllInputs();

    const extractedTx = tx.extractTransaction();
    return {
      txId: extractedTx.getId(),
      txHex: extractedTx.toHex(),
      value: value,
      publicCoin: mintData.publicCoin,
      fee: fee,
    };
  }

  async createLelantusSpendTx(
    params: LelantusSpendTxParams,
  ): Promise<FiroSpendTxReturn> {
    let spendAmount = params.spendAmount;

    const lelantusCoins = this._getUnspentCoins();
    const lelantusEntries = lelantusCoins.map<LelantusEntry>(coin => {
      const keyPair = this._getNode(MINT_INDEX, this.next_free_mint_index);
      if (keyPair.privateKey === undefined) {
        return new LelantusEntry(0, '', 0, true, 0, 0);
      }
      return new LelantusEntry(
        coin.value,
        keyPair.privateKey.toString('hex'),
        coin.index,
        coin.isUsed,
        coin.height,
        coin.anonymitySetId,
      );
    });

    const tx = new bitcoin.Psbt({network: this.network});

    // lelantusjoinsplitbuilder.cpp, lines 299-305
    tx.version = 3;
    tx.nType = TRANSACTION_LELANTUS;

    tx.addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 0,
      sequence: 0xffffffff,
      // eslint-disable-next-line no-undef
      finalScriptSig: Buffer.from('c9', 'hex'),
    });

    const estimateFeeData = await LelantusWrapper.estimateJoinSplitFee(
      spendAmount,
      params.subtractFeeFromAmount,
      lelantusEntries,
    );

    const jmintKeyPair = this._getNode(MINT_INDEX, this.next_free_mint_index);

    const keyPath = await LelantusWrapper.getMintKeyPath(
      estimateFeeData.chageToMint,
      jmintKeyPair,
      this.next_free_mint_index,
    );

    const aesKeyPair = this._getNode(JMINT_INDEX, keyPath);
    const aesPrivateKey = aesKeyPair.privateKey?.toString('hex');
    if (aesPrivateKey === undefined) {
      throw Error("Can't generate aes private key");
    }

    const jmintScript = await LelantusWrapper.lelantusJMint(
      estimateFeeData.chageToMint,
      jmintKeyPair,
      this.next_free_mint_index,
      aesPrivateKey,
    );

    console.log('jmintScript', jmintScript);
    tx.addOutput({
      // eslint-disable-next-line no-undef
      script: Buffer.from(jmintScript, 'hex'),
      value: 0,
    });

    let amount = spendAmount;
    if (params.subtractFeeFromAmount) {
      amount -= estimateFeeData.fee;
    }
    tx.addOutput({
      // eslint-disable-next-line no-undef
      script: Buffer.from(params.address, 'hex'),
      value: amount,
    });

    const extractedTx = tx.extractTransaction();
    const txHash = extractedTx.getId();

    const setIds: number[] = [];
    const anonimitySets: string[][] = [];
    const anonymitySetHashes: string[] = [];
    const groupBlockHashes: string[] = [];
    for (let i = 0; i < lelantusCoins.length; i++) {
      const coin = lelantusCoins[i];
      if (!setIds.includes(coin.anonymitySetId)) {
        setIds.push(coin.anonymitySetId);
        const result = await firoElectrum.getAnonymitySet(coin.anonymitySetId);
        anonimitySets.push(result.serializedCoins);
        anonymitySetHashes.push(result.setHash);
        groupBlockHashes.push(result.blockHash);
      }
    }

    const spendScript = LelantusWrapper.lelantusSpend(
      spendAmount,
      params.subtractFeeFromAmount,
      jmintKeyPair,
      this.next_free_mint_index,
      lelantusEntries,
      txHash,
      setIds,
      anonimitySets,
      anonymitySetHashes,
      groupBlockHashes,
    );

    let txHex = extractedTx.toHex();
    txHex += spendScript;

    return {
      txId: txHash,
      txHex: txHex,
      value: spendAmount,
      fee: estimateFeeData.fee,
    };
  }

  async addLelantusMintToCache(
    txId: string,
    value: number,
    publicCoin: string,
  ): Promise<void> {
    if (this._lelantus_coins[txId]) {
      return;
    }
    this._lelantus_coins[txId] = {
      index: this.next_free_mint_index,
      value: value,
      publicCoin: publicCoin,
      isConfirmed: false,
      txId: txId,
      height: HEIGHT_NOT_SET,
      anonymitySetId: 0,
      isUsed: false,
    };
    this.next_free_mint_index += 1;
  }

  async updateMintMetadata(): Promise<boolean> {
    const unconfirmedCoins = this._getUnconfirmedCoins();
    if (unconfirmedCoins.length > 0) {
      const publicCoinList = unconfirmedCoins.map(coin => {
        return coin.publicCoin;
      });
      const mintMetadata = await firoElectrum.getMintMedata(publicCoinList);
      console.log('mint metadata', mintMetadata);
      mintMetadata.forEach((metadata, index) => {
        unconfirmedCoins[index].height = metadata.height;
        unconfirmedCoins[index].anonymitySetId = metadata.anonimitySetId;
        this._updateIsMintConfirmed(unconfirmedCoins[index]);
      });
      return true;
    }
    return false;
  }

  _updateIsMintConfirmed(coin: LelantusCoin) {
    if (
      coin.height !== HEIGHT_NOT_SET &&
      coin.height + this.confirm_block_count <=
        firoElectrum.getLatestBlockHeight()
    ) {
      this._lelantus_coins[coin.txId].isConfirmed = true;
    } else {
      this._lelantus_coins[coin.txId].isConfirmed = false;
    }
  }

  _getUnconfirmedCoins(): LelantusCoin[] {
    const coins = Object.values(this._lelantus_coins);
    return coins.filter(coin => {
      if (!coin.isConfirmed) {
        return coin;
      }
    });
  }

  _getUnspentCoins(): LelantusCoin[] {
    const coins = Object.values(this._lelantus_coins);
    return coins.filter(coin => {
      if (!coin.isUsed && coin.isConfirmed) {
        return coin;
      }
    });
  }

  async _getWifForAddress(address: string): Promise<string> {
    if (this._address_to_wif_cache[address]) {
      return this._address_to_wif_cache[address]; // cache hit
    }

    // fast approach, first lets iterate over all addressess we have in cache
    for (const index of Object.keys(this.internal_addresses_cache)) {
      const iAddress = await this._getInternalAddressByIndex(+index);
      if (iAddress === address) {
        return (this._address_to_wif_cache[
          address
        ] = await this._getInternalWIFByIndex(+index));
      }
    }

    for (const index of Object.keys(this.external_addresses_cache)) {
      const eAddress = await this._getExternalAddressByIndex(+index);
      if (eAddress === address) {
        return (this._address_to_wif_cache[
          address
        ] = await this._getExternalWIFByIndex(+index));
      }
    }

    // no luck - lets iterate over all addresses we have up to first unused address index
    for (
      let c = 0;
      c <= this.next_free_change_address_index + this.gap_limit;
      c++
    ) {
      const possibleAddress = await this._getInternalAddressByIndex(c);
      if (possibleAddress === address) {
        return (this._address_to_wif_cache[
          address
        ] = await this._getInternalWIFByIndex(c));
      }
    }

    for (let c = 0; c <= this.next_free_address_index + this.gap_limit; c++) {
      const possibleAddress = await this._getExternalAddressByIndex(c);
      if (possibleAddress === address) {
        return (this._address_to_wif_cache[
          address
        ] = await this._getExternalWIFByIndex(c));
      }
    }

    throw new Error('Could not find WIF for ' + address);
  }

  async _getKeyPairFromWIF(wif: string): Promise<BIP32Interface> {
    return bitcoin.ECPair.fromWIF(wif, this.network);
  }

  async _getExternalWIFByIndex(index: number): Promise<string> {
    return this._getWIFByIndex(EXTERNAL_INDEX, index);
  }

  async _getInternalWIFByIndex(index: number): Promise<string> {
    return this._getWIFByIndex(INTERNAL_INDEX, index);
  }

  async _getMintWIFByIndex(index: number): Promise<string> {
    return this._getWIFByIndex(MINT_INDEX, index);
  }

  async _getWIFByIndex(node: number, index: number): Promise<string> {
    const child = this._getNode(node, index);
    return child.toWIF();
  }

  _getNode(node: number, index: number): BIP32Interface {
    if (!this.secret) {
      throw Error('illegal state secret is null');
    }

    // eslint-disable-next-line no-undef
    const root = bip32.fromSeed(Buffer.from(this.seed, 'hex'), this.network);
    const path = `m/44'/136'/0'/${node}/${index}`;
    const child = root.derivePath(path);

    return child;
  }

  async getAddressAsync(): Promise<string> {
    // looking for free external address
    let freeAddress = '';
    let c;
    for (c = 0; c < this.gap_limit + 1; c++) {
      if (this.next_free_address_index + c < 0) {
        continue;
      }
      const address = await this._getExternalAddressByIndex(
        this.next_free_address_index + c,
      );
      this.external_addresses_cache[this.next_free_address_index + c] = address; // updating cache just for any case
      let txs = [];
      try {
        txs = await firoElectrum.getTransactionsByAddress(address);
      } catch (Err) {
        console.warn('FiroElectrum.getTransactionsByAddress()', Err.message);
      }
      if (txs.length === 0) {
        // found free address
        freeAddress = address;
        this.next_free_address_index += c; // now points to _this one_
        break;
      }
    }

    if (!freeAddress) {
      // could not find in cycle above, give up
      freeAddress = await this._getExternalAddressByIndex(
        this.next_free_address_index + c,
      ); // we didnt check this one, maybe its free
      this.next_free_address_index += c; // now points to this one
    }
    return freeAddress;
  }

  async getChangeAddressAsync(): Promise<string> {
    // looking for free internal address
    let freeAddress = '';
    let c;
    for (c = 0; c < this.gap_limit + 1; c++) {
      if (this.next_free_change_address_index + c < 0) {
        continue;
      }
      const address = await this._getInternalAddressByIndex(
        this.next_free_change_address_index + c,
      );
      this.internal_addresses_cache[
        this.next_free_change_address_index + c
      ] = address; // updating cache just for any case
      let txs = [];
      try {
        txs = await firoElectrum.getTransactionsByAddress(address);
      } catch (Err) {
        console.warn('FiroElectrum.getTransactionsByAddress()', Err.message);
      }
      if (txs.length === 0) {
        // found free address
        freeAddress = address;
        this.next_free_change_address_index += c; // now points to _this one_
        break;
      }
    }

    if (!freeAddress) {
      // could not find in cycle above, give up
      freeAddress = await this._getInternalAddressByIndex(
        this.next_free_change_address_index + c,
      ); // we didnt check this one, maybe its free
      this.next_free_change_address_index += c; // now points to this one
    }
    return freeAddress;
  }

  async _getInternalAddressByIndex(index: number): Promise<string> {
    return this._getNodeAddressByIndex(INTERNAL_INDEX, index);
  }

  async _getExternalAddressByIndex(index: number): Promise<string> {
    return this._getNodeAddressByIndex(EXTERNAL_INDEX, index);
  }

  async _getNodeAddressByIndex(node: number, index: number) {
    index = index * 1; // cast to int
    if (node === 0) {
      if (this.external_addresses_cache[index]) {
        return this.external_addresses_cache[index]; // cache hit]
      }
    }

    if (node === 1) {
      if (this.internal_addresses_cache[index]) {
        return this.internal_addresses_cache[index]; // cache hit
      }
    }

    if (node === 0 && !this._node0) {
      const xpub = await this.getXpub();
      const hdNode = bip32.fromBase58(xpub, this.network);
      this._node0 = hdNode.derive(node);
    }

    if (node === 1 && !this._node1) {
      const xpub = await this.getXpub();
      const hdNode = bip32.fromBase58(xpub, this.network);
      this._node1 = hdNode.derive(node);
    }

    let address;
    if (node === 0) {
      address = this._nodeToLegacyAddress(this._node0!!.derive(index));
    }

    if (node === 1) {
      address = this._nodeToLegacyAddress(this._node1!!.derive(index));
    }

    if (node === 0) {
      return (this.external_addresses_cache[index] = address);
    }

    if (node === 1) {
      return (this.internal_addresses_cache[index] = address);
    }
  }

  _nodeToLegacyAddress(hdNode: BIP32Interface) {
    return bitcoin.payments.p2pkh({
      pubkey: hdNode.publicKey,
      network: this.network,
    }).address;
  }

  async getTransactionsAddresses(): Promise<Array<string>> {
    await this.getXpub();
    const address2Fetch = [];
    // external addresses first
    for (let c = 0; c < this.next_free_address_index + this.gap_limit; c++) {
      const extAddr = await this._getExternalAddressByIndex(c);
      address2Fetch.push(extAddr);
    }

    // next internal addresses
    for (
      let c = 0;
      c < this.next_free_change_address_index + this.gap_limit;
      c++
    ) {
      const intAddr = await this._getInternalAddressByIndex(c);
      address2Fetch.push(intAddr);
    }

    return address2Fetch;
  }

  async fetchTransactions() {
    // if txs are absent for some internal address in hierarchy - this is a sign
    // we should fetch txs for that address
    // OR if some address has unconfirmed balance - should fetch it's txs
    // OR some tx for address is unconfirmed
    // OR some tx has < 7 confirmations

    // fetching transactions in batch: first, getting batch history for all addresses,
    // then batch fetching all involved txids
    // finally, batch fetching txids of all inputs (needed to see amounts & addresses of those inputs)
    // then we combine it all together

    const addresses2fetch = [];

    for (let c = 0; c < this.next_free_address_index + this.gap_limit; c++) {
      // external addresses first
      let hasUnconfirmed = false;
      this._txs_by_external_index[c] = this._txs_by_external_index[c] || [];
      for (const tx of this._txs_by_external_index[c]) {
        hasUnconfirmed =
          hasUnconfirmed || !tx.confirmations || tx.confirmations < 7;
      }

      if (
        hasUnconfirmed ||
        this._txs_by_external_index[c].length === 0 ||
        this._balances_by_external_index[c].u !== 0
      ) {
        addresses2fetch.push(await this._getExternalAddressByIndex(c));
      }
    }

    for (
      let c = 0;
      c < this.next_free_change_address_index + this.gap_limit;
      c++
    ) {
      // next, internal addresses
      let hasUnconfirmed = false;
      this._txs_by_internal_index[c] = this._txs_by_internal_index[c] || [];
      for (const tx of this._txs_by_internal_index[c]) {
        hasUnconfirmed =
          hasUnconfirmed || !tx.confirmations || tx.confirmations < 7;
      }

      if (
        hasUnconfirmed ||
        this._txs_by_internal_index[c].length === 0 ||
        this._balances_by_internal_index[c].u !== 0
      ) {
        addresses2fetch.push(await this._getInternalAddressByIndex(c));
      }
    }

    // first: batch fetch for all addresses histories
    const histories = await firoElectrum.multiGetHistoryByAddress(
      addresses2fetch,
    );
    const txs: Map<string, FullTransactionModel> = new Map();
    for (const history of Object.values(histories)) {
      for (const tx of history) {
        txs.set(tx.tx_hash, tx);
      }
    }

    // next, batch fetching each txid we got
    const txdatas = await firoElectrum.multiGetTransactionByTxid(
      Object.keys(txs),
    );

    // now, tricky part. we collect all transactions from inputs (vin), and batch fetch them too.
    // then we combine all this data (we need inputs to see source addresses and amounts)
    const vinTxids = [];
    for (const txdata of Object.values(txdatas)) {
      for (const vin of txdata.vin) {
        vinTxids.push(vin.txid);
      }
    }
    const vintxdatas = await firoElectrum.multiGetTransactionByTxid(vinTxids);

    // fetched all transactions from our inputs. now we need to combine it.
    // iterating all _our_ transactions:
    for (const txid of Object.keys(txdatas)) {
      // iterating all inputs our our single transaction:
      const tx = txdatas.get(txid)!;
      for (let inpNum = 0; inpNum < tx.vin.length; inpNum++) {
        const inpTxid = tx.vin[inpNum].txid;
        const inpVout = tx.vin[inpNum].vout;
        // got txid and output number of _previous_ transaction we shoud look into
        const inpTx = vintxdatas.get(inpTxid);
        if (inpTx && inpTx.vout[inpVout]) {
          // extracting amount & addresses from previous output and adding it to _our_ input:
          tx.vin[inpNum].addresses = inpTx.vout[inpVout].scriptPubKey.addresses;
          tx.vin[inpNum].value = inpTx.vout[inpVout].value;
        }
      }
    }

    // now purge all unconfirmed txs from internal hashmaps, since some may be evicted from mempool because they became invalid
    // or replaced. hashmaps are going to be re-populated anyways, since we fetched TXs for addresses with unconfirmed TXs
    for (let c = 0; c < this.next_free_address_index + this.gap_limit; c++) {
      this._txs_by_external_index[c] = this._txs_by_external_index[c].filter(
        tx => !!tx.confirmations,
      );
    }
    for (
      let c = 0;
      c < this.next_free_change_address_index + this.gap_limit;
      c++
    ) {
      this._txs_by_internal_index[c] = this._txs_by_internal_index[c].filter(
        tx => !!tx.confirmations,
      );
    }

    // now, we need to put transactions in all relevant `cells` of internal hashmaps: this._txs_by_internal_index && this._txs_by_external_index

    for (let c = 0; c < this.next_free_address_index + this.gap_limit; c++) {
      for (const tx of Object.values(txdatas)) {
        for (const vin of tx.vin) {
          if (
            vin.addresses &&
            vin.addresses.indexOf(this._getExternalAddressByIndex(c)) !== -1
          ) {
            // this TX is related to our address
            this._txs_by_external_index[c] =
              this._txs_by_external_index[c] || [];
            const clonedTx = Object.assign({}, tx);
            clonedTx.inputs = tx.vin.slice(0);
            clonedTx.outputs = tx.vout.slice(0);
            delete clonedTx.vin;
            delete clonedTx.vout;

            // trying to replace tx if it exists already (because it has lower confirmations, for example)
            let replaced = false;
            for (let cc = 0; cc < this._txs_by_external_index[c].length; cc++) {
              if (this._txs_by_external_index[c][cc].txid === clonedTx.txid) {
                replaced = true;
                this._txs_by_external_index[c][cc] = clonedTx;
              }
            }
            if (!replaced) {
              this._txs_by_external_index[c].push(clonedTx);
            }
          }
        }
        for (const vout of tx.vout) {
          if (
            vout.scriptPubKey.addresses &&
            vout.scriptPubKey.addresses.indexOf(
              this._getExternalAddressByIndex(c),
            ) !== -1
          ) {
            // this TX is related to our address
            this._txs_by_external_index[c] =
              this._txs_by_external_index[c] || [];
            const clonedTx = Object.assign({}, tx);
            clonedTx.inputs = tx.vin.slice(0);
            clonedTx.outputs = tx.vout.slice(0);
            delete clonedTx.vin;
            delete clonedTx.vout;

            // trying to replace tx if it exists already (because it has lower confirmations, for example)
            let replaced = false;
            for (let cc = 0; cc < this._txs_by_external_index[c].length; cc++) {
              if (this._txs_by_external_index[c][cc].txid === clonedTx.txid) {
                replaced = true;
                this._txs_by_external_index[c][cc] = clonedTx;
              }
            }
            if (!replaced) {
              this._txs_by_external_index[c].push(clonedTx);
            }
          }
        }
      }
    }

    for (
      let c = 0;
      c < this.next_free_change_address_index + this.gap_limit;
      c++
    ) {
      for (const tx of Object.values(txdatas)) {
        for (const vin of tx.vin) {
          if (
            vin.addresses &&
            vin.addresses.indexOf(this._getInternalAddressByIndex(c)) !== -1
          ) {
            // this TX is related to our address
            this._txs_by_internal_index[c] =
              this._txs_by_internal_index[c] || [];
            const clonedTx = Object.assign({}, tx);
            clonedTx.inputs = tx.vin.slice(0);
            clonedTx.outputs = tx.vout.slice(0);
            delete clonedTx.vin;
            delete clonedTx.vout;

            // trying to replace tx if it exists already (because it has lower confirmations, for example)
            let replaced = false;
            for (let cc = 0; cc < this._txs_by_internal_index[c].length; cc++) {
              if (this._txs_by_internal_index[c][cc].txid === clonedTx.txid) {
                replaced = true;
                this._txs_by_internal_index[c][cc] = clonedTx;
              }
            }
            if (!replaced) {
              this._txs_by_internal_index[c].push(clonedTx);
            }
          }
        }
        for (const vout of tx.vout) {
          if (
            vout.scriptPubKey.addresses &&
            vout.scriptPubKey.addresses.indexOf(
              this._getInternalAddressByIndex(c),
            ) !== -1
          ) {
            // this TX is related to our address
            this._txs_by_internal_index[c] =
              this._txs_by_internal_index[c] || [];
            const clonedTx = Object.assign({}, tx);
            clonedTx.inputs = tx.vin.slice(0);
            clonedTx.outputs = tx.vout.slice(0);
            delete clonedTx.vin;
            delete clonedTx.vout;

            // trying to replace tx if it exists already (because it has lower confirmations, for example)
            let replaced = false;
            for (let cc = 0; cc < this._txs_by_internal_index[c].length; cc++) {
              if (this._txs_by_internal_index[c][cc].txid === clonedTx.txid) {
                replaced = true;
                this._txs_by_internal_index[c][cc] = clonedTx;
              }
            }
            if (!replaced) {
              this._txs_by_internal_index[c].push(clonedTx);
            }
          }
        }
      }
    }

    this._lastTxFetch = +new Date();
  }

  async getTransactions(): Promise<Array<TransactionItem>> {
    let txs: Array<TransactionItem> = [];

    for (const addressTxs of Object.values(this._txs_by_external_index)) {
      txs = txs.concat(addressTxs);
    }
    for (const addressTxs of Object.values(this._txs_by_internal_index)) {
      txs = txs.concat(addressTxs);
    }

    if (txs.length === 0) {
      return [];
    } // guard clause; so we wont spend time calculating addresses

    // its faster to pre-build hashmap of owned addresses than to query `this.weOwnAddress()`, which in turn
    // iterates over all addresses in hierarchy
    const ownedAddressesHashmap: Map<string, boolean> = new Map();
    for (let c = 0; c < this.next_free_address_index + 1; c++) {
      ownedAddressesHashmap.set(await this._getExternalAddressByIndex(c), true);
    }
    for (let c = 0; c < this.next_free_change_address_index + 1; c++) {
      ownedAddressesHashmap.set(await this._getInternalAddressByIndex(c), true);
    }

    const ret = [];
    for (const tx of txs) {
      tx.received = tx.blocktime * 1000;
      if (!tx.blocktime) {
        tx.received = +new Date() - 30 * 1000;
      } // unconfirmed
      tx.confirmations = tx.confirmations || 0; // unconfirmed
      tx.hash = tx.txid;
      tx.value = 0;

      for (const vin of tx.inputs) {
        // if input (spending) goes from our address - we are loosing!
        if (
          (vin.address && ownedAddressesHashmap.get(vin.address)) ||
          (vin.addresses &&
            vin.addresses[0] &&
            ownedAddressesHashmap.has(vin.addresses[0]))
        ) {
          tx.value -= new BigNumber(vin.value)
            .multipliedBy(100000000)
            .toNumber();
        }
      }

      for (const vout of tx.outputs) {
        // when output goes to our address - this means we are gaining!
        if (
          vout.scriptPubKey.addresses &&
          vout.scriptPubKey.addresses[0] &&
          ownedAddressesHashmap.has(vout.scriptPubKey.addresses[0])
        ) {
          tx.value += new BigNumber(vout.value)
            .multipliedBy(100000000)
            .toNumber();
        }
      }
      ret.push(tx);
    }

    // now, deduplication:
    const usedTxIds: Map<string, number> = new Map();
    const ret2 = [];
    for (const tx of ret) {
      if (!usedTxIds.has(tx.txid)) {
        ret2.push(tx);
      }
      usedTxIds.set(tx.txid, 1);
    }

    return ret2.sort(function (a, b) {
      return b.received - a.received;
    });
  }

  prepareForSerialization(): void {
    this._txs_by_external_index = [];
    this._txs_by_internal_index = [];

    // this.internal_addresses_cache = {};
    // this.external_addresses_cache = {};

    delete this._node0;
    delete this._node1;
  }

  static fromJson(obj: string): FiroWallet {
    const obj2 = JSON.parse(obj);
    const temp: {
      [key: string]: any;
    } = new this();
    for (const key2 of Object.keys(obj2)) {
      temp[key2] = obj2[key2];
    }

    return temp as FiroWallet;
  }
}
