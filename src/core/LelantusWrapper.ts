import {BIP32Interface} from 'bip32/types/bip32';
import RNLelantus from '../../react-native-lelantus';
import {LelantusEntry} from '../data/LelantusEntry';

export class LelantusWrapper {
  static async lelantusMint(
    keypair: BIP32Interface,
    index: number,
    value: number,
  ): Promise<string> {
    return new Promise(resolve => {
      console.log('value', value);
      RNLelantus.getMintScript(
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

  static async estimateJoinSplitFee(
    spendAmount: number,
    subtractFeeFromAmount: boolean,
    privateKey: String,
    coins: LelantusEntry[],
  ) {
    return new Promise<{fee: number; chageToMint: number}>(resolve => {
      RNLelantus.estimateJoinSplitFee(
        spendAmount,
        subtractFeeFromAmount,
        privateKey,
        coins,
        (fee: number, chageToMint: number) => {
          resolve({fee, chageToMint});
        },
      );
    });
  }

  static async lelantusJMint(
    value: number,
    privateKey: string,
    index: number,
    seed: String,
    privateKeyAES: String,
  ) {
    return new Promise<string>(resolve => {
      RNLelantus.getJMintScript(
        value,
        privateKey,
        index,
        seed,
        privateKeyAES,
        (script: string) => {
          resolve(script);
        },
      );
    });
  }
}
