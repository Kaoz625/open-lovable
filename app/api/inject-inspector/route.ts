import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var activeSandboxProvider: any;
}

const INSPECTOR_SCRIPT = `
(function() {
  if (window.__inspectorLoaded) return;
  window.__inspectorLoaded = true;

  /* ── Styles ── */
  var style = document.createElement('style');
  style.textContent =
    '.__il-hover{outline:2px solid #6366f1!important;outline-offset:1px!important;cursor:crosshair!important}' +
    '.__il-selected{outline:2px solid #ef4444!important;outline-offset:1px!important}' +
    '.__il-badge{position:fixed;background:#6366f1;color:#fff;font:11px/1 monospace;padding:3px 7px;border-radius:4px;z-index:2147483647;pointer-events:none;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.35)}' +
    '.__il-drag-over{outline:2px dashed #f59e0b!important;outline-offset:2px!important}';
  document.head.appendChild(style);

  var badge = document.createElement('div');
  badge.className = '__il-badge';
  badge.style.display = 'none';
  document.body.appendChild(badge);

  var enabled = false;
  var hoveredEl = null;
  var selectedEl = null;
  var dragEl = null;
  var dragGhost = null;

  /* ── Helpers ── */
  function rgb2hex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return 'transparent';
    var m = rgb.match(/rgba?\\((\\d+),(\\d+),(\\d+)/);
    if (!m) return rgb;
    return '#' + [m[1],m[2],m[3]].map(function(x){return (+x).toString(16).padStart(2,'0')}).join('');
  }

  function pxToNum(v) {
    return v ? parseInt(v, 10) || 0 : 0;
  }

  function getHint(el) {
    var node = el;
    for (var i = 0; i < 8; i++) {
      if (!node || node === document.body) break;
      if (node.dataset && node.dataset.component) return node.dataset.component;
      if (node.id && !node.id.match(/^:r/)) return '#' + node.id;
      node = node.parentElement;
    }
    return null;
  }

  function getComputedProps(el) {
    var cs = window.getComputedStyle(el);
    return {
      fontSize:        cs.fontSize,
      fontFamily:      cs.fontFamily.split(',')[0].replace(/['"]/g,'').trim(),
      fontWeight:      cs.fontWeight,
      color:           rgb2hex(cs.color),
      backgroundColor: rgb2hex(cs.backgroundColor),
      textAlign:       cs.textAlign,
      letterSpacing:   cs.letterSpacing,
      lineHeight:      cs.lineHeight,
      borderRadius:    cs.borderRadius,
      maxWidth:        cs.maxWidth,
      minHeight:       cs.minHeight,
      display:         cs.display,
      marginTop:       cs.marginTop,
      marginRight:     cs.marginRight,
      marginBottom:    cs.marginBottom,
      marginLeft:      cs.marginLeft,
      paddingTop:      cs.paddingTop,
      paddingRight:    cs.paddingRight,
      paddingBottom:   cs.paddingBottom,
      paddingLeft:     cs.paddingLeft
    };
  }

  function getSpecific(el) {
    var tag = el.tagName;
    if (tag === 'IMG')    return { src: el.src, alt: el.alt || '' };
    if (tag === 'A')      return { href: el.getAttribute('href') || '', target: el.target || '_self', text: el.innerText.trim().substring(0,100) };
    if (tag === 'VIDEO')  return { src: el.src || (el.querySelector('source') || {}).src || '', poster: el.poster || '' };
    if (tag === 'IFRAME') return { src: el.src || '' };
    if (tag === 'INPUT' || tag === 'TEXTAREA') return { value: el.value, placeholder: el.placeholder };
    // Text content for most elements
    return { text: el.innerText ? el.innerText.trim().substring(0,200) : '' };
  }

  function badgeLabel(el) {
    var hint = getHint(el);
    var tag = el.tagName.toLowerCase();
    var cls = Array.from(el.classList).filter(function(c){return !c.startsWith('__il')}).slice(0,2).join(' ');
    return hint ? hint + ' <' + tag + '>' : '<' + tag + '>' + (cls ? ' .' + cls.split(' ')[0] : '');
  }

  function sendSelect(el) {
    window.parent.postMessage({
      type:     'inspector:select',
      tag:      el.tagName.toLowerCase(),
      classes:  Array.from(el.classList).filter(function(c){return !c.startsWith('__il')}).join(' '),
      text:     (el.innerText || '').trim().substring(0, 60),
      hint:     getHint(el),
      styles:   getComputedProps(el),
      specific: getSpecific(el)
    }, '*');
  }

  /* ── Message handler ── */
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    switch (e.data.type) {
      case 'inspector:enable':
        enabled = true;
        document.body.style.cursor = 'crosshair';
        break;
      case 'inspector:disable':
        enabled = false;
        document.body.style.cursor = '';
        if (hoveredEl) { hoveredEl.classList.remove('__il-hover'); hoveredEl = null; }
        if (selectedEl) { selectedEl.classList.remove('__il-selected'); selectedEl = null; }
        badge.style.display = 'none';
        break;
      case 'inspector:apply-style':
        if (selectedEl && e.data.styles) {
          Object.assign(selectedEl.style, e.data.styles);
          sendSelect(selectedEl); // send back updated styles
        }
        break;
      case 'inspector:apply-src':
        if (selectedEl) {
          if (selectedEl.tagName === 'IMG') selectedEl.src = e.data.src;
          else if (selectedEl.tagName === 'VIDEO') { selectedEl.src = e.data.src; selectedEl.load(); }
          else if (selectedEl.tagName === 'IFRAME') selectedEl.src = e.data.src;
        }
        break;
      case 'inspector:apply-href':
        if (selectedEl && selectedEl.tagName === 'A') {
          selectedEl.href = e.data.href;
          if (e.data.target) selectedEl.target = e.data.target;
        }
        break;
      case 'inspector:apply-text':
        if (selectedEl) selectedEl.innerText = e.data.text;
        break;
      case 'inspector:reselect':
        if (selectedEl) sendSelect(selectedEl);
        break;
    }
  });

  /* ── Hover ── */
  document.addEventListener('mouseover', function(e) {
    if (!enabled || e.target === badge) return;
    if (hoveredEl && hoveredEl !== e.target) hoveredEl.classList.remove('__il-hover');
    hoveredEl = e.target;
    hoveredEl.classList.add('__il-hover');
    badge.textContent = badgeLabel(hoveredEl);
    badge.style.display = 'block';
    badge.style.top  = Math.max(4, e.clientY - 30) + 'px';
    badge.style.left = Math.min(window.innerWidth - 180, Math.max(4, e.clientX + 6)) + 'px';
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (!enabled) return;
    if (hoveredEl) hoveredEl.classList.remove('__il-hover');
    hoveredEl = null;
    badge.style.display = 'none';
  }, true);

  /* ── Click to select ── */
  document.addEventListener('click', function(e) {
    if (!enabled) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (selectedEl) selectedEl.classList.remove('__il-selected');
    selectedEl = e.target;
    selectedEl.classList.add('__il-selected');
    sendSelect(selectedEl);
  }, true);

  /* ── Double-click: inline text edit ── */
  document.addEventListener('dblclick', function(e) {
    if (!enabled) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var el = e.target;
    var tag = el.tagName;
    // Text-bearing elements only
    if (['IMG','VIDEO','IFRAME','INPUT','SELECT'].indexOf(tag) !== -1) return;
    var prev = el.getAttribute('contenteditable');
    el.setAttribute('contenteditable', 'true');
    el.focus();
    el.addEventListener('blur', function onBlur() {
      el.removeAttribute('contenteditable');
      el.removeEventListener('blur', onBlur);
      window.parent.postMessage({ type: 'inspector:text-changed', text: el.innerText }, '*');
    });
  }, true);

  /* ── Drag to reorder ── */
  document.addEventListener('mousedown', function(e) {
    if (!enabled || !selectedEl || e.button !== 0) return;
    if (e.target !== selectedEl && !selectedEl.contains(e.target)) return;
    var startX = e.clientX, startY = e.clientY;
    var moved = false;

    function onMove(ev) {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) {
        moved = true;
        dragEl = selectedEl;
        dragGhost = dragEl.cloneNode(true);
        dragGhost.style.cssText = 'position:fixed;opacity:.5;pointer-events:none;z-index:2147483646;outline:none;';
        dragGhost.style.width = dragEl.offsetWidth + 'px';
        dragGhost.style.height = dragEl.offsetHeight + 'px';
        document.body.appendChild(dragGhost);
      }
      if (dragGhost) {
        dragGhost.style.left = (ev.clientX - dragEl.offsetWidth / 2) + 'px';
        dragGhost.style.top  = (ev.clientY - dragEl.offsetHeight / 2) + 'px';
      }
    }

    function onUp(ev) {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      if (dragGhost) { dragGhost.remove(); dragGhost = null; }
      if (!moved || !dragEl) return;
      var drop = document.elementFromPoint(ev.clientX, ev.clientY);
      if (drop && drop !== dragEl && !dragEl.contains(drop)) {
        drop.classList.remove('__il-drag-over');
        // Insert before drop target
        drop.parentNode && drop.parentNode.insertBefore(dragEl, drop);
        window.parent.postMessage({ type: 'inspector:moved', hint: 'Element moved — click Apply to Code to save' }, '*');
        sendSelect(dragEl);
      }
      dragEl = null;
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  }, true);

  /* ── Drag-over highlight ── */
  document.addEventListener('mousemove', function(e) {
    if (!dragEl) return;
    var over = document.elementFromPoint(e.clientX, e.clientY);
    document.querySelectorAll('.__il-drag-over').forEach(function(el){ el.classList.remove('__il-drag-over'); });
    if (over && over !== dragEl && !dragEl.contains(over)) {
      over.classList.add('__il-drag-over');
    }
  }, true);

  window.parent.postMessage({ type: 'inspector:ready' }, '*');
})();
`;

export async function POST() {
  try {
    const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    if (!provider) return NextResponse.json({ success: false, error: 'No active sandbox' }, { status: 400 });

    await provider.writeFile('/home/user/app/public/inspector.js', INSPECTOR_SCRIPT);

    let indexHtml = await provider.readFile('/home/user/app/index.html');
    if (!indexHtml.includes('inspector.js')) {
      indexHtml = indexHtml.replace('</body>', '  <script src="/inspector.js"></script>\n  </body>');
      await provider.writeFile('/home/user/app/index.html', indexHtml);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[inject-inspector] Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const provider = sandboxManager.getActiveProvider() || global.activeSandboxProvider;
    if (!provider) return NextResponse.json({ success: false, error: 'No active sandbox' }, { status: 400 });

    let indexHtml = await provider.readFile('/home/user/app/index.html');
    indexHtml = indexHtml.replace(/\s*<script src="\/inspector\.js"><\/script>/g, '');
    await provider.writeFile('/home/user/app/index.html', indexHtml);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
