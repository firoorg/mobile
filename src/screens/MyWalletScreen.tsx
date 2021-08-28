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
  const {saveToDisk} = useContext(FiroContext);

  const getAddress = async () => {
    const wallet = getWallet();
    if (wallet === undefined) {
      throw new Error('wallet not created');
    }

    try {
      const address = await wallet.getAddressAsync();
      setWalletAddress(address);
    } catch (e) {
      console.log('error when getting address', e);
    }
  };

  const updateBalance = async () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      if (typeof walletBalance !== 'undefined') {
        setBalance(walletBalance);
      } else {
        setBalance(0);
      }

      const elBalance = await firoElectrum.getBalanceByAddress(walletAddress);
      console.log('balance is ', elBalance.confirmed / 100000000);
    } catch (e) {
      console.log('error when getting balance', e);
    }
  };

  const mintUnspendTransactions = async () => {
    console.log('mint start');
    const wallet = getWallet();
    if (!wallet) {
      return;
    }

    try {
      const utxos = await firoElectrum.getUnspendTransactionsByAddress(
        walletAddress,
      );
      if (utxos && utxos.length === 0) {
        return;
      }
      const txIds = utxos.map(tx => tx.tx_hash);
      const txs = await firoElectrum.multiGetTransactionByTxid(txIds);

      const lelantusUtxos = utxos.map(utxo => {
        const fTx = txs.get(utxo.tx_hash);
        return {
          txId: utxo.tx_hash,
          txHex: fTx!!.hex,
          index: utxo.tx_pos,
          value: utxo.value,
          address: walletAddress,
        };
      });

      if (lelantusUtxos.length > 0) {
        const mint = await wallet.createLelantusMintTx({
          utxos: lelantusUtxos,
        });
        console.log('mintTx', mint);
      }
    } catch (e) {
      console.log('error when creating mint transaction', e);
    }
  };

  const getTransactionList = async () => {
    try {
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
          if (vout.addresses && vout.addresses.includes(walletAddress)) {
            transactionItem.value += vout.value;
          }
        });
        txList.push(transactionItem);
      });
      setTxHistory(txList);
    } catch (e) {
      console.log('error when getting transaction list', e);
    }
  };
  useEffect(() => {
    getAddress();
  }, []);
  useEffect(() => {
    if (walletAddress === '') {
      return;
    }
    updateBalance();
    saveToDisk();
  }, [walletAddress]);
  useEffect(() => {
    if (walletAddress === '') {
      return;
    }
    getTransactionList();
  }, [walletAddress]);
  useEffect(() => {
    if (walletAddress === '') {
      return;
    }
    mintUnspendTransactions();
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
