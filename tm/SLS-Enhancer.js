// ==UserScript==
// @name         SLS Enhancer
// @description  Enhancements to SwingLifestyle.com
// @license      MIT
// @version      2024-08-15
// @author       FunWorksCouple
// @namespace    http://tampermonkey.net/
// @match        https://www.swinglifestyle.com/*
// @icon         http://swinglifestyle.com/favicon.ico
// @sandbox      raw
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
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

/* globals $, jQuery */

var safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

const delayChanges = function() {
  safeWin.console.debug('##### URL', document.URL);

let observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.attributeName === 'style') {
      safeWin.console.debug('##### STYLE change ', mutation);
    }
  });
});

let observerConfig = {
	attributes: true,
  attributeFilter: ["style"]
};

let targetNode = document.getElementById('single');
safeWin.console.debug('##### node ', targetNode);

// <div class="swal-overlay swal-overlay--show-modal" tabindex="-1">
observer.observe(targetNode, observerConfig);
}

safeWin.addEventListener("load", function(){
    var composeBox = document.querySelectorAll(".no")[2];
    if(!composeBox) {
        //The node we need does not exist yet.
        //Wait 500ms and try again
        window.setTimeout(addObserverIfDesiredNodeAvailable,500);
        return;
    }
    var config = {childList: true};
    composeObserver.observe(composeBox,config);
});
