import React, {useContext, useState} from 'react';
import * as NavigationService from '../NavigationService';
import {StackActions} from '@react-navigation/native';
import {Image, StyleSheet, View} from 'react-native';
import {FiroSecondaryButton} from '../components/Button';
import {FiroToolbar} from '../components/Toolbar';
import {FiroTitleBig, FiroTextBig} from '../components/Texts';
import {FiroInputPassword} from '../components/Input';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import localization from '../localization';

const {colors} = CurrentFiroTheme;

const PassphraseScreen = () => {
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState('');
  const {encryptStorage} = useContext(FiroContext);
  const btnCreateText = creating
    ? localization.passphrase_screen.creating
    : localization.passphrase_screen.create;

  const onClickDone = async () => {
    var jobDone = false;
    setCreating(true);
    try {
      await encryptStorage(password);
      jobDone = true;

      NavigationService.clearStack('MainScreen');
    } finally {
      if (!jobDone) {
        setCreating(false);
      }
    }
  };
  return (
    <View style={styles.root}>
      <FiroToolbar title={''} />
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
        onTextChanged={txt => setPassword(txt)}
      />
      <FiroSecondaryButton
        buttonStyle={styles.restoreWallet}
        text={btnCreateText}
        onClick={onClickDone}
      />
    </View>
  );
};

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

export default PassphraseScreen;
