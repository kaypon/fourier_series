import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sits on top of the formula's first box.
  devIndicators: false,
  // Lets a phone on the home Wi-Fi load the dev server (e.g. to try /april
  // at http://<this-mac's-ip>:3456/april). Dev-only; no effect in production.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
