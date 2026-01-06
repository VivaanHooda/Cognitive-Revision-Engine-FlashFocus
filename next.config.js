/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Webpack configuration for handling pdf-parse and other Node.js modules
  webpack: (config, { isServer }) => {
    // Handle pdf-parse which uses CommonJS and Node.js built-ins
    if (isServer) {
      // Server-side: Allow these packages
      config.externals = config.externals || [];
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        'canvas': 'commonjs canvas',
      });
    } else {
      // Client-side: These packages should not be bundled
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        zlib: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
