import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookmylook.app',
  appName: 'BookMyLook',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: 'android/bookmylook-new.keystore',
      keystoreAlias: 'bookmylook',
    }
  },
  ios: {
    contentInset: 'always'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e40af",
      showSpinner: false
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#1e40af",
      overlay: true
    }
  }
};

export default config;
