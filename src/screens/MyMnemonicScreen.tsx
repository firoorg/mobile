import React, {useContext, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {FiroToolbar} from '../components/Toolbar';
import {MnemonicText} from '../components/Mnemonic';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import localization from '../localization';
import { FiroStatusBar } from '../components/FiroStatusBar';
import RNScreenshotPrevent from 'react-native-screenshot-prevent';

const { colors } = CurrentFiroTheme;

const MyMnemonicScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const wallet = getWallet();
  if (wallet === undefined) {
    throw new Error('wallet not created');
  }
  const mnemonic = wallet.getSecret();
  var words = mnemonic.split(' ');

  useEffect(() => {
    RNScreenshotPrevent.enabled(true);
    return () =>
      RNScreenshotPrevent.enabled(false);
    }, []
  );

  return (
    <View>
      <FiroToolbar title={localization.my_mnemonic_screen.title} />
      <FiroStatusBar />
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
