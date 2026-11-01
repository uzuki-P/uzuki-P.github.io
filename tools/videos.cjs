// Renders one short MP4 per portfolio app: title, description, screenshots, stack and links.
// Every slide holds for SLIDE seconds (default 5) and slides cross-fade.
// Usage: NODE_PATH=~/projects/capital-crm/node_modules node tools/videos.cjs [app-id ...]
// Videos go to $OUT (default ./videos); frames are kept in $OUT/frames/<app>.
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright-core");

const root = path.resolve(__dirname, "..");
const out = path.resolve(process.env.OUT || path.join(root, "videos"));
const SLIDE = Number(process.env.SLIDE || 5);
const FADE = 0.6;
const W = 1920;
const H = 1080;

// --- data.ts, loaded without a TS toolchain ---------------------------------------------------
function loadData() {
  let src = fs.readFileSync(path.join(root, "src/data.ts"), "utf8");
  src = src
    .replace(/^export type[\s\S]*?(?=\n\/\*\*|\nconst )/m, "")
    .replace(/\/\*\*[^]*?\*\//g, "")
    .replace(/: Record<[^>]+>\s*=/g, " =")
    .replace(/\[width: number, height: number\]/g, "")
    .replace(/\(file: string, alt: string\): Shot =>/, "(file, alt) =>")
    .replace(/\(media: Media\): Shot\[\]/, "(media)")
    .replace(/: Project\[\]/, "")
    .replace(/\$\{import\.meta\.env\.BASE_URL\}/g, "")
    .replace(/export /g, "");
  return new Function(`${src}; return { featured, projects, PLATFORM_LABEL, shotsOf }`)();
}

function loadIcons() {
  const src = fs.readFileSync(path.join(root, "src/components/m3e/icon-data.app.ts"), "utf8");
  const json = src.slice(src.indexOf("{", src.indexOf("const data")), src.lastIndexOf("}") + 1);
  return JSON.parse(json.replace(/,(\s*[}\]])/g, "$1")).icons;
}

const { featured, projects, PLATFORM_LABEL, shotsOf } = loadData();
const icons = loadIcons();
const icon = (name, size) => {
  const key = name.replace(/_/g, "-");
  const body = (icons[key + "-rounded"] ?? icons[key])?.body ?? "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${body}</svg>`;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fileUrl = (p) => "file://" + p;
const shotPath = (src) => path.join(root, "public", src);

// Split long copy into slides short enough to read in SLIDE seconds (~28 words each).
function chunk(text, maxWords = 30) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text];
  const count = (t) => t.split(/\s+/).length;
  const total = count(text);
  const n = Math.ceil(total / maxWords);
  const target = total / n;
  const parts = [];
  let cur = [];
  let seen = 0;
  for (const s of sentences) {
    // Close the current slide once it reaches its share of the words, so slides come out even.
    if (cur.length && parts.length < n - 1 && seen + count(s) / 2 > target * (parts.length + 1)) {
      parts.push(cur.join(" "));
      cur = [];
    }
    cur.push(s);
    seen += count(s);
  }
  if (cur.length) parts.push(cur.join(" "));
  return parts;
}

