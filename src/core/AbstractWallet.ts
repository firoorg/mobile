import {BalanceData} from '../data/BalanceData';
import {LelantusCoin} from '../data/LelantusCoin';
import {TransactionItem} from '../data/TransactionItem';

export type LelantusMintTxParams = {
  utxos: {
    txId: string;
    txHex: string;
    index: number;
    value: number;
    address: string;
  }[];
};

export type FiroTxReturn = {
  txId: string;
  txHex: string;
  value: number;
  publicCoin: string;
  fee: number;
};

export interface AbstractWallet {
  secret: string | undefined; // private key or recovery phrase
  utxo: Array<TransactionItem>;
  _lastTxFetch: number;
  _lastBalanceFetch: Date;
  _balances_by_external_index: Array<BalanceData>; //  0 => { c: 0, u: 0 } // confirmed/unconfirmed
  _balances_by_internal_index: Array<BalanceData>;
  _txs_by_external_index: Array<Array<TransactionItem>>;
  _txs_by_internal_index: Array<Array<TransactionItem>>;

  generate(): Promise<void>;
  setSecret(secret: string): void;
  getSecret(): string;

  getAddressAsync(): Promise<string>;
  getChangeAddressAsync(): Promise<string>;

  getTransactionsAddresses(): Promise<Array<string>>;

  getBalance(): number;
  getUnconfirmedBalance(): number;
  getTransactions(): Promise<Array<TransactionItem>>;

  prepareForSerialization(): void;

  createLelantusMintTx(params: LelantusMintTxParams): Promise<FiroTxReturn>;
  addLelantusMintToCache(
    txId: string,
    value: number,
    publicCoin: string,
  ): Promise<void>;
  getUnconfirmedCoins(): Promise<LelantusCoin[]>;
  checkIsMintConfirmed(): Promise<void>;
}
