import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => ({
  locale: 'fi',
  messages: (await import('./messages/fi.json')).default,
}));