// --- slides -----------------------------------------------------------------------------------
const fonts = path.join(root, "node_modules/@fontsource-variable");
const CSS = `
@font-face { font-family: "Roboto Flex"; src: url(${fileUrl(fonts + "/roboto-flex/files/roboto-flex-latin-standard-normal.woff2")}) format("woff2"); font-weight: 100 1000; }
@font-face { font-family: "JetBrains Mono"; src: url(${fileUrl(fonts + "/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2")}) format("woff2"); font-weight: 100 800; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body {
  font-family: "Roboto Flex", system-ui, sans-serif; color: #f6eef2;
  background:
    radial-gradient(55% 60% at 12% 8%, rgb(233 30 99 / 0.32), transparent 70%),
    radial-gradient(50% 55% at 92% 96%, rgb(136 14 79 / 0.45), transparent 70%),
    radial-gradient(40% 40% at 70% 30%, rgb(244 143 177 / 0.07), transparent 70%),
    linear-gradient(165deg, #2a1422, #160d13 65%);
  display: flex; flex-direction: column; padding: 72px 110px 64px;
}
.top { display: flex; align-items: center; gap: 18px; color: #ddcbd4; font-size: 30px; font-weight: 500; }
.top .tile { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; background: #c2185b; color: #fff; }
.top .count { margin-left: auto; font-family: "JetBrains Mono"; font-size: 24px; color: #a8949e; }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; }
.kicker { font-family: "JetBrains Mono"; font-size: 26px; letter-spacing: .14em; text-transform: uppercase; color: #f48fb1; margin-bottom: 28px; }
h1 { font-size: 132px; line-height: 1; font-weight: 750; letter-spacing: -0.02em; }
.blurb { font-size: 50px; line-height: 1.25; color: #ddcbd4; margin-top: 36px; max-width: 1450px; }
.hero-icon { width: 168px; height: 168px; border-radius: 48px; display: grid; place-items: center; background: #c2185b; color: #fff; margin-bottom: 48px; box-shadow: 0 20px 60px rgb(233 30 99 / .35); }
.chips { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 48px; }
.chip { font-size: 32px; padding: 14px 30px; border-radius: 999px; background: #33242d; color: #f3d9e5; border: 1px solid rgb(255 255 255 / .08); }
.chip.accent { background: rgb(240 98 146 / .18); color: #f8bbd0; }
.para { font-size: 58px; line-height: 1.38; font-weight: 450; max-width: 1600px; text-wrap: pretty; }
.shot-wrap { flex: 1; padding: 28px 0 36px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; min-height: 0; }
.frames { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; gap: 48px; width: 100%; }
.frame { border-radius: 22px; overflow: hidden; background: #221820; box-shadow: 0 30px 80px rgb(0 0 0 / .5), 0 0 0 1px rgb(255 255 255 / .08); display: flex; flex-direction: column; max-height: 100%; }
.frame .bar { height: 40px; flex: none; background: #2d2029; display: flex; align-items: center; gap: 10px; padding: 0 18px; }
.frame .bar i { width: 13px; height: 13px; border-radius: 50%; background: #5a4450; }
.frame .bar i:first-child { background: #f06292; }
.frame img { display: block; min-height: 0; object-fit: contain; }
.caption { font-size: 32px; line-height: 1.3; color: #ddcbd4; text-align: center; max-width: 1500px; flex: none; }
.facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 36px; }
.fact { background: rgb(255 255 255 / .05); border: 1px solid rgb(255 255 255 / .08); border-radius: 32px; padding: 48px 44px; }
.fact b { display: block; white-space: nowrap; font-size: 64px; font-weight: 750; color: #f48fb1; margin-bottom: 20px; letter-spacing: -0.01em; }
.fact span { font-size: 36px; line-height: 1.35; color: #ddcbd4; }
.links { display: flex; flex-direction: column; gap: 26px; margin-top: 64px; }
.link { display: flex; align-items: center; gap: 22px; font-family: "JetBrains Mono"; font-size: 40px; color: #f6eef2; }
.link small { font-family: "Roboto Flex"; font-size: 28px; color: #a8949e; width: 140px; text-transform: uppercase; letter-spacing: .12em; }
.foot { font-size: 24px; color: #a8949e; display: flex; justify-content: space-between; font-family: "JetBrains Mono"; }
`;

