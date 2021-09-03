export class BalanceModel {
  confirmed: number = 0;
  unconfirmed: number = 0;
  addresses: Map<string, string> = new Map();
}

export class TransactionModel {
  tx_hash: string = '';
  height: number = 0;
  tx_pos: number = 0;
  value: number = 0;
}

export type VIn = {
  address: string;
  addresses: Array<string>;
  txid: string;
  value: number;
  vout: number;
};

export type VOut = {
  addresses: Array<string>;
  value: number;
  scriptPubKey: ScriptPubKey;
};

export type ScriptPubKey = {
  addresses: Array<string>;
  type: string;
};

export class FullTransactionModel {
  address: string = '';
  blockHash: number = 0;
  blockTime: number = 0;
  confirmation: number = 0;
  hash: string = '';
  height: number = 0;
  hex: string = '';
  vin: Array<VIn> = [];
  vout: Array<VOut> = [];
  inputs: Array<VIn> = [];
  outputs: Array<VOut> = [];
  size: number = 0;
  time: number = 0;
  txid: string = '';
  type: number = 0;
  version: number = 0;
  confirmations: number = 0;
}

export type MintMetadataModel = {
  height: number;
  anonimitySetId: number;
};

export type AnonymitySetModel = {
  serializedCoins: string[];
  blockHash: string;
  setHash: string;
};

export interface AbstractElectrum {
  connectMain(): Promise<void>;

  getLatestBlockHeight(): number;

  getBalanceByAddress(address: string): Promise<BalanceModel>;

  getTransactionsByAddress(address: string): Promise<Array<TransactionModel>>;

  getTransactionsFullByAddress(
    address: string,
  ): Promise<Array<FullTransactionModel>>;

  multiGetBalanceByAddress(
    addresses: Array<string>,
    batchsize?: number,
  ): Promise<BalanceModel>;

  multiGetHistoryByAddress(
    addresses: Array<string>,
    batchsize?: number,
  ): Promise<Map<string, Array<FullTransactionModel>>>;

  multiGetTransactionByTxid(
    txids: Array<string>,
    batchsize?: number,
    verbose?: boolean,
  ): Promise<Map<string, FullTransactionModel>>;

  getUnspentTransactionsByAddress(
    address: string,
  ): Promise<Array<TransactionModel>>;

  broadcast(hex: string): Promise<string>;

  getMintMedata(serilizedCoins: string[]): Promise<MintMetadataModel[]>;

  getAnonymitySet(setId: number): Promise<AnonymitySetModel>;
}
