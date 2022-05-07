import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight
} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import {FiroToolbar} from '../components/Toolbar';
import Logger from '../utils/logger';
import { FiroStatusBar } from '../components/FiroStatusBar';

const { colors, } = CurrentFiroTheme;

const DebugSettingsScreen = () => {
  const cleareLogFile = () => {
    Logger.clear();
  };

  const shareLogFile = () => {
    Logger.shareAndroid();
  };

  return (
    <View>
      <FiroToolbar title={'Debug Settings'} />
      <FiroStatusBar />
      <View style={styles.root}>
        <TouchableHighlight
          underlayColor={colors.highlight}
          onPress={shareLogFile}>
          <View style={styles.section}>
            <Text style={styles.title}>Share Logs</Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          underlayColor={colors.highlight}
          onPress={cleareLogFile}>
          <View style={styles.section}>
            <Text style={styles.title}>Clear Logs</Text>
          </View>
        </TouchableHighlight>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: '100%',
    display: 'flex',
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 20,
    marginRight: 20,
  },
  title: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
  },
  description: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '400',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 9,
  },
});

export default DebugSettingsScreen;
