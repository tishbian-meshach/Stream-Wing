import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.p2pwatchparty',
  appName: 'StreamWing',
  webDir: 'dist',
  server: {
    url: 'https://stream-wing.vercel.app/',
    cleartext: true
  }
};

export default config;
