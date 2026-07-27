const sharp = require("sharp");
const fs = require("fs");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#1E3B2C"/><circle cx="256" cy="200" r="80" fill="none" stroke="#F1E8D6" stroke-width="6"/><circle cx="256" cy="200" r="40" fill="#C9A876" opacity="0.5"/><text x="256" y="210" text-anchor="middle" font-family="serif" font-size="80" fill="#F1E8D6" font-weight="bold">A</text></svg>`;

const sizes = [192, 512];

async function generate() {
  for (const size of sizes) {
    const buffer = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toBuffer();
    fs.writeFileSync(`public/icons/icon-${size}.png`, buffer);

    const padded = await sharp(Buffer.from(svg))
      .resize(size, size)
      .extend({
        top: Math.round(size * 0.1),
        bottom: Math.round(size * 0.1),
        left: Math.round(size * 0.1),
        right: Math.round(size * 0.1),
        background: "#1E3B2C",
      })
      .resize(size, size)
      .png()
      .toBuffer();
    fs.writeFileSync(`public/icons/maskable-${size}.png`, padded);
  }
  console.log("Icons generated");
}

generate().catch(console.error);