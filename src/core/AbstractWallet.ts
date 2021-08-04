import {BalanceData} from '../data/BalanceData';
import {TransactionItem} from '../data/TransactionItem';

export interface AbstractWallet {
  secret: string | undefined; // private key or recovery phrase
  balance: number;
  unconfirmed_balance: number;
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

  getExternalAddressByIndex(index: number): Promise<string>;
  getInternalAddressByIndex(index: number): Promise<string>;

  getBalance(): number;
  getUnconfirmedBalance(): number;
  getTransactions(): Promise<Array<TransactionItem>>;

  prepareForSerialization(): void;
}
