import {BIP32Interface} from 'bip32/types/bip32';
import RNLelantus from '../../react-native-lelantus';
import {LelantusEntry} from '../data/LelantusEntry';

export class LelantusWrapper {
  static async lelantusMint(
    keypair: BIP32Interface,
    index: number,
    value: number,
  ): Promise<{script: string; publicCoin: string}> {
    return new Promise(resolve => {
      console.log('value', value);
      RNLelantus.getMintScript(
        value,
        keypair.privateKey?.toString('hex'),
        index,
        keypair.identifier.toString('hex'),
        (script: string, publicCoin: string) => {
          resolve({script, publicCoin});
        },
      );
    });
  }

  static async estimateJoinSplitFee(
    spendAmount: number,
    subtractFeeFromAmount: boolean,
    coins: LelantusEntry[],
  ) {
    return new Promise<{fee: number; chageToMint: number}>(resolve => {
      RNLelantus.estimateJoinSplitFee(
        spendAmount,
        subtractFeeFromAmount,
        coins,
        (fee: number, chageToMint: number) => {
          resolve({fee, chageToMint});
        },
      );
    });
  }

  static async getMintKeyPath(
    value: number,
    keypair: BIP32Interface,
    index: number,
  ) {
    return new Promise<number>(resolve => {
      RNLelantus.getMintKeyPath(
        value,
        keypair.privateKey?.toString('hex'),
        index,
        (keyPath: number) => {
          resolve(keyPath);
        },
      );
    });
  }

  static async lelantusJMint(
    value: number,
    keypair: BIP32Interface,
    index: number,
    privateKeyAES: String,
  ) {
    return new Promise<string>(resolve => {
      RNLelantus.getJMintScript(
        value,
        keypair.privateKey?.toString('hex'),
        index,
        keypair.identifier.toString('hex'),
        privateKeyAES,
        (script: string) => {
          resolve(script);
        },
      );
    });
  }

  static async lelantusSpend(
    value: number,
    subtractFeeFromAmount: boolean,
    keypair: BIP32Interface,
    index: number,
    coins: LelantusEntry[],
    txHash: string,
    setIds: number[],
    anonymitySets: string[][],
    anonymitySetHashes: string[],
    groupBlockHashes: string[],
  ) {
    return new Promise<string>(resolve => {
      RNLelantus.getSpendScript(
        value,
        subtractFeeFromAmount,
        keypair.privateKey?.toString('hex'),
        index,
        coins,
        txHash,
        setIds,
        anonymitySets,
        anonymitySetHashes,
        groupBlockHashes,
        (script: string) => {
          resolve(script);
        },
      );
    });
  }
}
