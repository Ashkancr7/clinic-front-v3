/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
     unoptimized: true,
    remotePatterns: [
      // آدرس CDN/بک‌اند برای تصاویر آپلودی (قبل/بعد، آواتار و...) اینجا اضافه شود
      // { protocol: "https", hostname: "api.clinic-manager.example.com" },
    ],
  },
};

export default nextConfig;
