import React, {FC} from 'react';
import {Text} from 'react-native-elements';
import {
  TouchableOpacity,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import localization from '../localization';

const {colors} = CurrentFiroTheme;

type ButtonProps = {
  text: string;
  onClick: () => void;
  buttonStyle?: StyleProp<ViewStyle>;
};

type IconButtonProps = {
  onClick: () => void;
  buttonStyle?: StyleProp<ViewStyle>;
};

export const FiroPrimaryButton: FC<ButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, props.buttonStyle]}
      onPress={props.onClick}>
      <Text style={styles.text}>{props.text}</Text>
    </TouchableOpacity>
  );
};

export const FiroPrimaryGreenButton: FC<ButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.primaryGreenButton, props.buttonStyle]}
      onPress={props.onClick}>
      <Text style={[styles.text, styles.primaryGreenButtonText]}>
        {props.text}
      </Text>
    </TouchableOpacity>
  );
};

export const FiroSecondaryButton: FC<ButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.secondaryButton, props.buttonStyle]}
      onPress={props.onClick}>
      <Text style={[styles.text, styles.secondaryText]}>{props.text}</Text>
    </TouchableOpacity>
  );
};

export const FiroSubtleButton: FC<ButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.sublteButton, props.buttonStyle]}
      onPress={props.onClick}>
      <Text style={[styles.text, styles.sublteText]}>{props.text}</Text>
    </TouchableOpacity>
  );
};

export const FiroGetFiroButton: FC<ButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.secondaryButton,
        styles.getFiro,
        props.buttonStyle,
      ]}
      onPress={props.onClick}>
      <Text style={[styles.text, styles.getFiroText]}>{props.text}</Text>
    </TouchableOpacity>
  );
};

export const FiroCopyButton: FC<IconButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.copyButton, props.buttonStyle]}
      onPress={props.onClick}>
      <Text style={[styles.text, styles.copyText]}>
        {localization.component_button.copy}
      </Text>
      <Image style={styles.copyIcon} source={require('../img/ic_copy_2.png')} />
    </TouchableOpacity>
  );
};

export const FiroMenuButton: FC<IconButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.iconButton, props.buttonStyle]}
      onPress={props.onClick}>
      <Image style={styles.icon} source={require('../img/ic_menu.png')} />
    </TouchableOpacity>
  );
};

export const FiroBackButton: FC<IconButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.iconButton, props.buttonStyle]}
      onPress={props.onClick}>
      <Image style={styles.icon} source={require('../img/ic_back.png')} />
    </TouchableOpacity>
  );
};

export const FiroSelectFromSavedAddress: FC<ButtonProps> = props => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.savedAddressButton, props.buttonStyle]}
      onPress={props.onClick}>
      <Image
        style={styles.icon}
        source={require('../img/ic_saved_address.png')}
      />
      <Text style={[styles.text, styles.savedAddressText]}>{props.text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 42,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: 20,
    borderWidth: 1,
  },
  primaryGreenButton: {
    height: 28,
    backgroundColor: 'rgba(47, 162, 153, 0.05)',
    borderColor: 'transparent',
  },
  savedAddressButton: {
    // height: 36,
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  sublteButton: {
    backgroundColor: '#00000010',
    borderColor: 'transparent',
  },
  getFiro: {
    height: 30,
    borderColor: '#fff',
  },
  copyButton: {
    height: 48,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopEndRadius: 0,
    borderTopStartRadius: 0,
    flexWrap: 'wrap',
  },
  iconButton: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  text: {
    color: colors.buttonTextColor,
    paddingHorizontal: 20,
    // paddingVertical: 14,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
  },
  primaryGreenButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.4,
    color: '#2FA299',
    // paddingVertical: 8,
  },
  savedAddressText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.4,
    color: '#9B1C2E',
  },
  secondaryText: {
    color: colors.primary,
  },
  sublteText: {
    color: colors.textOnBackground,
  },
  getFiroText: {
    color: colors.colorOnPrimary,
    paddingHorizontal: 25,
    // paddingVertical: 8,
  },
  copyIcon: {
    width: 24,
    height: 24,
  },
  copyText: {
    color: colors.secondary,
    paddingHorizontal: 5,
  },
  icon: {
    width: 24,
    height: 24,
  },
});
