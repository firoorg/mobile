import React, {useContext, useState} from 'react';
import * as NavigationService from '../NavigationService';
import {Image, StyleSheet, View} from 'react-native';
import {FiroSecondaryButton} from '../components/Button';
import {FiroToolbar} from '../components/Toolbar';
import {FiroInputMnemonic} from '../components/Input';
import {FiroTitleBig, FiroTextBig, FiroTextSmall} from '../components/Texts';
import {FiroContext} from '../FiroContext';
import {FiroWallet} from '../core/FiroWallet';
import {CurrentFiroTheme} from '../Themes';
import localization from '../localization';
import Logger from '../utils/logger';
import { FiroStatusBar } from '../components/FiroStatusBar';

const { colors } = CurrentFiroTheme;

const MnemonicInputScreen = () => {
  const [creating, setCreating] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const {setWallet} = useContext(FiroContext);
  const btnRestoreText = creating
    ? localization.mnemonic_input_screen.restoring
    : localization.mnemonic_input_screen.continue;

  const onClickContinue = async () => {
    setCreating(true);
    const words = mnemonic.split(' ');
    if (words.length !== 24) {
      Logger.error(
        'mnemonic_input_screen:onClickContinue',
        'words lenght must be 24',
      );
      setCreating(false);
      return;
    }
    try {
      const wallet = new FiroWallet();
      await wallet.setSecret(mnemonic);
      setWallet(wallet);
      NavigationService.navigate('PassphraseScreen', undefined);
    } catch (e) {
      Logger.error('mnemonic_input_screen:onClickContinue', e);
    } finally {
      setCreating(false);
    }
  };
  return (
    <View>
      <FiroToolbar title="Enter mnemonic" />
      <FiroStatusBar />
      <View style={styles.root}>
        <Image
          style={styles.logo}
          source={require('../img/firo-logo-black.png')}
        />
        <FiroTitleBig
          style={styles.title}
          text={localization.mnemonic_input_screen.title}
        />
        <FiroTextBig
          style={styles.textCopy}
          text={localization.mnemonic_input_screen.body_part_1}
        />
        <FiroTextSmall
          style={styles.textCenter}
          text={localization.mnemonic_input_screen.body_part_2}
        />
        <FiroInputMnemonic
          style={styles.mnemonicInput}
          onTextChanged={txt => setMnemonic(txt)}
        />
        <FiroSecondaryButton
          buttonStyle={styles.restoreWallet}
          text={btnRestoreText}
          onClick={onClickContinue}
        />
      </View>
    </View>
  );
};

export default MnemonicInputScreen;

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 42,
    marginTop: 16,
  },
  title: {
    marginTop: 26,
    marginBottom: 20,
  },
  textCopy: {
    marginBottom: 15,
    textAlign: 'center',
  },
  mnemonicInput: {
    width: '100%',
    height: 120,
    marginTop: 30,
  },
  restoreWallet: {
    marginTop: 'auto',
    width: '100%',
  },
  textCenter: {
    textAlign: 'center',
  },
});
