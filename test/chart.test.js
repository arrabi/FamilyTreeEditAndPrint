import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  chartPositions,
  createSampleChart,
  hasOverlappingClassicBoxes,
  movePerson,
  renderChartSvg,
} from '../src/chart.ts';

test('the fictional sample spans five generations and fits the classic page', () => {
  const chart = createSampleChart();
  const positions = chartPositions(chart, 'classic');

  assert.equal(chart.people.length, 15);
  assert.equal(new Set(chart.people.map((person) => generationsFromRoot(chart.people, person.id))).size, 5);
  assert.equal(hasOverlappingClassicBoxes(chart), false);
  for (const point of Object.values(positions)) {
    assert.ok(point.x > 62 && point.x < PAGE_WIDTH - 62);
    assert.ok(point.y > 22 && point.y < PAGE_HEIGHT - 22);
  }
});

test('leaf and classic SVG output preserve bilingual text and vector artwork', () => {
  const chart = createSampleChart();
  for (const style of ['classic', 'leaf']) {
    const svg = renderChartSvg(chart, style);
    assert.match(svg, /viewBox="0 0 1000 707"/);
    assert.match(svg, /يوسف حداد/);
    assert.match(svg, /Yusuf Haddad/);
    assert.doesNotMatch(svg, /<image/);
    assert.match(svg, /<path/);
  }
  assert.match(renderChartSvg(chart, 'leaf'), /class="living-leaf"/);
  assert.match(renderChartSvg(chart, 'leaf'), /class="deceased-leaf"/);
  assert.match(renderChartSvg(chart, 'leaf'), /class="branch"/);
});

test('dragging moves a branch and manual offsets survive style changes', () => {
  const original = createSampleChart();
  const moved = movePerson(original, 'classic', 'omar', { x: 20, y: 10 });
  const classic = chartPositions(moved, 'classic');
  const leaf = chartPositions(moved, 'leaf');

  assert.equal(moved.positions.omar.x, 20);
  assert.equal(moved.positions.karim.x, 20);
  assert.equal(moved.positions.noor.y, 10);
  assert.equal(classic.omar.x - chartPositions(original, 'classic').omar.x, 20);
  assert.equal(leaf.omar.x - chartPositions(original, 'leaf').omar.x, 20);
});

function generationsFromRoot(people, id) {
  const byId = new Map(people.map((person) => [person.id, person]));
  let depth = 0;
  let person = byId.get(id);
  while (person?.parentId) {
    depth += 1;
    person = byId.get(person.parentId);
  }
  return depth + 1;
}
