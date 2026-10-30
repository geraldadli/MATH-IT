// Generates the simplified Indonesian user flow (user-flow-id.svg).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = process.argv[2] ?? fileURLToPath(new URL(".", import.meta.url));

const W = 1060, MX = 530, LX = 195, RX = 870, RAIL = 750;
const C = {
  ink: "#1f2433", line: "#3a4256", bg: "#ffffff",
  oval: ["#fde7c2", "#d98a12"], rect: ["#e6ecfb", "#4a63b8"],
  dia: ["#fbe0e0", "#c4504f"], para: ["#dff3ea", "#2f8f68"],
};
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const SKEW = 16;
const SZ = { oval: [100, 28], rect: [150, 30], para: [150, 30], dia: [120, 55] };
const esc = (s) => s.replace(/&/g, "&amp;");

function text(x, y, lines, size = 19) {
  const lh = size * 1.2, y0 = y - ((lines.length - 1) * lh) / 2;
  return lines.map((l, i) => `<text x="${x}" y="${y0 + i * lh}" font-size="${size}" font-weight="600" fill="${C.ink}" text-anchor="middle" dominant-baseline="central">${esc(l)}</text>`).join("");
}
function shape(kind, x, y, lines, [hw, hh] = SZ[kind]) {
  const [fill, stroke] = C[kind];
  const a = `fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"`;
  const s = {
    oval: `<rect x="${x - hw}" y="${y - hh}" width="${hw * 2}" height="${hh * 2}" rx="${hh}" ${a}/>`,
    rect: `<rect x="${x - hw}" y="${y - hh}" width="${hw * 2}" height="${hh * 2}" rx="4" ${a}/>`,
    para: `<polygon points="${x - hw + SKEW},${y - hh} ${x + hw + SKEW},${y - hh} ${x + hw - SKEW},${y + hh} ${x - hw - SKEW},${y + hh}" ${a}/>`,
    dia: `<polygon points="${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}" ${a}/>`,
  }[kind];
  return s + text(x, y, lines);
}
const path = (pts) => "M" + pts.map((p) => p.join(" ")).join(" L");
const arrow = (pts) => `<path d="${path(pts)}" fill="none" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round" marker-end="url(#ah)"/>`;
const line = (pts) => `<path d="${path(pts)}" fill="none" stroke="${C.line}" stroke-width="2.4" stroke-linejoin="round"/>`;
const label = (x, y, s, anchor = "start") =>
  `<text x="${x}" y="${y}" font-size="17" font-weight="700" fill="${C.line}" text-anchor="${anchor}" dominant-baseline="central">${s}</text>`;

// Main column, top to bottom.
const steps = [
  ["start", "oval", ["Mulai"]],
  ["profil", "dia", ["Sudah punya", "profil?"]],
  ["dasbor", "rect", ["Dasbor: pilih unit"]],
  ["kasus", "rect", ["Buka kasus & baca misi"]],
  ["pindah", "para", ["Pindahkan petunjuk ke grup"]],
  ["periksa", "rect", ["Tekan “Periksa”"]],
  ["benar", "dia", ["Jawaban", "benar?"]],
  ["xp", "para", ["Dapat XP, kasus baru terbuka"], [170, 30]],
  ["lanjut", "dia", ["Lanjut", "main?"]],
  ["end", "oval", ["Selesai"]],
];
const y = {}, kind = {};
let top = 150;
for (const [k, kd] of steps) {
  kind[k] = kd;
  y[k] = top + SZ[kd][1];
  top += SZ[kd][1] * 2 + 40;
}
const H = top + 4;
const hw = (k) => SZ[kind[k]][0], hh = (k) => SZ[kind[k]][1];

const out = [];
// Straight links down the main column.
const yes = new Set(["benar", "profil"]), no = new Set(["lanjut"]);
for (let i = 0; i < steps.length - 1; i++) {
  const a = steps[i][0], b = steps[i + 1][0];
  out.push(arrow([[MX, y[a] + hh(a)], [MX, y[b] - hh(b) - 2]]));
  if (yes.has(a)) out.push(label(MX + 12, y[a] + hh(a) + 16, "Ya"));
  if (no.has(a)) out.push(label(MX + 12, y[a] + hh(a) + 16, "Tidak"));
}

