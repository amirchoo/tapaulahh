// MapLibre 6 loads its tile worker as a separate ES module. Bundlers don't emit
// it next to their chunks, so we serve it from /public and call setWorkerUrl()
// (see src/components/pasar/pasar-map.tsx). Runs on postinstall, predev, prebuild.
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";

const dist = "node_modules/maplibre-gl/dist";
const { version } = JSON.parse(
  readFileSync("node_modules/maplibre-gl/package.json", "utf8"),
);
const out = `public/vendor/maplibre-gl@${version}`;

rmSync("public/vendor", { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(`${dist}/${file}`, `${out}/${file}`);
}
console.log(`maplibre worker → ${out}`);
