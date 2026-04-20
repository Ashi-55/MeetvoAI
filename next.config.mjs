/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloud-sync folders (e.g. OneDrive) can corrupt webpack's on-disk pack cache and
  // stall or spam "PackFileCacheStrategy ... invalid block type" during dev.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
