import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const ExpoGoFixer = {
  // Check if running in Expo Go
  isExpoGo: () => {
    return Constants.appOwnership === 'expo';
  },

  // Get proper localhost URL for Expo Go
  getLocalUrl: (baseUrl: string) => {
    if (Platform.OS === 'android' && ExpoGoFixer.isExpoGo()) {
      // For Android Expo Go, use the manifest URL host
      const manifestUrl = Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
      if (manifestUrl) {
        const host = manifestUrl.split(':')[0];
        return baseUrl.replace('localhost', host).replace('127.0.0.1', host);
      }
    }
    return baseUrl;
  },

  // Log environment info for debugging
  logEnvironmentInfo: () => {
    console.log('=== EXPO ENVIRONMENT INFO ===');
    console.log('Platform:', Platform.OS);
    console.log('Is Expo Go:', ExpoGoFixer.isExpoGo());
    console.log('App Ownership:', Constants.appOwnership);
    console.log('Expo Version:', Constants.expoVersion);
    console.log('Manifest URL:', Constants.manifest?.debuggerHost);
    console.log('==============================');
  }
};

export default ExpoGoFixer;