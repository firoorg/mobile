import React, {Children, FC} from 'react';
import {StyleSheet, StyleProp, ViewStyle, View, Platform} from 'react-native';
import {CurrentFiroTheme} from '../Themes';

const {colors} = CurrentFiroTheme;

type CardProps = {
  style?: StyleProp<ViewStyle>;
};

export const Card: FC<CardProps> = props => {
  return (
    <View
      style={
        Platform.OS === 'ios'
          ? [styles.cardIos, props.style]
          : [styles.cardAndroid, props.style]
      }>
      {props.children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardAndroid: {
    elevation: 2,
  },
  cardIos: {
    shadowColor: colors.border,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
});
