import withPWA from 'next-pwa';

const config = {
  dest: 'public',
  register: true,
  skipWaiting: true,
} as const;

export default withPWA(config)({});
