const iconColorSet: string[] = ['#5EA7A1', '#7A78B8', '#7CAAC3', '#D37A90'];

export class AddressBookItem {
  id: number = -1;
  name: string;
  address: string;
  iconColor: string;

  constructor(name: string, address: string) {
    this.name = name;
    this.address = address;
    this.iconColor =
      iconColorSet[Math.ceil(Math.random() * iconColorSet.length) - 1];
  }
}
