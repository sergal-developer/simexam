import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simexam.coach.app',
  appName: 'simexam',
  webDir: 'build',
  bundledWebRuntime: false,
  "server": {
    "hostname": "localhost",
    "androidScheme": "https",
    "allowNavigation": ["localhost"]
  }
};

export default config;
