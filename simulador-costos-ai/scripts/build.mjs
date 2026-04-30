import { cp, mkdir, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const files = ["index.html", "styles.css"];
const srcFiles = ["app.js", "calculator.js"];

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "src"), { recursive: true });
await mkdir(join(dist, "assets"), { recursive: true });

for (const file of files) {
  await copyFile(join(root, file), join(dist, file));
}

for (const file of srcFiles) {
  await copyFile(join(root, "src", file), join(dist, "src", file));
}

await cp(join(root, "assets"), join(dist, "assets"), { recursive: true });

console.log("Build listo en dist/");
