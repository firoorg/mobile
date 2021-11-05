import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableHighlight,
  ScrollView,
} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import {FiroToolbar} from '../components/Toolbar';
import localization from '../localization';
import Logger from '../utils/logger';

const {colors} = CurrentFiroTheme;

const DebugSettingsScreen = () => {
  const cleareLogFile = () => {
    Logger.clear();
  };

  const shareLogFile = () => {
    Logger.shareAndroid();
  };

  return (
    <ScrollView>
      <View style={styles.toolbar}>
        <FiroToolbar title={'Debug Settings'} />
      </View>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    paddingTop: 30,
    paddingLeft: 20,
    paddingBottom: 15,
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
