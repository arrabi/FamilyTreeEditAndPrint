import './style.css';
import { renderPagePreview } from './editor/page-preview';
import type { PageSettings, PaperSize } from './model/page';
import { fictionalFiveGenerationTree } from './model/tree';
import { showScreen } from './screen';

const setup = document.querySelector<HTMLElement>('#setup');
const editor = document.querySelector<HTMLElement>('#editor');
const openEditor = document.querySelector<HTMLButtonElement>('#open-editor');
const backToSetup = document.querySelector<HTMLButtonElement>('#back-to-setup');
const pagePreview = document.querySelector<HTMLElement>('#page-preview');
const pageSummary = document.querySelector<HTMLElement>('#page-summary');
const fitStatus = document.querySelector<HTMLElement>('#fit-status');
const fitAgain = document.querySelector<HTMLButtonElement>('#fit-again');
const paperSize = document.querySelector<HTMLSelectElement>('#paper-size');
const orientation = document.querySelector<HTMLSelectElement>('#orientation');
const customFields = document.querySelector<HTMLElement>('#custom-size');
const customWidth = document.querySelector<HTMLInputElement>('#custom-width');
const customHeight = document.querySelector<HTMLInputElement>('#custom-height');
const bleedEnabled = document.querySelector<HTMLInputElement>('#bleed-enabled');
const bleed = document.querySelector<HTMLInputElement>('#bleed');
const marginInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-margin]'));
const pageError = document.querySelector<HTMLElement>('#page-error');
const sample = fictionalFiveGenerationTree();

function numberValue(input: HTMLInputElement | null, fallback: number): number {
  const value = input ? Number(input.value) : fallback;
  return Number.isFinite(value) ? value : fallback;
}

function readPageSettings(): PageSettings {
  const margins = { top: 12, right: 12, bottom: 12, left: 12 };
  for (const input of marginInputs) {
    margins[input.dataset.margin as keyof typeof margins] = numberValue(input, 12);
  }
  return {
    paperSize: (paperSize?.value ?? 'A3') as PaperSize,
    orientation: orientation?.value === 'portrait' ? 'portrait' : 'landscape',
    customWidth: numberValue(customWidth, 297),
    customHeight: numberValue(customHeight, 420),
    margins,
    bleed: bleedEnabled?.checked ? numberValue(bleed, 0) : 0,
  };
}

function renderTreePage(): void {
  if (!pagePreview || !pageSummary || !fitStatus || !pageError) return;
  try {
    const settings = readPageSettings();
    const result = renderPagePreview(pagePreview, sample, settings);
    pageSummary.textContent =
      `${settings.paperSize} ${settings.orientation} · ` +
      `${result.geometry.trimWidth} × ${result.geometry.trimHeight} mm trim` +
      (result.geometry.bleed ? ` · ${result.geometry.bleed} mm bleed` : '');
    fitStatus.textContent =
      `146 people · 5 generations · ${Math.round(result.scale * 100)}% · ` +
      `${result.fontSize.toFixed(1)} mm type`;
    pageError.textContent = '';
  } catch (error) {
    pageError.textContent = error instanceof Error ? error.message : 'Invalid page settings.';
  }
}

function updatePageControls(): void {
  if (customFields) customFields.hidden = paperSize?.value !== 'Custom';
  if (bleed) bleed.disabled = !bleedEnabled?.checked;
  renderTreePage();
}

if (setup && editor && openEditor && backToSetup) {
  openEditor.addEventListener('click', () => {
    showScreen('editor', setup, editor);
    renderTreePage();
    backToSetup.focus();
  });
  backToSetup.addEventListener('click', () => {
    showScreen('setup', setup, editor);
    openEditor.focus();
  });
}

for (const control of Array.from(
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-page-setting]'),
)) {
  control.addEventListener('input', updatePageControls);
}
fitAgain?.addEventListener('click', renderTreePage);
updatePageControls();
