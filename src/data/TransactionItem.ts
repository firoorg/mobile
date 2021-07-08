export class TransactionItem {
  firo: number = 0;
  received: boolean = true;
  date: Date = new Date();
  status: number = 0;
  transactionId: string = '';
  address: string = '';
  fee: number = 0;
  label: string | undefined;
}
