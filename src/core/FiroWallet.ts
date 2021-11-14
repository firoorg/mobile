import {
  AbstractWallet,
  FiroMintTxReturn,
  FiroSpendTxReturn,
  FiroTxFeeReturn,
  LelantusMintTxParams,
  LelantusSpendFeeParams,
  LelantusSpendTxParams,
} from './AbstractWallet';
import {network, Network} from './FiroNetwork';
import BigNumber from 'bignumber.js';
import {randomBytes} from '../utils/crypto';
import {TransactionItem} from '../data/TransactionItem';
import {BalanceData} from '../data/BalanceData';
import {firoElectrum} from './FiroElectrum';
import {BIP32Interface} from 'bip32/types/bip32';
import {LelantusWrapper} from './LelantusWrapper';
import {LelantusCoin} from '../data/LelantusCoin';
import {LelantusEntry} from '../data/LelantusEntry';
import Logger from '../utils/logger';
import {Transaction} from 'bitcoinjs-lib/types/transaction';

const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

const EXTERNAL_INDEX = 0;
const INTERNAL_INDEX = 1;
const MINT_INDEX = 2;
const JMINT_INDEX = 5;

const HEIGHT_NOT_SET = -1;

const TRANSACTION_LELANTUS = 8;

const MINT_CONFIRM_BLOCK_COUNT = 1;

export const SATOSHI = new BigNumber(100000000);

