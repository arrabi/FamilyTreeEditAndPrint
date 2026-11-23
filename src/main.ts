import './style.css';
import '@fontsource/noto-naskh-arabic/400.css';
import { createExport, downloadBlob, type ExportFormat } from './export/index.ts';
import { fictionalPoster } from './export/sample.ts';
import { renderSvg } from './export/svg.ts';
import { showScreen } from './screen.ts';

const setup = document.querySelector<HTMLElement>('#setup');
const editor = document.querySelector<HTMLElement>('#editor');
const openEditor = document.querySelector<HTMLButtonElement>('#open-editor');
const backToSetup = document.querySelector<HTMLButtonElement>('#back-to-setup');
const preview = document.querySelector<HTMLElement>('#poster-preview');
const exportDialog = document.querySelector<HTMLDialogElement>('#export-dialog');
const openExport = document.querySelector<HTMLButtonElement>('#open-export');
const cancelExport = document.querySelector<HTMLButtonElement>('#cancel-export');
const downloadExport = document.querySelector<HTMLButtonElement>('#download-export');
const exportStatus = document.querySelector<HTMLElement>('#export-status');
const dpiOptions = document.querySelector<HTMLElement>('#dpi-options');
const bleed = document.querySelector<HTMLInputElement>('#bleed');
const cropMarks = document.querySelector<HTMLInputElement>('#crop-marks');
const dpi = document.querySelector<HTMLSelectElement>('#dpi');

if (preview) preview.innerHTML = renderSvg(fictionalPoster);

if (setup && editor && openEditor && backToSetup) {
  openEditor.addEventListener('click', () => {
    showScreen('editor', setup, editor);
    backToSetup.focus();
  });
  backToSetup.addEventListener('click', () => {
    showScreen('setup', setup, editor);
    openEditor.focus();
  });
}

function selectedFormat(): ExportFormat {
  return document.querySelector<HTMLInputElement>('input[name="format"]:checked')?.value as ExportFormat;
}

function updateFormatUi(): void {
  const format = selectedFormat();
  document.querySelectorAll<HTMLElement>('.format-option').forEach((option) => {
    option.classList.toggle('selected', option.querySelector<HTMLInputElement>('input')?.checked ?? false);
  });
  if (dpiOptions) dpiOptions.hidden = format !== 'png';
  if (downloadExport) downloadExport.textContent = `Export ${format.toUpperCase()}`;
}

openExport?.addEventListener('click', () => {
  updateFormatUi();
  exportDialog?.showModal();
});
cancelExport?.addEventListener('click', () => exportDialog?.close());
document.querySelectorAll<HTMLInputElement>('input[name="format"]').forEach((input) => {
  input.addEventListener('change', updateFormatUi);
});
downloadExport?.addEventListener('click', async () => {
  if (!downloadExport || !exportStatus) return;
  const format = selectedFormat();
  const settings = structuredClone(fictionalPoster);
  settings.page.bleedMm = bleed?.checked ? 3 : 0;
  settings.page.cropMarks = cropMarks?.checked ?? true;
  downloadExport.disabled = true;
  exportStatus.textContent = `Preparing ${format.toUpperCase()}…`;
  try {
    const blob = await createExport(settings, { format, dpi: Number(dpi?.value ?? 300) });
    downloadBlob(blob, `haddad-family-a3-landscape.${format}`);
    exportStatus.textContent = `${format.toUpperCase()} is ready.`;
  } catch (error) {
    exportStatus.textContent = error instanceof Error ? error.message : 'Export failed.';
  } finally {
    downloadExport.disabled = false;
  }
});
