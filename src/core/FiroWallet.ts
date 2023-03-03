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
import {AnonymitySet} from '../data/AnonymitySet';

const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

const EXTERNAL_INDEX = 0;
const INTERNAL_INDEX = 1;
const MINT_INDEX = 2;
const JMINT_INDEX = 5;

const ANONYMITY_SET_EMPTY_ID = 0;

const TRANSACTION_LELANTUS = 8;

const MINT_LIMIT = 500100000000;

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
  mints: {
    value: number;
    script: string;
  }[];
};

export class FiroWallet implements AbstractWallet {
  secret: string | undefined = undefined;
  seed: string = '';
  network: Network = network;
  balance: number = 0;
  unconfirmed_balance: number = 0;
  _lelantus_coins_list: LelantusCoin[] = [];
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

  _anonymity_sets: AnonymitySet[] = [];
  _used_serial_numbers: string[] = [];

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
  mint_index_gap_limit = 50;

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

    const mintsWithoutFee = await this.createMintsFromAmount(total.toNumber());

    // transaction for compute fee
    const tmpTx = this.createMintTx({
      inputs: mintInputs,
      mints: mintsWithoutFee.map(mint => {
        return {value: mint.value, script: mint.script};
      }),
    });
    const bnFee = new BigNumber(feeRate)
      .times(Math.ceil(tmpTx.virtualSize() / 1000))
      .times(SATOSHI);
    total = total.minus(bnFee);

    // create real tx
    const mints = await this.createMintsFromAmount(total.toNumber());
    const tx = this.createMintTx({
      inputs: mintInputs,
      mints: mints.map(mint => {
        return {value: mint.value, script: mint.script};
      }),
    });

