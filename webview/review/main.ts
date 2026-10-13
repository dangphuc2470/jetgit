import { mount } from 'svelte';
import App from './App.svelte';

if (typeof document !== 'undefined') {
  if (document.body) {
    document.body.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) document.body.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
    });
  }
}

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, true);

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;
