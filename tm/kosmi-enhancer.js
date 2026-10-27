// ==UserScript==
// @name         Kosmi Enhancer
// @description  Change Kosmi for the better!
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2026.10.27
// @license      MIT
// @namespace    https://cinema-blue.icu
// @icon         https://app.kosmi.io/favicon.png
// @downloadURL  https://static-cytube.github.io/tm/kosmi-enhancer.js
// @updateURL    https://static-cytube.github.io/tm/kosmi-enhancer.js
// @match        *://app.kosmi.io/*
// @match        *://kosmi.app/*
// @match        *://www.kosmi.app/*
// @sandbox      raw
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

// https://www.tampermonkey.net/documentation.php
// https://jshint.com/docs/options/
// jshint esversion:11, browser:true, devel:true, curly:true, eqeqeq:true, freeze:true, futurehostile:true
// jshint latedef:nofunc, nocomma:true, undef:true, unused:true, trailingcomma:true

/* eslint-disable no-multi-spaces */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------------------------

  const DEBUG = false;              // true = log every lookup, `debugger` on errors
  const MAIN_VOLUME = 0.05;         // initial volume for the main (shared) video
  const CAM_SIZE = '120px';         // webcam tile size
  const SIDEBAR_WIDTH = '500px';
  const ROOMS_WIDTH = '32vw';
  const MUTATION_THROTTLE_MS = 250; // re-check layout at most this often while the DOM is changing
  const POLL_MS = 5000;             // safety-net re-check when nothing is changing
  const MISSING_WARN_MS = 30000;    // warn once if an item stays unfound this long

  // Popup that appears after the URL changes
  const POPUP_ACTION = 'click';     // 'click' = press its OKAY button, 'remove' = delete it from the page, 'off' = leave it
  const POPUP_BUTTON_TEXT = /^\s*(okay|ok)\s*[.!]?\s*$/i; // which button counts as "OKAY"
  const POPUP_WINDOW_MS = 10000;    // only auto-dismiss popups appearing this soon after a URL change
  const POPUP_ON_PAGE_LOAD = true;  // treat the initial page load as a URL change too
  const POPUP_NATIVE_ALERTS = true; // also swallow browser alert() boxes inside that window

  // ---------------------------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------------------------

  const safeWin = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  const con = safeWin.console;
  const scriptName = GM.info.script.name;
  const scriptVersion = GM.info.script.version;
  const tag = `[${scriptName}]`;

  const log = {
    debug: (...args) => { if (DEBUG) { con.debug(tag, ...args); } },
    info: (...args) => con.log(tag, ...args),
    warn: (...args) => con.warn(tag, ...args),
    error: (where, err) => {
      con.error(`${tag} ${where}:`, err);
      if (DEBUG) { debugger; } // jshint ignore:line
    },
  };

  // Redirect kosmi.app / www.kosmi.app to app.kosmi.io and stop here
  if (/^(www\.)?kosmi\.app$/i.test(location.hostname)) {
    location.replace('https://app.kosmi.io' + location.pathname + location.search + location.hash);
    return;
  }

  log.info(`Loading v${scriptVersion}`);

  // ---------------------------------------------------------------------------------------------
  // Styles — keyed on data-ke attributes we set, so they keep working even when an element
  // already had its own id. Legacy ids (#sidebar etc.) are still added when they're free.
  // ---------------------------------------------------------------------------------------------

  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'kosmi-enhancer-css';
    style.textContent = `
      [data-ke="rooms"]    { width: ${ROOMS_WIDTH} !important; }
      [data-ke="sidebar"]  { width: ${SIDEBAR_WIDTH} !important; }
      [data-ke="sidebtns"] { display: none !important; }
      .camVideo {
        top: 0 !important;
        left: 0 !important;
        width: ${CAM_SIZE} !important;
        height: ${CAM_SIZE} !important;
      }
      #mainvideo.ke-hidden { display: none !important; }
      #hideVideo { cursor: pointer; margin-left: 8px; }
      #hideVideo[aria-pressed="true"] { opacity: 0.6; }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // ---------------------------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------------------------

  function all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // Top-to-bottom, then left-to-right
  function byPosition(a, b) {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return (ra.top - rb.top) || (ra.left - rb.left);
  }

  // Element ancestors, nearest first, stopping before <body>
  function ancestors(el, max) {
    const out = [];
    for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement && out.length < max; n = n.parentElement) {
      out.push(n);
    }
    return out;
  }

  // Equivalent of the old jQuery `$(el).parents('div').eq(n)`
  function nthDivAncestor(el, n) {
    let count = -1;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p.tagName === 'DIV' && ++count === n) { return p; }
    }
    return null;
  }

  // Prefer a visible match; fall back to the first in document order
  function pickIcon(selector) {
    const icons = all(selector);
    return icons.find(isVisible) || icons[0] || null;
  }

  // ---------------------------------------------------------------------------------------------
  // Layout finders
  //
  // Each item lists strategies from most to least robust. The first one that returns a usable
  // element wins. The `legacy-*` strategies reproduce the original selectors exactly, so the
  // script never does worse than before. Run `kosmiEnhancer.layout()` in the console to see
  // which strategy matched each item and whether it agrees with the legacy lookup.
  // ---------------------------------------------------------------------------------------------

  // The side button bar is the nearest ancestor of the "..." icon that holds a row of
  // 3+ sibling buttons, each containing an icon. That survives extra wrapper divs being
  // added or removed, which is what breaks a fixed `.parents('div').eq(2)`.
  function findButtonBar() {
    for (const icon of all('i.ellipsis.horizontal')) {
      for (const anc of ancestors(icon, 6)) {
        const kids = Array.from(anc.children);
        const withIcons = kids.filter((k) => k.matches('i.icon') || k.querySelector('i.icon'));
        if (withIcons.length >= 3 && withIcons.length >= kids.length - 1) { return anc; }
      }
    }
    return null;
  }

  function roomsFromCaret(caret) {
    return caret ? caret.closest('div') : null;
  }

  function commentIcon() {
    return pickIcon('i.icon.comment');
  }

  const LAYOUT = [
    {
      key: 'rooms',
      id: 'roomsDropDown',
      strategies: [
        // Room picker lives in the header: take the top-most visible caret, not just the first in the DOM
        ['topmost-caret', () => roomsFromCaret(all('i.caret.down').filter(isVisible).sort(byPosition)[0]),],
        ['semantic-dropdown', () => all('.ui.dropdown').filter(isVisible).sort(byPosition)
          .find((d) => d.querySelector('i.caret.down, i.dropdown.icon')) || null,],
        ['legacy-first-caret', () => roomsFromCaret(document.querySelector('i.caret.down')),],
      ],
    },
    {
      key: 'sidebtns',
      id: 'sidebtns',
      strategies: [
        ['button-row', findButtonBar,],
        ['legacy-parents-2', () => {
          const icon = document.querySelector('i.ellipsis.horizontal');
          return icon ? nthDivAncestor(icon, 2) : null;
        },],
      ],
    },
    {
      key: 'sidebar',
      id: 'sidebar',
      strategies: [
        // Same relationship as the original (sidebar = parent of the button bar), but anchored
        // on the bar we actually found rather than a fixed ancestor count
        ['parent-of-sidebtns', () => {
          const bar = getItem('sidebtns');
          return bar ? bar.parentElement : null;
        },],
        ['legacy-parents-3', () => {
          const icon = document.querySelector('i.ellipsis.horizontal');
          return icon ? nthDivAncestor(icon, 3) : null;
        },],
      ],
    },
    {
      key: 'commentBtn',
      id: 'commentBtn',
      strategies: [
        ['clickable', () => {
          const icon = commentIcon();
          return icon ? icon.closest('button, [role="button"], a') : null;
        },],
        ['legacy-closest-div', () => {
          const icon = commentIcon();
          return icon ? icon.closest('div') : null;
        },],
      ],
    },
    {
      key: 'commentCnt',
      id: 'commentCnt',
      strategies: [
        ['legacy-prev-div', () => {
          const icon = commentIcon();
          const prev = icon && icon.previousElementSibling;
          return (prev && prev.tagName === 'DIV') ? prev : null;
        },],
        ['badge-in-button', () => {
          const btn = getItem('commentBtn');
          return btn ? btn.querySelector('.ui.label, .label, .floating') : null;
        },],
      ],
    },
  ];

  const specByKey = Object.fromEntries(LAYOUT.map((s) => [s.key, s,]));
  const state = Object.fromEntries(LAYOUT.map((s) => [s.key, {
    el: null,
    strategy: null,
    missingSince: 0,
    warned: false,
  },]));

  function isUsable(spec, el) {
    return Boolean(el) &&
      el.nodeType === Node.ELEMENT_NODE &&
      el.isConnected &&
      el !== document.body &&
      el !== document.documentElement &&
      el.id !== 'hideVideo' &&
      (!el.dataset.ke || el.dataset.ke === spec.key);   // don't steal another item's element
  }

  function claim(spec, el) {
    el.dataset.ke = spec.key;
    if (!el.id) { el.id = spec.id; }   // legacy id only when it won't clobber Kosmi's own
  }

  function release(key) {
    const el = state[key].el;
    if (el) {
      if (el.dataset.ke === key) { delete el.dataset.ke; }
      if (el.id === specByKey[key].id) { el.removeAttribute('id'); }
    }
    state[key].el = null;
    state[key].strategy = null;
  }

  // Cached lookup: only re-runs the strategies when React has replaced the element
  function locate(spec) {
    const st = state[spec.key];
    if (st.el && st.el.isConnected && st.el.dataset.ke === spec.key) { return st.el; }

    for (const [name, find] of spec.strategies) {
      let el = null;
      try {
        el = find();
      } catch (err) {
        log.debug(`${spec.key}/${name} threw`, err);
      }
      if (isUsable(spec, el)) {
        claim(spec, el);
        if (st.el !== el) { log.debug(`${spec.key}: found via ${name}`, el); }
        st.el = el;
        st.strategy = name;
        st.missingSince = 0;
        st.warned = false;
        return el;
      }
    }

    st.el = null;
    st.strategy = null;
    const now = Date.now();
    if (!st.missingSince) { st.missingSince = now; }
    if (!st.warned && now - st.missingSince > MISSING_WARN_MS) {
      st.warned = true;
      log.warn(`Couldn't find "${spec.key}" for ${MISSING_WARN_MS / 1000}s; Kosmi's layout may have changed. ` +
        'Run kosmiEnhancer.layout() in the console for details.');
    }
    return null;
  }

  function getItem(key) {
    return locate(specByKey[key]);
  }

  // Console diagnostics: which strategy matched each item, and does it agree with the old selectors?
  function dumpLayout() {
    const rows = {};
    for (const spec of LAYOUT) {
      const el = locate(spec);
      const legacy = spec.strategies.find(([name]) => name.startsWith('legacy'));
      let legacyEl = null;
      try { legacyEl = legacy ? legacy[1]() : null; } catch (err) { legacyEl = null; }
      const r = el ? el.getBoundingClientRect() : null;
      rows[spec.key] = {
        found: Boolean(el),
        strategy: state[spec.key].strategy || '-',
        agreesWithLegacy: legacy ? (el === legacyEl) : '-',
        element: el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}` : '-',
        classes: el ? String(el.className).slice(0, 60) : '-',
        size: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : '-',
      };
    }
    con.table(rows);
    return rows;
  }

  function refreshLayout() {
    LAYOUT.forEach((spec) => release(spec.key));
    applyChanges();
    return dumpLayout();
  }

  safeWin.kosmiEnhancer = {
    version: scriptVersion,
    layout: dumpLayout,     // kosmiEnhancer.layout()  -> table of what was found and how
    refresh: refreshLayout, // kosmiEnhancer.refresh() -> forget cached elements and re-find
    get: (key) => getItem(key),
  };

  // ---------------------------------------------------------------------------------------------
  // Video handling
  // ---------------------------------------------------------------------------------------------

  // The cam tile is the positioned wrapper around a single video, not just the nearest div.
  // Requiring "exactly one video inside" stops us grabbing the whole cam grid.
  function camTile(video) {
    const existing = video.closest('.camVideo');
    if (existing) { return existing; }
    for (const anc of ancestors(video, 6)) {
      if (anc.tagName !== 'DIV') { continue; }
      if (anc.querySelectorAll('video').length !== 1) { break; }
      if (anc.style.top || anc.style.left || anc.style.transform) { return anc; }
      const pos = getComputedStyle(anc).position;
      if (pos === 'absolute' || pos === 'fixed') { return anc; }
    }
    return video.closest('div');
  }

  function markCam(video) {
    const tile = camTile(video);
    if (tile && !tile.classList.contains('camVideo')) {
      tile.classList.add('camVideo');
      tile.removeAttribute('style');
    }
  }

  function onVideoPlay(event) {
    const video = event.currentTarget;
    const src = video.currentSrc || video.src || '';
    const key = src || 'cam';

    // Only (re)initialise when the source changes, so pausing/resuming
    // doesn't keep resetting the user's mute/volume choices.
    if (video.dataset.keSrc === key) { return; }
    video.dataset.keSrc = key;

    if (src) {
      // Main shared video: ensure only one element carries the id
      all('#mainvideo').forEach((v) => {
        if (v !== video) {
          v.removeAttribute('id');
          v.classList.remove('ke-hidden');
        }
      });
      video.id = 'mainvideo';
      video.muted = true;
      video.volume = MAIN_VOLUME;
      log.info('Video:', src);
    } else {
      // Webcam (MediaStream via srcObject, no src)
      video.muted = true;
      video.volume = 0;
      markCam(video);
    }
  }

  function handleVideo(video) {
    if (video.dataset.keHandled) { return; }   // avoid stacking duplicate listeners
    video.dataset.keHandled = '1';
    video.muted = true;
    video.addEventListener('play', onVideoPlay);
    if (!video.paused) { onVideoPlay({ currentTarget: video, }); } // already playing when we found it
    log.debug('video attached', video);
  }

  function toggleMainVideo(event) {
    const video = document.getElementById('mainvideo');
    if (!video) { return; }
    const hidden = video.classList.toggle('ke-hidden');
    video.muted = hidden;                       // hidden = muted, shown = unmuted
    event.currentTarget.setAttribute('aria-pressed', String(hidden));
  }

  // ---------------------------------------------------------------------------------------------
  // Apply tweaks — driven by DOM mutations (throttled), with a slow poll as a safety net
  // ---------------------------------------------------------------------------------------------

  // ---------------------------------------------------------------------------------------------
  // Popup trap: after a URL change, find a dialog with an OKAY button and dismiss it.
  // Scoped to a short window after navigation so unrelated dialogs are left alone.
  // ---------------------------------------------------------------------------------------------

  let lastHref = location.href;
  let urlChangedAt = POPUP_ON_PAGE_LOAD ? Date.now() : 0;

  function noteUrlChange() {
    if (location.href === lastHref) { return; }
    log.debug(`URL changed: ${lastHref} -> ${location.href}`);
    lastHref = location.href;
    urlChangedAt = Date.now();
    scheduleApply();
  }

  function inPopupWindow() {
    return Date.now() - urlChangedAt < POPUP_WINDOW_MS;
  }

  // Catch SPA navigation immediately rather than waiting for the next DOM change
  function hookHistory() {
    const hist = safeWin.history;
    const wrap = (method) => {
      const original = hist[method];
      hist[method] = function (...args) {
        const result = original.apply(this, args);
        setTimeout(noteUrlChange, 0);
        return result;
      };
    };
    ['pushState', 'replaceState',].forEach(wrap);
    safeWin.addEventListener('popstate', noteUrlChange);
    safeWin.addEventListener('hashchange', noteUrlChange);
  }

  function hookNativeAlert() {
    const originalAlert = safeWin.alert;
    safeWin.alert = function (message) {
      if (POPUP_ACTION !== 'off' && inPopupWindow()) {
        log.info('Suppressed alert:', message);
        return undefined;
      }
      return originalAlert.call(safeWin, message);
    };
  }

  const POPUP_SELECTOR = '.ui.modal, [role="dialog"], [role="alertdialog"], .modal';

  function findOkayButton(popup) {
    return all('button, [role="button"], .ui.button, a', popup)
      .find((b) => isVisible(b) && POPUP_BUTTON_TEXT.test(b.textContent)) || null;
  }

  function dismissPopups() {
    if (POPUP_ACTION === 'off' || !inPopupWindow()) { return; }

    for (const popup of all(POPUP_SELECTOR)) {
      if (popup.dataset.keDismissed || !isVisible(popup)) { continue; }
      const okay = findOkayButton(popup);
      if (!okay || okay.dataset.keClicked) { continue; }  // only touch popups that offer OKAY

      popup.dataset.keDismissed = '1';
      okay.dataset.keClicked = '1';
      log.info('Dismissing popup:', popup.textContent.trim().replace(/\s+/g, ' ').slice(0, 120));

      if (POPUP_ACTION === 'remove') {
        // Take the dimmed backdrop with it and restore page scrolling
        const backdrop = popup.closest('.ui.dimmer, .dimmer, .modals') || popup;
        backdrop.remove();
        document.body.classList.remove('dimmed', 'dimmable', 'scrolling');
      } else {
        okay.click();
      }
    }
  }

  function addVideoButton(rooms) {
    if (document.getElementById('hideVideo') || !rooms.parentElement) { return; }
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'hideVideo';
    btn.textContent = 'Video';
    btn.title = 'Hide/show and mute/unmute the main video';
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', toggleMainVideo);
    rooms.parentElement.after(btn);
  }

  function applyChanges() {
    try {
      noteUrlChange();
      dismissPopups();
      LAYOUT.forEach(locate);

      const rooms = state.rooms.el;
      if (rooms) {
        const nameEl = Array.from(rooms.children).find((c) => c.tagName === 'DIV');
        const roomName = (nameEl ? nameEl.textContent : rooms.textContent).trim();
        if (roomName) {
          const title = `Kosmi: ${roomName}`;
          if (document.title !== title) { document.title = title; }
        }
        addVideoButton(rooms);
      }

      // Re-apply cam class in case React rebuilt a tile's wrapper
      all('video[data-ke-src="cam"]').forEach(markCam);
    } catch (err) {
      log.error('applyChanges', err);
    }
  }

  let applyTimer = null;
  function scheduleApply() {
    if (applyTimer) { return; }
    applyTimer = setTimeout(() => {
      applyTimer = null;
      applyChanges();
    }, MUTATION_THROTTLE_MS);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) { continue; }
        if (node.tagName === 'VIDEO') {
          handleVideo(node);
        } else {
          node.querySelectorAll('video').forEach(handleVideo);
        }
      }
    }
    scheduleApply();
  });

  // ---------------------------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------------------------

  function start() {
    try {
      log.debug('DOMContentLoaded');
      all('video').forEach(handleVideo); // videos that exist already
      observer.observe(document.body, { childList: true, subtree: true, });
      applyChanges();
      setInterval(applyChanges, POLL_MS);
    } catch (err) {
      log.error('start', err);
    }
  }

  injectStyles();
  hookHistory();                                   // at document-start, before Kosmi's router loads
  if (POPUP_NATIVE_ALERTS) { hookNativeAlert(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true, });
  } else {
    start();
  }
})();
