import {BalanceData} from '../data/BalanceData';
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

export type LelantusSpendFeeParams = {
  spendAmount: number;
  subtractFeeFromAmount: boolean;
};

export type FiroTxFeeReturn = {
  fee: number;
  chageToMint: number;
  spendCoinIndexes: number[];
};

export type LelantusSpendTxParams = {
  spendAmount: number;
  address: string;
  subtractFeeFromAmount: boolean;
};

export type FiroMintTxReturn = {
  txId: string;
  txHex: string;
  value: number;
  publicCoin: string;
  fee: number;
};

export type FiroSpendTxReturn = {
  txId: string;
  txHex: string;
  value: number;
  fee: number;
  jmintValue: number;
  publicCoin: string;
  spendCoinIndexes: number[];
};

export interface AbstractWallet {
  secret: string | undefined; // private key or recovery phrase
  utxo: Array<TransactionItem>;
  _lastTxFetch: number;
  _lastBalanceFetch: Date;
  _balances_by_external_index: Array<BalanceData>; //  0 => { c: 0, u: 0 } // confirmed/unconfirmed
  _balances_by_internal_index: Array<BalanceData>;
  _txs_by_external_index: TransactionItem[];
  _txs_by_internal_index: TransactionItem[];

  generate(): Promise<void>;
  setSecret(secret: string): Promise<void>;
  getSecret(): string;

  getAddressAsync(): Promise<string>;
  getChangeAddressAsync(): Promise<string>;
  getTransactionsAddresses(): Promise<Array<string>>;

  getBalance(): number;
  getUnconfirmedBalance(): number;

  getTransactions(): TransactionItem[];
  fetchTransactions(): Promise<void>;
  getTransactionsByAddress(address: string): TransactionItem[];

  prepareForSerialization(): void;

  createLelantusMintTx(params: LelantusMintTxParams): Promise<FiroMintTxReturn>;
  estimateJoinSplitFee(
    params: LelantusSpendFeeParams,
  ): Promise<FiroTxFeeReturn>;
  createLelantusSpendTx(
    params: LelantusSpendTxParams,
  ): Promise<FiroSpendTxReturn>;
  addLelantusMintToCache(txId: string, value: number, publicCoin: string): void;
  markCoinsSpend(spendCoinIndexes: number[]): void;
  addMintTxToCache(txId: string, value: number, address: string): void;
  addSendTxToCache(txId: string, spendAmount: number, address: string): void;
  updateMintMetadata(): Promise<boolean>;
}
