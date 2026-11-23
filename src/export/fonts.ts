import arabicFontUrl from '@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-400-normal.woff2?url';
import latinFontUrl from '@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-latin-400-normal.woff2?url';
import type { SvgFont } from './svg.ts';

export interface ExportFonts {
  arabic: Uint8Array;
  latin: Uint8Array;
  svg: SvgFont[];
}

async function loadFont(url: string): Promise<{ bytes: Uint8Array; dataUrl: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load embedded font (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { bytes, dataUrl: `data:font/woff2;base64,${btoa(binary)}` };
}

let fontsPromise: Promise<ExportFonts> | undefined;

export function loadExportFonts(): Promise<ExportFonts> {
  fontsPromise ??= Promise.all([loadFont(arabicFontUrl), loadFont(latinFontUrl)]).then(
    ([arabic, latin]) => ({
      arabic: arabic.bytes,
      latin: latin.bytes,
      svg: [
        {
          family: 'Noto Naskh Arabic',
          dataUrl: arabic.dataUrl,
          unicodeRange: 'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF',
        },
        {
          family: 'Noto Naskh Arabic',
          dataUrl: latin.dataUrl,
          unicodeRange: 'U+0000-02FF,U+1E00-1EFF,U+2000-206F,U+20A0-20CF',
        },
      ],
    }),
  );
  return fontsPromise;
}
