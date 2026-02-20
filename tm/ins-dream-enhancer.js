// ==UserScript==
// @name         Ins-Dream Enhancer
// @description  Make changes to Ins-Dream
// @author       Cinema-Blue
// @copyright    2025+ Cinema-Blue
// @version      2025.08.19
// @license      MIT
// @namespace    https://cinema-blue.icu
// @downloadURL  https://static-cytube.github.io/tm/ins-dream-enhancer.js
// @updateURL    https://static-cytube.github.io/tm/ins-dream-enhancer.js
// @match        https://www.ins-dream.com/*
// @sandbox      raw
// @grant        unsafeWindow
// @inject-into  page
// @run-at       document-start
// ==/UserScript==
'use strict';

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals GM_info */

// https://www.tampermonkey.net/documentation.php

var safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

const customCSS = `<style type="text/css" id="customCSS">
@charset "UTF-8";
body {
  zoom: 133%;
}

.bbCodeImage {
  max-width: 640px;
  max-height: 400px;
}

#logo img:first-of-type {
  max-height: 20px;
}

.pageContent center:first-of-type {
  display: none;
}
</style>`;

(function() {
  const scriptName = GM_info.script.name;
  const scriptVersion = GM_info.script.version;
  safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

  safeWin.addEventListener("load", function() {
    document.head.innerHTML += customCSS;
  });
})();
