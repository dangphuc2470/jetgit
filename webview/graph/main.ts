import { mount } from 'svelte';
import './graph.css';
import App from './App.svelte';

if (typeof document !== 'undefined' && document.body) {
  document.body.setAttribute('data-vscode-context', JSON.stringify({ preventDefaultContextMenuItems: true }));
}

const app = mount(App, {
  target: document.getElementById('app')!
});

export default app;
