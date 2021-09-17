export class TransactionItem {
  value: number = 0;
  received: boolean = false;
  isMint: boolean = false;
  date: Date = new Date();
  confirmed: boolean = false;
  txId: string = '';
  address: string = '';
  fee: number = 0;
  label: string | undefined;
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
