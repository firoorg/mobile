export class TransactionItem {
  value: number = 0;
  received: boolean = true;
  blocktime: number = 0;
  date: Date = new Date();
  status: number = 0;
  transactionId: string = '';
  address: string = '';
  fee: number = 0;
  label: string | undefined;
  confirmations: number = 0;
  txid: string = '';
  hash: string = '';
  inputs: Array<VIn> = [];
  outputs: Array<VOut> = [];
}

export type VIn = {
  address: string;
  addresses: Array<string>;
  txid: string;
  value: number;
};

export type VOut = {
  addresses: Array<string>;
  value: number;
  scriptPubKey: ScriptPubKey;
};

export type ScriptPubKey = {
  addresses: Array<string>;
};
