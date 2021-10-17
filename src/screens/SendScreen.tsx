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
import {Currency} from '../utils/currency';
import {ScrollView} from 'react-native-gesture-handler';
import {useFocusEffect} from '@react-navigation/native';
import * as NavigationService from '../NavigationService';
import BigNumber from 'bignumber.js';
import Logger from '../utils/logger';

const {colors} = CurrentFiroTheme;
var timerHandler: number = -1;

const SendScreen = () => {
  const {getFiroRate, getSettings, getWallet} = useContext(FiroContext);
  const [balance, setBalance] = useState(new BigNumber(0));
  const [spendAmount, setSpendAmount] = useState(0);
  const [sendAddress, setSendAddress] = useState('');
  const [label, setLabel] = useState('');
  const [fee, setFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [subtractFeeFromAmount, setSubtractFeeFromAmount] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const currentCurrencyName: string = (localization.currencies as any)[
    getSettings().defaultCurrency
  ];

  const rate = getFiroRate();
  const estimateFee = (amount: number, subtractFeeFromAmount: boolean) => {
    if (timerHandler !== -1) {
      clearTimeout(timerHandler);
    }
    timerHandler = setTimeout(async () => {
      setIsValid(false);
      const wallet = getWallet();
      if (!wallet) {
        return;
      }
      if (amount === 0) {
        setFee(0);
        setTotal(0);
        return;
      }
      try {
        const estimate = await wallet.estimateJoinSplitFee({
          spendAmount: amount,
          subtractFeeFromAmount,
        });
        const changedFee = estimate.fee;

        setFee(changedFee);
        if (changedFee === 0) {
          setTotal(0);
        } else {
          const sub = subtractFeeFromAmount ? 0 : 1;
          setTotal(amount + sub * changedFee);
        }
        Logger.error('send_sreen:estimateFee', {changedFee, sendAddress});
        checkIsValid(changedFee, sendAddress);
      } catch (e) {
        Logger.error('send_sreen:estimateFee', e);
      }
    }, 300);
  };

  const checkIsValid = (fee: number, address: string) => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }

    setIsValid(fee !== 0 && wallet.validate(address));
  };

  const updateBalance = () => {
    try {
      let walletBalance = getWallet()?.getBalance();
      setBalance(walletBalance ?? new BigNumber(0));
    } catch (e) {
      Logger.error('senc_screen:updateBalance', e);
    }
  };

  const onAmountSelect = (amount: BigNumber, isMax: boolean) => {
    Logger.info('senc_screen:onAmountSelect', {amount, isMax});

    setIsValid(false);
    const substract = subtractFeeFromAmount || isMax;
    const satoshi = amount.times(SATOSHI).integerValue();

    setSpendAmount(satoshi.toNumber());
    setSubtractFeeFromAmount(substract);
    estimateFee(satoshi.toNumber(), substract);
  };

  const onSubtractFeeFromAmountChanged = () => {
    setIsValid(false);
    const changed = !subtractFeeFromAmount;
    setSubtractFeeFromAmount(changed);
    estimateFee(spendAmount, changed);
  };

  const onAddressSelect = (address: string) => {
    setSendAddress(address);
    checkIsValid(fee, address);
  };

  const onClickSend = () => {
    const params = {
      data: {
        address: sendAddress,
        amount: spendAmount,
        label,
        fee: fee,
        totalAmount: total,
        reduceFeeFromAmount: subtractFeeFromAmount,
      },
    };
    Logger.info('senc_screen:onClickSend', params);
    NavigationService.navigate('SendConfirmScreen', params);
  };

  useEffect(() => {
    updateBalance();
    firoElectrum.addChangeListener(updateBalance);
    return () => {
      firoElectrum.removeChangeListener(updateBalance);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      updateBalance();

      return () => {};
    }, []),
  );

  return (
    <ScrollView>
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
              {Currency.formatFiroAmountWithCurrency(
                balance,
                rate,
                getSettings().defaultCurrency,
              )}{' '}
              (1 {localization.global.firo} = {`${rate} ${currentCurrencyName}`}
              )
            </Text>
          </View>
          <Divider style={styles.divider} />
          <SendAmountInputCard
            maxBalance={balance}
            onAmountSelect={onAmountSelect}
          />
          <SendAddress
            style={styles.address}
            onAddressSelect={onAddressSelect}
            address={sendAddress}
          />
          <TextInput
            style={styles.label}
            placeholder={localization.send_screen.label_optional}
            onChangeText={newLabel => setLabel(newLabel)}
          />
          <View style={styles.feeDetailsContainer}>
            <FiroVerticalInfoText
              style={styles.feeDetail}
              title={localization.send_screen.transaction_fee}
              text={Currency.formatFiroAmountWithCurrency(
                new BigNumber(fee).div(SATOSHI),
              )}
            />
            <FiroVerticalInfoText
              style={styles.feeDetail}
              title={localization.send_screen.total_send_amount}
              text={Currency.formatFiroAmountWithCurrency(
                new BigNumber(total).div(SATOSHI),
              )}
            />
            <View style={styles.reduceFeeContainer}>
              <Text style={styles.reduceFeeTitle}>
                {localization.send_screen.reduce_fee}
              </Text>
              <Switch
                value={subtractFeeFromAmount}
                color={colors.primary}
                onValueChange={onSubtractFeeFromAmountChanged}
              />
            </View>
          </View>
          <FiroPrimaryButton
            disable={!isValid}
            buttonStyle={styles.sendButton}
            text={localization.send_screen.send}
            onClick={onClickSend}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
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
    color: colors.text,
    paddingHorizontal: 20,
    marginTop: 25,
    fontFamily: 'Rubik-Medium',
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
