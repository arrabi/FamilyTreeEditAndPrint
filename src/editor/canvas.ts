import {
  cloneTree,
  connectorPath,
  demoTree,
  EditorHistory,
  movementIds,
  personContains,
  PERSON_HEIGHT,
  PERSON_WIDTH,
  snapTranslation,
  translatePeople,
  worldPoint,
  type AlignmentGuide,
  type MoveMode,
  type PersonTree,
  type Point,
} from './model';

const SVG_NS = 'http://www.w3.org/2000/svg';

function element<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

export function initEditor(root: HTMLElement): void {
  const canvasElement = root.querySelector<SVGSVGElement>('#tree-canvas');
  const stageElement = root.querySelector<SVGGElement>('#canvas-stage');
  const statusElement = root.querySelector<HTMLElement>('#selection-status');
  if (!canvasElement || !stageElement || !statusElement) return;
  const canvas = canvasElement;
  const stage = stageElement;
  const status = statusElement;

  let tree: PersonTree = cloneTree(demoTree);
  const history = new EditorHistory(tree);
  const selected = new Set<string>();
  let guides: AlignmentGuide[] = [];
  let mode: MoveMode = 'person';
  let scale = 0.7;
  let pan: Point = { x: 20, y: 20 };
  let drag:
    | { kind: 'move'; start: Point; ids: Set<string>; original: PersonTree }
    | { kind: 'pan'; start: Point; original: Point }
    | undefined;
  let spaceHeld = false;

  const zoomLabel = root.querySelector<HTMLElement>('#zoom-label');
  const undoButton = root.querySelector<HTMLButtonElement>('[data-action="undo"]');
  const redoButton = root.querySelector<HTMLButtonElement>('[data-action="redo"]');

  function draw(): void {
    stage.replaceChildren();
    stage.setAttribute('transform', `translate(${pan.x} ${pan.y}) scale(${scale})`);

    stage.append(element('rect', {
      class: 'poster-frame',
      width: tree.width,
      height: tree.height,
      x: 0,
      y: 0,
    }));
    stage.append(element('rect', {
      class: 'safe-area',
      width: tree.width - 48,
      height: tree.height - 48,
      x: 24,
      y: 24,
    }));

    const connectorLayer = element('g', { class: 'connectors' });
    for (const person of tree.people) {
      for (const parentId of person.parentIds) {
        const parent = tree.people.find((item) => item.id === parentId);
        if (!parent) continue;
        connectorLayer.append(element('path', {
          d: connectorPath(parent, person),
        }));
      }
    }
    stage.append(connectorLayer);

    for (const person of tree.people) {
      const couple = tree.people.find((item) => item.id === person.partnerId);
      if (couple && person.id < couple.id) {
        const x1 = person.x + PERSON_WIDTH;
        const x2 = couple.x;
        stage.append(element('path', {
          class: 'couple-link',
          d: `M ${x1} ${person.y + PERSON_HEIGHT / 2} H ${x2}`,
        }));
      }
      const group = element('g', {
        class: `person-card${selected.has(person.id) ? ' selected' : ''}`,
        'data-person-id': person.id,
      });
      group.append(element('rect', { x: person.x, y: person.y, width: PERSON_WIDTH, height: PERSON_HEIGHT, rx: 8 }));
      const name = element('text', {
        x: person.x + PERSON_WIDTH / 2,
        y: person.y + 21,
        class: 'person-name',
        'text-anchor': 'middle',
        direction: 'auto',
      });
      name.textContent = person.name;
      const detail = element('text', {
        x: person.x + PERSON_WIDTH / 2,
        y: person.y + 40,
        class: 'person-detail',
        'text-anchor': 'middle',
      });
      detail.textContent = person.detail;
      group.append(name, detail);
      stage.append(group);
    }

    for (const guide of guides) {
      stage.append(element('line', {
        class: 'alignment-guide',
        x1: guide.axis === 'x' ? guide.value : 0,
        x2: guide.axis === 'x' ? guide.value : tree.width,
        y1: guide.axis === 'y' ? guide.value : 0,
        y2: guide.axis === 'y' ? guide.value : tree.height,
      }));
    }

    const count = selected.size;
    status.textContent = count === 0
      ? 'Nothing selected'
      : `${count} ${count === 1 ? 'person' : 'people'} selected · moving ${mode}`;
    if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    if (undoButton) undoButton.disabled = !history.canUndo;
    if (redoButton) redoButton.disabled = !history.canRedo;
  }

  function fitPage(): void {
    const bounds = canvas.getBoundingClientRect();
    scale = Math.min((bounds.width - 32) / tree.width, (bounds.height - 32) / tree.height, 1);
    pan = {
      x: (bounds.width - tree.width * scale) / 2,
      y: (bounds.height - tree.height * scale) / 2,
    };
    draw();
  }

  function zoom(factor: number, point: Point): void {
    const nextScale = Math.min(2.5, Math.max(0.25, scale * factor));
    const world = worldPoint(point.x, point.y, canvas.getBoundingClientRect(), pan, scale);
    pan = { x: point.x - canvas.getBoundingClientRect().left - world.x * nextScale, y: point.y - canvas.getBoundingClientRect().top - world.y * nextScale };
    scale = nextScale;
    draw();
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button === 1 || spaceHeld) {
      drag = { kind: 'pan', start: { x: event.clientX, y: event.clientY }, original: { ...pan } };
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    const point = worldPoint(event.clientX, event.clientY, canvas.getBoundingClientRect(), pan, scale);
    const person = tree.people.find((item) => personContains(item, point));
    if (!person) {
      if (!event.shiftKey) selected.clear();
      drag = { kind: 'pan', start: { x: event.clientX, y: event.clientY }, original: { ...pan } };
    } else {
      if (event.shiftKey) {
        if (selected.has(person.id)) selected.delete(person.id);
        else selected.add(person.id);
      } else if (!selected.has(person.id)) {
        selected.clear();
        selected.add(person.id);
      }
      const ids = movementIds(tree.people, selected, mode);
      drag = { kind: 'move', start: point, ids, original: cloneTree(tree) };
    }
    canvas.setPointerCapture(event.pointerId);
    draw();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    if (drag.kind === 'pan') {
      pan = {
        x: drag.original.x + event.clientX - drag.start.x,
        y: drag.original.y + event.clientY - drag.start.y,
      };
      draw();
      return;
    }
    const point = worldPoint(event.clientX, event.clientY, canvas.getBoundingClientRect(), pan, scale);
    const snapped = snapTranslation(
      drag.original.people,
      drag.ids,
      point.x - drag.start.x,
      point.y - drag.start.y,
    );
    tree = {
      ...drag.original,
      people: translatePeople(drag.original.people, drag.ids, snapped.dx, snapped.dy),
    };
    guides = snapped.guides;
    draw();
  });

  const endDrag = (): void => {
    if (drag?.kind === 'move') history.push(tree);
    drag = undefined;
    guides = [];
    draw();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1, { x: event.clientX, y: event.clientY });
  }, { passive: false });

  root.querySelectorAll<HTMLButtonElement>('[data-move-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      mode = button.dataset.moveMode as MoveMode;
      root.querySelectorAll('[data-move-mode]').forEach((item) => {
        item.toggleAttribute('data-active', item === button);
      });
      draw();
    });
  });
  root.querySelector('[data-action="undo"]')?.addEventListener('click', () => {
    const previous = history.undo();
    if (previous) {
      tree = previous;
      draw();
    }
  });
  root.querySelector('[data-action="redo"]')?.addEventListener('click', () => {
    const next = history.redo();
    if (next) {
      tree = next;
      draw();
    }
  });
  root.querySelector('[data-action="zoom-in"]')?.addEventListener('click', () => {
    const bounds = canvas.getBoundingClientRect();
    zoom(1.2, { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
  });
  root.querySelector('[data-action="zoom-out"]')?.addEventListener('click', () => {
    const bounds = canvas.getBoundingClientRect();
    zoom(1 / 1.2, { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
  });
  root.querySelector('[data-action="fit"]')?.addEventListener('click', fitPage);

  window.addEventListener('keydown', (event) => {
    if (root.hidden || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return;
    if (event.code === 'Space') spaceHeld = true;
    const direction = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    }[event.key];
    if (direction && selected.size > 0) {
      event.preventDefault();
      const distance = event.shiftKey ? 10 : 1;
      const ids = movementIds(tree.people, selected, mode);
      guides = [];
      tree = {
        ...tree,
        people: translatePeople(tree.people, ids, direction.x * distance, direction.y * distance),
      };
      history.push(tree);
      draw();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      const restored = event.shiftKey ? history.redo() : history.undo();
      if (restored) {
        tree = restored;
        draw();
      }
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') spaceHeld = false;
  });
  new ResizeObserver(fitPage).observe(canvas);
  requestAnimationFrame(fitPage);
}
