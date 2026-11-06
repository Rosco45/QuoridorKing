import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.king.quoridor',
  appName: 'QuoridorKing',
  webDir: 'dist',
  android: {
    backgroundColor: '#0d0e12',
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
