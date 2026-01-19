/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    // Tambahkan ini untuk menghindari error saat proses build statis
    output: 'standalone', 
  };
  
  export default nextConfig;