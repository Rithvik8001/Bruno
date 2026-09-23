import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const brand = resolve(root, "assets/brand");
const images = resolve(root, "assets/images");

async function render(source, target, width) {
  const svg = await readFile(resolve(brand, source), "utf8");
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } })
    .render()
    .asPng();
  await writeFile(resolve(images, target), png);
  console.log(`${target} ${width}px`);
}

await render("icon.svg", "icon.png", 1024);
await render("mark.svg", "mark.png", 360);
