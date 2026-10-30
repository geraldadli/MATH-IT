// Generates the Math It! user flow diagram (EN + ID) as SVG.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = process.argv[2] ?? fileURLToPath(new URL(".", import.meta.url));
mkdirSync(OUT, { recursive: true });

const W = 1000, H = 2010;
const MX = 500, LX = 175, RX = 830, LRAIL = 26, RRAIL = 974;
const C = {
  ink: "#1f2433", muted: "#5b6275", line: "#3a4256", bg: "#ffffff",
  oval: ["#fde7c2", "#d98a12"], rect: ["#e6ecfb", "#4a63b8"],
  dia: ["#fbe0e0", "#c4504f"], para: ["#dff3ea", "#2f8f68"],
};
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const T = {
  en: {
    title: "Math It! · User Flow", sub: "From opening the app to solving a case",
    yes: "Yes", no: "No", optional: "optional",
    legend: "Symbols", lg: ["Start / end", "Screen or action", "Decision", "Input / output", "Flow direction"],
    start: ["Open Math It!"], d1: ["Profile saved", "on this device?"],
    welcome: ["Welcome screen", "(switch ID / EN anytime)"],
    input: ["Enter detective name,", "pick partner & coat colour"],
    d2: ["Name", "filled in?"], d2no: "No · reminder shown",
    saved: ["Profile saved", "on this device"],
    dash: ["Dashboard", "rank, XP bar, unit picker"],
    d3: ["Play a", "case?"], end: ["Close the app"],
    choose: ["Pick a unit,", "open the current case"],
    d4: ["First case", "ever?"], demo: ["Drag / tap demo", "→ “Let me try”"],
    caseS: ["Case screen", "read the mission"],
    move: ["Drag or tap clues into groups", "(or set dashboard tools)"],
    hint: ["Hint dialog (optional)", "step by step, no penalty"],
    check: ["Press “Check”"],
    d5: ["Arrangement", "correct?"], look: ["“Look again” marks", "groups to review"],
    d6: ["First time", "solved?"], xp: ["+100 XP saved,", "next case unlocked"],
    celebrate: ["Solved celebration", "“Level up!” on a new rank"],
    d7: ["Next case in", "this unit?"],
  },
  id: {
    title: "Math It! · Alur Pengguna", sub: "Dari membuka aplikasi hingga menyelesaikan kasus",
    yes: "Ya", no: "Tidak", optional: "opsional",
    legend: "Simbol", lg: ["Mulai / selesai", "Layar atau tindakan", "Keputusan", "Masukan / keluaran", "Arah alur"],
    start: ["Buka Math It!"], d1: ["Profil tersimpan", "di perangkat?"],
    welcome: ["Halaman awal", "(ganti ID / EN kapan saja)"],
    input: ["Isi nama detektif, pilih", "hewan pendamping & warna"],
    d2: ["Nama", "sudah diisi?"], d2no: "Tidak · muncul pengingat",
    saved: ["Profil disimpan", "di perangkat"],
    dash: ["Dasbor", "peringkat, XP, pilihan unit"],
    d3: ["Main", "kasus?"], end: ["Tutup aplikasi"],
    choose: ["Pilih unit,", "buka kasus saat ini"],
    d4: ["Kasus", "pertama?"], demo: ["Contoh seret / ketuk", "→ “Aku coba dulu”"],
    caseS: ["Layar kasus", "baca misi"],
    move: ["Seret / ketuk petunjuk ke grup", "(atau atur alat dasbor)"],
    hint: ["Dialog petunjuk (opsional)", "bertahap, tanpa penalti"],
    check: ["Tekan “Periksa”"],
    d5: ["Susunan", "sudah benar?"], look: ["“Cek lagi” menandai", "grup yang perlu ditinjau"],
    d6: ["Pertama kali", "selesai?"], xp: ["+100 XP disimpan,", "kasus berikutnya terbuka"],
    celebrate: ["Perayaan kasus selesai", "“Naik level!” bila naik peringkat"],
    d7: ["Masih ada kasus", "di unit ini?"],
  },
};

// Shape sizes: [half width, half height]
const SZ = { oval: [110, 27], rect: [150, 30], para: [160, 31], dia: [125, 54] };
const SKEW = 18;

const esc = (s) => s.replace(/&/g, "&amp;");
function text(x, y, lines, opts = {}) {
  const size = opts.size ?? 17, lh = size * 1.25;
  const y0 = y - ((lines.length - 1) * lh) / 2;
  if (opts.flat) return lines.map((l, i) =>
    `<text x="${x}" y="${(y0 + i * lh).toFixed(1)}" font-size="${size}" font-weight="600" fill="${C.ink}" text-anchor="middle" dominant-baseline="central">${esc(l)}</text>`).join("");
  return lines.map((l, i) =>
    `<text x="${x}" y="${(y0 + i * lh).toFixed(1)}" font-size="${i === 0 && lines.length > 1 && !opts.flat ? size : size - (lines.length > 1 && !opts.flat ? 2 : 0)}" font-weight="${i === 0 && !opts.light ? 600 : 400}" fill="${i === 0 ? C.ink : C.muted}" text-anchor="middle" dominant-baseline="central">${esc(l)}</text>`
  ).join("");
}

