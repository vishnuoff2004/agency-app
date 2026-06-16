import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './translations/en.json';
import ta from './translations/ta.json';

const LANGUAGE_KEY = 'app_language';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Required for React Native compatibility
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta'],
    interpolation: {
      escapeValue: false,
    },
  } as any);

export async function getStoredLanguage(): Promise<string> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return lang || 'en';
  } catch {
    return 'en';
  }
}

export async function setStoredLanguage(lang: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.error('Failed to save language', error);
  }
}

export default i18n;
