import React, {FC} from 'react';
import {Text} from 'react-native-elements';
import {StyleProp, StyleSheet, TextStyle, View} from 'react-native';
import {CurrentFiroTheme} from '../Themes';

const colors = CurrentFiroTheme.colors;

type FiroTextProp = {
  style?: StyleProp<TextStyle>;
  text: string;
};

type FiroInfoTextProp = FiroTextProp & {
  title: string;
  onClick?: () => void;
  onLongPress?: () => void;
};

export const FiroTitleBig: FC<FiroTextProp> = props => {
  return (
    <Text style={[styles.text, styles.titleBig, props.style]}>
      {props.text}
    </Text>
  );
};

export const FiroTitleSmall: FC<FiroTextProp> = props => {
  return (
    <Text style={[styles.text, styles.titleSmall, props.style]}>
      {props.text}
    </Text>
  );
};

export const FiroTextBig: FC<FiroTextProp> = props => {
  return (
    <Text style={[styles.text, styles.textBig, props.style]}>{props.text}</Text>
  );
};

export const FiroTextSmall: FC<FiroTextProp> = props => {
  return (
    <Text style={[styles.text, styles.textSmall, props.style]}>
      {props.text}
    </Text>
  );
};

export const FiroInfoText: FC<FiroInfoTextProp> = props => {
  const onClickText = () => {
    props.onClick && props.onClick()
  }
  const onLongPresstext = () => {
    props.onLongPress && props.onLongPress()
  }
  return (
    <View style={props.style}>
      <Text style={[styles.text, styles.infoText, styles.infoTextTitle]}>
        {props.title}
      </Text>
      <Text
        onLongPress={onLongPresstext}
        onPress={onClickText}
        style={[styles.text, styles.infoText]}>
        {props.text}
      </Text>
    </View>
  );
};

export const FiroVerticalInfoText: FC<FiroInfoTextProp> = props => {
  return (
    <View style={[styles.verticalInfoTextContainer, props.style]}>
      <Text
        style={[
          styles.text,
          styles.verticalInfoText,
          styles.verticalInfoTextTitle,
        ]}>
        {props.title}
      </Text>
      <Text style={[styles.text, styles.verticalInfoText]}>{props.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    color: colors.textOnBackground,
    fontFamily: 'Rubik-Regular',
    fontStyle: 'normal',
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  titleBig: {
    fontSize: 20,
    lineHeight: 20,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  titleSmall: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  textBig: {
    fontSize: 14,
  },
  textSmall: {
    fontSize: 12,
    fontFamily: 'Rubik-Light',
    fontWeight: '300',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoTextTitle: {
    opacity: 0.5,
    paddingBottom: 10,
  },
  verticalInfoTextContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  verticalInfoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  verticalInfoTextTitle: {
    fontWeight: '400',
  },
});
