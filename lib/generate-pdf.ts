/**
 * Gerador minimalista de PDF/1.4 (sem dependências externas).
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

export function generatePdfBytes(
  titulo: string,
  conteudo: string,
  clienteNome: string,
): Uint8Array<ArrayBuffer> {
  const now = new Date().toLocaleDateString('pt-BR');
  const pageW = 595; // A4 em pontos
  const pageH = 841;
  const mLeft = 56;
  let y = pageH - 72;
  const yMin = 60;

  const cmds: string[] = [];

  function addLine(txt: string, size: number, bold = false): void {
    if (y < yMin) return;
    const font = bold ? '/F2' : '/F1';
    cmds.push(`BT ${font} ${size} Tf ${mLeft} ${Math.round(y)} Td (${pdfEncode(txt)}) Tj ET`);
    y -= size * 1.5;
  }

  // Título (bold 18pt)
  for (const l of wordWrap(titulo, 66)) addLine(l, 18, true);
  y -= 6;

  // Metadados (10pt)
  addLine(`Cliente: ${clienteNome}`, 10);
  addLine(`Data: ${now}`, 10);
  y -= 8;

  // Separador (traços ASCII)
  addLine('-'.repeat(80), 9);
  y -= 4;

  // Conteúdo (11pt, ~88 chars/linha)
  for (const rawLine of conteudo.split('\n')) {
    if (y < yMin) break;
    if (!rawLine.replace(/\r/g, '').trim()) { y -= 8; continue; }
    for (const l of wordWrap(rawLine, 88)) addLine(l, 11);
  }

  // Rodapé fixo
  cmds.push(
    `BT /F1 8 Tf ${mLeft} ${yMin - 12} Td ` +
    `(${pdfEncode(`Gerado automaticamente pelo sunOS em ${now}`)}) Tj ET`,
  );

  // ---------- Monta PDF/1.4 ----------
  // Todo conteúdo é ASCII puro (chars especiais como \341), portanto
  // string.length === byte count e TextEncoder produz bytes 1:1.

  const stream = cmds.join('\n');
  const streamLen = stream.length; // bytes = chars (ASCII)

  const parts: string[] = [];
  const offsets: number[] = [];
  let pos = 0;

  function emit(s: string): void { pos += s.length; parts.push(s); }

  function obj(n: number, body: string): void {
    offsets[n] = pos;
    emit(`${n} 0 obj\n${body}\nendobj\n`);
  }

  emit('%PDF-1.4\n');

  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3,
    `<< /Type /Page /Parent 2 0 R\n` +
    `   /MediaBox [0 0 ${pageW} ${pageH}]\n` +
    `   /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>\n` +
    `   /Contents 4 0 R >>`);
  obj(4, `<< /Length ${streamLen} >>\nstream\n${stream}\nendstream`);
  obj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  obj(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  const xrefPos = pos;
  const numObjs = 7; // objetos 0..6
  emit(`xref\n0 ${numObjs}\n`);
  emit(`0000000000 65535 f \n`);
  for (let i = 1; i < numObjs; i++) {
    emit(`${offsets[i].toString().padStart(10, '0')} 00000 n \n`);
  }
  emit(`trailer\n<< /Size ${numObjs} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  return new TextEncoder().encode(parts.join(''));
}
