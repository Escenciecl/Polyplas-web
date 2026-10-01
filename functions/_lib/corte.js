/**
 * Diagramas de corte para el comprobante de compra.
 * Port de pp_generar_pngs_corte / pp_strip_pack / pp_generar_pdf_cortes de functions.php,
 * sin dependencias (Cloudflare no tiene GD ni Imagick):
 *  - Usa los PNG que ya dibuja el navegador (calcInfo.pngsB64), igual que WordPress.
 *  - Si no vienen, dibuja el diagrama aquí (placedSheets → pieces → corteMedidas).
 *  - Arma un PDF A4 con una página por plancha (diagrama-cortes.pdf).
 */

/* ----------------------------------------------------------- base64 / zlib */
export function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function bytesToB64(bytes) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
}
async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}
const zlib = (b) => pipe(b, new CompressionStream("deflate"));
const unzlib = (b) => pipe(b, new DecompressionStream("deflate"));

const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_T[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

/* ----------------------------------------------------------- PNG encode/decode */
async function encodePng(w, h, rgb) {
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  }
  const idat = await zlib(raw);
  const chunk = (type, data) => {
    const td = new Uint8Array(4 + data.length);
    td.set([...type].map((c) => c.charCodeAt(0)));
    td.set(data, 4);
    return [...u32(data.length), ...td, ...u32(crc32(td))];
  };
  const ihdr = new Uint8Array([...u32(w), ...u32(h), 8, 2, 0, 0, 0]);
  return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...chunk("IHDR", ihdr), ...chunk("IDAT", idat), ...chunk("IEND", new Uint8Array())]);
}

/** Decodifica un PNG (8 bits, sin entrelazado) a RGB sobre fondo blanco. */
export async function decodePng(bytes) {
  if (bytes[0] !== 137 || bytes[1] !== 80) throw new Error("no es PNG");
  let p = 8, w = 0, h = 0, depth = 0, ctype = 0, inter = 0, plte = null, trns = null;
  const idat = [];
  while (p < bytes.length) {
    const len = (bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3];
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    const data = bytes.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      w = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
      h = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
      depth = data[8]; ctype = data[9]; inter = data[12];
    } else if (type === "PLTE") plte = data;
    else if (type === "tRNS") trns = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (depth !== 8 || inter !== 0) throw new Error("PNG no soportado");
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  const total = idat.reduce((a, d) => a + d.length, 0);
  const comp = new Uint8Array(total);
  let o = 0;
  for (const d of idat) { comp.set(d, o); o += d.length; }
  const raw = await unzlib(comp);
  const stride = w * ch;
  const px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = px.subarray(y * stride, (y + 1) * stride);
    const prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= ch ? prev[x - ch] : 0;
      let v = src[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
  }
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    let r, g, b, al = 255;
    if (ctype === 2) { r = px[i * 3]; g = px[i * 3 + 1]; b = px[i * 3 + 2]; }
    else if (ctype === 6) { r = px[i * 4]; g = px[i * 4 + 1]; b = px[i * 4 + 2]; al = px[i * 4 + 3]; }
    else if (ctype === 0) { r = g = b = px[i]; }
    else if (ctype === 4) { r = g = b = px[i * 2]; al = px[i * 2 + 1]; }
    else { const k = px[i]; r = plte[k * 3]; g = plte[k * 3 + 1]; b = plte[k * 3 + 2]; if (trns && k < trns.length) al = trns[k]; }
    const m = al / 255; // mezcla con fondo blanco
    rgb[i * 3] = Math.round(r * m + 255 * (1 - m));
    rgb[i * 3 + 1] = Math.round(g * m + 255 * (1 - m));
    rgb[i * 3 + 2] = Math.round(b * m + 255 * (1 - m));
  }
  return { w, h, rgb };
}

