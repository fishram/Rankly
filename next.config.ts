import withPWA from "next-pwa";

const config = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/api\/auth\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "auth-cache",
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /.*/, // Default handler for all other routes
      handler: "NetworkFirst",
      options: {
        cacheName: "default-cache",
        networkTimeoutSeconds: 10,
      },
    },
  ] as const,
};

export default withPWA(config)({});
