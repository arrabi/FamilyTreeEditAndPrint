import { Canvas, Textbox } from 'fabric';
import Konva from 'konva';
import { exportPdf } from './pdf-export';
import {
  createSpikeTexts,
  SPIKE_PAGE,
  type SpikeText,
} from './spike-model';

type Renderer = 'konva' | 'fabric';

let initialized = false;

function setStatus(message: string): void {
  const status = document.querySelector<HTMLElement>('#spike-status');
  if (status) status.textContent = message;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing spike element: ${selector}`);
  return element;
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadFont(): Promise<ArrayBuffer> {
  const response = await fetch('./fonts/NotoNaskhArabic-Regular.ttf');
  if (!response.ok) throw new Error(`Could not load embedded font (${response.status})`);
  return response.arrayBuffer();
}

function toBase64(bytes: ArrayBuffer): string {
  const data = new Uint8Array(bytes);
  let binary = '';
  for (let offset = 0; offset < data.length; offset += 16_384) {
    binary += String.fromCharCode(...data.subarray(offset, offset + 16_384));
  }
  return btoa(binary);
}

function embedFontInSvg(svg: string, fontBytes: ArrayBuffer): string {
  const fontFace = `<defs><style>@font-face{font-family:'Noto Naskh Arabic';src:url(data:font/ttf;base64,${toBase64(fontBytes)}) format('truetype');font-weight:400}</style></defs>`;
  return svg.replace(/(<svg[^>]*>)/, `$1${fontFace}`);
}

function createKonva(items: SpikeText[]): () => SpikeText[] {
  const stage = new Konva.Stage({
    container: 'konva-canvas',
    width: SPIKE_PAGE.width,
    height: SPIKE_PAGE.height,
  });
  const layer = new Konva.Layer();
  layer.add(new Konva.Rect({
    width: SPIKE_PAGE.width,
    height: SPIKE_PAGE.height,
    fill: '#fffdf8',
    stroke: '#b7a36b',
    strokeWidth: 2,
  }));
  const textNodes = items.map((item) => new Konva.Text({
    id: item.id,
    text: item.text,
    x: item.x,
    y: item.y,
    width: item.width,
    fontFamily: 'Noto Naskh Arabic',
    fontSize: item.fontSize,
    fill: '#242321',
    direction: item.direction,
    align: item.direction === 'rtl' ? 'right' : 'left',
    draggable: true,
  }));
  textNodes.forEach((node) => layer.add(node));
  stage.add(layer);

  return () => items.map((item) => {
    const node = stage.findOne<Konva.Text>(`#${item.id}`);
    return {
      ...item,
      x: node?.x() ?? item.x,
      y: node?.y() ?? item.y,
    };
  });
}

function createFabric(items: SpikeText[]): {
  getItems: () => SpikeText[];
  toSvg: () => string;
} {
  const canvas = new Canvas('fabric-canvas', {
    width: SPIKE_PAGE.width,
    height: SPIKE_PAGE.height,
    backgroundColor: '#fffdf8',
    selection: false,
  });
  const textObjects = items.map((item) => new Textbox(item.text, {
    left: item.x,
    top: item.y,
    width: item.width,
    fontFamily: 'Noto Naskh Arabic',
    fontSize: item.fontSize,
    fill: '#242321',
    direction: item.direction,
    textAlign: item.direction === 'rtl' ? 'right' : 'left',
    editable: false,
    selectable: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
  }));
  canvas.add(...textObjects);
  canvas.renderAll();

  return {
    getItems: () => items.map((item, index) => {
      const object = textObjects[index];
      return {
        ...item,
        x: object?.left ?? item.x,
        y: object?.top ?? item.y,
      };
    }),
    toSvg: () => canvas.toSVG(),
  };
}

export async function initializeSpike(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    const fontBytes = await loadFont();
    await document.fonts.load('24px "Noto Naskh Arabic"');

    const getKonvaItems = createKonva(createSpikeTexts());
    const fabric = createFabric(createSpikeTexts());

    const exportCurrent = async (renderer: Renderer) => {
      setStatus('Building an embedded-font vector PDF…');
      const blob = await exportPdf(
        renderer === 'konva' ? getKonvaItems() : fabric.getItems(),
        fontBytes,
      );
      download(blob, `family-tree-arabic-${renderer}-a3.pdf`);
      setStatus(`Downloaded ${renderer} PDF. Verify the 420 × 297 mm page at 400% zoom.`);
    };

    requireElement<HTMLButtonElement>('#export-konva-pdf').addEventListener(
      'click',
      () => void exportCurrent('konva'),
    );
    requireElement<HTMLButtonElement>('#export-fabric-pdf').addEventListener(
      'click',
      () => void exportCurrent('fabric'),
    );
    requireElement<HTMLButtonElement>('#export-fabric-svg').addEventListener(
      'click',
      () => {
        const svg = embedFontInSvg(fabric.toSvg(), fontBytes);
        download(new Blob([svg], { type: 'image/svg+xml' }), 'family-tree-arabic-fabric.svg');
        setStatus('Downloaded Fabric SVG with its font embedded and text kept editable.');
      },
    );
    requireElement<HTMLButtonElement>('#reset-spike').addEventListener(
      'click',
      () => window.location.reload(),
    );
    setStatus('Ready. Drag the fictional names, then export either canvas to A3 PDF.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'The spike could not be initialized.');
  }
}