const page = (app, i, n, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="top"><div class="tile">${icon(app.icon, 34)}</div>${esc(app.name)}<span class="count">${i + 1} / ${n}</span></div>
<div class="main">${body}</div>
<div class="foot"><span>Rahmat Fajar · uzuki-P</span><span>${esc(app.domain)}</span></div>
</body></html>`;

const frame = (shot, maxW, maxH) => {
  const scale = Math.min(maxW / shot.width, (maxH - 40) / shot.height, 2);
  const w = Math.round(shot.width * scale);
  const h = Math.round(shot.height * scale);
  return `<div class="frame"><div class="bar"><i></i><i></i><i></i></div><img src="${fileUrl(shotPath(shot.src))}" style="width:${w}px;height:${h}px"></div>`;
};

function shotSlides(shots) {
  // Pair tall/narrow shots side by side; wide shots get a slide each.
  const slides = [];
  const narrow = (s) => s.width / s.height < 1;
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const next = shots[i + 1];
    if (narrow(s) && next && narrow(next)) {
      slides.push({ kind: "shots", shots: [s, next] });
      i++;
    } else slides.push({ kind: "shots", shots: [s] });
  }
  return slides;
}

function slideBody(app, slide) {
  switch (slide.kind) {
    case "title":
      return `<div class="hero-icon">${icon(app.icon, 104)}</div>
        <div class="kicker">${esc(app.kicker)}</div>
        <h1>${esc(app.name)}</h1>
        <div class="blurb">${esc(app.blurb)}</div>`;
    case "text":
      return `<div class="kicker">${esc(slide.label)}</div><div class="para">${esc(slide.text)}</div>`;
    case "shots": {
      const maxH = 660;
      const maxW = slide.shots.length > 1 ? 780 : 1560;
      const caption = slide.shots.map((s) => s.alt).join(" · ");
      return `<div class="shot-wrap"><div class="frames">${slide.shots.map((s) => frame(s, maxW, maxH)).join("")}</div>
        <div class="caption">${esc(caption)}</div></div>`;
    }
    case "facts":
      return `<div class="kicker">By the numbers</div><div class="facts">${slide.facts
        .map((f) => `<div class="fact"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`)
        .join("")}</div>`;
    case "stack":
      return `<div class="kicker">Built with</div>
        <div class="chips">${app.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        <div class="links">${app.links
          .map(([k, v]) => `<div class="link"><small>${esc(k)}</small>${esc(v.replace(/^https:\/\//, ""))}</div>`)
          .join("")}</div>`;
  }
}

function apps() {
  const list = [
    {
      id: featured.id,
      name: featured.name,
      icon: featured.icon,
      blurb: featured.role,
      kicker: "Featured · Web",
      description: featured.description,
      tags: ["React", "TypeScript", "Vite", "SIP / WebRTC", "Playwright"],
      links: [["Site", featured.url]],
      shots: featured.shots,
      facts: featured.facts,
    },
    ...projects.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      blurb: p.blurb,
      kicker: p.platforms.map((x) => PLATFORM_LABEL[x]).join(" · "),
      description: p.description,
      tags: p.tags,
      links: [["Code", p.repo], ...(p.site ? [["Site", p.site]] : [])],
      shots: shotsOf(p.media),
    })),
  ];
  for (const a of list) {
    a.domain = (a.links.find(([k]) => k === "Site") ?? a.links[0])[1].replace(/^https:\/\//, "").replace(/\/$/, "");
    const parts = chunk(a.description);
    a.slides = [
      { kind: "title" },
      ...parts.map((text, i) => ({ kind: "text", label: parts.length > 1 ? `About · ${i + 1}/${parts.length}` : "About", text })),
      ...shotSlides(a.shots),
      ...(a.facts ? [{ kind: "facts", facts: a.facts }] : []),
      { kind: "stack" },
    ];
  }
  return list;
}

// --- render -----------------------------------------------------------------------------------
function encode(pngs, dest) {
  const args = ["-y", "-v", "error"];
  const step = SLIDE + FADE; // each slide is fully still for SLIDE seconds
  const dur = step + FADE;
  for (const p of pngs) args.push("-loop", "1", "-framerate", "30", "-t", String(dur), "-i", p);
  const filters = [];
  let prev = "[0:v]";
  pngs.slice(1).forEach((_, k) => {
    const i = k + 1;
    const label = i === pngs.length - 1 ? "[xf]" : `[x${i}]`;
    filters.push(`${prev}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${(i * step).toFixed(2)}${label}`);
    prev = label;
  });
  const last = pngs.length > 1 ? "[xf]" : "[0:v]";
  const total = pngs.length * step + FADE;
  filters.push(`${last}fade=t=in:st=0:d=0.4,fade=t=out:st=${(total - 0.5).toFixed(2)}:d=0.5,format=yuv420p[v]`);
  args.push("-filter_complex", filters.join(";"), "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-r", "30", "-movflags", "+faststart", dest);
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, colorScheme: "dark" });
  const tab = await ctx.newPage();
  for (const app of apps()) {
    if (only.length && !only.includes(app.id)) continue;
    const dir = path.join(out, "frames", app.id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const pngs = [];
    for (const [i, slide] of app.slides.entries()) {
      const html = path.join(dir, `${i}.html`);
      fs.writeFileSync(html, page(app, i, app.slides.length, slideBody(app, slide)));
      await tab.goto(fileUrl(html));
      await tab.evaluate(() => document.fonts.ready);
      await tab.waitForLoadState("load");
      const png = path.join(dir, `${String(i).padStart(2, "0")}.png`);
      await tab.screenshot({ path: png });
      fs.rmSync(html);
      pngs.push(png);
    }
    const dest = path.join(out, `${app.id}.mp4`);
    encode(pngs, dest);
    console.log(`${dest}  ${pngs.length} slides, ${(pngs.length * (SLIDE + FADE) + FADE).toFixed(1)}s`);
  }
  await browser.close();
})();
