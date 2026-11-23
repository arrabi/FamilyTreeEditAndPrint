import { compactTreeLayout, fitTree } from '../layout/compact-tree';
import { pageGeometry, type PageGeometry, type PageSettings } from '../model/page';
import type { Person } from '../model/tree';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface PreviewResult {
  geometry: PageGeometry;
  scale: number;
  fontSize: number;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

export function renderPagePreview(
  container: HTMLElement,
  people: readonly Person[],
  settings: PageSettings,
): PreviewResult {
  const geometry = pageGeometry(settings);
  const layout = compactTreeLayout(people);
  const fit = fitTree(layout, geometry.safe, geometry.safe);
  const svg = svgElement('svg', {
    class: 'page-svg',
    viewBox: `0 0 ${geometry.width} ${geometry.height}`,
    role: 'img',
    'aria-label': `${settings.paperSize} ${settings.orientation} family tree page`,
    'preserveAspectRatio': 'xMidYMid meet',
  });

  if (geometry.bleed > 0) {
    svg.append(svgElement('rect', {
      class: 'bleed-guide',
      x: 0,
      y: 0,
      width: geometry.width,
      height: geometry.height,
    }));
  }
  svg.append(
    svgElement('rect', {
      class: 'paper',
      ...geometry.trim,
    }),
    svgElement('rect', {
      class: 'safe-guide',
      ...geometry.safe,
    }),
  );

  const tree = svgElement('g', {
    class: 'tree-preview',
    transform: `translate(${fit.x} ${fit.y}) scale(${fit.scale})`,
  });
  const boxesById = new Map(layout.boxes.map((box) => [box.person.id, box]));
  for (const box of layout.boxes) {
    if (!box.person.parentId) continue;
    const parent = boxesById.get(box.person.parentId);
    if (!parent) continue;
    const startX = parent.x + parent.width;
    const startY = parent.y + parent.height / 2;
    const endX = box.x;
    const endY = box.y + box.height / 2;
    const bendX = startX + (endX - startX) / 2;
    tree.append(svgElement('path', {
      class: 'connector',
      d: `M ${startX} ${startY} C ${bendX} ${startY}, ${bendX} ${endY}, ${endX} ${endY}`,
    }));
  }

  for (const box of layout.boxes) {
    const group = svgElement('g', {
      class: 'person-node',
      transform: `translate(${box.x} ${box.y})`,
    });
    group.append(svgElement('rect', { width: box.width, height: box.height, rx: 1.1 }));
    const text = svgElement('text', {
      x: box.width / 2,
      y: box.height / 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      'font-size': 2.1,
      dir: 'auto',
    });
    text.textContent = box.person.name;
    group.append(text);
    tree.append(group);
  }
  svg.append(tree);
  container.replaceChildren(svg);
  container.style.aspectRatio = `${geometry.width} / ${geometry.height}`;

  return { geometry, scale: fit.scale, fontSize: fit.fontSize };
}
