let tooltipEl: HTMLElement | null = null;

export function getOrCreateTooltip(): HTMLElement {
  if (!tooltipEl && typeof document !== 'undefined') {
    tooltipEl = document.querySelector('.app-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'app-tooltip';
      document.body.appendChild(tooltipEl);
    }
  }
  return tooltipEl!;
}

export function attachTooltip(el: HTMLElement | null, text: string, shortcut = '', side = 'bottom'): void {
  if (!el) return;
  el.dataset.tooltip = text;
  if (shortcut) el.dataset.shortcut = shortcut;
  el.title = text + (shortcut ? ` (${shortcut})` : '');

  let timer: any;
  el.addEventListener('mouseenter', () => {
    const currentText = el.dataset.tooltip || el.title;
    const currentShortcut = el.dataset.shortcut || '';
    if (!currentText) return;

    timer = setTimeout(() => {
      const tip = getOrCreateTooltip();
      tip.innerHTML = currentText + (currentShortcut ? `<span class="tooltip-shortcut">${currentShortcut}</span>` : '');

      tip.style.visibility = 'hidden';
      tip.style.display = 'block';
      tip.style.left = '-9999px';
      tip.style.top = '-9999px';
      tip.style.transform = 'none';
      tip.classList.add('visible');

      const tipWidth = tip.offsetWidth || 100;
      const tipHeight = tip.offsetHeight || 24;
      const rect = el.getBoundingClientRect();
      const pad = 6;
      const viewWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewHeight = window.innerHeight || document.documentElement.clientHeight;

      let tipLeft: number;
      let tipTop: number;

      if (side === 'bottom') {
        tipLeft = rect.left + (rect.width / 2) - (tipWidth / 2);
        tipTop = rect.bottom + 6;

        if (tipTop + tipHeight > viewHeight - pad && rect.top - tipHeight - 6 >= pad) {
          tipTop = rect.top - tipHeight - 6;
          tip.classList.remove('side-bottom');
          tip.classList.add('side-top');
        } else {
          tip.classList.remove('side-top');
          tip.classList.add('side-bottom');
        }
      } else if (side === 'top') {
        tipLeft = rect.left + (rect.width / 2) - (tipWidth / 2);
        tipTop = rect.top - tipHeight - 6;

        if (tipTop < pad && rect.bottom + tipHeight + 6 <= viewHeight - pad) {
          tipTop = rect.bottom + 6;
          tip.classList.remove('side-top');
          tip.classList.add('side-bottom');
        } else {
          tip.classList.remove('side-bottom');
          tip.classList.add('side-top');
        }
      } else if (side === 'left') {
        tipLeft = rect.left - tipWidth - 8;
        tipTop = rect.top + (rect.height / 2) - (tipHeight / 2);
        tip.classList.remove('side-top', 'side-bottom');
        tip.classList.add('side-left');
      } else {
        tipLeft = rect.right + 8;
        tipTop = rect.top + (rect.height / 2) - (tipHeight / 2);
        tip.classList.remove('side-top', 'side-bottom');
        tip.classList.add('side-right');
      }

      if (tipLeft < pad) tipLeft = pad;
      if (tipLeft + tipWidth > viewWidth - pad) tipLeft = viewWidth - tipWidth - pad;
      if (tipTop < pad) tipTop = pad;
      if (tipTop + tipHeight > viewHeight - pad) tipTop = viewHeight - tipHeight - pad;

      tip.style.left = `${Math.round(tipLeft)}px`;
      tip.style.top = `${Math.round(tipTop)}px`;
      tip.style.visibility = 'visible';
    }, 400);
  });

  const hide = () => {
    clearTimeout(timer);
    const tip = getOrCreateTooltip();
    if (tip) {
      tip.classList.remove('visible');
      tip.style.display = 'none';
      tip.style.visibility = 'hidden';
      tip.style.left = '-9999px';
      tip.style.top = '-9999px';
    }
  };

  el.addEventListener('mouseleave', hide);
  el.addEventListener('click', hide);
}
