import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ENV = {
  webClientId: Constants.expoConfig?.extra?.webClientId ?? '',
};

export default ENV; 