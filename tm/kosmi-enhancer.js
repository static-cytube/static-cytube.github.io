// ==UserScript==
// @name         Kosmi Enhancer
// @description  Change Kosmi for the better!
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2024-10-04
// @license      MIT
// @namespace    https://cinema-blue.icu
// @icon         https://app.kosmi.io/favicon.png
// @downloadURL  https://static.cinema-blue.icu/tm/kosmi-enhancer.js
// @updateURL    https://static.cinema-blue.icu/tm/kosmi-enhancer.js
// @match        https://app.kosmi.io/*
// @sandbox      raw
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==
'use strict';

// https://www.tampermonkey.net/documentation.php

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true
// jshint debug: true

/* global jQuery */

var safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

// safeWin.console.debug(JSON.stringify(GM_info, null, 2));

const btnClass = 'class="x6s0dn4 xur7f20 x1y0btm7 x9r1u3d xdh2fpr x1vjfegm x1ypdohk x78zum5 x1n2onr6 x1q0g3np ' +
                 'x1l1c18b xif65rj xuxw1ft x9gmhs3 x117nqv4 xt7dq6l xl56j7k x193iq5w xu0aao5 x1a2a7pz xb3r6kr ' +
                 'xwib8y2 x1igx7t4 x172e5tb x1y1aw1k x71s49j x87ps6o xeq5yr9 xoyzusl xa2dozc x1trvaba xwzlg83 ' +
                 'xacu4zq x1hi3wi8 xm4o3sg xudkgsl x11jfisy x8qxh4v"';

safeWin.delayChanges = function() {
  // safeWin.console.debug('##### ' + scriptName + ' delayChanges called');

  try {
    let sidebar = jQuery(".sidebar-tYw").first();
    if (typeof sidebar !== 'undefined') {
      sidebar.css("width", "600px");
    }

    let msgBox = jQuery('[class^="messagesDropdownMenu"]').first(); // ".messagesDropdownMenu-k+8"
    if (typeof msgBox !== 'undefined') {
      msgBox.css("width", "600px");
      msgBox.css("height", "540px");
      msgBox.css("maxHeight", "540px");
    }

    if (jQuery('#cleancams').length === 0) {
      jQuery(`<button type="button" id="cleancams" ${btnClass}>Clean Cams</button>`)
        .appendTo(".leftButtons-XpD").first()
        .on("click", function() {
          let webCams = jQuery('[class^="webcamOverlayItem"]');
          for (let i = 0; i < webCams.length; i++) {
            webCams[i].style.top = "6%";
            webCams[i].style.left = "2%";
            webCams[i].style.width = "80px";
            webCams[i].style.height = "80px";
          }
        });
    }

  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' delayChanges: ' + error + ' at line: ' + error.lineNumber);
    safeWin.console.dir(error);
    debugger;
  }
};

safeWin.addEventListener("load", function(){
  try {
    setInterval(function() { safeWin.delayChanges(); }, 6000);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' DocReady: ' + error + ' at line: ' + error.lineNumber);
    safeWin.console.dir(error);
    debugger;
  }
});
