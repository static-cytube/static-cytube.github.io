// ==UserScript==
// @name         LushStories Enhancer
// @description  Change LushStories for the better!
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2024-07-17-1045
// @license      MIT
// @namespace    https://cinema-blue.icu
// @icon         https://www.lushstories.com/assets/images/homescreen-favicons/lush/favicon.ico
// @downloadURL  https://static.cinema-blue.icu/tm/lush-enhancer.js
// @updateURL    https://static.cinema-blue.icu/tm/lush-enhancer.js
// @match        https://www.lushstories.com/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
'use strict';

var safeWin = window.unsafeWindow || window;

const customCSS = `<style type="text/css" id="customCSS">
@charset "UTF-8";

.max-w-full {
  max-width: 480px;
  max-width: 480px;
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
