import React, {FC, useContext, useEffect, useState} from 'react';
import * as NavigationService from '../NavigationService';
import {Image, StyleSheet, View} from 'react-native';
import {FiroPrimaryButton} from '../components/Button';
import {FiroToolbar} from '../components/Toolbar';
import {FiroInputMnemonic} from '../components/Input';
import {FiroTitleBig, FiroTextBig, FiroTextSmall} from '../components/Texts';
import {FiroContext} from '../FiroContext';
import {FiroWallet} from '../core/FiroWallet';
import {CurrentFiroTheme} from '../Themes';
import localization from '../localization';
import Logger from '../utils/logger';
import {FiroStatusBar} from '../components/FiroStatusBar';
import {NavigationProp} from '@react-navigation/native';
import {ScrollView} from 'react-native-gesture-handler';

const {colors} = CurrentFiroTheme;

type MnemonicInputProps = {
  navigation: NavigationProp<any>;
};

const MnemonicInputScreen: FC<MnemonicInputProps> = props => {
  const [creating, setCreating] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [failedRestoring, setFailedRestoring] = useState(false);
  const [progressMessage, setProgressMessage] = useState(
    localization.mnemonic_input_screen.restoring,
  );
  const {setWallet} = useContext(FiroContext);
  const btnRestoreText = creating
    ? progressMessage
    : localization.mnemonic_input_screen.continue;

  const onClickContinue = async () => {
    try {
      setFailedRestoring(false);
      setCreating(true);
      const wallet = new FiroWallet();
      await wallet.setSecret(mnemonic);
      await wallet.restore((progress, total) => {
        setProgressMessage(
          getProgressText(progress) + ' (' + progress + '/' + total + ')',
        );
      });
      setWallet(wallet, true);
      NavigationService.navigate('PassphraseScreen', undefined);
    } catch (e) {
      Logger.error('mnemonic_input_screen:onClickContinue', e);
      setFailedRestoring(true);
    } finally {
      setCreating(false);
    }
  };

  const getProgressText = (progressNumber: number): string => {
    if (progressNumber === 1) {
      return localization.mnemonic_input_screen.progress_text_1;
    } else if (progressNumber === 2) {
      return localization.mnemonic_input_screen.progress_text_2;
    } else if (progressNumber === 3) {
      return localization.mnemonic_input_screen.progress_text_3;
    } else if (progressNumber === 4) {
      return localization.mnemonic_input_screen.progress_text_4;
    } else if (progressNumber === 5) {
      return localization.mnemonic_input_screen.progress_text_5;
    }
    return localization.mnemonic_input_screen.restoring;
  };

  const navBeforeRemove = (e: any) => {
    if (creating) {
      e.preventDefault();
    }
  };
  useEffect(() => {
    props.navigation.addListener('beforeRemove', navBeforeRemove);
    return () =>
      props.navigation.removeListener('beforeRemove', navBeforeRemove);
  });

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View style={styles.page}>
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
          <FiroInputMnemonic
            style={styles.mnemonicInput}
            onTextChanged={txt => setMnemonic(txt)}
            enabled={!creating}
          />
          <FiroPrimaryButton
            buttonStyle={styles.restoreWallet}
            text={btnRestoreText}
            onClick={onClickContinue}
            disable={
              creating ||
              !mnemonic ||
              mnemonic.split(' ').filter(token => token.length > 0).length !==
                24
            }
          />
          {failedRestoring ? (
            <FiroTextSmall
              text={localization.mnemonic_input_screen.message_failed_restore}
              style={{paddingTop: 5, color: colors.notification}}
            />
          ) : creating ? (
            <FiroTextSmall
              text={localization.mnemonic_input_screen.message_wait}
              style={{paddingTop: 5, color: colors.notification}}
            />
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

export default MnemonicInputScreen;

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
    marginTop: 20,
    width: '100%',
  },
  textCenter: {
    textAlign: 'center',
  },
});
