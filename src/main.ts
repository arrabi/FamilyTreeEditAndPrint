import './style.css';
import { detectAndParseTree, TreeParseError } from './import/parse-tree';
import { displayPersonName, selectDescendants } from './import/select-descendants';
import type { ChartSelection, FamilyTree, NameDisplay } from './model/tree';
import { showScreen } from './screen';

const setup = document.querySelector<HTMLElement>('#setup');
const editor = document.querySelector<HTMLElement>('#editor');
const form = document.querySelector<HTMLFormElement>('#chart-form');
const fileInput = document.querySelector<HTMLInputElement>('#tree-file');
const dropArea = document.querySelector<HTMLElement>('#drop-area');
const sampleButton = document.querySelector<HTMLButtonElement>('#load-sample');
const status = document.querySelector<HTMLElement>('#file-status');
const rootSelect = document.querySelector<HTMLSelectElement>('#root-person');
const generationInput = document.querySelector<HTMLInputElement>('#generation-count');
const generationOutput = document.querySelector<HTMLOutputElement>('#generation-output');
const selectionSummary = document.querySelector<HTMLElement>('#selection-summary');
const openEditor = document.querySelector<HTMLButtonElement>('#open-editor');
const backToSetup = document.querySelector<HTMLButtonElement>('#back-to-setup');
const posterPreview = document.querySelector<HTMLElement>('#poster-preview');
const nameInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="name-display"]'));

let tree: FamilyTree | undefined;
let sourceName = '';

function selectedNameDisplay(): NameDisplay {
  return (nameInputs.find((input) => input.checked)?.value ?? 'both') as NameDisplay;
}

function currentSelection(): ChartSelection | undefined {
  if (!tree || !rootSelect?.value || !generationInput) return undefined;
  return {
    rootId: rootSelect.value,
    generations: Number(generationInput.value),
    nameDisplay: selectedNameDisplay(),
  };
}

function updateSelection(): void {
  if (!tree || !generationOutput || !selectionSummary) return;
  const selection = currentSelection();
  if (!selection) return;
  const selected = selectDescendants(tree, selection);
  const unit = selection.generations === 1 ? 'generation' : 'generations';
  generationOutput.value = `${selection.generations} ${unit} · ${selected.length} people`;
  const root = tree.people.find((person) => person.id === selection.rootId);
  selectionSummary.textContent = `Starting with ${root ? displayPersonName(root, selection.nameDisplay).join(' · ') : selection.rootId}.`;
}

function setControlsEnabled(enabled: boolean): void {
  if (rootSelect) rootSelect.disabled = !enabled;
  if (generationInput) generationInput.disabled = !enabled;
  if (openEditor) openEditor.disabled = !enabled;
  for (const input of nameInputs) input.disabled = !enabled;
}

function showTree(nextTree: FamilyTree, name: string, format: string): void {
  tree = nextTree;
  sourceName = name;
  if (!rootSelect || !status) return;
  rootSelect.replaceChildren();
  for (const person of nextTree.people) {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = [...new Set(displayPersonName(person, 'both'))].join(' · ');
    rootSelect.append(option);
  }
  rootSelect.value = nextTree.people[0].id;
  setControlsEnabled(true);
  status.className = 'file-status loaded';
  status.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = `✓ ${name}`;
  const detail = document.createElement('p');
  detail.className = 'muted';
  const familyCount = nextTree.families.length;
  detail.textContent = `${nextTree.people.length} people · ${familyCount} families · ${format.toUpperCase()}`;
  status.append(heading, detail);
  updateSelection();
}

function showParseError(error: unknown, name: string): void {
  if (!status) return;
  tree = undefined;
  setControlsEnabled(false);
  status.className = 'file-status error';
  status.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = `Could not open ${name}`;
  const detail = document.createElement('p');
  detail.textContent = error instanceof TreeParseError ? error.message : 'The file could not be read. Choose another file and try again.';
  status.append(heading, detail);
}

async function importText(text: string, name: string): Promise<void> {
  try {
    const parsed = detectAndParseTree(text, name);
    showTree(parsed.tree, name, parsed.format);
  } catch (error) {
    showParseError(error, name);
  }
}

async function importFile(file: File): Promise<void> {
  try {
    await importText(await file.text(), file.name);
  } catch (error) {
    showParseError(error, file.name);
  }
}

fileInput?.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void importFile(file);
});

for (const eventName of ['dragenter', 'dragover']) {
  dropArea?.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropArea.classList.add('dragging');
  });
}
for (const eventName of ['dragleave', 'drop']) {
  dropArea?.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropArea.classList.remove('dragging');
  });
}
dropArea?.addEventListener('drop', (event) => {
  const file = event.dataTransfer?.files[0];
  if (file) void importFile(file);
});

sampleButton?.addEventListener('click', async () => {
  try {
    const response = await fetch('./fixtures/haddad-family.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await importText(await response.text(), 'Haddad sample family');
  } catch (error) {
    showParseError(error, 'Haddad sample family');
  }
});

rootSelect?.addEventListener('change', updateSelection);
generationInput?.addEventListener('input', updateSelection);
for (const input of nameInputs) input.addEventListener('change', updateSelection);

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const selection = currentSelection();
  if (!tree || !selection || !posterPreview || !setup || !editor) return;
  const selected = selectDescendants(tree, selection);
  const content = document.createElement('div');
  content.className = 'poster-content';
  const title = document.createElement('h2');
  title.textContent = sourceName;
  content.append(title);
  for (let generation = 1; generation <= selection.generations; generation += 1) {
    const row = document.createElement('div');
    row.className = 'poster-generation';
    row.setAttribute('aria-label', `Generation ${generation}`);
    for (const entry of selected.filter((candidate) => candidate.generation === generation)) {
      const person = document.createElement('div');
      person.className = 'person-card';
      for (const name of displayPersonName(entry.person, selection.nameDisplay)) {
        const line = document.createElement('span');
        line.dir = /[\u0600-\u06ff]/u.test(name) ? 'rtl' : 'ltr';
        line.textContent = name;
        person.append(line);
      }
      row.append(person);
    }
    content.append(row);
  }
  posterPreview.replaceChildren(content);
  showScreen('editor', setup, editor);
  backToSetup?.focus();
});

backToSetup?.addEventListener('click', () => {
  if (!setup || !editor) return;
  showScreen('setup', setup, editor);
  openEditor?.focus();
});
