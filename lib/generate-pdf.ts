/**
 * Gerador minimalista de PDF/1.4 com paginação automática.
 * Usa Helvetica/Helvetica-Bold (Type1 embutidas em todos os viewers).
 * Caracteres portugueses são codificados como escapes octais (WinAnsiEncoding).
 */

function pdfEncode(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\') { out += '\\\\'; continue; }
    if (ch === '(')  { out += '\\(';  continue; }
    if (ch === ')')  { out += '\\)';  continue; }
    const n = ch.charCodeAt(0);
    if (n >= 32 && n <= 126) { out += ch; continue; }
    if (n > 126 && n <= 255) { out += '\\' + n.toString(8).padStart(3, '0'); continue; }
    out += '?'; // além do Latin-1 → substitui
  }
  return out;
}

function wordWrap(text: string, maxLen: number): string[] {
  const clean = text.replace(/\r/g, '');
  if (!clean.trim()) return [''];
  const words = clean.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length <= maxLen) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = w.length > maxLen ? w.slice(0, maxLen) : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

type RenderCmd =
  | { kind: 'text'; txt: string; size: number; bold: boolean }
  | { kind: 'spacer'; pts: number };

export function generatePdfBytes(
  titulo: string,
  conteudo: string,
  clienteNome: string,
): Uint8Array<ArrayBuffer> {
  const now = new Date().toLocaleDateString('pt-BR');
  const pageW = 595;
  const pageH = 841;
  const mLeft = 56;
  const yTop = pageH - 72;
  const yMin = 60;
  const footer = `Gerado automaticamente pelo sunOS em ${now}`;

  // 1. Coletar todos os comandos de renderização
  const queue: RenderCmd[] = [];

  const text = (txt: string, size: number, bold = false) =>
    queue.push({ kind: 'text', txt, size, bold });
  const spacer = (pts: number) =>
    queue.push({ kind: 'spacer', pts });

  for (const l of wordWrap(titulo, 66)) text(l, 18, true);
  spacer(6);
  text(`Cliente: ${clienteNome}`, 10);
  text(`Data: ${now}`, 10);
  spacer(8);
  text('-'.repeat(80), 9);
  spacer(4);

  for (const rawLine of conteudo.split('\n')) {
    if (!rawLine.replace(/\r/g, '').trim()) { spacer(8); continue; }
    for (const l of wordWrap(rawLine, 88)) text(l, 11);
  }

  // 2. Paginar
  const pages: string[][] = [];
  let cmds: string[] = [];
  let y = yTop;

  const flushPage = () => {
    cmds.push(
      `BT /F1 8 Tf ${mLeft} ${yMin - 12} Td (${pdfEncode(footer)}) Tj ET`,
    );
    pages.push(cmds);
    cmds = [];
    y = yTop;
  };

  for (const cmd of queue) {
    if (cmd.kind === 'spacer') {
      y -= cmd.pts;
      if (y < yMin) flushPage();
      continue;
    }
    if (y - cmd.size < yMin) flushPage();
    const font = cmd.bold ? '/F2' : '/F1';
    cmds.push(`BT ${font} ${cmd.size} Tf ${mLeft} ${Math.round(y)} Td (${pdfEncode(cmd.txt)}) Tj ET`);
    y -= cmd.size * 1.5;
  }
  flushPage(); // última página

  // 3. Montar PDF/1.4
  // Layout de objetos:
  //   1          → Catalog
  //   2          → Pages
  //   3..2+N     → Page objects (N = pages.length)
  //   3+N..2+2N  → Content streams
  //   3+2N       → Font F1 (Helvetica)
  //   4+2N       → Font F2 (Helvetica-Bold)

  const N = pages.length;
  const fontF1 = 3 + 2 * N;
  const fontF2 = 4 + 2 * N;
  const totalObjs = fontF2 + 1;

  const parts: string[] = [];
  const offsets: number[] = new Array(totalObjs).fill(0);
  let pos = 0;

  const emit = (s: string) => { pos += s.length; parts.push(s); };
  const obj = (n: number, body: string) => {
    offsets[n] = pos;
    emit(`${n} 0 obj\n${body}\nendobj\n`);
  };

  emit('%PDF-1.4\n');

  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');

  const kids = Array.from({ length: N }, (_, i) => `${3 + i} 0 R`).join(' ');
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${N} >>`);

  for (let i = 0; i < N; i++) {
    obj(3 + i,
      `<< /Type /Page /Parent 2 0 R\n` +
      `   /MediaBox [0 0 ${pageW} ${pageH}]\n` +
      `   /Resources << /Font << /F1 ${fontF1} 0 R /F2 ${fontF2} 0 R >> >>\n` +
      `   /Contents ${3 + N + i} 0 R >>`);
  }

  for (let i = 0; i < N; i++) {
    const stream = pages[i].join('\n');
    obj(3 + N + i, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }

  obj(fontF1, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  obj(fontF2, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  const xrefPos = pos;
  emit(`xref\n0 ${totalObjs}\n`);
  emit(`0000000000 65535 f \n`);
  for (let i = 1; i < totalObjs; i++) {
    emit(`${offsets[i].toString().padStart(10, '0')} 00000 n \n`);
  }
  emit(`trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  return new TextEncoder().encode(parts.join(''));
}
