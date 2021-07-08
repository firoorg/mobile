import {AbstractWallet} from './AbstractWallet';
import {network, Network} from './FiroNetwork';
import {randomBytes} from '../utils/crypto';

const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');

export class FiroWallet implements AbstractWallet {
  private secret: string | undefined = undefined;
  private network: Network = network;

  async generate(): Promise<void> {
    const buf = await randomBytes(32);
    this.secret = bip39.entropyToMnemonic(buf);
  }

  setSecret(secret: string): void {
    this.secret = secret;
  }

  getSecret(): string {
    if (this.secret === undefined) {
      throw Error('FiroWallet not initialize');
    }
    return this.secret;
  }

  async address(): Promise<string> {
    const secret = this.getSecret();
    const seed = await bip39.mnemonicToSeed(secret);
    const root = bitcoin.bip32.fromSeed(seed, this.network);
    const child = root.derivePath("m/44'/136'/0'").neutered();
    const payment = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: this.network,
    });
    if (payment.address === undefined) {
      throw Error('address is undefined');
    }
    return payment.address;
  }

  static fromJson(obj: string) {
    const obj2 = JSON.parse(obj);
    const temp = new this();
    for (const key2 of Object.keys(obj2)) {
      temp[key2] = obj2[key2];
    }

    return temp;
  }
}
