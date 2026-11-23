import {
  getOutputPageSize,
  getPageSize,
  personText,
  visiblePeople,
  type PosterDocument,
  type TextDirection,
} from './model.ts';

export interface SvgFont {
  family: string;
  dataUrl: string;
  unicodeRange?: string;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function number(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function textAttributes(direction: TextDirection, anchor: 'start' | 'middle' | 'end'): string {
  return `direction="${direction}" unicode-bidi="plaintext" text-anchor="${anchor}"`;
}

export function renderSvg(document: PosterDocument, fonts: SvgFont[] = []): string {
  const trim = getPageSize(document.page);
  const output = getOutputPageSize(document.page);
  const bleed = document.page.bleedMm;
  const visible = visiblePeople(document);
  const peopleById = new Map(visible.map((person) => [person.id, person]));
  const family = fonts[0]?.family ?? 'serif';
  const fontCss = fonts
    .map(
      (font) =>
        `@font-face{font-family:'${escapeXml(font.family)}';src:url('${font.dataUrl}') format('woff2');font-weight:400;font-style:normal;font-display:block;${font.unicodeRange ? `unicode-range:${font.unicodeRange}` : ''}}`,
    )
    .join('');
  const connections = document.connections.flatMap((connection) => {
    const from = peopleById.get(connection.from);
    const to = peopleById.get(connection.to);
    if (!from || !to) return [];
    return [
      `<path d="M ${number(bleed + from.x)} ${number(bleed + from.y + 12)} C ${number(
        bleed + from.x - 10,
      )} ${number(bleed + from.y + 12)}, ${number(bleed + to.x + 10)} ${number(
        bleed + to.y,
      )}, ${number(bleed + to.x)} ${number(bleed + to.y)}" fill="none" stroke="#8b6a3f" stroke-width="1.4"/>`,
    ];
  });
  const people = visible.map((person) => {
    const width = person.width ?? 44;
    const direction = person.direction ?? (/\p{Script=Arabic}/u.test(personText(person)) ? 'rtl' : 'ltr');
    const x = bleed + person.x;
    const y = bleed + person.y;
    return `<g id="person-${escapeXml(person.id)}" data-display-text="${escapeXml(personText(person))}">
  <rect x="${number(x - width / 2)}" y="${number(y - 5)}" width="${number(width)}" height="12" rx="2.5" fill="#fffdf8" stroke="#a88850" stroke-width="0.7"/>
  <text x="${number(x)}" y="${number(y + 2.5)}" font-family="${escapeXml(family)}" font-size="4.4" fill="#332c24" ${textAttributes(direction, 'middle')}>${escapeXml(personText(person))}</text>
</g>`;
  });
  const freeText = (document.freeText ?? []).map((text) => {
    const direction = text.direction ?? (/\p{Script=Arabic}/u.test(text.text) ? 'rtl' : 'ltr');
    const anchor = text.align ?? 'middle';
    return `<text id="text-${escapeXml(text.id)}" x="${number(bleed + text.x)}" y="${number(
      bleed + text.y,
    )}" font-family="${escapeXml(family)}" font-size="${number(text.fontSize)}" fill="${escapeXml(
      text.color ?? '#332c24',
    )}" ${textAttributes(direction, anchor)}>${escapeXml(text.text)}</text>`;
  });
  const cropMarks = document.page.cropMarks && bleed > 0
    ? `<path data-crop-marks="true" d="M ${number(bleed)} ${number(bleed - 2)}V ${number(
        bleed,
      )}M ${number(bleed - 2)} ${number(bleed)}H ${number(bleed)} M ${number(
        bleed + trim.widthMm,
      )} ${number(bleed - 2)}V ${number(bleed)} M ${number(bleed + trim.widthMm)} ${number(
        bleed,
      )}H ${number(bleed + trim.widthMm + 2)} M ${number(bleed)} ${number(
        bleed + trim.heightMm,
      )}V ${number(bleed + trim.heightMm + 2)} M ${number(bleed - 2)} ${number(
        bleed + trim.heightMm,
      )}H ${number(bleed)} M ${number(bleed + trim.widthMm)} ${number(
        bleed + trim.heightMm,
      )}V ${number(bleed + trim.heightMm + 2)} M ${number(bleed + trim.widthMm)} ${number(
        bleed + trim.heightMm,
      )}H ${number(bleed + trim.widthMm + 2)}" fill="none" stroke="#555" stroke-width="0.25"/>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${number(output.widthMm)}mm" height="${number(
    output.heightMm,
  )}mm" viewBox="0 0 ${number(output.widthMm)} ${number(
    output.heightMm,
  )}" role="img" aria-label="${escapeXml(document.title)}">
  <defs><style>${fontCss}</style></defs>
  <rect width="${number(output.widthMm)}" height="${number(output.heightMm)}" fill="#fffdf8"/>
  <rect x="${number(bleed + 4)}" y="${number(bleed + 4)}" width="${number(
    trim.widthMm - 8,
  )}" height="${number(trim.heightMm - 8)}" fill="none" stroke="#aa8749" stroke-width="1"/>
  <g id="connections">${connections.join('')}</g>
  <g id="people">${people.join('')}</g>
  <g id="free-text">${freeText.join('')}</g>
  ${cropMarks}
</svg>`;
}
