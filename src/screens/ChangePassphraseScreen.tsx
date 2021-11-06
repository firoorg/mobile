import React, {useContext, useState} from 'react';
import * as NavigationService from '../NavigationService';
import {StyleSheet, View, Image} from 'react-native';
import {FiroToolbar} from '../components/Toolbar';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import localization from '../localization';
import {FiroInputPassword} from '../components/Input';
import localizations from '../localization';
import {Confirmation} from '../components/Confirmation';
import {BottomSheet, Text} from 'react-native-elements';
import {Icon} from 'react-native-elements/dist/icons/Icon';
import {Biometrics} from '../utils/biometrics';
import {AppStorage} from '../app-storage';
import Logger from '../utils/logger';

const {colors} = CurrentFiroTheme;

enum BottomSheetViewMode {
  None,
  Success,
  Error,
}

let error: string = '';
const ChangePassphraseScreen = () => {
  const {verifyPassword, encryptStorage} = useContext(FiroContext);
  const [bottomSheetViewMode, changeBottomSheetViewMode] = useState(
    BottomSheetViewMode.None,
  );
  const [oldPassphrase, setOldPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');

  const changeFailed: () => void = () => {
    changeBottomSheetViewMode(BottomSheetViewMode.Error);
    setTimeout(() => {
      changeBottomSheetViewMode(BottomSheetViewMode.None);
    }, 2000);
  };

  return (
    <View>
      <FiroToolbar title={localization.change_passphrase_screen.title} />
      <View style={styles.root}>
        <FiroInputPassword
          style={styles.password}
          placeholder={localizations.change_passphrase_screen.label_current}
          onTextChanged={txt => setOldPassphrase(txt)}
        />
        <FiroInputPassword
          style={styles.password}
          placeholder={localizations.change_passphrase_screen.label_new}
          onTextChanged={txt => setNewPassphrase(txt)}
        />
        <FiroInputPassword
          style={styles.password}
          placeholder={localizations.change_passphrase_screen.label_confirm}
          onTextChanged={txt => setConfirmPassphrase(txt)}
        />
      </View>
      <Confirmation
        style={styles.confirmation}
        confirmButtonText="Save"
        onConfirmAction={async () => {
          if (newPassphrase !== confirmPassphrase) {
            error =
              localizations.change_passphrase_screen.error_passphrase_mismatch;
            changeFailed();
            return;
          }

          const passwordIsOk: boolean = await verifyPassword(oldPassphrase);
          if (!passwordIsOk) {
            error =
              localizations.change_passphrase_screen.error_wrong_old_passphrase;
            changeFailed();
            return;
          }

          if (oldPassphrase === newPassphrase) {
            error =
              localizations.change_passphrase_screen.error_passphrase_same;
            changeFailed();
            return;
          }

          const fingerPrintEnabled: boolean = await Biometrics.biometricAuthorizationEnabled();
          if (fingerPrintEnabled) {
            let passwordChanged: boolean = false;
            const confirmResult = await Biometrics.encryptPassphraseAndSave(
              newPassphrase,
              localizations.change_passphrase_screen.prompt_fingerprint,
              async () => {
                try {
                  await encryptStorage(newPassphrase);
                  passwordChanged = true;
                  return true;
                } catch (err) {
                  Logger.error(
                    'change_passphrase_screen',
                    'Failed changing passphrase after confirm: ' +
                      JSON.stringify(err),
                  );
                  return false;
                }
              },
            );
            if (!confirmResult.success && passwordChanged) {
              // try to recover old password
              try {
                await encryptStorage(oldPassphrase);
              } catch (err) {
                Logger.error(
                  'change_passphrase_screen',
                  'Failed recover changed passphrase after fingerprint change error: ' +
                    JSON.stringify(err),
                );
                confirmResult.success = true;
                // try to turn off fingerprint
                try {
                  await new AppStorage().setItem(
                    AppStorage.ENCRYPTED_PASSWORD,
                    '',
                  );
                } catch (clearError) {
                  Logger.error(
                    'change_passphrase_screen',
                    'Failed clear fingerprint after passphrase change: ' +
                      JSON.stringify(clearError),
                  );
                }
              }
            }
            if (confirmResult.success) {
              changeBottomSheetViewMode(BottomSheetViewMode.Success);
              setTimeout(() => {
                NavigationService.back();
              }, 2000);
            } else {
              Logger.error(
                'change_passphrase_screen',
                'Failed changing passphrase because of confirm error: ' +
                  JSON.stringify(confirmResult.error),
              );
              error = localizations.change_passphrase_screen.error_failed;
              changeFailed();
            }
          } else {
            // change passphrase
            try {
              await encryptStorage(newPassphrase);
              changeBottomSheetViewMode(BottomSheetViewMode.Success);
              setTimeout(() => {
                NavigationService.back();
              }, 2000);
            } catch (err) {
              Logger.error(
                'change_passphrase_screen',
                'Failed changing passphrase: ' + JSON.stringify(err),
              );
              error = localizations.change_passphrase_screen.error_failed;
              changeFailed();
              return;
            }
          }
        }}
        onDiscardAction={() => {
          NavigationService.back();
        }}
      />
      <BottomSheet
        isVisible={bottomSheetViewMode !== BottomSheetViewMode.None}
        modalProps={{
          onRequestClose: () => {
            changeBottomSheetViewMode(BottomSheetViewMode.None);
          },
        }}>
        {bottomSheetViewMode === BottomSheetViewMode.Error ? (
          <View style={styles.bottomSheetMessageView}>
            <Text style={styles.titleForMessage}>
              {localization.change_passphrase_screen.title_error}
            </Text>
            <Text style={styles.descriptionForMessage}>{error}</Text>
            <Icon name="error" color="red" size={60} style={styles.errorIcon} />
          </View>
        ) : null}
        {bottomSheetViewMode === BottomSheetViewMode.Success ? (
          <View style={styles.bottomSheetMessageView}>
            <Text style={styles.titleForMessage}>
              {localization.change_passphrase_screen.title_success}
            </Text>
            <Text style={styles.descriptionForMessage}>
              {localization.change_passphrase_screen.description_success}
            </Text>
            <View style={styles.success}>
              <Image source={require('../img/ic_success.png')} />
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  password: {
    width: '100%',
    marginBottom: 25,
  },
  confirmation: {
    marginTop: 'auto',
    elevation: 16,
    backgroundColor: '#fff',
    padding: 20,
  },
  bottomSheetMessageView: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleForMessage: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 16,
    marginTop: 15,
    marginLeft: 20,
    marginRight: 30,
  },
  descriptionForMessage: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '400',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 9,
    marginLeft: 20,
  },
  errorIcon: {
    padding: 40,
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    padding: 35,
  },
});

export default ChangePassphraseScreen;
