/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configures image optimization for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ooekjddavtdfbzsgdezg.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**", // Allows images from any public bucket
      },
    ],
  },
};

export default nextConfig;