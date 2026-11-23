import './style.css';
import { showScreen } from './screen';

const setup = document.querySelector<HTMLElement>('#setup');
const editor = document.querySelector<HTMLElement>('#editor');
const openEditor = document.querySelector<HTMLButtonElement>('#open-editor');
const backToSetup = document.querySelector<HTMLButtonElement>('#back-to-setup');

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
