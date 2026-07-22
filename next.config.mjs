import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disables PWA in dev mode so it doesn't cache your hot-reloads
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config options go here (if any)
};

export default withPWA(nextConfig);