/* ----------------------------------------------------------- dibujo (fallback) */
// Fuente 5x7 para medidas: dígitos, x, punto, espacio, c, m
const FONT = {
  "0": [14, 17, 19, 21, 25, 17, 14], "1": [4, 12, 4, 4, 4, 4, 14], "2": [14, 17, 1, 2, 4, 8, 31],
  "3": [31, 2, 4, 2, 1, 17, 14], "4": [2, 6, 10, 18, 31, 2, 2], "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14], "7": [31, 1, 2, 4, 8, 8, 8], "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12], x: [0, 0, 17, 10, 4, 10, 17], ".": [0, 0, 0, 0, 0, 12, 12],
  " ": [0, 0, 0, 0, 0, 0, 0], c: [0, 0, 14, 16, 16, 17, 14], m: [0, 0, 26, 21, 21, 17, 17],
};
const PAL = [
  [[219, 234, 254], [59, 130, 246]], [[209, 250, 229], [16, 185, 129]], [[254, 243, 199], [245, 158, 11]],
  [[237, 233, 254], [139, 92, 246]], [[254, 226, 226], [239, 68, 68]], [[224, 242, 254], [14, 165, 233]],
];

function canvas(w, h) {
  const rgb = new Uint8Array(w * h * 3).fill(255);
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 3;
    rgb[i] = c[0]; rgb[i + 1] = c[1]; rgb[i + 2] = c[2];
  };
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const rect = (x0, y0, x1, y1, c) => {
    for (let x = x0; x <= x1; x++) { set(x, y0, c); set(x, y1, c); }
    for (let y = y0; y <= y1; y++) { set(x0, y, c); set(x1, y, c); }
  };
  const text = (s, x, y, c, vertical = false) => {
    [...s].forEach((ch, k) => {
      const g = FONT[ch] || FONT[" "];
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r] & (16 >> col)) vertical ? set(x + r, y - k * 6 - col, c) : set(x + k * 6 + col, y + r, c);
    });
  };
  return { w, h, rgb, fill, rect, text };
}

export function parseDimMm(s) {
  s = String(s || "").trim();
  let m = s.match(/^(\d+)[xX](\d+)$/);
  if (m) { const a = +m[1], b = +m[2]; return [Math.min(a, b), Math.max(a, b)]; }
  const ns = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => n >= 20);
  if (ns.length >= 2) {
    const [a, b] = ns;
    const w = a > 500 ? Math.round(a) : Math.round(a * 10);
    const h = a > 500 ? Math.round(b) : Math.round(b * 10);
    return [Math.min(w, h), Math.max(w, h)];
  }
  return [1220, 2440];
}

export function stripPack(pieces, sw, sh, saw, nSheets) {
  if (!pieces.length) return [];
  pieces = [...pieces].sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));
  const n = Math.max(1, nSheets | 0);
  const sheets = Array.from({ length: n }, () => []);
  const st = Array.from({ length: n }, () => ({ x: 0, y: 0, rowH: 0 }));
  for (const pc of pieces) {
    let placed = false;
    for (let si = 0; si < n && !placed; si++) {
      const s = st[si];
      if (s.x + pc.w <= sw) {
        sheets[si].push({ x: s.x, y: s.y, w: pc.w, h: pc.h, ci: pc.ci });
        s.rowH = Math.max(s.rowH, pc.h + saw); s.x += pc.w + saw; placed = true;
      } else if (s.y + s.rowH + pc.h <= sh) {
        s.y += s.rowH; s.x = 0;
        sheets[si].push({ x: 0, y: s.y, w: pc.w, h: pc.h, ci: pc.ci });
        s.rowH = pc.h + saw; s.x = pc.w + saw; placed = true;
      }
    }
    if (!placed) {
      const l = n - 1;
      sheets[l].push({ x: 0, y: st[l].y + st[l].rowH, w: pc.w, h: pc.h, ci: pc.ci });
    }
  }
  return sheets;
}

