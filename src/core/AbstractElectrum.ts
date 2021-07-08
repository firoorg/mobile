export type BalanceModel = {
  confirmed: number;
  address: string;
};

export type TransactionModel = {
  tx_hash: string;
  height: number;
};

export type VIn = {
  address: string;
  addresses: Array<string>;
  txid: string;
  value: number;
};

export type VOut = {
  addresses: Array<string>;
  value: number;
};

export type FullTransactionModel = {
  address: string;
  blockHash: number;
  blockTime: number;
  confirmation: number;
  hash: string;
  height: number;
  hex: string;
  inputs: Array<VIn>;
  outputs: Array<VOut>;
  size: number;
  time: number;
  txid: string;
  type: number;
  version: number;
};

export interface AbstractElectrum {
  connectMain(): Promise<void>;

  getBalanceByAddress(address: string): Promise<BalanceModel>;

  getTransactionsByAddress(address: string): Promise<Array<TransactionModel>>;

  getTransactionsFullByAddress(
    address: string,
  ): Promise<Array<FullTransactionModel>>;
}
