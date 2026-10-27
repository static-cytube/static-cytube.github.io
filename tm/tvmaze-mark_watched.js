// ==UserScript==
// @name         TVmaze - Mark All Watched
// @description  Clicks every "Watched" button on the TVmaze watch page for show 75026
// @version      2026-10-27
// @author       Cinema-Blue
// @copyright    2026+ Cinema-Blue
// @license      MIT
// @namespace    https://cinema-blue.icu
// @match        https://www.tvmaze.com/watch/show?show_id=*
// @icon         https://static.tvmaze.com/images/favico/favicon.ico
// @downloadURL  https://static-cytube.github.io/tm/tvmaze-mark_watched.js.js
// @updateURL    https://static-cytube.github.io/tm/tvmaze-mark_watched.js.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/* eslint-disable no-multi-spaces */

(function () {
    'use strict';

    const SELECTOR = 'div.button.watched[title="Watched"][data-watchtype="0"]';
    const DELAY_MS = 500; // pause between clicks so the site's requests don't pile up

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function clickAll(btn) {
        const buttons = Array.from(document.querySelectorAll(SELECTOR));
        if (!buttons.length) {
            btn.textContent = 'No buttons found';
            return;
        }
        btn.disabled = true;
        for (let i = 0; i < buttons.length; i++) {
            btn.textContent = `Clicking ${i + 1}/${buttons.length}…`;
            buttons[i].scrollIntoView({ block: 'center' });
            buttons[i].click();
            await sleep(DELAY_MS);
        }
        btn.textContent = `Done (${buttons.length} clicked)`;
        btn.disabled = false;
    }

    // Floating trigger button, so nothing gets clicked until you ask for it
    const btn = document.createElement('button');
    btn.textContent = 'Mark ALL Watched';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999,
        padding: '10px 16px',
        background: '#3c948b',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,.3)',
    });
    btn.addEventListener('click', () => clickAll(btn));
    document.body.appendChild(btn);
})();
