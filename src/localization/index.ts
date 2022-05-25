import AsyncStorage from '@react-native-community/async-storage';
import LocalizedStrings from 'react-localization';
import {AppStorage} from '../app-storage';
import {IString} from './type';
import * as RNLocalize from 'react-native-localize';
import {SupportedLanguages} from './languages';

const localizations: IString = new LocalizedStrings({
  en: require('./en.json'),
  zh: require('./zh-cn.json')
});

(async () => {
  let lang = await AsyncStorage.getItem(AppStorage.LANG);
  if (lang) {
    localizations.setLanguage(lang);
  } else {
    const locales = RNLocalize.getLocales();
    const deviceLang = locales[0].languageCode;
    const hasLanguage = SupportedLanguages.some(
      language => language.value === deviceLang,
    );
    if (hasLanguage) {
      localizations.setLanguage(deviceLang);
    } else {
      localizations.setLanguage('en');
    }
  }
})();

export default localizations;
