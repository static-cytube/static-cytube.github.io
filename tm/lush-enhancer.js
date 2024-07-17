// ==UserScript==
// @name         LushStories Enhancer
// @description  Change LushStories for the better!
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2024-07-17-0900
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

// https://www.tampermonkey.net/documentation.php

var safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

// safeWin.console.debug(JSON.stringify(GM_info, null, 2));

const delayChanges = function() {
  safeWin.console.debug('delayChanges');

  try {

  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' delayChanges: ' + error);
    debugger;
  }
}

safeWin.addEventListener("load", function(){
  try {
    setInterval(function() { delayChanges(); }, 2000);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' DocReady: ' + error);
    debugger;
  }
});
