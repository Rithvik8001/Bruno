import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const brand = resolve(root, "assets/brand");
const images = resolve(root, "assets/images");

const scales = [
  ["", 1],
  ["@2x", 2],
  ["@3x", 3],
];

function png(svg, width) {
  return new Resvg(svg, { fitTo: { mode: "width", value: width } })
    .render()
    .asPng();
}

async function write(target, data) {
  await writeFile(target, data);
  console.log(target.replace(`${root}/`, ""));
}

async function renderIcon() {
  const svg = await readFile(resolve(brand, "icon.svg"), "utf8");
  await write(resolve(images, "icon.png"), png(svg, 1024));
}

async function renderMark() {
  const svg = await readFile(resolve(brand, "mark.svg"), "utf8");
  const base = 72;
  for (const [suffix, scale] of scales) {
    await write(resolve(images, `mark${suffix}.png`), png(svg, base * scale));
  }
}

await renderIcon();
await renderMark();
