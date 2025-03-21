import packageInfo from '../../package.json';

export const environment = {
  apiBaseUrl: 'http://localhost:8000/api',
  appVersion: packageInfo.version,
  production: false,
};
