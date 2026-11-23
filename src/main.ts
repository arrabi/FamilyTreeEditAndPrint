import './style.css';
import { type ChartStyle, createSampleChart, movePerson, renderChartSvg } from './chart';
import { showScreen } from './screen';

const setup = document.querySelector<HTMLElement>('#setup');
const editor = document.querySelector<HTMLElement>('#editor');
const openEditor = document.querySelector<HTMLButtonElement>('#open-editor');
const backToSetup = document.querySelector<HTMLButtonElement>('#back-to-setup');
const poster = document.querySelector<HTMLElement>('#poster');
const stylePicker = document.querySelector<HTMLSelectElement>('#chart-style');
const resetPositions = document.querySelector<HTMLButtonElement>('#reset-positions');
const exportSvg = document.querySelector<HTMLButtonElement>('#export-svg');
let chart = createSampleChart();
let chartStyle: ChartStyle = 'classic';
let drag: { id: string; x: number; y: number } | null = null;

function renderPoster(): void {
  if (!poster) return;
  poster.innerHTML = renderChartSvg(chart, chartStyle);
  const vector = poster.querySelector('svg');
  vector?.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target.closest<SVGElement>('[data-person-id]') : null;
    const id = target?.dataset.personId;
    if (!id || !(event instanceof PointerEvent)) return;
    drag = { id, x: event.clientX, y: event.clientY };
    target.classList.add('dragging');
    event.preventDefault();
  });
}

document.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const svg = poster?.querySelector('svg');
  if (!svg) return;
  const bounds = svg.getBoundingClientRect();
  const delta = {
    x: (event.clientX - drag.x) * (1000 / bounds.width),
    y: (event.clientY - drag.y) * (707 / bounds.height),
  };
  chart = movePerson(chart, chartStyle, drag.id, delta);
  drag = { ...drag, x: event.clientX, y: event.clientY };
  renderPoster();
});

document.addEventListener('pointerup', () => {
  drag = null;
});

if (setup && editor && openEditor && backToSetup) {
  openEditor.addEventListener('click', () => {
    showScreen('editor', setup, editor);
    renderPoster();
    backToSetup.focus();
  });
  backToSetup.addEventListener('click', () => {
    showScreen('setup', setup, editor);
    openEditor.focus();
  });
}

stylePicker?.addEventListener('change', () => {
  chartStyle = stylePicker.value === 'leaf' ? 'leaf' : 'classic';
  renderPoster();
});

resetPositions?.addEventListener('click', () => {
  chart = { ...chart, positions: {} };
  renderPoster();
});

exportSvg?.addEventListener('click', () => {
  const source = renderChartSvg(chart, chartStyle);
  const styles = `<style>
    .paper{fill:#fffdf8}.poster-frame rect{fill:none;stroke:#b99a50;stroke-width:2}.box-link{fill:none;stroke:#89744b;stroke-width:2}.branch{fill:#a57a42}.box-person rect{fill:#fffdf5;stroke:#876c36;stroke-width:1.6}.person text{font-family:Arial,'Noto Naskh Arabic',sans-serif;font-size:11px;fill:#302b23;text-anchor:middle}.leaf-person text{text-anchor:end}.secondary-name{font-size:8px}.spouse{font-size:8px;fill:#776b58}.living-leaf{fill:#66864b}.deceased-leaf{fill:#c47b37}.poster-title{font-family:Arial,sans-serif;font-size:23px;fill:#302b23}.generation-count,.legend text{font-family:Arial,sans-serif;font-size:9px;fill:#6d6253}
  </style>`;
  const downloadable = source.replace(/(<svg[^>]*>)/, `$1${styles}`);
  const blob = new Blob([downloadable], { type: 'image/svg+xml;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `haddad-family-${chartStyle}.svg`;
  link.click();
  URL.revokeObjectURL(link.href);
});
