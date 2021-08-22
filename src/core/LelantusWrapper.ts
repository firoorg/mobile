import {BIP32Interface} from 'bip32/types/bip32';
import RNLelantus from '../../react-native-lelantus';

export class LelantusWrapper {
  static async getMintCommitment(
    keypair: BIP32Interface,
    index: number,
    value: number,
  ): Promise<string> {
    return new Promise(resolve => {
      console.log('value', value);
      RNLelantus.getMintCommitment(
        value,
        keypair.privateKey?.toString('hex'),
        index,
        keypair.fingerprint.toString('hex'),
        (commitment: string) => {
          resolve(commitment);
        },
      );
    });
  }
}
