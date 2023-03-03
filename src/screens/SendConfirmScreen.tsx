import React, {FC, useState} from 'react';
import {RouteProp} from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {BottomSheet, Divider, Icon} from 'react-native-elements';
import {CurrentFiroTheme} from '../Themes';
import {FiroToolbar} from '../components/Toolbar';
import localization from '../localization';
import {useContext} from 'react';
import {FiroContext} from '../FiroContext';
import {useEffect} from 'react';
import {FiroPrimaryButton, FiroPrimaryGreenButton} from '../components/Button';
import {Currency} from '../utils/currency';
import {Biometrics} from '../utils/biometrics';
import {FiroInputPassword} from '../components/Input';
import {SendData} from '../data/SendData';
import {NavigationProp} from '@react-navigation/native';
import {firoElectrum} from '../core/FiroElectrum';
import {SATOSHI} from '../core/FiroWallet';
import BigNumber from 'bignumber.js';
import Logger from '../utils/logger';
import {FiroStatusBar} from '../components/FiroStatusBar';

const {colors} = CurrentFiroTheme;
type SendConfirmRouteProps = {
  data: {data: SendData; onConfirmCallback: (success: boolean) => void};
};

type SendConfirmProps = {
  route: RouteProp<SendConfirmRouteProps, 'data'>;
  navigation: NavigationProp<any>;
};

enum BottomSheetViewMode {
  None,
  EnterPassphrase,
  SpendSuccess,
  SpendError,
}

let passphraseInput: string = '';
let securityCheckPassed: boolean = false;
let securityCheckFinished: boolean = false;
let spendError: string = '';
const SPEND_LIMIT: number = 500100000000;

