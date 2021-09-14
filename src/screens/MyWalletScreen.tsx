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
  const [balance, setBalance] = useState(0);
  const [txHistory, setTxHistory] = useState(new Array<TransactionItem>());
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
          transactionItem.transactionId = tx.txid;
          tx.outputs.forEach(vout => {
            if (vout.addresses && vout.addresses.includes(address)) {
              transactionItem.value += vout.value;
            } else if (
              vout.scriptPubKey &&
              vout.scriptPubKey.type === 'lelantusmint'
            ) {
              transactionItem.received = false;
              transactionItem.value = vout.value;
            }
          });
          txList.push(transactionItem);
        });
      } catch (e) {
        console.log('error when getting transaction list', e);
      }
    }
    setTxHistory(txList);
  };

  const updateBalance = async () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      setBalance(walletBalance ?? 0);
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

  const subscribeToElectrum = async () => {
    firoElectrum.subscribeToChanges(() => {
      mintUnspentTransactions();
      updateMintMetadata();
      updateBalance();
      getTransactionList();
    });
  };

  useEffect(() => {
    updateBalance();
  }, []);
  useEffect(() => {
    getTransactionList();
  }, []);
  useEffect(() => {
    mintUnspentTransactions();
  }, []);
  useEffect(() => {
    updateMintMetadata();
  }, []);
  useEffect(() => {
    subscribeToElectrum();
  }, []);

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
