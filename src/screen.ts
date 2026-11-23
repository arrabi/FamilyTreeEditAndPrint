export type Screen = 'setup' | 'editor';

export function showScreen(screen: Screen, setup: HTMLElement, editor: HTMLElement): void {
  setup.hidden = screen !== 'setup';
  editor.hidden = screen !== 'editor';
}
