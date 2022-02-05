import React, {useContext, useState} from 'react';
import * as NavigationService from '../NavigationService';
import {Image, StyleSheet, View} from 'react-native';
import {FiroPrimaryButton, FiroSecondaryButton} from '../components/Button';
import {FiroEmptyToolbar} from '../components/Toolbar';
import {FiroTitleBig, FiroTextBig} from '../components/Texts';
import {FiroWallet} from '../core/FiroWallet';
import {FiroContext} from '../FiroContext';
import localization from '../localization';
import Logger from '../utils/logger';
import {FiroStatusBar} from '../components/FiroStatusBar';

const WelcomeScreen = () => {
  const [creating, setCreating] = useState(false);
  const {setWallet} = useContext(FiroContext);
  const btnCreateText = creating
    ? localization.welcome_screen.creating
    : localization.welcome_screen.create_wallet;

  const onCreateWalletClick = async () => {
    setCreating(true);
    try {
      const wallet = new FiroWallet();
      await wallet.generate();
      setWallet(wallet);
      NavigationService.navigate('MnemonicViewScreen', undefined);
    } catch (e) {
      Logger.error('welcom_screen', e);
    } finally {
      setCreating(false);
    }
  };

  const onRestoreWalletClick = () => {
    NavigationService.navigate('MnemonicInputScreen', undefined);
  };

  return (
    <View style={styles.root}>
      <FiroEmptyToolbar />
      <FiroStatusBar />
      <Image
        style={styles.logo}
        source={require('../img/firo-logo-black.png')}
      />
      <FiroTitleBig
        style={styles.title}
        text={localization.welcome_screen.title}
      />
      <FiroTextBig text={localization.welcome_screen.body_part_1} />
      <FiroTextBig
        style={styles.spaceOr}
        text={localization.welcome_screen.body_part_2}
      />
      <FiroTextBig text={localization.welcome_screen.body_part_3} />
      <FiroPrimaryButton
        buttonStyle={styles.createWallet}
        text={btnCreateText}
        onClick={onCreateWalletClick}
      />
      <FiroSecondaryButton
        buttonStyle={styles.restoreWallet}
        text={localization.welcome_screen.restore_wallet}
        onClick={onRestoreWalletClick}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: 30,
  },
  logo: {
    width: 120,
    height: 42,
    marginTop: 16,
    marginBottom: 'auto',
  },
  title: {
    marginBottom: 20,
  },
  spaceOr: {
    marginVertical: 15,
  },
  createWallet: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 20,
  },
  restoreWallet: {
    width: '100%',
  },
});

export default WelcomeScreen;
