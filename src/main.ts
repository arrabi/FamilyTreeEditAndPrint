import './style.css';
import {
  ProjectFileError,
  createEmptyProject,
  parseProject,
  serializeProject,
  type ProjectV1,
} from './project';
import { showScreen } from './screen';

const setup = document.querySelector<HTMLElement>('#setup');
const editor = document.querySelector<HTMLElement>('#editor');
const openEditor = document.querySelector<HTMLButtonElement>('#open-editor');
const backToSetup = document.querySelector<HTMLButtonElement>('#back-to-setup');
const openProject = document.querySelector<HTMLButtonElement>('#open-project');
const saveProject = document.querySelector<HTMLButtonElement>('#save-project');
const projectFile = document.querySelector<HTMLInputElement>('#project-file');
const fileStatus = document.querySelector<HTMLElement>('#file-status');
const pageLabel = document.querySelector<HTMLElement>('#page-label');
const posterTitle = document.querySelector<HTMLElement>('#poster-title');
const posterSummary = document.querySelector<HTMLElement>('#poster-summary');
const pageDetails = document.querySelector<HTMLElement>('#page-details');
const styleDetails = document.querySelector<HTMLElement>('#style-details');
const layoutDetails = document.querySelector<HTMLElement>('#layout-details');

let project = createEmptyProject();

function renderProject(current: ProjectV1): void {
  if (pageLabel) {
    pageLabel.textContent = `${current.page.paper} ${current.page.orientation} · preview`;
  }
  if (pageDetails) {
    pageDetails.textContent =
      `${current.page.paper} ${current.page.orientation} · ` +
      `${current.page.widthMm} × ${current.page.heightMm} mm`;
  }
  if (styleDetails) {
    const theme =
      typeof current.style.theme === 'string'
        ? current.style.theme
        : 'custom';
    styleDetails.textContent = `${current.style.chart} · ${theme}`;
  }
  if (layoutDetails) {
    layoutDetails.textContent =
      `${Object.keys(current.positions).length} positioned · ` +
      `${current.hiddenItemIds.length} hidden`;
  }
  if (posterSummary) {
    const visible = current.tree.people.length - current.hiddenItemIds.length;
    posterSummary.textContent =
      `${visible} visible ${visible === 1 ? 'person' : 'people'} · ` +
      `${current.posterContent.length} added ${current.posterContent.length === 1 ? 'item' : 'items'}`;
  }
  if (posterTitle) {
    const title = current.posterContent.find(
      (item) => item.type === 'text' && typeof item.text === 'string',
    );
    posterTitle.textContent =
      title && typeof title.text === 'string' ? title.text : 'Your poster';
  }
}

renderProject(project);

if (setup && editor && openEditor && backToSetup && openProject && saveProject && projectFile) {
  openEditor.addEventListener('click', () => {
    showScreen('editor', setup, editor);
    backToSetup.focus();
  });
  backToSetup.addEventListener('click', () => {
    showScreen('setup', setup, editor);
    openEditor.focus();
  });
  openProject.addEventListener('click', () => projectFile.click());
  projectFile.addEventListener('change', async () => {
    const file = projectFile.files?.[0];
    if (!file) return;
    try {
      const opened = parseProject(await file.text());
      project = opened;
      renderProject(project);
      if (fileStatus) fileStatus.textContent = `Opened ${file.name}.`;
      showScreen('editor', setup, editor);
      saveProject.focus();
    } catch (error) {
      const message =
        error instanceof ProjectFileError ? error.message : 'The project could not be opened.';
      if (fileStatus) {
        fileStatus.textContent = `Could not open ${file.name}: ${message}`;
      }
    } finally {
      projectFile.value = '';
    }
  });
  saveProject.addEventListener('click', () => {
    const blob = new Blob([serializeProject(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'family-tree-poster.ftep.json';
    link.click();
    URL.revokeObjectURL(url);
  });
}
