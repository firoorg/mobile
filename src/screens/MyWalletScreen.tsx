import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {FiroToolbarWithoutBack} from '../components/Toolbar';
import {BalanceCard} from '../components/BalanceCard';
import {TransactionList} from '../components/TransactionList';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import {firoElectrum} from '../core/FiroElectrum';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';
import RNLelantus from '../../react-native-lelantus';
import {LelantusEntry} from '../data/LelantusEntry';

const {colors} = CurrentFiroTheme;

function lelantusMint(
  value: number,
  privateKey: string,
  index: number,
  seed: String,
) {
  return new Promise<string>(resolve => {
    RNLelantus.getMintScript(
      value,
      privateKey,
      index,
      seed,
      (script: string) => {
        resolve(script);
      },
    );
  });
}

function estimateJoinSplitFee(
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

function lelantusJMint(
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

const MyWalletScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [txHistory, setTxHistory] = useState(new Array<TransactionItem>());

  const getAddress = async () => {
    const wallet = getWallet();
    if (wallet === undefined) {
      throw new Error('wallet not created');
    }

    let script = await lelantusMint(
      100000000,
      'fb766cc0a77a2255f10d4e3bf5e2ea53ff425441ce488f51d99140c6280b414f',
      0,
      'f2402f6f0e7e5e999847b394563dc101398d2750',
    );
    console.log('mint script', script);
    let joinSplitData = await estimateJoinSplitFee(
      50000000,
      false,
      'fb766cc0a77a2255f10d4e3bf5e2ea53ff425441ce488f51d99140c6280b414f',
      [new LelantusEntry(100000000, 0, false, 1000, 12)],
    );
    console.log('fee', joinSplitData.fee);
    console.log('chageToMint', joinSplitData.chageToMint);
    let jMintScript = await lelantusJMint(
      5000000,
      'fb766cc0a77a2255f10d4e3bf5e2ea53ff425441ce488f51d99140c6280b414f',
      1,
      'f2402f6f0e7e5e999847b394563dc101398d2750',
      'fb766cc0a77a2255f10d4e3bf5e2ea53ff425441ce488f51d99140c6280b414f',
    );
    console.log('jmint script', jMintScript);

    const address = await wallet.getExternalAddressByIndex(0);
    console.log('address', address);
    setWalletAddress(address);
  };

  const getBalance = async () => {
    const elBalance = await firoElectrum.getBalanceByAddress(walletAddress);
    console.log('elBalance', elBalance);
    const listUnspent = await firoElectrum.getUnspendTransactionsByAddress(
      walletAddress,
    );
    console.log('listUnspent', listUnspent);
    setBalance(elBalance.confirmed / 100000000);
  };

  const getTransactionList = async () => {
    const fullTxs = await firoElectrum.getTransactionsFullByAddress(
      walletAddress,
    );
    const txList = new Array<TransactionItem>();
    fullTxs.forEach(tx => {
      console.log(tx);
      let transactionItem = new TransactionItem();
      transactionItem.address = tx.address;
      transactionItem.date = new Date(tx.time * 1000);
      transactionItem.transactionId = tx.txid;
      tx.outputs.forEach(vout => {
        if (vout.addresses.includes(walletAddress)) {
          transactionItem.value += vout.value;
        }
      });
      txList.push(transactionItem);
    });
    setTxHistory(txList);
  };

  useEffect(() => {
    getAddress();
  });
  useEffect(() => {
    getBalance();
  }, [walletAddress]);
  useEffect(() => {
    getTransactionList();
  }, [walletAddress]);

  return (
    <View style={styles.root}>
      <FiroToolbarWithoutBack title={localization.my_wallet_screen.title} />
      <View style={styles.balanceCardContainer}>
        <BalanceCard style={styles.balanceCard} balance={balance} />
      </View>
      <View style={styles.transactionContainer}>
        {/* <FiroTransactionEmpty /> */}
        <TransactionList transactionList={txHistory} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 30,
  },
  balanceCardContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  balanceCard: {
    width: '100%',
  },
  transactionContainer: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 60,
  },
});

export default MyWalletScreen;
