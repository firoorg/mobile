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

const {colors} = CurrentFiroTheme;

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

    const address = await wallet.address();
    console.log('address', address);
    setWalletAddress(address);
  };

  const getBalance = async () => {
    const elBalance = await firoElectrum.getBalanceByAddress(walletAddress);
    setBalance(elBalance.confirmed / 100000000);
  };
  const getTransactionList = async () => {
    const fullTxs = await firoElectrum.getTransactionsFullByAddress(
      walletAddress,
    );
    const txList = new Array<TransactionItem>();
    fullTxs.forEach(tx => {
      let transactionItem = new TransactionItem();
      transactionItem.address = tx.address;
      transactionItem.date = new Date(tx.time * 1000);
      transactionItem.transactionId = tx.txid;
      tx.outputs.forEach(vout => {
        if (vout.addresses.includes(walletAddress)) {
          transactionItem.firo += vout.value;
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
