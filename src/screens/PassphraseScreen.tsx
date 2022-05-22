import React, {useContext, useState} from 'react';
import * as NavigationService from '../NavigationService';
import {Image, StyleSheet, View} from 'react-native';
import {FiroPrimaryButton} from '../components/Button';
import {FiroToolbar} from '../components/Toolbar';
import {FiroTitleBig, FiroTextBig} from '../components/Texts';
import {FiroInputPassword} from '../components/Input';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import localization from '../localization';
import Logger from '../utils/logger';
import {FiroStatusBar} from '../components/FiroStatusBar';
import {AppStorage} from '../app-storage';

const {colors} = CurrentFiroTheme;

const PassphraseScreen = () => {
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState('');
  const [emptyPassphrase, setEmptyPassphrase] = useState(true);
  const {encryptStorage} = useContext(FiroContext);
  const btnCreateText = creating
    ? localization.passphrase_screen.creating
    : localization.passphrase_screen.create;

  const onPassphraseChange = (passphrase: string) => {
    setEmptyPassphrase(passphrase === '')
    setPassword(passphrase)
  }
  const onClickDone = async () => {
    var jobDone = false;
    setCreating(true);
    try {
      await encryptStorage(password, true);
      jobDone = true;

      NavigationService.clearStack('MainScreen');
    } catch (e) {
      Logger.error('passphrase_screen:onClickDone', e);
    } finally {
      if (!jobDone) {
        setCreating(false);
      } else {
        // try to turn off fingerprint
        try {
          await new AppStorage().setItem(AppStorage.ENCRYPTED_PASSWORD, '');
        } catch (clearError) {
          Logger.error(
            'passphrase_screen',
            'Failed clear fingerprint after creating passphrase: ' +
              JSON.stringify(clearError),
          );
        }
      }
    }
  };
  return (
    <View style={styles.page}>
      <FiroToolbar title={''} />
      <FiroStatusBar />
      <View style={styles.root}>
        <Image
          style={styles.logo}
          source={require('../img/firo-logo-black.png')}
        />
        <FiroTitleBig
          style={styles.title}
          text={localization.passphrase_screen.title}
        />
        <FiroTextBig
          style={styles.textCopy}
          text={localization.passphrase_screen.body}
        />
        <FiroInputPassword
          style={styles.password}
          onTextChanged={txt => onPassphraseChange(txt)}
        />
        <FiroPrimaryButton
          buttonStyle={styles.create}
          text={btnCreateText}
          onClick={onClickDone}
          disable={emptyPassphrase}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  root: {
    backgroundColor: colors.background,
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  create: {
    marginTop: 20,
    width: '100%',
  },
});

export default PassphraseScreen;
