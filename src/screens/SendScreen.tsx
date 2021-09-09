import React, {useContext, useState, useEffect} from 'react';
import {StyleSheet, View, Text, Image, TextInput} from 'react-native';
import {FiroToolbarWithoutBack} from '../components/Toolbar';
import {CurrentFiroTheme} from '../Themes';
import {Divider} from 'react-native-elements';
import {SendAmountInputCard} from '../components/AmountInput';
import {SendAddress} from '../components/SendAddress';
import {FiroPrimaryButton} from '../components/Button';
import {FiroVerticalInfoText} from '../components/Texts';
import {FiroContext} from '../FiroContext';
import {firoElectrum} from '../core/FiroElectrum';
import localization from '../localization';

const {colors} = CurrentFiroTheme;

const SendScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const {getFiroRate, getSettings} = useContext(FiroContext);
  const [spend, setSpend] = useState(false);
  const [spendAmount, setSpendAmount] = useState(0);
  const [sendAddress, setSendAddress] = useState('');
  const currentCurrencyName: string = (localization.currencies as any)[
    getSettings().defaultCurrency
  ];

  const doSpend = async (
    amount: number,
    subtractFeeFromAmount: boolean,
    address: string,
  ) => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    try {
      const spendTx = await wallet.createLelantusSpendTx({
        spendAmount: amount,
        subtractFeeFromAmount: subtractFeeFromAmount,
        address: address,
      });

      const txId = await firoElectrum.broadcast(spendTx.txHex);
      console.log(`broadcast tx: ${JSON.stringify(txId)}`);
    } catch (e) {
      console.log('error when creating spend transaction', e);
    }
  };

  useEffect(() => {
    if (spend === true) {
      return;
    }
    doSpend(spendAmount, false, sendAddress);
  }, [spend]);

  const onAmountSelect = (amount: number) => {
    setSpendAmount(amount);
  };
  const onAddressSelect = (address: string) => {
    setSendAddress(address);
  };
  const onClickSend = () => {
    setSpend(true);
  };
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
          <Text style={styles.firo}>0.00 {localization.global.firo}</Text>
          <Text style={styles.currency}>
            0.00 {currentCurrencyName} (1 {localization.global.firo} ={' '}
            {getFiroRate().toString() + ' ' + currentCurrencyName})
          </Text>
        </View>
        <Divider style={styles.divider} />
        <SendAmountInputCard onAmountSelect={onAmountSelect} />
        <SendAddress style={styles.address} onAddressSelect={onAddressSelect} />
        <TextInput
          style={styles.label}
          placeholder={localization.send_screen.label_optional}
        />
        <View style={styles.feeDetailsContainer}>
          <FiroVerticalInfoText
            style={styles.feeDetail}
            title={localization.send_screen.transaction_fee}
            text={'0.00' + localization.global.firo}
          />
          <FiroVerticalInfoText
            style={styles.feeDetail}
            title={localization.send_screen.total_send_amount}
            text={'0.00' + localization.global.firo}
          />
          <View style={styles.reduceFeeContainer}>
            <Text style={styles.reduceFeeTitle}>
              {localization.send_screen.reduce_fee}
            </Text>
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
