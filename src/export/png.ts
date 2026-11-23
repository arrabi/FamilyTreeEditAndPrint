const chunkTypeLength = 4;
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

export function pixelsForMm(millimetres: number, dpi: number): number {
  if (!Number.isFinite(dpi) || dpi <= 0) throw new RangeError('DPI must be a positive number');
  return Math.round((millimetres / 25.4) * dpi);
}

export async function setPngResolution(blob: Blob, dpi: number): Promise<Blob> {
  if (!Number.isFinite(dpi) || dpi <= 0) throw new RangeError('DPI must be a positive number');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (
    bytes.length < 33 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    throw new TypeError('Expected a PNG image');
  }

  const parts: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;
  let addedResolution = false;
  const resolutionChunk = (): Uint8Array => {
    const data = new Uint8Array(9);
    const dataView = new DataView(data.buffer);
    const pixelsPerMetre = Math.round(dpi / 0.0254);
    dataView.setUint32(0, pixelsPerMetre);
    dataView.setUint32(4, pixelsPerMetre);
    data[8] = 1;
    return pngChunk('pHYs', data);
  };
  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0);
    const type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
    const end = offset + 12 + length;
    if (type === 'pHYs') {
      offset = end;
      continue;
    }
    if (type === 'IDAT' && !addedResolution) {
      parts.push(resolutionChunk());
      addedResolution = true;
    }
    if (type === 'IEND') {
      if (!addedResolution) parts.push(resolutionChunk());
      parts.push(bytes.subarray(offset, end));
      break;
    }
    parts.push(bytes.subarray(offset, end));
    offset = end;
  }

  return new Blob(parts as BlobPart[], { type: 'image/png' });
}

export async function svgToPng(svg: string, widthMm: number, heightMm: number, dpi = 300): Promise<Blob> {
  const image = new Image();
  const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not render the poster SVG'));
      image.src = source;
    });
    const canvas = document.createElement('canvas');
    canvas.width = pixelsForMm(widthMm, dpi);
    canvas.height = pixelsForMm(heightMm, dpi);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas export is unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Could not encode PNG'))), 'image/png'),
    );
    return setPngResolution(blob, dpi);
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function pngChunkTypeCount(blobBytes: Uint8Array, requestedType: string): number {
  let count = 0;
  let offset = 8;
  while (offset + chunkTypeLength * 2 < blobBytes.length) {
    const length = new DataView(blobBytes.buffer, blobBytes.byteOffset + offset).getUint32(0);
    const type = new TextDecoder().decode(blobBytes.subarray(offset + 4, offset + 8));
    if (type === requestedType) count += 1;
    offset += length + 12;
  }
  return count;
}
