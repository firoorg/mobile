import React, {FC} from 'react';
import {Text} from 'react-native-elements';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {FiroCopyButton} from './Button';
import {CurrentFiroTheme} from '../Themes';

const colors = CurrentFiroTheme.colors;

type MnemonicTextProp = {
  style: StyleProp<ViewStyle>;
  words: string[];
  copyMnemonic: () => void;
};

export const MnemonicText: FC<MnemonicTextProp> = props => {
  var mems = props.words.map((e, i) => (
    <Text key={i} style={styles.mem}>
      {e}
    </Text>
  ));

  return (
    <View style={[styles.card, props.style]}>
      <View style={styles.mems}>{mems}</View>
      <View style={styles.copyContainer}>
        <FiroCopyButton onClick={props.copyMnemonic} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    elevation: 2,
  },
  mems: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  mem: {
    backgroundColor: 'rgba(216,225,235, 0.2)',
    color: '#3C3939',
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    margin: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  copyContainer: {
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    borderTopWidth: 1,
  },
});
