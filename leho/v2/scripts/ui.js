(function (root) {
  'use strict';

  function setPage(id) {
    document.querySelectorAll('.page').forEach(page => {
      const active = page.id === id;
      page.classList.toggle('active', active);
      page.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
  }

  function initNumpad() {
    const pad = document.getElementById('numpad');
    if (!pad) return;
    pad.innerHTML = '';
    [1,2,3,4,5,6,7,8,9,0].forEach(n => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(n);
      button.dataset.digit = String(n);
      pad.appendChild(button);
    });
  }

  function init() {
    initNumpad();
    document.getElementById('btn-start').addEventListener('click', () => setPage('page-player'));
    document.getElementById('btn-open-trophies').addEventListener('click', () => setPage('page-trophies'));
    document.getElementById('btn-trophies-back').addEventListener('click', () => setPage('page-home'));
  }

  root.V2UI = { setPage, initNumpad, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
