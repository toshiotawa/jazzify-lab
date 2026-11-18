import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jazzifySrc = path.resolve(__dirname, "../../../src");
const vendorStaff = path.resolve(__dirname, "../vendor/jazzify-staff");

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/main.tsx"),
      name: "SomisiraStaff",
      formats: ["iife"],
      fileName: () => "staff-bundle.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
    outDir: path.resolve(__dirname, "../dist-staff"),
    emptyOutDir: true,
    cssCodeSplit: false,
  },
  resolve: {
    alias: [
      {
        find: "@/components/earTraining/ChordVoicingStaff",
        replacement: path.join(vendorStaff, "ChordVoicingStaff.tsx"),
      },
      {
        find: "@/components/earTraining/bravuraStaffDocumentFonts",
        replacement: path.join(vendorStaff, "bravuraStaffDocumentFonts.ts"),
      },
      {
        find: "@/components/earTraining/musicNotationVectorStaff",
        replacement: path.join(vendorStaff, "musicNotationVectorStaff.tsx"),
      },
      {
        find: "@/components/earTraining/chordVoicingStaffEffects.css",
        replacement: path.join(vendorStaff, "chordVoicingStaffEffects.css"),
      },
      { find: "@", replacement: jazzifySrc },
    ],
  },
});
