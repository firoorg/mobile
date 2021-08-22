export class LelantusEntry {
  amount: number = 0;
  index: number = 0;
  isUsed: boolean = false;
  height: number = 0;
  anonymitySetId: number = 0;

  constructor(
    amount: number,
    index: number,
    isUsed: boolean,
    height: number,
    anonymitySetId: number,
  ) {
    this.amount = amount;
    this.index = index;
    this.isUsed = isUsed;
    this.height = height;
    this.anonymitySetId = anonymitySetId;
  }
}
