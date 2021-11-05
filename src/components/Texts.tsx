import React, {FC} from 'react';
import {Text} from 'react-native-elements';
import {
  Image,
  StyleProp,
  StyleSheet,
  TextStyle,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import Clipboard from '@react-native-clipboard/clipboard';

const colors = CurrentFiroTheme.colors;

type FiroTextProp = {
  style?: StyleProp<TextStyle>;
  text: string;
};

type FiroInfoTextProp = FiroTextProp & {
  title: string;
  onClick?: () => void;
};

type FiroInfoTextWithTextProp = FiroInfoTextProp & {
  toastMessage: string;
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
    props.onClick && props.onClick();
  };
  return (
    <View style={props.style}>
      <Text style={[styles.text, styles.infoText, styles.infoTextTitle]}>
        {props.title}
      </Text>
      <Text onPress={onClickText} style={[styles.text, styles.infoText]}>
        {props.text}
      </Text>
    </View>
  );
};

export const FiroInfoTextWithCopy: FC<FiroInfoTextWithTextProp> = props => {
  const onClickText = () => {
    props.onClick && props.onClick();
  };
  const copyText = (text: string) => {
    Clipboard.setString(text);
    ToastAndroid.showWithGravityAndOffset(
      props.toastMessage,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
      0,
      100,
    );
  };
  return (
    <View style={[styles.infoTextWithIcon, props.style]}>
      <Text style={[styles.text, styles.infoText, styles.infoTextTitle]}>
        {props.title}
      </Text>
      <View style={styles.infoTextRow}>
        <Text onPress={onClickText} style={[styles.text, styles.infoText]}>
          {props.text}
        </Text>
        <TouchableOpacity onPress={() => copyText(props.text)}>
          <Image style={styles.icon} source={require('../img/ic_copy.png')} />
        </TouchableOpacity>
      </View>
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
    width: '85%',
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
  infoTextWithIcon: {
    display: 'flex',
  },
  infoTextRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginLeft: 8,
  },
});
