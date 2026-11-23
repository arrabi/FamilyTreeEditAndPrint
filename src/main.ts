import './style.css';
import { showScreen } from './screen';
import {
  type Person,
  type PosterProject,
  renderPosterSvg,
  setBranchHidden,
  setDisplayText,
  setPersonHidden,
} from './poster';

const setup = document.querySelector<HTMLElement>('#setup');
const editor = document.querySelector<HTMLElement>('#editor');
const openEditor = document.querySelector<HTMLButtonElement>('#open-editor');
const backToSetup = document.querySelector<HTMLButtonElement>('#back-to-setup');
const peopleList = document.querySelector<HTMLElement>('#people-list');
const posterPreview = document.querySelector<HTMLElement>('#poster-preview');
const sourceName = document.querySelector<HTMLElement>('#source-name');
const displayText = document.querySelector<HTMLInputElement>('#display-text');
const personHidden = document.querySelector<HTMLInputElement>('#person-hidden');
const toggleBranch = document.querySelector<HTMLButtonElement>('#toggle-branch');
const exportSvg = document.querySelector<HTMLButtonElement>('#export-svg');

const samplePeople: readonly Person[] = [
  { id: 'amina', sourceName: 'أمينة حداد · Amina Haddad' },
  { id: 'sami', sourceName: 'سامي حداد · Sami Haddad', parentId: 'amina' },
  { id: 'lina', sourceName: 'لينا حداد · Lina Haddad', parentId: 'amina' },
  { id: 'noura', sourceName: 'نورة حداد · Noura Haddad', parentId: 'sami' },
  { id: 'rami', sourceName: 'رامي حداد · Rami Haddad', parentId: 'sami' },
  { id: 'yasmin', sourceName: 'ياسمين حداد · Yasmin Haddad', parentId: 'lina' },
];

let project: PosterProject = { people: samplePeople, presentation: {} };
let selectedId = samplePeople[0]?.id ?? '';

function selectedPerson(): Person | undefined {
  return project.people.find((person) => person.id === selectedId);
}

function renderEditor(): void {
  if (!peopleList || !posterPreview || !sourceName || !displayText || !personHidden || !toggleBranch) {
    return;
  }

  peopleList.replaceChildren(...project.people.map((person) => {
    const button = document.createElement('button');
    const hidden = project.presentation[person.id]?.hidden ?? false;
    button.type = 'button';
    button.className = `person-list-item${selectedId === person.id ? ' selected' : ''}${hidden ? ' hidden-person' : ''}`;
    button.textContent = project.presentation[person.id]?.displayText ?? person.sourceName;
    button.setAttribute('aria-pressed', String(selectedId === person.id));
    button.dataset.personId = person.id;
    button.title = hidden ? 'Hidden from poster; select to show' : 'Visible on poster';
    return button;
  }));

  posterPreview.innerHTML = renderPosterSvg(project);
  const person = selectedPerson();
  const presentation = project.presentation[selectedId];
  sourceName.textContent = person?.sourceName ?? 'No person selected';
  displayText.value = presentation?.displayText ?? '';
  personHidden.checked = presentation?.hidden ?? false;
  toggleBranch.textContent = presentation?.hidden ? 'Show this branch' : 'Hide this branch';
}

peopleList?.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-person-id]');
  if (!target?.dataset.personId) {
    return;
  }
  selectedId = target.dataset.personId;
  renderEditor();
});

displayText?.addEventListener('input', () => {
  project = setDisplayText(project, selectedId, displayText.value);
  renderEditor();
  displayText.focus();
});

personHidden?.addEventListener('change', () => {
  project = setPersonHidden(project, selectedId, personHidden.checked);
  renderEditor();
});

toggleBranch?.addEventListener('click', () => {
  const hidden = project.presentation[selectedId]?.hidden ?? false;
  project = setBranchHidden(project, selectedId, !hidden);
  renderEditor();
});

exportSvg?.addEventListener('click', () => {
  const svg = renderPosterSvg(project);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  link.download = 'family-tree-poster.svg';
  link.click();
  URL.revokeObjectURL(link.href);
});

if (setup && editor && openEditor && backToSetup) {
  renderEditor();
  openEditor.addEventListener('click', () => {
    showScreen('editor', setup, editor);
    backToSetup.focus();
  });
  backToSetup.addEventListener('click', () => {
    showScreen('setup', setup, editor);
    openEditor.focus();
  });
}
