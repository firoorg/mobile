import {DefaultTheme, DarkTheme} from '@react-navigation/native';
import {Appearance} from 'react-native';

type FiroColors = {
  primary: string;
  background: string;
  card: string;
  text: string;
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
    primary: '#9B1C2E',
    primaryDisabled: 'rgba(155, 28, 46, 0.5)',
    colorOnPrimary: '#FFFFFF',
    secondary: '#2FA299',
    cardBackground: '#FFFFFF',
    // mainColor: '#9B1C2E',
    buttonTextColor: '#ffffff',
    // buttonDisabledBackgroundColor: '#d1848f',
    // buttonDisabledTextColor: '#dfe7f5',
    // secondaryButtonColor: '#000000',
    highlight: '#f2f2f2',
    switchTrackTrue: '#2fa299',
    switchTrackFalse: '#878787',
    switchThumb: '#ffffff',
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

  static updateColorScheme() {
    let isDark = Appearance.getColorScheme() === 'dark';
    let theme: FiroTheme = isDark ? FiroDarkTheme : FiroDefaultTheme;
    CurrentFiroTheme.colors = theme.colors;
  }
}

CurrentFiroTheme.updateColorScheme();
