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

const {colors} = CurrentFiroTheme;

const MyWalletScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [balance, setBalance] = useState(0);
  const [unconfirmedBalance, setUnconfirmedBalance] = useState(0);
  const [txHistory, setTxHistory] = useState<TransactionItem[] | undefined>(
    undefined,
  );
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
          await saveToDisk();
        }
      } catch (e) {
        console.log('error when creating mint transaction', e);
      }
    }
  };

  const retriveTxList = async () => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    const address2Check = await wallet.getTransactionsAddresses();
    const txList: TransactionItem[] = [];
    for (const address of address2Check) {
      try {
        const fullTxs = await firoElectrum.getTransactionsFullByAddress(
          address,
        );
        fullTxs.forEach(tx => {
          let transactionItem = new TransactionItem();
          transactionItem.address = tx.address;
          transactionItem.date = new Date(tx.time * 1000);
          transactionItem.txId = tx.txid;
          transactionItem.confirmed = true;

          if (
            tx.outputs.length === 1 &&
            tx.outputs[0].scriptPubKey &&
            tx.outputs[0].scriptPubKey.type === 'lelantusmint'
          ) {
            transactionItem.received = false;
            transactionItem.isMint = true;
            transactionItem.value = tx.outputs[0].value;
            transactionItem.confirmed = tx.confirmations >= 2; // TODO: move to wallet and use MINT_CONFIRM_BLOCK_COUNT
          } else {
            tx.outputs.forEach(vout => {
              if (vout.addresses && vout.addresses.includes(address)) {
                transactionItem.value += vout.value;
                transactionItem.received = true;
              }
            });
          }

          if (transactionItem.received || transactionItem.isMint) {
            txList.push(transactionItem);
          }
        });
      } catch (e) {
        console.log('error when getting transaction list', e);
      }
    }
    txList.sort((tx1: TransactionItem, tx2: TransactionItem) => {
      return tx2.date.getTime() - tx1.date.getTime();
    });
    setTxHistory(txList);
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

  const getTransactionList = async () => {
    retriveTxList();
  };

  const subscribeToElectrumChanges = async () => {
    firoElectrum.subscribeToChanges(() => {
      updateWalletData();
    });
  };

  const updateWalletData = async () => {
    await updateMintMetadata();
    updateBalance();

    await getTransactionList();
    await mintUnspentTransactions();
  };

  useEffect(() => {
    updateBalance();
    updateWalletData();
    subscribeToElectrumChanges();
  }, []);

  let transactionList;
  if (txHistory === undefined) {
    transactionList = <View />;
  } else if (txHistory.length === 0) {
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
    marginBottom: 60,
  },
});

export default MyWalletScreen;
