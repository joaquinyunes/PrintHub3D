import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  // Evita que Next infiera la raíz del monorepo (hay dos lockfiles) y anide
  // el output de standalone bajo .next/standalone/frontend/.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
