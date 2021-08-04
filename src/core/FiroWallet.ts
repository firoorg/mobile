import {AbstractWallet} from './AbstractWallet';
import {network, Network} from './FiroNetwork';
import BigNumber from 'bignumber.js';
import {randomBytes} from '../utils/crypto';
import {TransactionItem} from '../data/TransactionItem';
import {BalanceData} from '../data/BalanceData';
import {firoElectrum} from './FiroElectrum';
import {FullTransactionModel} from './AbstractElectrum';
import {BIP32Interface} from 'bip32/types/bip32';

const bitcoin = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');

const EXTERNAL_INDEX = 0;
const INTERNAL_INDEX = 1;

export class FiroWallet implements AbstractWallet {
  secret: string | undefined = undefined;
  network: Network = network;
  balance: number = 0;
  unconfirmed_balance: number = 0;
  utxo: Array<TransactionItem> = [];
  _lastTxFetch: number = 0;
  _lastBalanceFetch: Date = new Date();
  _balances_by_external_index: Array<BalanceData> = [];
  _balances_by_internal_index: Array<BalanceData> = [];
  _txs_by_external_index: Array<Array<TransactionItem>> = [];
  _txs_by_internal_index: Array<Array<TransactionItem>> = [];

  next_free_address_index = 0;
  next_free_change_address_index = 0;
  internal_addresses_cache = {}; // index => address
  external_addresses_cache = {}; // index => address
  _xPub: string = ''; // cache
  usedAddresses = [];
  _address_to_wif_cache = {};
  gap_limit = 20;

  private _changeNodes: {
    [key: string]: any;
  } = {};
  private _indexAddress: {
    [key: string]: any;
  } = {};

  async generate(): Promise<void> {
    const buf = await randomBytes(32);
    this.secret = bip39.entropyToMnemonic(buf);
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
    let ret = 0;
    for (const bal of Object.values(this._balances_by_external_index)) {
      ret += bal.c;
    }
    for (const bal of Object.values(this._balances_by_internal_index)) {
      ret += bal.c;
    }
    return (
      ret +
      (this.getUnconfirmedBalance() < 0 ? this.getUnconfirmedBalance() : 0)
    );
  }

  getUnconfirmedBalance() {
    let ret = 0;
    for (const bal of Object.values(this._balances_by_external_index)) {
      ret += bal.u;
    }
    for (const bal of Object.values(this._balances_by_internal_index)) {
      ret += bal.u;
    }
    return ret;
  }

  async getXpub(): Promise<string> {
    if (this._xPub !== '') {
      return this._xPub;
    }

    const secret = this.getSecret();
    // const secret = "salt theme sheriff summer slab travel sheriff dress quarter silly below grunt girl salon method design rug blanket throw comfort icon select trophy exclude";
    const seed = await bip39.mnemonicToSeed(secret);
    const root = bitcoin.bip32.fromSeed(seed, this.network);
    console.log('mnemonic:', secret);
    // const privateKey = root.derivePath("m/44'/136'/0'/2/0");
    // console.log('indentifier:', privateKey.identifier.reverse().toString('hex'));
    // console.log('privateKey:', privateKey.privateKey.toString('hex'));
    this._xPub = root
      .deriveHardened(44)
      .deriveHardened(136)
      .deriveHardened(0)
      .neutered()
      .toBase58();
    return this._xPub;
  }

  async getExternalAddressByIndex(index: number): Promise<string> {
    return this._getNodeAddressByIndex(EXTERNAL_INDEX, index);
  }

  async getInternalAddressByIndex(index: number): Promise<string> {
    return this._getNodeAddressByIndex(INTERNAL_INDEX, index);
  }

  async _getNodeAddressByIndex(change: number, index: number): Promise<string> {
    const addressKey = `${change}_${index}`;
    const cacheAddress = this._indexAddress[addressKey];
    if (cacheAddress !== undefined) {
      return cacheAddress;
    }

    let node = this._changeNodes[change];
    if (!node) {
      const xpub = await this.getXpub();
      const root = bip32.fromBase58(xpub, this.network);
      node = root.derive(change);

      this._changeNodes[change] = node;
    }

    const address = this._nodeToLegacyAddress(node!.derive(index));
    this._indexAddress[addressKey] = address;

    return address;
  }

  _nodeToLegacyAddress(hdNode: BIP32Interface) {
    return bitcoin.payments.p2pkh({
      pubkey: hdNode.publicKey,
      network: this.network,
    }).address;
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
        addresses2fetch.push(await this.getExternalAddressByIndex(c));
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
        addresses2fetch.push(await this.getInternalAddressByIndex(c));
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
            vin.addresses.indexOf(this.getExternalAddressByIndex(c)) !== -1
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
              this.getExternalAddressByIndex(c),
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
            vin.addresses.indexOf(this.getInternalAddressByIndex(c)) !== -1
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
              this.getInternalAddressByIndex(c),
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
      ownedAddressesHashmap.set(await this.getExternalAddressByIndex(c), true);
    }
    for (let c = 0; c < this.next_free_change_address_index + 1; c++) {
      ownedAddressesHashmap.set(await this.getInternalAddressByIndex(c), true);
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
    this._changeNodes = {};
    this._indexAddress = {};
  }

  static fromJson(obj: string): FiroWallet {
    const obj2 = JSON.parse(obj);
    const temp = new this();
    for (const key2 of Object.keys(obj2)) {
      temp[key2] = obj2[key2];
    }

    return temp;
  }
}
