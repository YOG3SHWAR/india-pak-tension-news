// next.config.js (add this at project root)
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // If you prefer using next/image, whitelist external hosts here
    domains: ["static.toiimg.com"],
  },
};
module.exports = nextConfig;
