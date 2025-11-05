
// ==UserScript==
// @name         Mutation Observer
// @description  Mutation Observer Tester
// @author       Cinema-Blue
// @license      MIT
// @namespace    https://cinema-blue.icu
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

/* global jQuery, GM */

jQuery('body').append('<script type="text/javascript" src="https://code.jquery.com/jquery-3.7.1.min.js"></script>');

var safeWin = window.unsafeWindow || window;

const scriptName = GM.info.script.name;
const scriptVersion = GM.info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

var $body = null;

//  #################################################################################

var mutationConfig = {
  childList: true,
  subtree: true,
};

// --------------------------------------------------------------------------------
function handleVideo(videoElement) {
  safeWin.console.debug(`############  Observe Tag: ${videoElement.tagName}`);
}

// --------------------------------------------------------------------------------
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach(function(addedNode) {
        handleVideo(addedNode);

        if (addedNode.querySelectorAll) {
          addedNode.querySelectorAll('video').forEach(handleVideo);
        }
      });
    }
  });
});

//  #################################################################################

safeWin.addEventListener("load", function(){
  try {
    $body = document.body;
    observer.observe($body, mutationConfig); // Start observing
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' DocReady: ' + error + ' at line: ' + error.lineNumber);
    safeWin.console.dir(error);
    debugger;
  }
});

//  #################################################################################
//  #################################################################################
