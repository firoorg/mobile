import React, {useContext} from 'react';
import * as NavigationService from '../NavigationService';
import {Image, StyleSheet, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {FiroSecondaryButton} from '../components/Button';
import {FiroToolbar} from '../components/Toolbar';
import {MnemonicText} from '../components/Mnemonic';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import localization from '../localization';

const {colors} = CurrentFiroTheme;

const MyMnemonicScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const wallet = getWallet();
  if (wallet === undefined) {
    throw new Error('wallet not created');
  }
  const mnemonic = wallet.getSecret();
  var words = mnemonic.split(' ');

  return (
    <View>
      <FiroToolbar title={localization.my_mnemonic_screen.title} />
      <View style={styles.root}>
        <MnemonicText
          style={styles.mnemonicCard}
          words={words}
          copyMnemonic={() => Clipboard.setString(mnemonic)}
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
    paddingHorizontal: 20,
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
    marginTop: 40,
    marginBottom: 40,
  },
  restoreWallet: {
    width: '100%',
  },
  textCenter: {
    textAlign: 'center',
  },
});

export default MyMnemonicScreen;
