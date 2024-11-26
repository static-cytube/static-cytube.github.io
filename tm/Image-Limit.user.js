// ==UserScript==
// @name         Image Limit
// @description  Limit the size of images
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2024-11-23
// @license      MIT
// @namespace    https://cinema-blue.icu
// @match        *://*/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
'use strict';

var safeWin = window.unsafeWindow || window;

const customCSS = `<style type="text/css" id="imgLimit">
@charset "UTF-8";

img {
  max-width: 640px !important;
  max-width: 640px !important;
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