function layoutFromItem(item) {
  const ci = item.calcInfo || {};
  let [sw, sh] = parseDimMm(item.dimKey || item.dim || item.nombre || "");
  const svg = Array.isArray(ci.svgs) ? ci.svgs.find(Boolean) : null;
  const rm = svg && String(svg).match(/<rect[^>]+width="(\d+(?:\.\d+)?)"[^>]+height="(\d+(?:\.\d+)?)"[^>]+fill="#dce3ee"/);
  if (rm) {
    const a = Math.round(+rm[1]), b = Math.round(+rm[2]);
    if (a >= 500 && b >= 500) { sw = Math.min(a, b); sh = Math.max(a, b); }
  }
  const SAW = 3;
  let sheets = [];
  const cmap = {};
  let cc = 0;
  const color = (w, h) => { const k = `${w}x${h}`; if (!(k in cmap)) cmap[k] = cc++ % PAL.length; return cmap[k]; };
  if (Array.isArray(ci.placedSheets) && ci.placedSheets.length) {
    sheets = ci.placedSheets.map((s) => (s || []).map((p) => {
      const W = parseInt(p.W, 10) || 0, H = parseInt(p.H, 10) || 0;
      return { x: parseInt(p.x, 10) || 0, y: parseInt(p.y, 10) || 0, w: W, h: H, ci: color(W, H) };
    }));
  } else if (Array.isArray(ci.pieces) && ci.pieces.length) {
    const flat = [];
    for (const p of ci.pieces) {
      const w = parseInt(p.w, 10) || 0, h = parseInt(p.h, 10) || 0, q = Math.max(1, parseInt(p.qty ?? 1, 10) || 1);
      for (let i = 0; i < q; i++) flat.push({ w, h, ci: color(w, h) });
    }
    sheets = stripPack(flat, sw, sh, SAW, Math.max(1, parseInt(ci.Nsh ?? 1, 10) || 1));
  } else if (item.corteMedidas && Array.isArray(item.corteMedidas.items)) {
    let k = 0;
    for (const plank of item.corteMedidas.items) {
      const flat = [];
      for (const m of plank.medidas || []) {
        if (!m || !m.ancho || !m.alto) continue;
        const w = (parseInt(m.ancho, 10) || 0) * 10, h = (parseInt(m.alto, 10) || 0) * 10;
        const q = Math.max(1, parseInt(m.qty ?? 1, 10) || 1);
        for (let i = 0; i < q; i++) flat.push({ w, h, ci: k % PAL.length });
        k++;
      }
      sheets.push(flat.length ? stripPack(flat, sw, sh, SAW, 1)[0] || [] : []);
    }
  }
  return { sw, sh, sheets };
}

const cmLabel = (mm) => (mm % 10 === 0 ? String(mm / 10) : (mm / 10).toFixed(1));

async function drawSheets(item) {
  const { sw, sh, sheets } = layoutFromItem(item);
  if (!(sw > 0 && sh > 0)) return [];
  const L = 52, T = 26, R = 56, B = 14;
  const S = Math.min(560 / sw, 800 / sh);
  const PW = Math.floor(sw * S), PH = Math.floor(sh * S);
  const out = [];
  for (const placed of sheets) {
    if (!placed || !placed.length) continue;
    let maxB = PH;
    for (const p of placed) maxB = Math.max(maxB, Math.floor((p.y + p.h) * S));
    const cv = canvas(PW + L + R, maxB + T + B);
    cv.fill(L, T, L + PW, T + PH, [220, 227, 238]);
    cv.rect(L, T, L + PW, T + PH, [80, 80, 80]);
    for (const p of placed) {
      const px = L + Math.floor(p.x * S), py = T + Math.floor(p.y * S);
      const pw = Math.max(2, Math.floor(p.w * S)), ph = Math.max(2, Math.floor(p.h * S));
      const [fillC, brd] = PAL[p.ci % PAL.length];
      cv.fill(px, py, px + pw, py + ph, fillC);
      cv.rect(px, py, px + pw, py + ph, brd);
      const lbl = `${cmLabel(p.w)}x${cmLabel(p.h)}`;
      if (pw > lbl.length * 6 + 4 && ph > 11) cv.text(lbl, px + Math.floor((pw - lbl.length * 6) / 2), py + Math.floor((ph - 7) / 2), [26, 26, 46]);
    }
    const lw = `${Math.round(sw / 10)} cm`;
    cv.text(lw, L + Math.floor((PW - lw.length * 6) / 2), T - 14, [100, 116, 139]);
    const lh = `${Math.round(sh / 10)} cm`;
    cv.text(lh, L + PW + 20, T + Math.floor((PH + lh.length * 6) / 2), [100, 116, 139], true);
    out.push(await encodePng(cv.w, cv.h, cv.rgb));
  }
  return out;
}

