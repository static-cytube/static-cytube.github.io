// ==UserScript==
// @name         Ins-Dream Enhancer
// @description  Make changes to Ins-Dream
// @author       Cinema-Blue
// @copyright    2025+ Cinema-Blue
// @version      2025-08-19
// @license      MIT
// @namespace    https://cinema-blue.icu
// @iconURL      https://ins-dream.com/favicon.ico
// @downloadURL  https://static.cinema-blue.icu/tm/ins-dream Enhancer.js
// @updateURL    https://static.cinema-blue.icu/tm/ins-dream Enhancer.js
// @match        https://www.ins-dream.com/*
// @sandbox      raw
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
'use strict';

var safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

const customCSS = `<style type="text/css" id="customCSS">
@charset "UTF-8";
  .bbCodeImage {
    max-height: 640px;
  }
</style>`;

(function() {
  'use strict';

  const scriptName = GM_info.script.name;
  const scriptVersion = GM_info.script.version;
  safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

  safeWin.addEventListener("load", function() {
    document.head.innerHTML += customCSS;
  });
})();
