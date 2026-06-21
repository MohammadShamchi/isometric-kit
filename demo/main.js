import { scenes } from './scenes/index.js';

const canvas = document.getElementById('canvas');
const sidebar = document.getElementById('sidebar-nav');
const sceneTitle = document.getElementById('scene-title');
const sceneSubtitle = document.getElementById('scene-subtitle');
const elementList = document.getElementById('element-list');

const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));

function renderElementList(elements) {
  if (!elements?.length) {
    elementList.hidden = true;
    elementList.innerHTML = '';
    return;
  }

  elementList.hidden = false;
  elementList.innerHTML = elements
    .map(
      (el) => `
        <li class="element-item">
          <span class="element-name">${el.name}</span>
          ${el.state ? `<span class="element-meta">${el.state}</span>` : ''}
        </li>
      `,
    )
    .join('');
}

function showScene(sceneId) {
  const scene = sceneById.get(sceneId) ?? scenes[0];
  if (!scene) return;

  sceneTitle.textContent = scene.label;
  sceneSubtitle.textContent = scene.subtitle ?? '';
  canvas.innerHTML = scene.render();
  renderElementList(scene.elements);

  for (const button of sidebar.querySelectorAll('[data-scene-id]')) {
    const isActive = button.dataset.sceneId === scene.id;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  }

  history.replaceState(null, '', `#${scene.id}`);
}

function buildSidebar() {
  sidebar.innerHTML = scenes
    .map(
      (scene) => `
        <button
          type="button"
          class="nav-item"
          data-scene-id="${scene.id}"
          aria-current="false"
        >
          <span class="nav-label">${scene.label}</span>
          ${
            scene.elements?.length
              ? `<span class="nav-count">${scene.elements.length}</span>`
              : ''
          }
        </button>
      `,
    )
    .join('');

  sidebar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-scene-id]');
    if (!button) return;
    showScene(button.dataset.sceneId);
  });
}

buildSidebar();

const initialScene = location.hash.slice(1) || scenes[0]?.id;
showScene(initialScene);

window.addEventListener('hashchange', () => {
  showScene(location.hash.slice(1));
});
