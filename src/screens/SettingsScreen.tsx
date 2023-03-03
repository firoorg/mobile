import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  Switch,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import {BottomSheet, Icon, ListItem} from 'react-native-elements';
import {CurrentFiroTheme} from '../Themes';
import {FiroToolbar} from '../components/Toolbar';
import localization from '../localization';
import {useContext} from 'react';
import {FiroContext} from '../FiroContext';
import {useEffect} from 'react';
import {FiroPrimaryGreenButton} from '../components/Button';
import {Currency} from '../utils/currency';
import {Biometrics} from '../utils/biometrics';
import {FiroInputPassword} from '../components/Input';
import * as Progress from 'react-native-progress';
import * as NavigationService from '../NavigationService';
import deviceInfoModule from 'react-native-device-info';
import { FiroStatusBar } from '../components/FiroStatusBar';

const { colors } = CurrentFiroTheme;
const supportedCurrencies: string[] = ['usd', 'eur', 'gbp', 'aud', 'btc'];
enum BiometricSettingsViewMode {
  None,
  EnterPassphrase,
  VerifyingPassphrase,
  PassphraseError,
  EnablingBiometric,
  EnableBiometricError,
  EnableBiometricSuccess,
  DisablingBiometric,
  DisableBiometricError,
  DisableBiometricSuccess,
}

enum MyMnemonicViewMode {
  None,
  EnterPassphrase,
  PassphraseOk,
}

let enableBiometricResult: {success: boolean; error?: string};
let disableBiometricResult: {success: boolean; error?: string};
let passphraseInput: string = '';

