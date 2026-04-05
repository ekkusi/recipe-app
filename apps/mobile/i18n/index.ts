import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import fi from './fi.json';

i18next.use(initReactI18next).init({
  lng: 'fi',
  fallbackLng: 'fi',
  resources: {
    fi: { translation: fi },
  },
  interpolation: { escapeValue: false },
});

export default i18next;