// No profile yet → fill in the profile → dashboard.
out.push(arrow([[MX + hw("profil"), y.profil], [RX - 150 - 2, y.profil]]));
out.push(label(MX + hw("profil") + 8, y.profil - 16, "Tidak"));
out.push(arrow([[RX, y.profil + 30], [RX, y.dasbor], [MX + hw("dasbor") + 2, y.dasbor]]));
out.push(shape("para", RX, y.profil, ["Isi nama & pilih karakter"]));

// Wrong answer → "Cek lagi" → move the clues again.
out.push(arrow([[MX - hw("benar"), y.benar], [LX + 145 + 2, y.benar]]));
out.push(label(MX - hw("benar") - 8, y.benar - 16, "Tidak", "end"));
out.push(arrow([[LX, y.benar - 30], [LX, y.pindah], [MX - hw("pindah") - 2, y.pindah]]));
out.push(shape("para", LX, y.benar, ["Muncul tanda “Cek lagi”"], [145, 30]));

// Keep playing → open the next case.
out.push(line([[MX + hw("lanjut"), y.lanjut], [RAIL, y.lanjut], [RAIL, y.kasus]]));
out.push(arrow([[RAIL, y.kasus], [MX + hw("kasus") + 2, y.kasus]]));
out.push(label(MX + hw("lanjut") + 8, y.lanjut - 16, "Ya"));

for (const [k, kd, lines, size] of steps) out.push(shape(kd, MX, y[k], lines, size));

// Title and a one-row legend.
out.push(`<text x="${MX}" y="46" font-size="30" font-weight="700" fill="${C.ink}" text-anchor="middle">Alur Pengguna Math It!</text>`);
const legend = [
  ["oval", "Mulai / selesai", 112], ["rect", "Layar / tindakan", 120], ["dia", "Keputusan", 74],
  ["para", "Masukan / keluaran", 140], ["arrow", "Arah alur", 70],
];
const gap = 34, iconW = 46;
const total = legend.reduce((s, [, , w]) => s + iconW + 10 + w, 0) + gap * (legend.length - 1);
let lx = MX - total / 2;
const ly = 98;
out.push(`<rect x="${lx - 22}" y="${ly - 24}" width="${total + 44}" height="48" rx="24" fill="#f5f6fa" stroke="#dde1ea"/>`);
for (const [k, name, w] of legend) {
  const cx = lx + iconW / 2;
  const icon = {
    oval: `<rect x="${cx - 22}" y="${ly - 11}" width="44" height="22" rx="11" fill="${C.oval[0]}" stroke="${C.oval[1]}" stroke-width="2"/>`,
    rect: `<rect x="${cx - 22}" y="${ly - 11}" width="44" height="22" rx="3" fill="${C.rect[0]}" stroke="${C.rect[1]}" stroke-width="2"/>`,
    dia: `<polygon points="${cx},${ly - 14} ${cx + 22},${ly} ${cx},${ly + 14} ${cx - 22},${ly}" fill="${C.dia[0]}" stroke="${C.dia[1]}" stroke-width="2"/>`,
    para: `<polygon points="${cx - 15},${ly - 11} ${cx + 23},${ly - 11} ${cx + 15},${ly + 11} ${cx - 23},${ly + 11}" fill="${C.para[0]}" stroke="${C.para[1]}" stroke-width="2"/>`,
    arrow: `<path d="M${cx - 22} ${ly} L${cx + 18} ${ly}" stroke="${C.line}" stroke-width="2.4" marker-end="url(#ah)"/>`,
  }[k];
  out.push(icon, `<text x="${lx + iconW + 10}" y="${ly}" font-size="15" fill="${C.ink}" dominant-baseline="central">${name}</text>`);
  lx += iconW + 10 + w + gap;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${C.line}"/></marker></defs>
<rect width="100%" height="100%" fill="${C.bg}"/>
${out.join("\n")}
</svg>`;
writeFileSync(`${OUT}/user-flow-id.svg`, svg);
console.log("ok", W, H);