const SettingsScreen = () => {
  const { getSettings, setSettings, verifyPassword } = useContext(FiroContext);
  const [saveInProgress, changeSaveProgress] = useState(false);
  const [chooseCurrency, changeChooseCurrency] = useState(false);
  const [showMyMnemonic, changeMyMnemonic] = useState(MyMnemonicViewMode.None);
  const [windowHeight, changeWindowHeight] = useState(
    Dimensions.get('window').height,
  );
  const currentCurrency: string = getSettings().defaultCurrency;
  const [selectedCurrency, changeSelectedCurrency] = useState(currentCurrency);
  const [biometricsAvailable, changeBiometricsAvailable] = useState(false);
  const [biometricsEnabled, changeBiometricEnabled] = useState<Boolean | null>(
    null,
  );
  const [biometricSettingsViewMode, changeBiometricSettingsViewMode] = useState(
    BiometricSettingsViewMode.None,
  );
  const [confirmRestoreWallet, changeConfirmRestoreWallet] = useState(false);

  const clickOnVersionCode = () => {
    NavigationService.navigate('DebugSettings', undefined);
  };

  useEffect(() => {
    const onChange = () => {
      changeWindowHeight(Dimensions.get('window').height);
    };
    Biometrics.isBiometricsAvailable().then(isAvailable => {
      if (isAvailable) {
        changeBiometricsAvailable(true);
      }
    });
    Biometrics.biometricAuthorizationEnabled().then(isEnabled => {
      changeBiometricEnabled(isEnabled);
    });
    Dimensions.addEventListener('change', onChange);
    return () => Dimensions.removeEventListener('change', onChange);
  }, []);

  return (
    <ScrollView>
      <FiroToolbar title={localization.settings.title} />
      <FiroStatusBar />
      <TouchableHighlight
        disabled={saveInProgress}
        underlayColor={colors.highlight}
        onPress={() => {
          changeChooseCurrency(true);
        }}>
        <View style={styles.section}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {localization.settings.title_currency}
              </Text>
              <Text style={styles.description}>
                {localization.settings.description_currency}
              </Text>
            </View>
            <Text style={styles.currency}>
              {(localization.currencies as any)[currentCurrency]}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
      {/* <TouchableHighlight
        disabled={saveInProgress}
        underlayColor={colors.highlight}
        onPress={() => {
          const settings = getSettings();
          changeSaveProgress(true);
          setSettings({
            ...settings,
            notificationsEnabled: !settings.notificationsEnabled,
          }).finally(() => changeSaveProgress(false));
        }}>
        <View style={styles.section}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {localization.settings.title_notification}
              </Text>
              <Text style={styles.description}>
                {localization.settings.description_notification}
              </Text>
            </View>
            <Switch
              value={getSettings()?.notificationsEnabled}
              thumbColor={colors.switchThumb}
              trackColor={{
                false: colors.switchTrackFalse,
                true: colors.switchTrackTrue,
              }}
              onValueChange={enable => {
                changeSaveProgress(true);
                setSettings({
                  ...getSettings(),
                  notificationsEnabled: enable,
                }).finally(() => changeSaveProgress(false));
              }}
            />
          </View>
        </View>
      </TouchableHighlight> */}
      <TouchableHighlight
        disabled={saveInProgress}
        underlayColor={colors.highlight}
        onPress={() => {
          NavigationService.navigate('ChangePassphraseScreen', undefined);
        }}>
        <View style={styles.section}>
          <Text style={styles.title}>
            {localization.settings.title_passphrase}
          </Text>
          <Text style={styles.description}>
            {localization.settings.description_passphrase}
          </Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        disabled={saveInProgress}
        underlayColor={colors.highlight}
        onPress={async () => {
          if (await Biometrics.biometricAuthorizationEnabled()) {
            const result = await Biometrics.getPassphrase(
              localization.settings.prompt_view_mnemonic,
            );
            if (result.success) {
              const passwordIsOk = await verifyPassword(
                result.password as string,
              );
              if (passwordIsOk) {
                NavigationService.navigate('MyMnemonicScreen', undefined);
                return;
              }
            } else {
              if (!result.error) {
                return;
              }
              console.log(result.error);
            }
            changeMyMnemonic(MyMnemonicViewMode.EnterPassphrase);
          } else {
            changeMyMnemonic(MyMnemonicViewMode.EnterPassphrase);
          }
        }}>
        <View style={styles.section}>
          <Text style={styles.title}>
            {localization.settings.title_mnemonic}
          </Text>
          <Text style={styles.description}>
            {localization.settings.description_mnemonic}
          </Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        disabled={saveInProgress}
        underlayColor={colors.highlight}
        onPress={() => {
          changeConfirmRestoreWallet(true);
        }}>
        <View style={styles.section}>
          <Text style={styles.title}>
            {localization.settings.title_restore}
          </Text>
          <Text style={styles.description}>
            {localization.settings.description_restore}
          </Text>
        </View>
      </TouchableHighlight>
      {biometricsAvailable && biometricsEnabled != null ? (
        <View style={styles.section}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {localization.settings.title_fingerprint}
              </Text>
              <Text style={styles.description}>
                {localization.settings.description_fingerprint}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled == true}
              thumbColor={biometricsEnabled == true ? colors.switchThumb : colors.switchThumbDisabled}
              trackColor={{
                false: colors.switchTrackFalse,
                true: colors.switchTrackTrue,
              }}
              disabled={saveInProgress}
              onValueChange={async () => {
                  const isEnabled = await Biometrics.biometricAuthorizationEnabled();
                  if (isEnabled) {
                    disableBiometricResult = await Biometrics.clearPassphraseFromStorage(
                      localization.settings.prompt_disable_biometric,
                      () =>
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.DisablingBiometric,
                        ),
                    );
                    if (disableBiometricResult.success) {
                      changeBiometricSettingsViewMode(
                        BiometricSettingsViewMode.DisableBiometricSuccess,
                      );
                      changeBiometricEnabled(false);
                      setTimeout(() => {
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.None,
                        );
                      }, 2000);
                    } else {
                      if (disableBiometricResult.error) {
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.DisableBiometricError,
                        );
                        setTimeout(() => {
                          changeBiometricSettingsViewMode(
                            BiometricSettingsViewMode.None,
                          );
                        }, 2000);
                      } else {
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.None,
                        );
                      }
                    }
                  } else {
                    changeBiometricSettingsViewMode(
                      BiometricSettingsViewMode.EnterPassphrase,
                    );
                  }
                }
              }
            />
          </View>
        </View>
      ) : null}
      <Text style={styles.version} onPress={clickOnVersionCode}>
        {localization.settings.version + deviceInfoModule.getVersion()}
      </Text>
      <BottomSheet
        isVisible={chooseCurrency}
        modalProps={{
          onRequestClose: () => {
            changeChooseCurrency(false);
          },
        }}>
        <View style={{ ...styles.currenciesView, height: windowHeight / 2 }}>
          <View style={{ display: 'flex' }}>
            <Text style={styles.changeCurrency}>
              {localization.settings.title_change_currency}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBottomSheet}
            onPress={() => {
              changeChooseCurrency(false);
              changeSelectedCurrency(currentCurrency);
            }}>
            <Image source={require('../img/ic_close.png')} />
          </TouchableOpacity>
          <ScrollView
            style={{ marginTop: 30 }}
            contentContainerStyle={{ paddingBottom: 52 }}>
            {supportedCurrencies.map(currency => {
              return (
                <ListItem
                  key={currency}
                  disabled={saveInProgress}
                  underlayColor=""
                  onPress={() => changeSelectedCurrency(currency)}
                  containerStyle={styles.currencyItem}>
                  <ListItem.Content>
                    <ListItem.Title style={styles.title}>
                      {(localization.currencies as any)[currency]}
                    </ListItem.Title>
                  </ListItem.Content>
                  <ListItem.CheckBox
                    disabled={saveInProgress}
                    checkedColor={colors.primary}
                    uncheckedColor={colors.unchecked}
                    checkedIcon="dot-circle-o"
                    uncheckedIcon="circle-o"
                    checked={currency == selectedCurrency}
                    onPress={() => changeSelectedCurrency(currency)}
                  />
                </ListItem>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.changeCurrencyButton}
            disabled={saveInProgress}>
            <FiroPrimaryGreenButton
              text={localization.settings.button_done}
              onClick={async () => {
                const settings = getSettings();
                changeSaveProgress(true);
                try {
                  await setSettings({
                    ...settings,
                    defaultCurrency: selectedCurrency as any,
                  });
                  Currency.setCurrentCurrency(selectedCurrency);
                } finally {
                  changeChooseCurrency(false);
                  changeSaveProgress(false);
                }
              }}
              buttonStyle={{ backgroundColor: undefined, marginTop: 15 }}
            />
          </TouchableOpacity>
        </View>
      </BottomSheet>
      <BottomSheet
        isVisible={showMyMnemonic === MyMnemonicViewMode.EnterPassphrase}
        modalProps={{
          onRequestClose: () => {
            changeMyMnemonic(MyMnemonicViewMode.None);
          },
        }}>
        <View style={styles.biometricSettingsChangeView}>
          <TouchableOpacity
            style={styles.closeBottomSheet}
            onPress={() => {
              changeMyMnemonic(MyMnemonicViewMode.None);
            }}>
            <Image source={require('../img/ic_close.png')} />
          </TouchableOpacity>
          <Text style={styles.titleForBiometric}>
            {localization.settings.title_passphrase_biometric}
          </Text>
          <Text style={styles.descriptionForBiomertic}>
            {localization.settings.description_passphrase_mnemonic}
          </Text>
          <View style={{ padding: 15, paddingTop: 20 }}>
            <FiroInputPassword
              style={styles.password}
              onTextChanged={value => (passphraseInput = value)}
            />
          </View>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.enableBiometricButton}>
            <FiroPrimaryGreenButton
              text={localization.settings.button_done}
              onClick={async () => {
                const passwordOk = await verifyPassword(passphraseInput);
                passphraseInput = '';
                if (passwordOk) {
                  changeMyMnemonic(MyMnemonicViewMode.PassphraseOk);
                  NavigationService.navigate('MyMnemonicScreen', undefined);
                } else {
                  changeMyMnemonic(MyMnemonicViewMode.None);
                }
              }}
              buttonStyle={{ backgroundColor: undefined, marginTop: 15 }}
            />
          </TouchableOpacity>
        </View>
      </BottomSheet>
      <BottomSheet
        isVisible={biometricSettingsViewMode != BiometricSettingsViewMode.None}
        modalProps={{
          onRequestClose: () => {
            changeBiometricSettingsViewMode(BiometricSettingsViewMode.None);
          },
        }}>
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.EnterPassphrase ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.title_passphrase_biometric}
            </Text>
            <TouchableOpacity
              style={styles.closeBottomSheet}
              onPress={() => {
                changeBiometricSettingsViewMode(BiometricSettingsViewMode.None);
              }}>
              <Image source={require('../img/ic_close.png')} />
            </TouchableOpacity>
            <Text style={styles.descriptionForBiomertic}>
              {localization.settings.description_passphrase_biometric}
            </Text>
            <View style={{ padding: 15, paddingTop: 20 }}>
              <FiroInputPassword
                style={styles.password}
                onTextChanged={value => (passphraseInput = value)}
              />
            </View>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.enableBiometricButton}>
              <FiroPrimaryGreenButton
                text={localization.settings.button_enable_biometric}
                onClick={async () => {
                  changeBiometricSettingsViewMode(
                    BiometricSettingsViewMode.VerifyingPassphrase,
                  );
                  const passwordOk = await verifyPassword(passphraseInput);
                  if (passwordOk) {
                    changeBiometricSettingsViewMode(
                      BiometricSettingsViewMode.None,
                    );
                    enableBiometricResult = await Biometrics.encryptPassphraseAndSave(
                      passphraseInput,
                      localization.settings.prompt_enable_biometric,
                      async () => {
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.EnablingBiometric,
                        );
                        return true;
                      },
                    );
                    if (enableBiometricResult.success) {
                      changeBiometricSettingsViewMode(
                        BiometricSettingsViewMode.EnableBiometricSuccess,
                      );
                      changeBiometricEnabled(true);
                      setTimeout(() => {
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.None,
                        );
                      }, 2000);
                    } else {
                      if (enableBiometricResult.error) {
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.EnableBiometricError,
                        );
                        setTimeout(() => {
                          changeBiometricSettingsViewMode(
                            BiometricSettingsViewMode.None,
                          );
                        }, 2000);
                      } else {
                        changeBiometricSettingsViewMode(
                          BiometricSettingsViewMode.None,
                        );
                      }
                    }
                  } else {
                    changeBiometricSettingsViewMode(
                      BiometricSettingsViewMode.PassphraseError,
                    );
                    setTimeout(() => {
                      changeBiometricSettingsViewMode(
                        BiometricSettingsViewMode.None,
                      );
                    }, 2000);
                  }
                }}
                buttonStyle={{ backgroundColor: undefined, marginTop: 15 }}
              />
            </TouchableOpacity>
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.VerifyingPassphrase ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.title_processing}
            </Text>
            <Text style={styles.descriptionForBiomertic}>
              {localization.settings.description_verifying_passphrase}
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', padding: 35 }}>
              <Progress.Circle indeterminate size={50} color={colors.text} />
            </View>
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.PassphraseError ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.error_invalid_passphrase}
            </Text>
            <Icon name="error" color="red" size={60} style={{ padding: 40 }} />
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.EnablingBiometric ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.title_processing}
            </Text>
            <Text style={styles.descriptionForBiomertic}>
              {localization.settings.description_enabling_biometric}
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', padding: 35 }}>
              <Progress.Circle indeterminate size={50} color={colors.text} />
            </View>
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.EnableBiometricSuccess ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.title_success}
            </Text>
            <Text style={styles.descriptionForBiomertic}>
              {localization.settings.description_enabled_biometric}
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', padding: 35 }}>
              <Image source={require('../img/ic_success.png')} />
            </View>
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.EnableBiometricError ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.error_enabled_biometric}
            </Text>
            <Text style={styles.descriptionForBiomertic}>
              {enableBiometricResult ? enableBiometricResult.error : ''}
            </Text>
            <Icon name="error" color="red" size={60} style={{ padding: 40 }} />
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.DisablingBiometric ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.title_processing}
            </Text>
            <Text style={styles.descriptionForBiomertic}>
              {localization.settings.description_disabling_biometric}
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', padding: 35 }}>
              <Progress.Circle indeterminate size={50} color={colors.text} />
            </View>
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.DisableBiometricSuccess ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.title_success}
            </Text>
            <Text style={styles.descriptionForBiomertic}>
              {localization.settings.description_disable_biometric}
            </Text>
            <View style={{ display: 'flex', alignItems: 'center', padding: 35 }}>
              <Image source={require('../img/ic_success.png')} />
            </View>
          </View>
        ) : null}
        {biometricSettingsViewMode ==
          BiometricSettingsViewMode.DisableBiometricError ? (
          <View style={styles.biometricSettingsChangeView}>
            <Text style={styles.titleForBiometric}>
              {localization.settings.error_disabled_biometric}
            </Text>
            <Text style={styles.descriptionForBiomertic}>
              {disableBiometricResult ? disableBiometricResult.error : ''}
            </Text>
            <Icon name="error" color="red" size={60} style={{ padding: 40 }} />
          </View>
        ) : null}
      </BottomSheet>
      <BottomSheet isVisible={confirmRestoreWallet} modalProps={{
        onRequestClose: () => {
          changeConfirmRestoreWallet(false);
        },
      }}>
        <View style={styles.biometricSettingsChangeView}>
          <View style={styles.warningRestoreContainer}>
            <Text style={styles.warningRestoreCard}>
              <Text style={{ fontWeight: 'bold' }}>
                {localization.settings.title_warning}
              </Text>
              {localization.settings.warning_restore_text}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBottomSheet}
            onPress={() => {
              changeConfirmRestoreWallet(false);
            }}>
            <Image source={require('../img/ic_close.png')} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.confirmRestoreButton}>
            <FiroPrimaryGreenButton
              text={localization.settings.button_confirm_restore}
              onClick={() => {
                changeConfirmRestoreWallet(false);
                NavigationService.navigate('MnemonicInputScreen', undefined);
              }}
              buttonStyle={{ backgroundColor: undefined, marginTop: 14 }}
            />
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 20,
    marginRight: 20,
  },
  title: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
  },
  description: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '400',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 9,
  },
  currency: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    opacity: 0.6,
    marginRight: 9,
  },
  currenciesView: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0,
  },
  closeBottomSheet: {
    width: 30,
    height: 30,
    position: 'absolute',
    right: 5,
    top: 10,
  },
  changeCurrency: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 16,
    paddingTop: 15,
    alignSelf: 'center',
  },
  currencyItem: {
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 12,
    padding: 0,
    paddingRight: 15,
    paddingLeft: 15,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 10,
    height: 40,
  },
  changeCurrencyButton: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.cardBackground,
    height: 60,
    width: '100%',
  },
  biometricSettingsChangeView: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleForBiometric: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 16,
    marginTop: 15,
    marginLeft: 20,
    marginRight: 30,
  },
  descriptionForBiomertic: {
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
  enableBiometricButton: {
    backgroundColor: colors.cardBackground,
    height: 60,
    width: '100%',
  },
  version: {
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 20,
    marginTop: 100,
    textAlign: 'center',
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    opacity: 0.4,
    textDecorationLine: 'underline',
  },
  warningRestoreContainer: {
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 0,
    paddingTop: 47
  },
  warningRestoreCard: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(162, 47, 114, 0.1)',
    padding: 14,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
  },
  confirmRestoreButton: {
    backgroundColor: colors.cardBackground,
    height: 54,
    width: '100%',
  },
});

export default SettingsScreen;
