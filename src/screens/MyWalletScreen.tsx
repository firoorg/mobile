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

const {colors} = CurrentFiroTheme;

const MyWalletScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [balance, setBalance] = useState(0);
  const [unconfirmedBalance, setUnconfirmedBalance] = useState(0);
  const [txHistory, setTxHistory] = useState<TransactionItem[]>([]);
  const {saveToDisk} = useContext(FiroContext);

  const doMint = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    const address2Check = await wallet.getTransactionsAddresses();
    for (const address of address2Check) {
      try {
        const utxos = await firoElectrum.getUnspentTransactionsByAddress(
          address,
        );
        if (utxos && utxos.length === 0) {
          continue;
        }
        console.log(`trying to mint address ${address}`);
        const txIds = utxos.map(tx => tx.tx_hash);
        const txs = await firoElectrum.multiGetTransactionByTxid(txIds);

        const lelantusUtxos = utxos.map(utxo => {
          const fTx = txs.get(utxo.tx_hash);
          return {
            txId: utxo.tx_hash,
            txHex: fTx!!.hex,
            index: utxo.tx_pos,
            value: utxo.value,
            address: address,
          };
        });
        if (lelantusUtxos.length === 0) {
          continue;
        }

        const mint = await wallet.createLelantusMintTx({
          utxos: lelantusUtxos,
        });

        const txId = await firoElectrum.broadcast(mint.txHex);
        console.log(`broadcast tx: ${JSON.stringify(txId)}`);

        if (txId === mint.txId) {
          wallet.addLelantusMintToCache(txId, mint.value, mint.publicCoin);
          wallet.addMintTxToCache(txId, mint.value / SATOSHI, address);
          await saveToDisk();
        }
      } catch (e) {
        console.log('error when creating mint transaction', e);
      }
    }
  };

  const updateBalance = () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      let walletUnconfirmedBalance = getWallet()?.getUnconfirmedBalance();
      setBalance(walletBalance ?? 0);
      setUnconfirmedBalance(walletUnconfirmedBalance ?? 0);
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
    doMint();
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

  const subscribeToElectrumChanges = async () => {
    firoElectrum.subscribeToChanges(() => {
      updateWalletData();
    });
  };

  const updateWalletData = async () => {
    updateMintMetadata();
    updateBalance();

    mintUnspentTransactions();

    fetchTransactionList();
    updateTxHistory();
  };

  useEffect(() => {
    updateBalance();
    updateTxHistory();
    updateWalletData();
    subscribeToElectrumChanges();
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
    paddingBottom: 90,
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 60,
  },
});

export default MyWalletScreen;
