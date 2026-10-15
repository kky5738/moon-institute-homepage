import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const logo = new URL("../public/images/brand/logo.png", import.meta.url);
const app = new URL("../src/app/", import.meta.url);
const sizes = [16, 32, 48, 64];
const icons = await Promise.all(sizes.map((size) => sharp(logo.pathname).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
icons.forEach((icon, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(icon.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += icon.length;
});
const favicon = Buffer.concat([header, ...icons]);
assert.equal(favicon.length, offset);
for (let index = 0; index < sizes.length; index++) {
  const entry = 6 + index * 16;
  const start = favicon.readUInt32LE(entry + 12);
  const length = favicon.readUInt32LE(entry + 8);
  const metadata = await sharp(favicon.subarray(start, start + length)).metadata();
  assert.equal(metadata.width, sizes[index]);
  assert.equal(metadata.height, sizes[index]);
}
await writeFile(new URL("favicon.ico", app), favicon);

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f8f7fb"/>
  <rect width="1200" height="14" fill="#4c3a7a"/>
  <path d="M455 130V500" stroke="#ddd7ea" stroke-width="2"/>
  <g font-family="Apple SD Gothic Neo, sans-serif">
    <text x="520" y="232" font-size="23" letter-spacing="4" fill="#4c3a7a">MOON INSTITUTE</text>
    <text x="515" y="325" font-size="68" font-weight="700" fill="#352556">문선명 연구소</text>
    <text x="520" y="390" font-size="28" fill="#625b6d">평화를 사랑하는 세계인으로</text>
    <text x="520" y="487" font-size="22" fill="#625b6d">문선명연구소.com</text>
  </g>
</svg>`);
const share = await sharp(background)
  .composite([{ input: await sharp(logo.pathname).resize(310, 310).png().toBuffer(), left: 85, top: 160 }])
  .png().toBuffer();
const metadata = await sharp(share).metadata();
assert.equal(metadata.width, 1200);
assert.equal(metadata.height, 630);
assert.ok(share.length < 5 * 1024 * 1024);
await writeFile(new URL("opengraph-image.png", app), share);
console.log("Generated favicon (16/32/48/64px) and share image (1200×630); checks passed.");
