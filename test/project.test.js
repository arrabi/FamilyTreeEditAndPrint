import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ProjectFileError,
  createEmptyProject,
  parseProject,
  serializeProject,
} from '../src/project.ts';

function completeProject() {
  const project = createEmptyProject();
  project.tree = {
    people: [{ id: 'amina', displayName: 'أمينة', birthYear: 1940 }],
    relationships: [{ id: 'amina-child', type: 'parent-child', from: 'amina', to: 'sara' }],
    source: 'fictional-test-data',
  };
  project.positions = { amina: { x: 120.5, y: 80, rotation: 3 } };
  project.hiddenItemIds = ['sara'];
  project.displayOverrides = { amina: { displayName: 'Amina' } };
  project.style = { chart: 'leaf', theme: { name: 'autumn' } };
  project.posterContent = [
    { id: 'title', type: 'text', x: 10, y: 12, width: 80, height: 20, text: 'عائلة الحلواني' },
  ];
  return project;
}

test('project files round-trip every editable state category', () => {
  const project = completeProject();
  assert.deepEqual(parseProject(serializeProject(project)), project);
});

test('invalid JSON reports a clear project error', () => {
  assert.throws(() => parseProject('{not json'), {
    name: 'ProjectFileError',
    message: 'The project file is not valid JSON.',
  });
});

test('rejects files with the wrong format or an unsupported version', () => {
  const project = completeProject();
  assert.throws(() => parseProject(JSON.stringify({ ...project, format: 'other' })), ProjectFileError);
  assert.throws(
    () => parseProject(JSON.stringify({ ...project, version: 99 })),
    /Unsupported project version: 99/,
  );
});

test('rejects missing and invalid editable state', () => {
  const project = completeProject();
  delete project.page;
  assert.throws(() => serializeProject(project), /page must be an object/);

  const invalidPosition = completeProject();
  invalidPosition.positions.amina.x = Number.POSITIVE_INFINITY;
  assert.throws(() => serializeProject(invalidPosition), /must be a finite number/);
});
