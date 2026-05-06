/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // @coral-xyz/anchor and @solana/web3.js reference several Node.js built-ins.
      // The browser doesn't have them, so we tell webpack to ignore them.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Next.js 16 uses Turbopack by default
  turbopack: {},
};
