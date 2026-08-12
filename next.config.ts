import type { NextConfig } from "next";

const withCoverage = process.env.COVERAGE === "true";

const nextConfig: NextConfig = {
  experimental: withCoverage
    ? {
        swcPlugins: [
          [
            "swc-plugin-coverage-instrument",
            { unstableExclude: ["**/app/layout.tsx"] },
          ],
        ],
      }
    : {},
};

export default nextConfig;
