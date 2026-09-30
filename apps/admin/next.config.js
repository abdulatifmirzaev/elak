/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@radar/shared-types", "@radar/database"],
  reactStrictMode: true,
};

module.exports = nextConfig;