const SendConfirmScreen: FC<SendConfirmProps> = props => {
  const {
    getSettings,
    getFiroRate,
    verifyPassword,
    getWallet,
    saveToDisk,
  } = useContext(FiroContext);
  const [processing, setProcessing] = useState(false);
  const [bottomSheetViewMode, changeBottomSheetViewMode] = useState(
    BottomSheetViewMode.None,
  );

  const doSpend: (
    amount: number,
    subtractFeeFromAmount: boolean,
    address: string,
  ) => Promise<{success: boolean; error?: string}> = async (
    amount,
    subtractFeeFromAmount,
    address,
  ) => {
    try {
      const securityCheck: boolean = await checkSecurityForSpend();
      if (!securityCheck) {
        return !securityCheckFinished
          ? {success: true}
          : {
              success: false,
              error: localization.send_confirm_screen.error_invalid_fingerprint,
            };
      }
    } catch (error) {
      Logger.error('send_confirm_screen:doSpend', error);
      return {
        success: false,
        error: localization.send_confirm_screen.error_invalid_fingerprint,
      };
    }
    const wallet = getWallet();
    if (!wallet) {
      Logger.error('send_confirm_screen:doSpend', 'wallet undefined');
      return {
        success: false,
        error: localization.send_confirm_screen.error_invalid_nowallet,
      };
    }
    if (!wallet?.validate(address)) {
      Logger.error('send_confirm_screen:doSpend', 'address not valid');
      return {
        success: false,
        error: localization.send_confirm_screen.error_invalid_address,
      };
    }
    let success: boolean = false;
    try {
      const spendData = await wallet?.createLelantusSpendTx({
        spendAmount: amount,
        subtractFeeFromAmount,
        address: address,
      });

      const txId = await firoElectrum.broadcast(spendData.txHex);
      success = true;

      if (txId === spendData.txId) {
        wallet?.addSendTxToCache(
          txId,
          new BigNumber(spendData.value).div(SATOSHI).toNumber(),
          new BigNumber(spendData.fee).div(SATOSHI).toNumber(),
          address,
        );
        wallet?.addLelantusMintToCache(
          txId,
          spendData.jmintValue,
          spendData.publicCoin,
          spendData.mintIndex
        );
        wallet?.markCoinsSpend(spendData.spendCoinIndexes);
        await saveToDisk();
      } else {
        Logger.error('send_confirm_screen:doSpend', 'wrong txIds received');
      }
    } catch (e) {
      Logger.error('send_confirm_screen:doSpend', e);
      return {success, error: localization.send_confirm_screen.error_network};
    }

    return {success: true};
  };

  const passphraseIsInvalid = () => {
    setProcessing(false);
    spendError = localization.send_confirm_screen.error_invalid_passphrase;
    changeBottomSheetViewMode(BottomSheetViewMode.SpendError);
    setTimeout(() => {
      changeBottomSheetViewMode(BottomSheetViewMode.None);
    }, 2000);
  };

  const checkSecurityForSpend: () => Promise<boolean> = async () => {
    const biometricEnabled: boolean = await Biometrics.biometricAuthorizationEnabled();
    if (biometricEnabled) {
      const result = await Biometrics.getPassphrase(
        localization.send_confirm_screen.prompt_fingerprint,
      );
      if (result.success) {
        securityCheckFinished = true;
        securityCheckPassed = await verifyPassword(result.password as string);
        if (!securityCheckPassed) {
          passphraseIsInvalid();
        }
        return securityCheckPassed;
      } else {
        if (!result.error) {
          setProcessing(false);
          return false;
        }
        changeBottomSheetViewMode(BottomSheetViewMode.EnterPassphrase);
        return false;
      }
    } else {
      if (securityCheckPassed) {
        securityCheckFinished = true;
        return true;
      } else {
        changeBottomSheetViewMode(BottomSheetViewMode.EnterPassphrase);
      }
    }
    return false;
  };

  const onClickConfirm = () => {
    try {
      if (props.route.params.data.amount > SPEND_LIMIT) {
        spendError = localization.send_confirm_screen.error_limit_exceeded;
        changeBottomSheetViewMode(BottomSheetViewMode.SpendError);
        setTimeout(() => {
          changeBottomSheetViewMode(BottomSheetViewMode.None);
        }, 2000);
        return;
      }
      setProcessing(true);
      doSpend(
        props.route.params.data.amount,
        props.route.params.data.reduceFeeFromAmount,
        props.route.params.data.address,
      ).then(sendResult => {
        if (!securityCheckFinished) {
          return;
        }
        if (sendResult.success) {
          changeBottomSheetViewMode(BottomSheetViewMode.SpendSuccess);
          setTimeout(() => {
            props.route.params.onConfirmCallback(true);
            props.navigation.removeListener('beforeRemove', navBeforeRemove);
            props.navigation.goBack();
          }, 2000);
        } else {
          spendError = '' + sendResult.error;
          changeBottomSheetViewMode(BottomSheetViewMode.SpendError);
          setTimeout(() => {
            changeBottomSheetViewMode(BottomSheetViewMode.None);
          }, 2000);
        }
        setProcessing(false);
      });
    } catch (e) {
      Logger.warn('send_confirm_screen:onClickConfirm', e);
    }
  };
  const navBeforeRemove = (e: any) => {
    if (processing) {
      e.preventDefault();
    }
  };
  useEffect(() => {
    props.navigation.addListener('beforeRemove', navBeforeRemove);
    return () =>
      props.navigation.removeListener('beforeRemove', navBeforeRemove);
  });
  return (
    <ScrollView>
      <FiroToolbar title={localization.send_confirm_screen.title} />
      <FiroStatusBar />
      <View style={styles.warningCardContainer}>
        <Text style={styles.warningCard}>
          <Text style={{fontWeight: 'bold'}}>
            {localization.send_confirm_screen.warning}
          </Text>
          {localization.send_confirm_screen.warning_text}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.amount}>
          {localization.send_confirm_screen.amount}
        </Text>
        <Text style={styles.amountFiro}>
          {new BigNumber(props.route.params.data.amount)
            .div(SATOSHI)
            .toString()}{' '}
          {localization.global.firo}
        </Text>
        <Divider style={styles.divider} />
        <Text style={styles.amountFiat}>
          {Currency.formatFiroAmountWithCurrency(
            new BigNumber(props.route.params.data.amount).div(SATOSHI),
            getFiroRate(),
            getSettings().defaultCurrency,
          )}
        </Text>
        <Text style={styles.address}>
          {localization.send_confirm_screen.address}
        </Text>
        <Text style={styles.addressValue}>
          {props.route.params.data.address}
        </Text>
        {props.route.params.data.label ? (
          <Text style={styles.label}>
            {localization.send_confirm_screen.label}
          </Text>
        ) : null}
        {props.route.params.data.label ? (
          <Text style={styles.labelValue}>{props.route.params.data.label}</Text>
        ) : null}
        <View style={styles.feesPart}>
          <View style={styles.settingRaw}>
            <Text style={styles.titleLabel}>
              {localization.send_confirm_screen.transaction_fee}
            </Text>
            <Text style={styles.feeValue}>
              {new BigNumber(props.route.params.data.fee)
                .div(SATOSHI)
                .toString()}{' '}
              {localization.global.firo}
            </Text>
          </View>
          <View style={styles.settingRaw}>
            <Text style={styles.titleLabel}>
              {localization.send_confirm_screen.total_send_amount}
            </Text>
            <Text style={styles.feeValue}>
              {new BigNumber(props.route.params.data.totalAmount)
                .div(SATOSHI)
                .toString()}{' '}
              {localization.global.firo}
            </Text>
          </View>
          <View style={styles.settingRaw}>
            <Text style={styles.titleLabel}>
              {localization.send_confirm_screen.reduce_fee_from_amount}
            </Text>
            <Switch
              value={props.route.params.data.reduceFeeFromAmount}
              thumbColor={colors.switchThumbDisabled}
              trackColor={{
                false: colors.switchTrackFalse,
                true: colors.switchTrackTrue,
              }}
              disabled
            />
          </View>
        </View>
        {bottomSheetViewMode != BottomSheetViewMode.SpendSuccess ? (
          <FiroPrimaryButton
            disable={processing}
            buttonStyle={styles.confirm}
            text={
              processing
                ? localization.send_confirm_screen.confirming
                : localization.send_confirm_screen.confirm
            }
            onClick={() => {
              securityCheckFinished = securityCheckPassed = false;
              passphraseInput = '';
              spendError = '';
              onClickConfirm();
            }}
          />
        ) : null}
      </View>
      <BottomSheet
        isVisible={bottomSheetViewMode != BottomSheetViewMode.None}
        modalProps={{
          onRequestClose: () => {
            changeBottomSheetViewMode(BottomSheetViewMode.None);
          },
        }}>
        {bottomSheetViewMode == BottomSheetViewMode.EnterPassphrase ? (
          <View style={styles.bottomSheetProvidePasswordView}>
            <TouchableOpacity
              style={styles.closeBottomSheet}
              onPress={() => {
                setProcessing(false);
                changeBottomSheetViewMode(BottomSheetViewMode.None);
              }}>
              <Image source={require('../img/ic_close.png')} />
            </TouchableOpacity>
            <Text style={styles.titleForPassphrase}>
              {localization.send_confirm_screen.title_passphrase}
            </Text>
            <Text style={styles.descriptionForPassphrase}>
              {localization.send_confirm_screen.description_passphrase}
            </Text>
            <View style={{padding: 15, paddingTop: 20}}>
              <FiroInputPassword
                style={styles.password}
                onTextChanged={value => (passphraseInput = value)}
              />
            </View>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.confirmPassphraseButton}>
              <FiroPrimaryGreenButton
                text={
                  localization.send_confirm_screen.button_confirm_passphrase
                }
                onClick={async () => {
                  const passwordOk = await verifyPassword(passphraseInput);
                  if (passwordOk) {
                    changeBottomSheetViewMode(BottomSheetViewMode.None);
                    securityCheckPassed = true;
                    onClickConfirm();
                  } else {
                    passphraseIsInvalid();
                  }
                }}
                buttonStyle={{backgroundColor: undefined, marginTop: 15}}
              />
            </TouchableOpacity>
          </View>
        ) : null}
        {bottomSheetViewMode == BottomSheetViewMode.SpendError ? (
          <View style={styles.bottomSheetProvidePasswordView}>
            <Text style={styles.titleForPassphrase}>
              {localization.send_confirm_screen.error}
            </Text>
            <Text style={styles.descriptionForPassphrase}>{spendError}</Text>
            <Icon name="error" color="red" size={60} style={{padding: 40}} />
          </View>
        ) : null}
        {bottomSheetViewMode == BottomSheetViewMode.SpendSuccess ? (
          <View style={styles.bottomSheetProvidePasswordView}>
            <Text style={styles.titleForPassphrase}>
              {localization.send_confirm_screen.title_success}
            </Text>
            <Text style={styles.descriptionForPassphrase}>
              {localization.send_confirm_screen.description_success}
            </Text>
            <View style={{display: 'flex', alignItems: 'center', padding: 35}}>
              <Image source={require('../img/ic_success.png')} />
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  warningCardContainer: {
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 25,
  },
  warningCard: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(162, 47, 114, 0.1)',
    padding: 15,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  body: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  amount: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(15, 14, 14, 0.5)',
  },
  amountFiro: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    fontWeight: '500',
    paddingTop: 7,
    color: colors.text,
  },
  divider: {
    marginRight: 20,
    marginTop: 5,
    marginBottom: 2,
  },
  amountFiat: {
    fontFamily: 'Rubik-Regular',
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(15, 14, 14, 0.5)',
  },
  address: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(15, 14, 14, 0.5)',
    paddingTop: 25,
  },
  addressValue: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    fontWeight: '500',
    paddingTop: 7,
    color: colors.text,
  },
  label: {
    fontFamily: 'Rubik-Regular',
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(15, 14, 14, 0.5)',
    paddingTop: 25,
  },
  labelValue: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    fontWeight: '500',
    paddingTop: 7,
    color: colors.text,
  },
  feesPart: {
    paddingTop: 35,
  },
  settingRaw: {
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: 15,
  },
  titleLabel: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(15, 14, 14, 0.8)',
    flexGrow: 1,
  },
  feeValue: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  confirm: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    marginTop: 35,
    marginBottom: 22,
  },
  bottomSheetProvidePasswordView: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeBottomSheet: {
    width: 30,
    height: 30,
    position: 'absolute',
    right: 5,
    top: 10,
  },
  titleForPassphrase: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 16,
    marginTop: 15,
    marginLeft: 20,
    marginRight: 30,
  },
  descriptionForPassphrase: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '400',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 9,
    marginLeft: 20,
  },
  password: {
    width: '100%',
  },
  confirmPassphraseButton: {
    backgroundColor: colors.cardBackground,
    height: 60,
    width: '100%',
  },
});

export default SendConfirmScreen;