    return {
      txId: tx.getId(),
      txHex: tx.toHex(),
      mints: mints,
      value: total.toNumber(),
      fee: bnFee.toNumber(),
    };
  }

  private async createMintsFromAmount(total: number) {
    let tmpTotal = new BigNumber(total);
    let counter = 0;
    const mints = [];
    while (tmpTotal.toNumber() > 0) {
      const index = this.next_free_mint_index + counter;
      const mintKeyPair = this._getNode(
        MINT_INDEX,
        index,
      );

      const mintTag = await LelantusWrapper.getMintTag(
        mintKeyPair,
        index,
      );
      
      if (this._anonymity_sets.find(set => set.coins.find(coin => coin[1] == mintTag) !== undefined) === undefined) {
        const mintValue = Math.min(tmpTotal.toNumber(), MINT_LIMIT);
        const mint = await LelantusWrapper.lelantusMint(
          mintKeyPair,
          index,
          mintValue,
        );
        mints.push({
          value: mintValue,
          script: mint.script,
          publicCoin: mint.publicCoin,
          index: index,
        });
        tmpTotal = tmpTotal.minus(MINT_LIMIT);
      }

      counter++;
    }
    return mints;
  }

  private createMintTx({inputs, mints}: MintTxData): Transaction {
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

    mints.forEach(mint => {
      tx.addOutput({
        // eslint-disable-next-line no-undef
        script: Buffer.from(mint.script, 'hex'),
        value: mint.value,
      });
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

    return estimateFeeData;
  }

  _getLelantusEntry(): LelantusEntry[] {
    const lelantusCoins = this._getUnspentCoins();
    const lelantusEntries = lelantusCoins.map<LelantusEntry>(coin => {
      const keyPair = this._getNode(MINT_INDEX, coin.index);
      if (keyPair.privateKey === undefined) {
        Logger.error('firo_wallet:_getLelantusEntry', 'key pair is undefined');
        return new LelantusEntry(0, '', 0, true, 0, 0);
      }
      return new LelantusEntry(
        coin.value,
        keyPair.privateKey.toString('hex'),
        coin.index,
        coin.isUsed,
        0,
        coin.anonymitySetId,
      );
    });

    return lelantusEntries;
  }

  async createLelantusSpendTx(
    params: LelantusSpendTxParams,
  ): Promise<FiroSpendTxReturn> {
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
        const anonymitySet = this._anonymity_sets.find(
          set => set.setId === anonymitySetId,
        );
        if (anonymitySet) {
          anonimitySets.push([...anonymitySet.coins.map(coin => coin[0])]);
          anonymitySetHashes.push(anonymitySet.setHash);
          groupBlockHashes.push(anonymitySet.blockHash);
        }
      }
    }

    const spendScript = await LelantusWrapper.lelantusSpend(
      spendAmount,
      params.subtractFeeFromAmount,
      jmintKeyPair,
      index,
      lelantusEntries,
      txHash.toString('hex'),
      setIds,
      anonimitySets,
      anonymitySetHashes,
      groupBlockHashes,
    );

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

    return {
      txId: txId,
      txHex: txHex,
      value: amount,
      fee: fee,
      jmintValue: chageToMint,
      publicCoin: jmintData.publicCoin,
      mintIndex: index,
      spendCoinIndexes: spendCoinIndexes,
    };
  }

  addLelantusMintToCache(
    txId: string,
    value: number,
    publicCoin: string,
    index: number,
  ): void {
    this._lelantus_coins_list.push({
      index: index,
      value: value,
      publicCoin: publicCoin,
      txId: txId,
      anonymitySetId: ANONYMITY_SET_EMPTY_ID,
      isUsed: false,
    });
    this.next_free_mint_index = Math.max(index + 1, this.next_free_mint_index);
  }

  markCoinsSpend(spendCoinIndexes: number[]): void {
    this._lelantus_coins_list.forEach(coin => {
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
    let hasUpdate = false;
    const unconfirmedCoins = this._getUnconfirmedCoins();
    if (unconfirmedCoins.length > 0) {
      this._anonymity_sets.forEach(set => {
        unconfirmedCoins.forEach(coin => {
          if (coin.anonymitySetId < set.setId && set.coins.filter(c => c[0] == coin.publicCoin).length > 0) {
            hasUpdate = true;
            coin.anonymitySetId = set.setId;
            this._updateSendTxStatus(coin);
          }
        });
      });
    }
    return hasUpdate;
  }

  _updateSendTxStatus(coin: LelantusCoin) {
    const tx = this._txs_by_external_index.find(
      item => item.txId === coin.txId,
    );
    if (tx && tx.isMint === false) {
      tx.confirmed = coin.anonymitySetId !== ANONYMITY_SET_EMPTY_ID;
    }
  }

  _getUnconfirmedCoins(): LelantusCoin[] {
    return this._lelantus_coins_list.filter(coin => {
      return !coin.isUsed && coin.anonymitySetId === ANONYMITY_SET_EMPTY_ID;
    });
  }

  _getUnspentCoins(): LelantusCoin[] {
    return this._lelantus_coins_list.filter(coin => {
      return !coin.isUsed && coin.anonymitySetId !== ANONYMITY_SET_EMPTY_ID && coin.value > 0;
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

  skipAddress(): void {
    this.next_free_address_index += 1;
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
    if (node === EXTERNAL_INDEX) {
      if (this.external_addresses_cache[index]) {
        return this.external_addresses_cache[index]; // cache hit
      }
    }

    if (node === INTERNAL_INDEX) {
      if (this.internal_addresses_cache[index]) {
        return this.internal_addresses_cache[index]; // cache hit
      }
    }

    if (node === EXTERNAL_INDEX && !this._node0) {
      const xpub = await this.getXpub();
      const hdNode = bip32.fromBase58(xpub, this.network);
      this._node0 = hdNode.derive(node);
    }

    if (node === INTERNAL_INDEX && !this._node1) {
      const xpub = await this.getXpub();
      const hdNode = bip32.fromBase58(xpub, this.network);
      this._node1 = hdNode.derive(node);
    }

    let address;
    if (node === EXTERNAL_INDEX) {
      address = this._nodeToLegacyAddress(this._node0!!.derive(index));
    }

    if (node === INTERNAL_INDEX) {
      address = this._nodeToLegacyAddress(this._node1!!.derive(index));
    }

    if (node === EXTERNAL_INDEX) {
      return (this.external_addresses_cache[index] = address);
    }

    if (node === INTERNAL_INDEX) {
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
    for (let c = 0; c < this.next_free_address_index + 40; c++) {
      const extAddr = await this._getExternalAddressByIndex(c);
      address2Fetch.push(extAddr);
    }

    // next internal addresses
    for (
      let c = 0;
      c < this.next_free_change_address_index + 40;
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
    let hasChanges = false;
    const address2Check = await this.getTransactionsAddresses();
    try {
      const fullTxs = await firoElectrum.multiGetTransactionsFullByAddress(
        address2Check,
      );
      fullTxs.forEach(tx => {
        const foundTxs = this._txs_by_external_index.filter(
          item => item.txId === tx.txid,
        );

        if (foundTxs.length == 0 || foundTxs.length == 1 && foundTxs[0].received == false && foundTxs[0].isMint == false) {
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
            hasChanges = true;
            this._txs_by_external_index.push(transactionItem);
          }
        }
        foundTxs.forEach(foundTx => {
          if (foundTx.confirmed === false && tx.confirmations > 0) {
            hasChanges = true;
            foundTx.confirmed = true;
            foundTx.date = tx.time * 1000;
          }
        })
      });
    } catch (e) {
      Logger.error('firo_wallet:fetchTransaction', e);
    }
    if (hasChanges) {
      this.sortTransactions();
    }
    return hasChanges;
  }

  private sortTransactions() {
    this._txs_by_external_index.sort(
      (tx1: TransactionItem, tx2: TransactionItem) => {
        if (Math.abs(tx2.date - tx1.date) < 1000) {
          if (tx2.isMint && tx1.received || tx2.received && !tx1.received && !tx1.isMint) {
            return 1;
          } else if (tx1.isMint && tx2.received || tx1.received && !tx2.received && !tx2.isMint) {
            return -1;
          } else {
            return tx2.date - tx1.date;
          }
        } else {
          return tx2.date - tx1.date;
        }
      },
    );
  }

  getTransactions(): TransactionItem[] {
    return this._txs_by_external_index;
  }

  getTransactionsByAddress(address: string): TransactionItem[] {
    return this._txs_by_external_index.filter(tx => {
      return tx.address === address;
    });
  }

  async fetchAnonymitySets(): Promise<boolean> {
    let hasChanges = false;
    const latestSetId = await firoElectrum.getLatestSetId();
    for (let setId = 1; setId <= latestSetId; setId++) {
      let anonymitySet = this._anonymity_sets.find(set => set.setId === setId);
      if (!anonymitySet) {
        anonymitySet = new AnonymitySet();
        anonymitySet.setId = setId;
        this._anonymity_sets.push(anonymitySet);
      }
      const fetchedAnonymitySet = await firoElectrum.getAnonymitySet(
        anonymitySet.setId,
        anonymitySet.blockHash,
      );
      if (
        fetchedAnonymitySet.setHash !== '' &&
        anonymitySet.setHash !== fetchedAnonymitySet.setHash
      ) {
        anonymitySet.setHash = fetchedAnonymitySet.setHash;
        anonymitySet.blockHash = fetchedAnonymitySet.blockHash;
        fetchedAnonymitySet.coins.reverse().forEach(coin => {
          anonymitySet?.coins.unshift(coin);
        });
        hasChanges = true;
      }
    }
    return hasChanges;
  }

  private async fixDuplicateCoinIssue(): Promise<boolean> {
    let hasChanges = false;
    let unspentCoins = this._getUnspentCoins();
    unspentCoins.forEach(coin => {
      let duplicateCoins = this._lelantus_coins_list.filter(c => c.index == coin.index);
      if (duplicateCoins.length > 1) {
        let maxSetId = Math.max(...duplicateCoins.map(c => c.anonymitySetId));
        this._lelantus_coins_list = this._lelantus_coins_list.filter(c => c.index != coin.index || c.anonymitySetId == maxSetId)
        hasChanges = true;
      }
    })
    unspentCoins = this._getUnspentCoins();
    unspentCoins.forEach(coin => {
      this._anonymity_sets.forEach(set => {
        if (coin.anonymitySetId < set.setId) {
          const foundCoin = set.coins.find(setCoin => setCoin[0] === coin.publicCoin);
          if (foundCoin) {
            coin.anonymitySetId = set.setId;
            hasChanges = true;
          }
        }
      })
    })
    return hasChanges;
  }

  async fetchUsedCoins(): Promise<boolean> {
    let hasChanges = false;
    const usedSerialNumbers = (
      await firoElectrum.getUsedCoinSerials(this._used_serial_numbers.length)
    ).serials;
    hasChanges = usedSerialNumbers.length > 0;
    this._used_serial_numbers = [...this._used_serial_numbers, ...usedSerialNumbers];
    return hasChanges;
  }

  async sync(callback: () => void): Promise<void> {
    if (await this.fetchTransactions()) {
      callback();
    }

    if (await this.fetchUsedCoins()) {
      callback();
    }

    if (await this.fetchAnonymitySets()) {
      callback();
    }

    if (await this.fixDuplicateCoinIssue()) {
      callback();
    }

    let result = await this.extractMintTransactions();
    if (result.hasChanges) {
      if (result.spendTxIds.length > 0) {
        await this.fetchSpendTxs(result.spendTxIds);
      }
      callback();
    }
  }

  async restore(
    callback: (progress: number, total: number) => void,
  ): Promise<void> {
    let callbackIndex = 1;
    const totalCallbacks = 5;

    callback(callbackIndex++, totalCallbacks);
    await this.fetchTransactions();

    callback(callbackIndex++, totalCallbacks);
    await this.fetchUsedCoins();

    callback(callbackIndex++, totalCallbacks);
    await this.fetchAnonymitySets();

    callback(callbackIndex++, totalCallbacks);
    const result = await this.extractMintTransactions();

    callback(callbackIndex++, totalCallbacks);
    await this.fetchSpendTxs(result.spendTxIds);
  }

  private async extractMintTransactions(): Promise<{
    hasChanges: boolean;
    spendTxIds: string[];
  }> {
    let hasChanges = false;

    const latestSetId = Math.max(...this._anonymity_sets.map(set => set.setId));
    const setDataMap: {
      [key: number]: AnonymitySet;
    } = {};
    this._anonymity_sets.forEach(set => {
      setDataMap[set.setId] = set;
    })

    const unspentCoins = this._getUnspentCoins();

    const spendTxIds: string[] = [];

    if (this._lelantus_coins_list.length > 0) {
      const actualFreeMintIndex = this._lelantus_coins_list[this._lelantus_coins_list.length - 1].index + 1;
      if (this.next_free_mint_index != actualFreeMintIndex) {
        this.next_free_mint_index = actualFreeMintIndex
        hasChanges = true;
      }
    }

    let lastFoundIndex = this.next_free_mint_index - 1;
    let currentIndex = this.next_free_mint_index;
    while (currentIndex < lastFoundIndex + this.mint_index_gap_limit) {
      const mintKeyPair = this._getNode(MINT_INDEX, currentIndex);
      const mintTag = await LelantusWrapper.getMintTag(
        mintKeyPair,
        currentIndex,
      );

      let coinSetId = 0;
      for (let setId = latestSetId; setId >= 1; setId--) {
        const setData = setDataMap[setId];
        const foundCoin = setData.coins.find(coin => coin[1] === mintTag);
        if (foundCoin && coinSetId == 0) {
          hasChanges = true;
          coinSetId = setId;
          if (typeof foundCoin[2] === 'number') {
            // mint
            lastFoundIndex = currentIndex;
            const amount = foundCoin[2];
            const serialNumber = await LelantusWrapper.getSerialNumber(
              mintKeyPair,
              currentIndex,
              amount,
            );
            this._lelantus_coins_list.push({
              index: currentIndex,
              value: amount,
              publicCoin: foundCoin[0],
              txId: foundCoin[3],
              anonymitySetId: setId,
              isUsed: this._used_serial_numbers.includes(serialNumber),
            });
          } else {
            // jmint
            lastFoundIndex = currentIndex;

            const keyPath = await LelantusWrapper.getAesKeyPath(foundCoin[0]);
            const aesKeyPair = this._getNode(JMINT_INDEX, keyPath);
            const aesPrivateKey = aesKeyPair.privateKey?.toString('hex');
            if (aesPrivateKey !== undefined) {
              const amount = await LelantusWrapper.decryptMintAmount(
                aesPrivateKey,
                foundCoin[2],
              );

              const serialNumber = await LelantusWrapper.getSerialNumber(
                mintKeyPair,
                currentIndex,
                amount,
              );

              this._lelantus_coins_list.push({
                index: currentIndex,
                value: amount,
                publicCoin: foundCoin[0],
                txId: foundCoin[3],
                anonymitySetId: setId,
                isUsed: this._used_serial_numbers.includes(serialNumber),
              });

              spendTxIds.push(foundCoin[3]);
            }
          }
        }
      }

      currentIndex++;
    }

    this.next_free_mint_index = lastFoundIndex + 1;

    if (this.mint_index_gap_limit != 20) {
      hasChanges = true;
      this.mint_index_gap_limit = 20;
    }

    if (spendTxIds.length > 0) {
      for (let index = 0; index < unspentCoins.length; index++) {
        const coin = unspentCoins[index];
        if (this._used_serial_numbers.includes(coin.publicCoin)) {
          coin.isUsed = true;
        }
      }
    }

    return {hasChanges: hasChanges, spendTxIds: spendTxIds};
  }

  private async fetchSpendTxs(spendTxIds: string[]): Promise<void> {
    const spendTxs = await firoElectrum.multiGetTransactionByTxid(spendTxIds);
    for (const [txid, tx] of Object.entries(spendTxs)) {
      const foundTxs = this._txs_by_external_index.filter(
        item => item.txId === tx.txid,
      );

      if (foundTxs.length == 0 || foundTxs.length == 1 && foundTxs[0].received == true) {
        const transactionItem = new TransactionItem();
        if (tx.confirmations > 0) {
          transactionItem.confirmed = tx.confirmations > 0;
          transactionItem.date = tx.time * 1000;
        }
        tx.vout.forEach(vout => {
          if (vout.value > 0) {
            transactionItem.value += vout.value;
            transactionItem.address = vout.scriptPubKey.addresses[0];
          }
        });
        transactionItem.txId = txid;
        tx.vin.forEach(vin => (transactionItem.fee += vin.nFees));
        this._txs_by_external_index.unshift(transactionItem);
      }
    }

    this.sortTransactions();
  }

  prepareForSerialization(): void {
    this._txs_by_external_index = [];
    this._txs_by_internal_index = [];

    this._anonymity_sets = [];

    this._used_serial_numbers = [];

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
