import React, {useContext, useEffect, useState} from 'react';
import * as NavigationService from '../NavigationService';
import {Alert, Image, StyleSheet, View} from 'react-native';
import {FiroSecondaryButton} from '../components/Button';
import {FiroToolbar} from '../components/Toolbar';
import {FiroTitleBig, FiroTextBig} from '../components/Texts';
import {FiroInputPassword} from '../components/Input';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import localization from '../localization';
import { Biometrics } from '../utils/biometrics';

const {colors} = CurrentFiroTheme;

const EnterPassphraseScreen = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const {loadFromDisk} = useContext(FiroContext);
  const btnText = loading
    ? localization.enter_passphrase_screen.loading
    : localization.enter_passphrase_screen.login;

  const onClickDone = async (passphrase: string) => {
    console.log(passphrase);
    setLoading(true);
    if (await loadFromDisk(passphrase)) {
      NavigationService.clearStack('MainScreen');
    }
    setLoading(false);
  };

  const loginViaFingerprint = () => {
    setBiometricEnabled(true);
    Biometrics.getPassphrase(localization.enter_passphrase_screen.prompt_fingerprint)
      .then(info => {
        if (info.success) {
          onClickDone(info.password as string);
        } else {
          setBiometricEnabled(false);
        }
      });
  };

  // handle biometrics
  useEffect(() => {
    Biometrics.biometricAuthorizationEnabled()
      .then(enabled => {
        if (enabled) {
          loginViaFingerprint();
        }
      });
  }, []);
  
  return (
    <View style={styles.root}>
      <FiroToolbar title={biometricEnabled
        ? localization.enter_passphrase_screen.title_toolbar_fingerprint
        : localization.enter_passphrase_screen.title_toolbar} />
      <Image
        style={styles.logo}
        source={require('../img/firo-logo-black.png')}
      />
      <FiroTitleBig
        style={styles.title}
        text={biometricEnabled
          ? localization.enter_passphrase_screen.title_fingerprint
          : localization.enter_passphrase_screen.title}
      />
      <FiroTextBig
        style={styles.textCopy}
        text={localization.enter_passphrase_screen.body}
      />
      {
        !biometricEnabled
          ? <FiroInputPassword
            style={styles.password}
            onTextChanged={txt => setPassword(txt)}
          />
          : null
      }
      <FiroSecondaryButton
        buttonStyle={styles.restoreWallet}
        text={btnText}
        onClick={() => onClickDone(password)}
      />
    </View>
  );
};

export default EnterPassphraseScreen;

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: 30,
  },
  logo: {
    width: 120,
    height: 42,
    marginTop: 16,
    marginBottom: 26,
  },
  title: {
    marginBottom: 20,
  },
  textCopy: {
    marginBottom: 15,
  },
  password: {
    width: '100%',
    marginTop: 40,
  },
  restoreWallet: {
    marginTop: 'auto',
    width: '100%',
  },
});
