/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // The /api/banks routes read data/question-banks/*.json with fs.readdirSync
  // at request time. Vercel's file tracer (@vercel/nft) statically analyzes
  // imports/requires to decide what to bundle into each serverless function,
  // and dynamic fs reads like this aren't always picked up — which can leave
  // the JSON files out of the deployed bundle even though they build fine
  // locally. This forces them to be included for every route, just in case.
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./data/question-banks/**/*.json"],
    },
  },
};

module.exports = nextConfig;