export const TX_DATE_FORMAT = {
  year: '2-digit',
  month: '2-digit',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

type MintInput = {
  txId: string;
  txHex: string;
  outputIndex: number;
  keypair: BIP32Interface;
};

type MintTxData = {
  inputs: MintInput[];
  script: string;
  value: number;
};

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
  _txs_by_external_index: TransactionItem[] = [];
  _txs_by_internal_index: TransactionItem[] = [];
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

  async generate(): Promise<void> {
    const buf = await randomBytes(32);
    this.secret = bip39.entropyToMnemonic(buf);
    this.seed = (await bip39.mnemonicToSeed(this.secret)).toString('hex');
  }

  async setSecret(secret: string): Promise<void> {
    this.secret = secret;
    this.seed = (await bip39.mnemonicToSeed(this.secret)).toString('hex');
  }

  getSecret(): string {
    if (this.secret === undefined) {
      throw Error('FiroWallet not initialize');
    }
    return this.secret;
  }

  getBalance() {
    return new BigNumber(
      this._getUnspentCoins().reduce<number>(
        (previousValue: number, currentValue: LelantusCoin): number => {
          return previousValue + currentValue.value;
        },
        0,
      ),
    ).div(SATOSHI);
  }

  getUnconfirmedBalance() {
    return new BigNumber(
      this._getUnconfirmedCoins().reduce<number>(
        (previousValue: number, currentValue: LelantusCoin): number => {
          return previousValue + currentValue.value;
        },
        0,
      ),
    ).div(SATOSHI);
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
      Logger.error('firo_wallet:createLelantusMintTx', 'utxos is empty');
      throw Error('there are no any unspent transaction is empty');
    }
    const feeRate = await firoElectrum.getFeeRate();
    const mintInputs: Array<MintInput> = [];
    let total = new BigNumber(0);

    const mintKeyPair = this._getNode(MINT_INDEX, this.next_free_mint_index);

    for (let index = 0; index < params.utxos.length; index++) {
      const input = params.utxos[index];
      const wif = await this._getWifForAddress(input.address);
      const keyPair = await this._getKeyPairFromWIF(wif);

      mintInputs.push({
        txId: input.txId,
        txHex: input.txHex,
        outputIndex: input.index,
        keypair: keyPair,
      });

      total = total.plus(input.value);
    }
    Logger.debug('firo_wallet:createLelantusMintTx:mintInputs', mintInputs);

    const mintWithoutFee = await LelantusWrapper.lelantusMint(
      mintKeyPair,
      this.next_free_mint_index,
      total.toNumber(),
    );

    // transaction for compute fee
    const tmpTx = this.createMintTx({
      inputs: mintInputs,
      script: mintWithoutFee.script,
      value: total.toNumber(),
    });
    const bnFee = new BigNumber(feeRate)
      .times(Math.ceil(tmpTx.virtualSize() / 1000))
      .times(SATOSHI);
    total = total.minus(bnFee);

    Logger.debug('firo_wallet:createLelantusMintTx:fee', bnFee);
    Logger.debug('firo_wallet:createLelantusMintTx:total', total);

    // create real tx
    const mintWithFee = await LelantusWrapper.lelantusMint(
      mintKeyPair,
      this.next_free_mint_index,
      total.toNumber(),
    );
    const tx = this.createMintTx({
      inputs: mintInputs,
      script: mintWithFee.script,
      value: total.toNumber(),
    });

    return {
      txId: tx.getId(),
      txHex: tx.toHex(),
      value: total.toNumber(),
      publicCoin: mintWithFee.publicCoin,
      fee: bnFee.toNumber(),
    };
  }

  private createMintTx({inputs, script, value}: MintTxData): Transaction {
    const tx = new bitcoin.Psbt({network: this.network});
    tx.setVersion(2);

    inputs.forEach(input => {
      tx.addInput({
        hash: input.txId,
        index: input.outputIndex,
        sequence: 4294967294,
        // eslint-disable-next-line no-undef
        nonWitnessUtxo: Buffer.from(input.txHex, 'hex'),
      });
    });

    tx.addOutput({
      // eslint-disable-next-line no-undef
      script: Buffer.from(script, 'hex'),
      value,
    });

    inputs.forEach((input, index) => {
      tx.signInput(index, input.keypair);
      tx.validateSignaturesOfInput(index);
    });
    tx.finalizeAllInputs();

    return tx.extractTransaction();
  }

  async estimateJoinSplitFee(
    params: LelantusSpendFeeParams,
  ): Promise<FiroTxFeeReturn> {
    let spendAmount = params.spendAmount;

    const lelantusEntries = this._getLelantusEntry();

    const estimateFeeData = await LelantusWrapper.estimateJoinSplitFee(
      spendAmount,
      params.subtractFeeFromAmount,
      lelantusEntries,
    );

    Logger.info('firo_wallet:estimateJoinSplitFee', estimateFeeData);
    return estimateFeeData;
  }

  _getLelantusEntry(): LelantusEntry[] {
    const lelantusCoins = this._getUnspentCoins();
    const lelantusEntries = lelantusCoins.map<LelantusEntry>(coin => {
      const keyPair = this._getNode(MINT_INDEX, coin.index);
      if (keyPair.privateKey === undefined) {
        Logger.error(
          'firo_wallet:_getLelantusEntry',
          `key pair is undefined ${coin}`,
        );
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

    Logger.info('firo_wallet:_getLelantusEntry', lelantusEntries);
    return lelantusEntries;
  }

  async createLelantusSpendTx(
    params: LelantusSpendTxParams,
  ): Promise<FiroSpendTxReturn> {
    Logger.info('firo_wallet:createLelantusSpendTx', 'start');
    let spendAmount = params.spendAmount;
    let lelantusEntries = this._getLelantusEntry();

    const estimateJoinSplitFee = await this.estimateJoinSplitFee({
      spendAmount,
      subtractFeeFromAmount: params.subtractFeeFromAmount,
    });
    let chageToMint = estimateJoinSplitFee.chageToMint;
    let fee = estimateJoinSplitFee.fee;
    let spendCoinIndexes = estimateJoinSplitFee.spendCoinIndexes;

    const tx = new bitcoin.Psbt({network: this.network});
    tx.setLocktime(firoElectrum.getLatestBlockHeight());

    // lelantusjoinsplitbuilder.cpp, lines 299-305
    tx.setVersion(3 | (TRANSACTION_LELANTUS << 16));

    tx.addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 4294967295,
      sequence: 4294967295,
      // eslint-disable-next-line no-undef
      finalScriptSig: Buffer.alloc(0),
    });

    const index = this.next_free_mint_index;
    const jmintKeyPair = this._getNode(MINT_INDEX, index);
    const keyPath = await LelantusWrapper.getMintKeyPath(
      chageToMint,
      jmintKeyPair,
      index,
    );

    const aesKeyPair = this._getNode(JMINT_INDEX, keyPath);
    const aesPrivateKey = aesKeyPair.privateKey?.toString('hex');
    if (aesPrivateKey === undefined) {
      Logger.error(
        'firo_wallet:createLelantusSpendTx',
        'key pair is undefuned',
      );
      throw Error("Can't generate aes private key");
    }

    const jmintData = await LelantusWrapper.lelantusJMint(
      chageToMint,
      jmintKeyPair,
      index,
      aesPrivateKey,
    );
    Logger.info('firo_wallet:createLelantusSpendTx', jmintData);

    tx.addOutput({
      // eslint-disable-next-line no-undef
      script: Buffer.from(jmintData.script, 'hex'),
      value: 0,
    });

    let amount = spendAmount;
    if (params.subtractFeeFromAmount) {
      amount -= fee;
    }
    tx.addOutput({
      address: params.address,
      value: amount,
    });

    const extractedTx = tx.extractTransaction(true);
    Logger.info('firo_wallet:createLelantusSpendTx', extractedTx);

    // eslint-disable-next-line no-undef
    extractedTx.setPayload(Buffer.alloc(0));
    const txHash = extractedTx.getId();

    const setIds: number[] = [];
    const anonimitySets: string[][] = [];
    const anonymitySetHashes: string[] = [];
    const groupBlockHashes: string[] = [];
    for (let i = 0; i < lelantusEntries.length; i++) {
      const anonymitySetId = lelantusEntries[i].anonymitySetId;

      if (!setIds.includes(anonymitySetId)) {
        setIds.push(anonymitySetId);
        const result = await firoElectrum.getAnonymitySet(anonymitySetId, '');
        anonimitySets.push(result.serializedCoins);
        anonymitySetHashes.push(result.setHash);
        groupBlockHashes.push(result.blockHash);
      }
    }

    const spendScript = await LelantusWrapper.lelantusSpend(
      spendAmount,
      params.subtractFeeFromAmount,
      jmintKeyPair,
      this.next_free_mint_index,
      lelantusEntries,
      txHash.toString('hex'),
      setIds,
      anonimitySets,
      anonymitySetHashes,
      groupBlockHashes,
    );
    Logger.info('firo_wallet:createLelantusSpendTx', spendScript);

    const finalTx = new bitcoin.Psbt({network: this.network});
    finalTx.setLocktime(firoElectrum.getLatestBlockHeight());

    // lelantusjoinsplitbuilder.cpp, lines 299-305
    finalTx.setVersion(3 | (TRANSACTION_LELANTUS << 16));

    finalTx.addInput({
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      index: 4294967295,
      sequence: 4294967295,
      // eslint-disable-next-line no-undef
      finalScriptSig: Buffer.from('c9', 'hex'),
    });

    finalTx.addOutput({
      // eslint-disable-next-line no-undef
      script: Buffer.from(jmintData.script, 'hex'),
      value: 0,
    });

    finalTx.addOutput({
      address: params.address,
      value: amount,
    });

    const extTx = finalTx.extractTransaction(true);

    //eslint-disable-next-line no-undef
    extTx.setPayload(Buffer.from(spendScript, 'hex'));

    const txHex = extTx.toHex();
    const txId = extTx.getId();

    Logger.info('firo_wallet:createLelantusSpendTx', 'final tx');
    Logger.info('firo_wallet:createLelantusSpendTx', txHash);

    return {
      txId: txId,
      txHex: txHex,
      value: amount,
      fee: fee,
      jmintValue: chageToMint,
      publicCoin: jmintData.publicCoin,
      spendCoinIndexes: spendCoinIndexes,
    };
  }

  addLelantusMintToCache(
    txId: string,
    value: number,
    publicCoin: string,
  ): void {
    if (this._lelantus_coins[txId]) {
      return;
    }
    this._lelantus_coins[txId] = {
      index: this.next_free_mint_index,
      value: value,
      publicCoin: publicCoin,
      txId: txId,
      height: HEIGHT_NOT_SET,
      anonymitySetId: 0,
      isUsed: false,
    };
    this.next_free_mint_index += 1;
    Logger.info(
      'firo_wallet:addLelantusMintToCache',
      this.next_free_mint_index,
    );
  }

  markCoinsSpend(spendCoinIndexes: number[]): void {
    const coins = Object.values(this._lelantus_coins);
    coins.forEach(coin => {
      if (spendCoinIndexes.includes(coin.index)) {
        coin.isUsed = true;
      }
    });
  }

  addMintTxToCache(txId: string, value: number, fee: number, address: string) {
    const tx = new TransactionItem();
    tx.address = address;
    tx.value = value;
    tx.txId = txId;
    tx.isMint = true;
    tx.fee = fee;
    this._txs_by_external_index.unshift(tx);
  }

  addSendTxToCache(
    txId: string,
    spendAmount: number,
    fee: number,
    address: string,
  ): void {
    const tx = new TransactionItem();
    tx.address = address;
    tx.value = spendAmount;
    tx.txId = txId;
    tx.fee = fee;
    this._txs_by_external_index.unshift(tx);
  }

  async updateMintMetadata(): Promise<boolean> {
    Logger.info('firo_wallet:updateMintMetadata', this.next_free_mint_index);
    const unconfirmedCoins = this._getUnconfirmedCoins();
    if (unconfirmedCoins.length > 0) {
      const publicCoinList = unconfirmedCoins.map(coin => {
        return coin.publicCoin;
      });
      const mintMetadata = await firoElectrum.getMintMedata(publicCoinList);
      const latestBlockHeight = firoElectrum.getLatestBlockHeight();

      mintMetadata.forEach((metadata, index) => {
        if (metadata.height !== HEIGHT_NOT_SET) {
          this._updateMintCoinData(
            unconfirmedCoins[index],
            metadata.height,
            metadata.anonimitySetId,
            latestBlockHeight,
          );
          this._updateMintTxStatus(unconfirmedCoins[index]);
        }
      });
      Logger.info('firo_wallet:updateMintMetadata', 'updated');
      return true;
    }
    Logger.info('firo_wallet:updateMintMetadata', 'up to date');
    return false;
  }

  _updateMintCoinData(
    coin: LelantusCoin,
    height: number,
    anonimitySetId: number,
    latestBlockHeight: number,
  ) {
    if (latestBlockHeight - height >= MINT_CONFIRM_BLOCK_COUNT - 1) {
      coin.height = height;
      coin.anonymitySetId = anonimitySetId;
    }
  }

  _updateMintTxStatus(coin: LelantusCoin) {
    const tx = this._txs_by_external_index.find(
      item => item.txId === coin.txId,
    );
    if (tx) {
      tx.confirmed = coin.height !== HEIGHT_NOT_SET;
    }
  }

  _getUnconfirmedCoins(): LelantusCoin[] {
    const coins = Object.values(this._lelantus_coins);
    return coins.filter(coin => {
      return !coin.isUsed && coin.height === HEIGHT_NOT_SET;
    });
  }

  _getUnspentCoins(): LelantusCoin[] {
    const coins = Object.values(this._lelantus_coins);
    return coins.filter(coin => {
      return !coin.isUsed && coin.height !== HEIGHT_NOT_SET;
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
    let path = `m/44'/136'/0'/${node}/${index}`;
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
      } catch (e) {
        Logger.error('firo_wallet:getAddressAsync', e);
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
      } catch (e) {
        Logger.error('firo_wallet:getChangeAddressAsync', e);
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

  validate(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, network);
      return true;
    } catch (e) {
      return false;
    }
  }

  async fetchTransactions() {
    let needToSort = false;
    const address2Check = await this.getTransactionsAddresses();
    try {
      const fullTxs = await firoElectrum.multiGetTransactionsFullByAddress(
        address2Check,
      );
      fullTxs.forEach(tx => {
        const foundTx = this._txs_by_external_index.find(
          item => item.txId === tx.txid,
        );

        if (foundTx === undefined) {
          let transactionItem = new TransactionItem();
          transactionItem.address = tx.address;
          transactionItem.txId = tx.txid;
          if (tx.confirmations > 0) {
            transactionItem.confirmed = tx.confirmations > 0;
            transactionItem.date = tx.time * 1000;
          }

          const ia = tx.inputs.reduce(
            (acc, elm) => acc.plus(elm.value),
            new BigNumber(0),
          );
          const oa = tx.outputs.reduce(
            (acc, elm) => acc.plus(elm.value),
            new BigNumber(0),
          );

          transactionItem.fee = ia.minus(oa).toNumber();

          if (
            tx.outputs.length === 1 &&
            tx.outputs[0].scriptPubKey &&
            tx.outputs[0].scriptPubKey.type === 'lelantusmint'
          ) {
            transactionItem.received = false;
            transactionItem.isMint = true;
            transactionItem.value = tx.outputs[0].value;
            transactionItem.confirmed =
              tx.confirmations >= MINT_CONFIRM_BLOCK_COUNT;
          } else {
            let sumValue: BigNumber = new BigNumber(0);
            tx.outputs.forEach(vout => {
              if (vout.addresses && vout.addresses.includes(tx.address)) {
                sumValue = sumValue.plus(vout.value);
                transactionItem.received = true;
              }
            });
            transactionItem.value = sumValue.toNumber();
          }

          if (transactionItem.received || transactionItem.isMint) {
            needToSort = true;
            this._txs_by_external_index.push(transactionItem);
          }
        } else if (
          foundTx.confirmed === false &&
          tx.confirmations > 0 &&
          foundTx.isMint === false
        ) {
          needToSort = true;
          foundTx.date = tx.time * 1000;
        }
      });
    } catch (e) {
      Logger.error('firo_wallet:fetchTransaction', e);
    }
    if (needToSort) {
      this._txs_by_external_index.sort(
        (tx1: TransactionItem, tx2: TransactionItem) => {
          return tx2.date - tx1.date;
        },
      );
    }
  }

  getTransactions(): TransactionItem[] {
    return this._txs_by_external_index;
  }

  getTransactionsByAddress(address: string): TransactionItem[] {
    return this._txs_by_external_index.filter(tx => {
      return tx.address === address;
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