/** PNG (bytes) de todas las planchas con corte, en orden. Nunca lanza error. */
export async function diagramasCorte(items) {
  const all = [];
  for (const it of items || []) {
    if (!it || !it.corteMode) continue;
    try {
      const fromBrowser = ((it.calcInfo && it.calcInfo.pngsB64) || [])
        .filter((b) => typeof b === "string" && b)
        .map((b) => b64ToBytes(b.replace(/^data:image\/png;base64,/, "")))
        .filter((b) => b.length > 200 && b[0] === 137);
      if (fromBrowser.length) { all.push(...fromBrowser); continue; }
      all.push(...(await drawSheets(it)));
    } catch (e) {
      console.log("[Polyplas] diagrama de corte", String(e));
    }
  }
  return all;
}

/* ----------------------------------------------------------- PDF */
/** PDF A4 con una página por plancha (mismo formato que pp_build_pdf_desde_imagenes). */
export async function pdfCortes(pngs) {
  const pages = [];
  for (let i = 0; i < pngs.length; i++) {
    try {
      const { w, h, rgb } = await decodePng(pngs[i]);
      pages.push({ w, h, data: await zlib(rgb), label: pngs.length > 1 ? `PLANCHA ${i + 1} DE ${pngs.length}` : "" });
    } catch (e) {
      console.log("[Polyplas] PDF: imagen omitida", String(e));
    }
  }
  if (!pages.length) return null;

  const A4W = 595.28, A4H = 841.89, MRG = 28.35, FS = 11, GAP = 7;
  const maxW = A4W - 2 * MRG, maxH = A4H - 2 * MRG - FS - GAP;
  const enc = new TextEncoder();
  const objs = []; // [n] = Uint8Array
  let n = 0;
  const catalogN = ++n, pagesN = ++n, fontN = ++n;
  objs[fontN] = enc.encode("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const refs = [];
  const join = (...parts) => {
    const len = parts.reduce((a, p) => a + p.length, 0);
    const o = new Uint8Array(len);
    let k = 0;
    for (const p of parts) { o.set(p, k); k += p.length; }
    return o;
  };
  for (const pg of pages) {
    const sc = Math.min(maxW / pg.w, maxH / pg.h);
    const dw = pg.w * sc, dh = pg.h * sc;
    const ix = (A4W - dw) / 2, iy = MRG + (maxH - dh) / 2;
    const imgN = ++n, contN = ++n, pageN = ++n;
    objs[imgN] = join(
      enc.encode(`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${pg.data.length} >>\nstream\n`),
      pg.data,
      enc.encode("\nendstream"),
    );
    const parts = [];
    if (pg.label) parts.push(`BT /F1 ${FS.toFixed(2)} Tf ${MRG.toFixed(4)} ${(iy + dh + GAP).toFixed(4)} Td (${pg.label}) Tj ET`);
    parts.push(`q ${dw.toFixed(4)} 0 0 ${dh.toFixed(4)} ${ix.toFixed(4)} ${iy.toFixed(4)} cm /Im1 Do Q`);
    const content = parts.join("\n");
    objs[contN] = enc.encode(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    objs[pageN] = enc.encode(`<< /Type /Page /Parent ${pagesN} 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contN} 0 R /Resources << /XObject << /Im1 ${imgN} 0 R >> /Font << /F1 ${fontN} 0 R >> >> >>`);
    refs.push(pageN);
  }
  objs[pagesN] = enc.encode(`<< /Type /Pages /Count ${refs.length} /Kids [${refs.map((r) => `${r} 0 R`).join(" ")}] >>`);
  objs[catalogN] = enc.encode(`<< /Type /Catalog /Pages ${pagesN} 0 R >>`);

  const chunks = [enc.encode("%PDF-1.4\n%âã\n")];
  let pos = chunks[0].length;
  const offs = [];
  for (let i = 1; i <= n; i++) {
    offs[i] = pos;
    const c = join(enc.encode(`${i} 0 obj\n`), objs[i], enc.encode("\nendobj\n"));
    chunks.push(c);
    pos += c.length;
  }
  let xref = `xref\n0 ${n + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= n; i++) xref += `${String(offs[i]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${n + 1} /Root ${catalogN} 0 R >>\nstartxref\n${pos}\n%%EOF`;
  chunks.push(enc.encode(xref));
  return join(...chunks);
}
