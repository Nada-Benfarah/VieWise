import packageInfo from '../../package.json';

export const environment = {
  apiBaseUrl: 'https://www.example.com/api',
  appVersion: packageInfo.version,
  production: true
};
