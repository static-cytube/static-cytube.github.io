// ==UserScript==
// @name         Kosmi Enhancer
// @description  Change Kosmi for the better!
// @author       Bv5t3r
// @version      2024-05-08-1658
// @namespace    http://tampermonkey.net/
// @icon         https://app.kosmi.io/favicon.png
// @match        https://app.kosmi.io/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
'use strict';

var safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

// safeWin.console.debug(JSON.stringify(GM_info, null, 2));

var msgBoxFixed = false;
var sidebarFixed = false;

const delayChanges = function() {
  // safeWin.console.debug('delayChanges');

  try {
    if (!msgBoxFixed) {
      var msgBox = document.getElementsByClassName("messagesDropdownMenu-k+8");
      if (typeof msgBox !== 'undefined') {
        msgBox[0].style.width = "600px";
        msgBox[0].style.height = "540px";
        msgBox[0].style.maxHeight = msgBox[0].style.height;
        msgBoxFixed = true;
      }
    }

    if (!sidebarFixed) {
      var sidebar = document.getElementsByClassName("sidebar-tYw");
      if (typeof sidebar !== 'undefined') {
        sidebar[0].style.width = "400px";
        sidebarFixed = true;
      }
    }

    var webCams = document.getElementsByClassName("webcamOverlayItem-qb1");
    if (typeof webCams !== 'undefined') {
      for (let i = 0; i < webCams.length; i++) {
        webCams[i].style.top = "6%";
        webCams[i].style.left = "2%";
        webCams[i].style.width = "100px";
        webCams[i].style.height = "100px";
      }
    }
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
