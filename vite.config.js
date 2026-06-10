import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the repo name for GitHub Project Pages:
// site will be served at https://<user>.github.io/financeos/
export default defineConfig({
  plugins: [react()],
  base: "/financeos/",
});
