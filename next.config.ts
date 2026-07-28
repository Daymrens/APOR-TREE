import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com",
              "font-src 'self' data:",
              "connect-src 'self' https://firestore.googleapis.com https://*.firebaseio.com https://*.googleapis.com https://api.cloudinary.com https://api.emailjs.com",
               "frame-src 'self' https://www.google.com https://maps.app.goo.gl",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
