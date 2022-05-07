import React from 'react';
import {StyleSheet, View, StatusBar, SafeAreaView} from 'react-native';
import {CurrentFiroTheme} from '../Themes';

const {colors, isDark} = CurrentFiroTheme;

export const FiroStatusBar = () => (
  <View style={[styles.statusBar, {backgroundColor: colors.background}]}>
    <SafeAreaView>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
    </SafeAreaView>
  </View>
);

const STATUSBAR_HEIGHT = StatusBar.currentHeight;
const styles = StyleSheet.create({
  statusBar: {
    height: STATUSBAR_HEIGHT,
  },
});
