import {defineConfig, loadEnv} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  if (mode === "staging") {
    const apiUrl = env.VITE_API_URL;
    let parsedApiUrl;
    try {
      parsedApiUrl = new URL(apiUrl);
    } catch {
      throw new Error(
        "Set VITE_API_URL in .env.staging to the HTTPS staging API URL ending in /api/v1.",
      );
    }

    if (
      parsedApiUrl.protocol !== "https:" ||
      parsedApiUrl.pathname.replace(/\/$/, "") !== "/api/v1" ||
      parsedApiUrl.hostname === "example.com" ||
      parsedApiUrl.hostname.endsWith(".example.com")
    ) {
      throw new Error(
        "VITE_API_URL must be the real HTTPS staging API URL ending in /api/v1; replace the example host.",
      );
    }
  }

  return {plugins: [react()]};
});
