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
import Logger from '../utils/logger';

const {colors} = CurrentFiroTheme;

const MyWalletScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [balance, setBalance] = useState(new BigNumber(0));
  const [unconfirmedBalance, setUnconfirmedBalance] = useState(new BigNumber(0));
  const [txHistory, setTxHistory] = useState<TransactionItem[]>([]);
  const {saveToDisk} = useContext(FiroContext);

  const doMint = async () => {
    Logger.info('my_wallet_screen:doMint', 'start')
    const wallet = getWallet();
    if (!wallet) {
      Logger.error('my_wallet_screen:doMint', 'wallet is undefined')
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
      Logger.info('my_wallet_screen:doMint', `utxos form mint: ${JSON.stringify(txs)}`)

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
        Logger.info('my_wallet_screen:doMint', `lelantus utxos: ${JSON.stringify(lelantusUtxos)}`)

        const mint = await wallet.createLelantusMintTx({
          utxos: lelantusUtxos,
        });
        Logger.info('my_wallet_screen:doMint', `broadcast tx: ${JSON.stringify(mint)}`)

        const txId = await firoElectrum.broadcast(mint.txHex);
        Logger.info('my_wallet_screen:doMint', `broadcast txId: ${JSON.stringify(txId)}`)

        if (txId === mint.txId) {
          wallet.addLelantusMintToCache(txId, mint.value, mint.publicCoin);
          wallet.addMintTxToCache(
            txId,
            new BigNumber(mint.value).div(SATOSHI).toNumber(),
            new BigNumber(mint.fee).div(SATOSHI).toNumber(),
            address,
          );
          updateWallet = true;
          Logger.info('my_wallet_screen:doMint', `minted tx saved local: ${JSON.stringify(txId)}`)
        }
      }
      if (updateWallet) {
        await saveToDisk();
        Logger.info('my_wallet_screen:doMint', `saved on disk`)
      }
    } catch (e) {
      Logger.error('my_wallet_screen:doMint', e)
    }
  };

  const updateBalance = () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      let walletUnconfirmedBalance = getWallet()?.getUnconfirmedBalance();
      setBalance(walletBalance ?? new BigNumber(0));
      setUnconfirmedBalance(walletUnconfirmedBalance ?? new BigNumber(0));
      Logger.info('my_wallet_screen:updateBalance', { walletBalance, walletUnconfirmedBalance })
    } catch (e) {
      Logger.error('my_wallet_screen:updateBalance', e)
    }
  };

  const updateTxHistory = () => {
    try {
      const txs = getWallet()?.getTransactions() ?? [] 
      setTxHistory(txs);
      Logger.info('my_wallet_screen:updateTxHistory', txs)
    } catch (e) {
      Logger.error('my_wallet_screen:updateTxHistory', e)
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

    try {
      if (await wallet.updateMintMetadata()) {
        await saveToDisk();
        Logger.info('my_wallet_screen:updateMintMetadata', 'updateMintMetadata')
      }
    } catch (e) {
      Logger.error('my_wallet_screen:updateMintMetadata ', e)
    }
  };

  const fetchTransactionList = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    try {
      await wallet.fetchTransactions();
      await saveToDisk();
      Logger.info('my_wallet_screen:fetchTransactionList ', 'fetchTransactions')
    } catch (e) {
      Logger.error('my_wallet_screen:fetchTransactionList ', e)
    }
  };

  useFocusEffect(
    React.useCallback(() => {
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
    Logger.info('my_wallet_screen:useEffect', 'subscribe to changes')
    return () => {
      firoElectrum.unsubscribeToChanges(updateWalletData);
      Logger.info('my_wallet_screen:useEffect', 'unsubscribe to changes')
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
