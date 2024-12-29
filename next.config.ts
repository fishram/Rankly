import withPWA from 'next-pwa';

const config = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
} as const;

export default withPWA(config)({});
