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
import {Text} from 'react-native-elements';
import {FiroStatusBar} from '../components/FiroStatusBar';

const {colors} = CurrentFiroTheme;

const MyWalletScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [balance, setBalance] = useState(new BigNumber(0));
  const [unconfirmedBalance, setUnconfirmedBalance] = useState(
    new BigNumber(0),
  );
  const [txHistory, setTxHistory] = useState<TransactionItem[]>([]);
  const [sync, setSync] = useState(false);
  const {saveToDisk} = useContext(FiroContext);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const doMint = async () => {
    Logger.info('my_wallet_screen:doMint', 'start');
    const wallet = getWallet();
    if (!wallet) {
      Logger.error('my_wallet_screen:doMint', 'wallet is undefined');
      return;
    }
    let updateWallet = false;
    const address2Check = await wallet.getTransactionsAddresses();
    try {
      const utxoMap = await firoElectrum.multiGetUnspentTransactionsByAddress(
        address2Check,
      );
      if (Object.keys(utxoMap).length === 0) {
        return;
      }

      const txIds: Array<string> = [];
      for (const value of Object.values(utxoMap)) {
        const ids = value.map(element => {
          return element.tx_hash;
        });
        txIds.push(...ids);
      }

      const txs = await firoElectrum.multiGetTransactionByTxid(txIds);
      Logger.info(
        'my_wallet_screen:doMint',
        `utxos form mint: ${JSON.stringify(txs)}`,
      );

      for (const [address, utxos] of Object.entries(utxoMap)) {
        const lelantusUtxos = utxos.map(utxo => {
          const fTx = txs[utxo.tx_hash];
          return {
            txId: utxo.tx_hash,
            txHex: fTx!.hex,
            index: utxo.tx_pos,
            value: utxo.value,
            address: address,
          };
        });
        Logger.info(
          'my_wallet_screen:doMint',
          `lelantus utxos: ${JSON.stringify(lelantusUtxos)}`,
        );

        const mintTxResult = await wallet.createLelantusMintTx({
          utxos: lelantusUtxos,
        });
        Logger.info(
          'my_wallet_screen:doMint',
          `broadcast tx: ${JSON.stringify(mintTxResult)}`,
        );

        const txId = await firoElectrum.broadcast(mintTxResult.txHex);
        Logger.info(
          'my_wallet_screen:doMint',
          `broadcast txId: ${JSON.stringify(txId)}`,
        );

        if (txId === mintTxResult.txId) {
          mintTxResult.mints.forEach(mint => {
            wallet.addLelantusMintToCache(txId, mint.value, mint.publicCoin);
          });
          wallet.addMintTxToCache(
            txId,
            new BigNumber(mintTxResult.value).div(SATOSHI).toNumber(),
            new BigNumber(mintTxResult.fee).div(SATOSHI).toNumber(),
            address,
          );
          updateWallet = true;
          Logger.info(
            'my_wallet_screen:doMint',
            `minted tx saved local: ${JSON.stringify(txId)}`,
          );
        }
      }
      if (updateWallet) {
        await saveToDisk();
        Logger.info('my_wallet_screen:doMint', 'saved on disk');
      }
    } catch (e) {
      Logger.error('my_wallet_screen:doMint', e);
    }
  };

  const updateBalance = () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      let walletUnconfirmedBalance = getWallet()?.getUnconfirmedBalance();
      setBalance(walletBalance ?? new BigNumber(0));
      setUnconfirmedBalance(walletUnconfirmedBalance ?? new BigNumber(0));
      Logger.info('my_wallet_screen:updateBalance', {
        walletBalance,
        walletUnconfirmedBalance,
      });
    } catch (e) {
      Logger.error('my_wallet_screen:updateBalance', e);
    }
  };

  const updateTxHistory = () => {
    try {
      const txs = getWallet()?.getTransactions() ?? [];
      setTxHistory(txs);
      Logger.info('my_wallet_screen:updateTxHistory', txs);
    } catch (e) {
      Logger.error('my_wallet_screen:updateTxHistory', e);
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
        Logger.info(
          'my_wallet_screen:updateMintMetadata',
          'updateMintMetadata',
        );
      }
    } catch (e) {
      Logger.error('my_wallet_screen:updateMintMetadata ', e);
    }
  };

  const fetchTransactionList = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    try {
      if (await wallet.fetchTransactions()) {
        await saveToDisk();
      }
      Logger.info(
        'my_wallet_screen:fetchTransactionList ',
        'fetchTransactions',
      );
    } catch (e) {
      Logger.error('my_wallet_screen:fetchTransactionList ', e);
    }
  };

  const fetchAnonymitySets = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    try {
      if (await wallet.fetchAnonymitySets()) {
        await saveToDisk();
      }
      Logger.info('my_wallet_screen:fetchAnonymitySet ', 'fetchAnonymitySet');
    } catch (e) {
      Logger.error('my_wallet_screen:fetchAnonymitySet ', e);
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
    setSync(true);
    const t = Date.now();
    await updateMintMetadata();
    await fetchTransactionList();
    await fetchAnonymitySets();
    await mintUnspentTransactions();
    const dt = 1000 - (Date.now() - t);
    dt > 0 && (await delay(dt));
    setSync(false);
    updateBalance();
    updateTxHistory();
  };

  useEffect(() => {
    updateWalletData();
    const id = setInterval(updateWalletData, 60000);
    firoElectrum.addChangeListener(updateWalletData);
    Logger.info('my_wallet_screen:useEffect', 'subscribe to changes');
    return () => {
      firoElectrum.removeChangeListener(updateWalletData);
      clearInterval(id);
      Logger.info('my_wallet_screen:useEffect', 'unsubscribe to changes');
    };
  }, []);

  let transactionList;
  if (txHistory.length === 0) {
    transactionList = (
      <View style={styles.transactionContainer}>
        <FiroTransactionEmpty />
      </View>
    );
  } else {
    transactionList = <TransactionList transactionList={txHistory} />;
  }

  return (
    <View style={styles.page}>
      <FiroToolbarWithoutBack title={localization.my_wallet_screen.title} />
      <FiroStatusBar />
      <View style={styles.root}>
        <View style={styles.balanceCardContainer}>
          <BalanceCard
            style={styles.balanceCard}
            balance={balance}
            unconfirmedBalance={unconfirmedBalance}
          />
        </View>
        {sync && <Text style={styles.syncText}>Syncing...</Text>}
        {transactionList}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
  },
  root: {
    backgroundColor: colors.background,
    display: 'flex',
    flex: 1,
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  balanceCardContainer: {
    width: '100%',
  },
  balanceCard: {
    width: '100%',
  },
  transactionContainer: {
    flexGrow: 1,
  },
  syncText: {
    textAlign: 'right',
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
});

export default MyWalletScreen;
