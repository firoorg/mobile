import {Linking, Alert} from 'react-native';
import {getSystemName} from 'react-native-device-info';
import localization from '../localization';

const isDesktop = getSystemName() === 'Mac OS X';

export const openPrivacyDesktopSettings = () => {
  if (isDesktop) {
    Linking.openURL(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera',
    );
  } else {
    Linking.openSettings();
  }
};

export const presentCameraNotAuthorizedAlert = (error: any) => {
  Alert.alert(
    localization.errors.error,
    error,
    [
      {
        text: localization.scan_qrcode_screen.open_settings,
        onPress: openPrivacyDesktopSettings,
        style: 'default',
      },
      {
        text: localization.component_button.ok,
        onPress: () => {},
        style: 'cancel',
      },
    ],
    {cancelable: true},
  );
};
