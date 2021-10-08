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
import {FiroTransactionEmpty} from '../components/EmptyState';
import {SATOSHI} from '../core/FiroWallet';
import {useFocusEffect} from '@react-navigation/native';
import BigNumber from 'bignumber.js';

const {colors} = CurrentFiroTheme;

const MyWalletScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [balance, setBalance] = useState(new BigNumber(0));
  const [unconfirmedBalance, setUnconfirmedBalance] = useState(new BigNumber(0));
  const [txHistory, setTxHistory] = useState<TransactionItem[]>([]);
  const {saveToDisk} = useContext(FiroContext);

  const doMint = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    let updateWallet = false;
    const address2Check = await wallet.getTransactionsAddresses();
    try {
      const utxoMap = await firoElectrum.multiGetUnspentTransactionsByAddress(
        address2Check,
      );

      const txIds: Array<string> = [];
      for (const value of utxoMap.values()) {
        const ids = value.map(element => {
          return element.tx_hash;
        });
        txIds.push(...ids);
      }

      const txs = await firoElectrum.multiGetTransactionByTxid(txIds);

      for (const [address, utxos] of utxoMap.entries()) {
        const lelantusUtxos = utxos.map(utxo => {
          const fTx = txs.get(utxo.tx_hash);
          return {
            txId: utxo.tx_hash,
            txHex: fTx!.hex,
            index: utxo.tx_pos,
            value: utxo.value,
            address: address,
          };
        });

        const mint = await wallet.createLelantusMintTx({
          utxos: lelantusUtxos,
        });

        const txId = await firoElectrum.broadcast(mint.txHex);
        console.log(`broadcast tx: ${JSON.stringify(txId)}`);

        if (txId === mint.txId) {
          wallet.addLelantusMintToCache(txId, mint.value, mint.publicCoin);
          wallet.addMintTxToCache(
            txId,
            new BigNumber(mint.value).div(SATOSHI).toNumber(),
            new BigNumber(mint.fee).div(SATOSHI).toNumber(),
            address,
          );
          updateWallet = true;
          console.log(`saved mint tx: ${JSON.stringify(txId)}`);
        }
      }
      if (updateWallet) {
        await saveToDisk();
      }
    } catch (e) {
      console.log('error when creating mint transaction', e);
    }
  };

  const updateBalance = () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      let walletUnconfirmedBalance = getWallet()?.getUnconfirmedBalance();
      setBalance(walletBalance ?? new BigNumber(0));
      setUnconfirmedBalance(walletUnconfirmedBalance ?? new BigNumber(0));
    } catch (e) {
      console.log('error when getting balance', e);
    }
  };

  const updateTxHistory = () => {
    try {
      setTxHistory(getWallet()?.getTransactions() ?? []);
    } catch (e) {
      console.log('error when getting transaction history', e);
    }
  };

  const mintUnspentTransactions = async () => {
    await doMint();
  };

  const updateMintMetadata = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }

    if (await wallet.updateMintMetadata()) {
      await saveToDisk();
    }
  };

  const fetchTransactionList = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    await wallet.fetchTransactions();
    await saveToDisk();
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('useFocusEffect my wallet');
      console.log(getWallet());

      updateBalance();
      updateTxHistory();

      return () => {};
    }, []),
  );

  const updateWalletData = async () => {
    await updateMintMetadata();
    await fetchTransactionList();
    await mintUnspentTransactions();
    updateBalance();
    updateTxHistory();
  };

  useEffect(() => {
    updateWalletData();
    firoElectrum.subscribeToChanges(updateWalletData);
    return () => {
      firoElectrum.unsubscribeToChanges(updateWalletData);
    };
  }, []);

  let transactionList;
  if (txHistory.length === 0) {
    transactionList = <FiroTransactionEmpty />;
  } else {
    transactionList = <TransactionList transactionList={txHistory} />;
  }

  return (
    <View style={styles.root}>
      <FiroToolbarWithoutBack title={localization.my_wallet_screen.title} />
      <View style={styles.balanceCardContainer}>
        <BalanceCard
          style={styles.balanceCard}
          balance={balance}
          unconfirmedBalance={unconfirmedBalance}
        />
      </View>
      <View style={styles.transactionContainer}>{transactionList}</View>
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
    marginBottom: 235,
  },
});

export default MyWalletScreen;