function shape(kind, x, y, lines, size) {
  const [hw, hh] = size ?? SZ[kind];
  let s;
  if (kind === "oval") s = `<rect x="${x - hw}" y="${y - hh}" width="${hw * 2}" height="${hh * 2}" rx="${hh}" fill="${C.oval[0]}" stroke="${C.oval[1]}" stroke-width="2.5"/>`;
  if (kind === "rect") s = `<rect x="${x - hw}" y="${y - hh}" width="${hw * 2}" height="${hh * 2}" rx="4" fill="${C.rect[0]}" stroke="${C.rect[1]}" stroke-width="2.5"/>`;
  if (kind === "para") s = `<polygon points="${x - hw + SKEW},${y - hh} ${x + hw + SKEW},${y - hh} ${x + hw - SKEW},${y + hh} ${x - hw - SKEW},${y + hh}" fill="${C.para[0]}" stroke="${C.para[1]}" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (kind === "dia") s = `<polygon points="${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}" fill="${C.dia[0]}" stroke="${C.dia[1]}" stroke-width="2.5" stroke-linejoin="round"/>`;
  return s + text(x, y, lines, { size: kind === "dia" ? 16 : 17, flat: kind === "dia" });
}

// Polyline with arrowhead at the end.
function arrow(points, { dashed = false, both = false } = {}) {
  const d = points.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  return `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="2.2" stroke-linejoin="round"${dashed ? ' stroke-dasharray="7 5"' : ""} marker-end="url(#ah)"${both ? ' marker-start="url(#ahs)"' : ""}/>`;
}
function plain(points) {
  const d = points.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  return `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="2.2" stroke-linejoin="round"/>`;
}
function label(x, y, s, anchor = "start") {
  return `<text x="${x}" y="${y}" font-size="15" font-weight="600" fill="${C.line}" text-anchor="${anchor}" dominant-baseline="central" paint-order="stroke" stroke="${C.bg}" stroke-width="5">${esc(s)}</text>`;
}

function build(lang) {
  const t = T[lang];
  const out = [];
  const add = (s) => out.push(s);

  // Vertical layout of the main column (centres).
  const y = {};
  const order = [
    ["start", "oval"], ["d1", "dia"], ["welcome", "rect"], ["input", "para"], ["d2", "dia"], ["saved", "para"],
    ["dash", "rect"], ["d3", "dia"], ["choose", "rect"], ["d4", "dia"], ["caseS", "rect"], ["move", "para"],
    ["check", "rect"], ["d5", "dia"], ["d6", "dia"], ["celebrate", "rect"], ["d7", "dia"],
  ];
  let top = 120;
  const GAP = 38;
  for (const [key, kind] of order) {
    const hh = SZ[kind][1];
    y[key] = top + hh;
    top += hh * 2 + GAP;
  }
  const kindOf = Object.fromEntries(order);
  const bottom = (k) => y[k] + SZ[kindOf[k]][1];
  const topOf = (k) => y[k] - SZ[kindOf[k]][1];
  const halfW = (k) => SZ[kindOf[k]][0];

  // Arrows first so shapes sit on top.
  // Straight downward links along the main column.
  const straight = [
    ["start", "d1"], ["d1", "welcome", t.no], ["welcome", "input"], ["input", "d2"], ["d2", "saved", t.yes],
    ["saved", "dash"], ["dash", "d3"], ["d3", "choose", t.yes], ["choose", "d4"], ["d4", "caseS", t.no],
    ["caseS", "move"], ["move", "check"], ["check", "d5"], ["d5", "d6", t.yes], ["d6", "celebrate", t.no],
    ["celebrate", "d7"],
  ];
  for (const [a, b, lab] of straight) {
    add(arrow([[MX, bottom(a)], [MX, topOf(b) - 2]]));
    if (lab) add(label(MX + 10, bottom(a) + 15, lab));
  }

  // D1 yes → right rail → dashboard.  D7 no → right rail → dashboard.
  add(plain([[MX + halfW("d1"), y.d1], [RRAIL, y.d1], [RRAIL, y.dash]]));
  add(label(MX + halfW("d1") + 12, y.d1 - 14, t.yes));
  add(plain([[MX + halfW("d7"), y.d7], [RRAIL, y.d7], [RRAIL, y.dash]]));
  add(label(MX + halfW("d7") + 12, y.d7 - 14, t.no));
  add(arrow([[RRAIL, y.dash], [MX + halfW("dash") + 2, y.dash]]));

  // D2 no → loop back to the input.
  const d2x = 150;
  add(plain([[MX - halfW("d2"), y.d2], [d2x, y.d2], [d2x, y.input]]));
  add(arrow([[d2x, y.input], [MX - halfW("input") - 2, y.input]]));
  add(label(MX - halfW("d2") - 12, y.d2 - 14, t.d2no, "end"));

  // D3 no → end.
  add(arrow([[MX - halfW("d3"), y.d3], [LX + SZ.oval[0] + 2, y.d3]]));
  add(label(MX - halfW("d3") - 12, y.d3 - 14, t.no, "end"));
  add(shape("oval", LX, y.d3, t.end));

  // D4 yes → demo → back into the case screen.
  add(arrow([[MX + halfW("d4"), y.d4], [RX - 122, y.d4]]));
  add(label(MX + halfW("d4") + 10, y.d4 - 14, t.yes));
  add(arrow([[RX, y.d4 + 30], [RX, y.caseS], [MX + halfW("caseS") + 2, y.caseS]]));
  add(shape("rect", RX, y.d4, t.demo, [120, 30]));

  // Hint dialog, optional two-way.
  add(arrow([[MX + 140 + 4, y.move], [RX - 122, y.move]], { dashed: true, both: true }));
  add(shape("rect", RX, y.move, t.hint, [120, 30]));

  // D5 no → "look again" output → back to moving clues.
  const lookX = 188, lookW = 125;
  add(arrow([[MX - halfW("d5"), y.d5], [lookX + lookW + 2, y.d5]]));
  add(label(MX - halfW("d5") - 12, y.d5 - 14, t.no, "end"));
  add(arrow([[lookX, y.d5 - 31], [lookX, y.move], [MX - 140 - 4, y.move]]));
  add(shape("para", lookX, y.d5, t.look, [lookW, 31]));

  // D6 yes → XP output → into the celebration.
  const xpX = 805, xpW = 125;
  add(arrow([[MX + halfW("d6"), y.d6], [xpX - xpW - 2, y.d6]]));
  add(label(MX + halfW("d6") + 10, y.d6 - 14, t.yes));
  add(arrow([[xpX, y.d6 + 31], [xpX, y.celebrate], [MX + 170 + 2, y.celebrate]]));
  add(shape("para", xpX, y.d6, t.xp, [xpW, 31]));

  // D7 yes → left rail → case screen.
  add(plain([[MX - halfW("d7"), y.d7], [LRAIL, y.d7], [LRAIL, y.caseS - 0]]));
  add(arrow([[LRAIL, y.caseS], [MX - halfW("caseS") - 2, y.caseS]]));
  add(label(MX - halfW("d7") - 12, y.d7 - 14, t.yes, "end"));

  // Main column shapes.
  for (const [key, kind] of order) add(shape(kind, MX, y[key], t[key], key === "celebrate" ? [170, 30] : key === "move" ? [140, 31] : undefined));

  // Legend in the free right column, between D1 and the dashboard.
  const lx = 700, ly = y.welcome - 40, lw = 240;
  const items = [
    (cx, cy) => `<rect x="${cx - 26}" y="${cy - 12}" width="52" height="24" rx="12" fill="${C.oval[0]}" stroke="${C.oval[1]}" stroke-width="2"/>`,
    (cx, cy) => `<rect x="${cx - 26}" y="${cy - 12}" width="52" height="24" rx="3" fill="${C.rect[0]}" stroke="${C.rect[1]}" stroke-width="2"/>`,
    (cx, cy) => `<polygon points="${cx},${cy - 16} ${cx + 26},${cy} ${cx},${cy + 16} ${cx - 26},${cy}" fill="${C.dia[0]}" stroke="${C.dia[1]}" stroke-width="2"/>`,
    (cx, cy) => `<polygon points="${cx - 20},${cy - 12} ${cx + 28},${cy - 12} ${cx + 20},${cy + 12} ${cx - 28},${cy + 12}" fill="${C.para[0]}" stroke="${C.para[1]}" stroke-width="2"/>`,
    (cx, cy) => `<path d="M${cx - 26} ${cy} L${cx + 22} ${cy}" stroke="${C.line}" stroke-width="2.2" marker-end="url(#ah)"/>`,
  ];
  add(`<rect x="${lx}" y="${ly}" width="${lw}" height="${50 + items.length * 46}" rx="10" fill="#f7f8fb" stroke="#d5d9e3" stroke-width="1.5"/>`);
  add(`<text x="${lx + 20}" y="${ly + 28}" font-size="16" font-weight="700" fill="${C.ink}">${t.legend}</text>`);
  items.forEach((draw, i) => {
    const cy = ly + 72 + i * 46;
    add(draw(lx + 52, cy));
    add(`<text x="${lx + 96}" y="${cy}" font-size="15" fill="${C.ink}" dominant-baseline="central">${t.lg[i]}</text>`);
  });

  // Title.
  add(`<text x="${MX}" y="48" font-size="28" font-weight="700" fill="${C.ink}" text-anchor="middle">${t.title}</text>`);
  add(`<text x="${MX}" y="80" font-size="16" fill="${C.muted}" text-anchor="middle">${t.sub}</text>`);

  const height = bottom("d7") + 46;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" font-family="${FONT}">
<defs>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.line}"/></marker>
<marker id="ahs" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M10 0 L0 5 L10 10 z" fill="${C.line}"/></marker>
</defs>
<rect width="100%" height="100%" fill="${C.bg}"/>
${out.join("\n")}
</svg>`;
}

for (const lang of ["en"]) writeFileSync(`${OUT}/user-flow-${lang}.svg`, build(lang));
console.log("ok");
