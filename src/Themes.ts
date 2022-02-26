import {DefaultTheme, DarkTheme} from '@react-navigation/native';
import {Appearance} from 'react-native';

type FiroColors = {
  primary: string;
  background: string;
  card: string;
  text: string;
  textPlaceholder: string;
  border: string;
  notification: string;
  textOnBackground: string;
  colorOnPrimary: string;
  buttonTextColor: string;
  secondary: string;
  cardBackground: string;
  highlight: string;
  switchTrackTrue: string;
  switchTrackFalse: string;
  switchThumb: string;
  switchThumbDisabled: string,
  secondaryBackground: string;
  unchecked: string;
  primaryDisabled: string;
};

type FiroTheme = {
  dark: boolean;
  colors: FiroColors;
};

export const FiroDefaultTheme: FiroTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FBFBFB',
    textOnBackground: '#3C3939',
    text: '#3C3939',
    textPlaceholder: '#a7a7a7',
    primary: '#9B1C2E',
    primaryDisabled: 'rgba(155, 28, 46, 0.5)',
    colorOnPrimary: '#FFFFFF',
    secondary: '#2FA299',
    cardBackground: '#FFFFFF',
    buttonTextColor: '#ffffff',
    highlight: '#f2f2f2',
    switchTrackTrue: '#d1848f',
    switchTrackFalse: '#878787',
    switchThumb: '#9B1C2E',
    switchThumbDisabled: '#c28f97',
    secondaryBackground: '#f7f9fb',
    unchecked: '#838485',
  },
};

export const FiroDarkTheme: FiroTheme = {
  ...DarkTheme,
  ...FiroDefaultTheme,
  colors: {
    ...DarkTheme.colors,
    ...FiroDefaultTheme.colors,
  },
};

export class CurrentFiroTheme {
  static colors: FiroColors;
  static isDark: boolean;
  static updateColorScheme() {
    let isDark = Appearance.getColorScheme() === 'dark';
    let theme: FiroTheme = isDark ? FiroDarkTheme : FiroDefaultTheme;
    CurrentFiroTheme.colors = theme.colors;
    CurrentFiroTheme.isDark = isDark;
  }
}

CurrentFiroTheme.updateColorScheme();
