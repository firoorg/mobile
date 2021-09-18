import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, View, Text, Image, TextInput} from 'react-native';
import {FiroToolbarWithoutBack} from '../components/Toolbar';
import {CurrentFiroTheme} from '../Themes';
import {Divider, Switch} from 'react-native-elements';
import {SendAmountInputCard} from '../components/AmountInput';
import {SendAddress} from '../components/SendAddress';
import {FiroPrimaryButton} from '../components/Button';
import {FiroVerticalInfoText} from '../components/Texts';
import {FiroContext} from '../FiroContext';
import {firoElectrum} from '../core/FiroElectrum';
import localization from '../localization';
import {SATOSHI} from '../core/FiroWallet';
import { Currency } from '../utils/currency';

const {colors} = CurrentFiroTheme;
var timerHandler: number = -1;

const SendScreen = () => {
  const {saveToDisk} = useContext(FiroContext);
  const {getWallet} = useContext(FiroContext);
  const {getFiroRate, getSettings} = useContext(FiroContext);
  const [balance, setBalance] = useState(0.0);
  const [spendAmount, setSpendAmount] = useState(0.0);
  const [sendAddress, setSendAddress] = useState('');
  const [fee, setFee] = useState(0.0);
  const [total, setTotal] = useState(0.0);
  const [subtractFeeFromAmount, setSubtractFeeFromAmount] = useState(false);
  const currentCurrencyName: string = (localization.currencies as any)[
    getSettings().defaultCurrency
  ];

  const rate = getFiroRate()
  const estimateFee = () => {
    if (timerHandler !== -1) {
      clearTimeout(timerHandler);
      console.log('clearTimeout', timerHandler);
    }
    timerHandler = setTimeout(async () => {
      const wallet = getWallet();
      if (!wallet) {
        return;
      }
      try {
        const estimate = await wallet.estimateJoinSplitFee({
          spendAmount,
          subtractFeeFromAmount,
        });

        console.log('fee', fee);
        setFee(estimate.fee);
      } catch (e) {
        console.log('estimateFee', e);
      }
    }, 300);
  };

  const doSpend = async (
    amount: number,
    _subtractFeeFromAmount: boolean,
    address: string,
  ) => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    try {
      const spendData = await wallet.createLelantusSpendTx({
        spendAmount: amount,
        subtractFeeFromAmount: _subtractFeeFromAmount,
        address: address,
      });

      const txId = await firoElectrum.broadcast(spendData.txHex);
      console.log(`broadcast tx: ${JSON.stringify(txId)}`);

      if (txId === spendData.txId) {
        wallet.addSendTxToCache(txId, spendData.value / SATOSHI, address);
        wallet.addLelantusMintToCache(
          txId,
          spendData.jmintValue,
          spendData.publicCoin,
        );
        wallet.markCoinsSpend(spendData.spendCoinIndexes);
        await saveToDisk();
      }
    } catch (e) {
      console.log('error when creating spend transaction', e);
    }
  };

  const updateBalance = async () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      setBalance(walletBalance ?? 0);
    } catch (e) {
      console.log('error when getting balance', e);
    }
  };
  const onAmountSelect = (amount: number) => {
    const staoshi = amount * SATOSHI;
    setSpendAmount(staoshi);
  };
  const onAddressSelect = (address: string) => {
    setSendAddress(address);
  };

  const onClickSend = async () => {
    try {
      await doSpend(spendAmount, subtractFeeFromAmount, sendAddress);
    } catch (e) {
      console.log('somting went wrong in spend tx', e);
    }
  };

  useEffect(() => {
    updateBalance();
  }, []);

  useEffect(() => {
    const sub = subtractFeeFromAmount ? 1 : 0;
    setTotal(spendAmount + sub * fee);
  }, [fee, subtractFeeFromAmount]);

  useEffect(() => {
    estimateFee();
  }, [spendAmount]);

  return (
    <View style={styles.root}>
      <FiroToolbarWithoutBack title={localization.send_screen.title} />
      <View style={styles.content}>
        <View style={styles.balanceContainer}>
          <View style={styles.titleContainer}>
            <Image
              style={styles.icon}
              source={require('../img/ic_firo_balance.png')}
            />
            <Text style={styles.title}>
              {localization.global.firo} {localization.global.balance}
            </Text>
          </View>
          <Text style={styles.firo}>
            {Currency.formatFiroAmountWithCurrency(balance)}
          </Text>
          <Text style={styles.currency}>
            {Currency.formatFiroAmountWithCurrency(balance, rate, getSettings().defaultCurrency)} (1{' '}
            {localization.global.firo} ={' '}
            {`${rate} ${currentCurrencyName}`})
          </Text>
        </View>
        <Divider style={styles.divider} />
        <SendAmountInputCard
          maxBalance={balance}
          onAmountSelect={onAmountSelect}
        />
        <SendAddress style={styles.address} onAddressSelect={onAddressSelect} />
        <TextInput
          style={styles.label}
          placeholder={localization.send_screen.label_optional}
        />
        <View style={styles.feeDetailsContainer}>
          <FiroVerticalInfoText
            style={styles.feeDetail}
            title={localization.send_screen.transaction_fee}
            text={Currency.formatFiroAmountWithCurrency(fee / SATOSHI)}
          />
          <FiroVerticalInfoText
            style={styles.feeDetail}
            title={localization.send_screen.total_send_amount}
            text={Currency.formatFiroAmountWithCurrency(total / SATOSHI)}
          />
          <View style={styles.reduceFeeContainer}>
            <Text style={styles.reduceFeeTitle}>
              {localization.send_screen.reduce_fee}
            </Text>
            <Switch
              value={subtractFeeFromAmount}
              color={colors.primary}
              onValueChange={value => setSubtractFeeFromAmount(value)}
            />
          </View>
        </View>
        <FiroPrimaryButton
          buttonStyle={styles.sendButton}
          text={localization.send_screen.send}
          onClick={onClickSend}
        />
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
  content: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  balanceContainer: {
    width: '100%',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginEnd: 8,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  firo: {
    marginTop: 10,
    fontFamily: 'Rubik-Medium',
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  currency: {
    marginBottom: 5,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
  },
  divider: {
    width: '100%',
    marginHorizontal: 10,
    marginTop: 10,
  },
  address: {
    marginTop: 25,
  },
  label: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 20,
    marginTop: 25,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    borderRadius: 25,
    elevation: 2,
    width: '100%',
  },
  feeDetailsContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    marginVertical: 25,
  },
  feeDetail: {
    marginBottom: 20,
  },
  reduceFeeContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reduceFeeTitle: {
    fontFamily: 'Rubik-Regular',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  sendButton: {
    width: '100%',
  },
});

export default SendScreen;
