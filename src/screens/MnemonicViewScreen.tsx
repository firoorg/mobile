import React, {useContext} from 'react';
import * as NavigationService from '../NavigationService';
import {Image, StyleSheet, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {FiroSecondaryButton} from '../components/Button';
import {FiroToolbar} from '../components/Toolbar';
import {MnemonicText} from '../components/Mnemonic';
import {FiroTitleBig, FiroTextBig, FiroTextSmall} from '../components/Texts';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import localization from '../localization';
import Logger from '../utils/logger';
import { FiroStatusBar } from '../components/FiroStatusBar';

const { colors } = CurrentFiroTheme;

const MnemonicViewScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const wallet = getWallet();
  if (wallet === undefined) {
    throw new Error('wallet not created');
  }
  const mnemonic = wallet.getSecret();
  var words = mnemonic.split(' ');

  const onClickContinue = () => {
    NavigationService.navigate('PassphraseScreen', undefined);
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
          text={localization.mnemonic_view_screen.title}
        />
        <FiroTextBig
          style={styles.textCopy}
          text={localization.mnemonic_view_screen.body_part_1}
        />
        <FiroTextSmall
          style={styles.textCenter}
          text={localization.mnemonic_view_screen.body_part_2}
        />
        <MnemonicText
          style={styles.mnemonicCard}
          words={words}
          copyMnemonic={() => Clipboard.setString(mnemonic)}
        />
        <FiroSecondaryButton
          buttonStyle={styles.restoreWallet}
          text={localization.mnemonic_view_screen.continue}
          onClick={onClickContinue}
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
  },
  title: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  textCopy: {
    marginBottom: 15,
    textAlign: 'center',
  },
  mnemonicCard: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  restoreWallet: {
    width: '100%',
  },
  textCenter: {
    textAlign: 'center',
  },
});

export default MnemonicViewScreen;
