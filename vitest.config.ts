import { defineConfig } from "vitest/config";
import path from "path";
import fs from "fs";

if (fs.existsSync(".env") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

