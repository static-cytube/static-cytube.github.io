// ==UserScript==
// @name         Kosmi Enhancer
// @description  Change Kosmi for the better!
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2025-11-04
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
var debug = false;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

safeWin.console.debug(JSON.stringify(GM_info, null, 2));

var $body = null;
var $roomsDropDown = null;
var $sidebar = null;
var $sidebtns = null;
var $hideVideo = null;

//  #################################################################################

var mutationConfig = {
  childList: true,
  subtree: true,
};

// --------------------------------------------------------------------------------
function handleVideo(videoElement) {
  // safeWin.console.debug(`######  Observe Tag: ${videoElement.tagName}`);

  if (videoElement.tagName === 'VIDEO') {
    $(videoElement).on('play', function() {

      videoElement.muted = true;
      videoElement.volume = 0.0;

      if (videoElement.src !== "") {
        videoElement.id = "mainvideo";
        videoElement.volume = 0.05;
        videoElement.style.display = 'none';
     } else {
        var cam = $(videoElement).closest('DIV'); // parent DIV
        cam.addClass('camVideo');
        cam.removeAttr('style');
        cam.css({
          'top': "1%",
          'left': "1%",
          'width': '80px',
          'height': '80px',
        });
      }

      if (this.src) {
        safeWin.console.log('Video:', (this.src || 'Source Unknown'));
      }
    });

    // safeWin.console.debug('Observer attached:', videoElement);
    // safeWin.console.dir(videoElement);

    videoElement.muted = true;
  }
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
safeWin.delayChanges = function() {
  try {
    if ($roomsDropDown === null) {
      $roomsDropDown = jQuery('i.caret.down').first().parents('div').eq(1).attr('id', 'roomsDropDown');
    }

    // Add 'Toggle Video'
    if ($hideVideo === null) {
      $hideVideo = jQuery('#roomsDropDown').after('<button type="button" id="hideVideo">Video</button>');
      jQuery('#hideVideo').on('click', function() {
        jQuery('#mainvideo').toggle();
      });
    }

    if ($sidebar === null) {
      $sidebar = jQuery('i.ellipsis.horizontal').first().parents('div').eq(3).attr('id', 'sidebar');
    }
    $sidebar.css("width", "500px");

    if ($sidebtns === null) {
      $sidebtns = jQuery('i.ellipsis.horizontal').first().parents('div').eq(2).attr('id', 'sidebtns');
    }
    $sidebtns.hide();

  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' delayChanges: ' + error + ' at line: ' + error.lineNumber);
    safeWin.console.dir(error);
    debugger;
  }
};

//  #################################################################################
safeWin.addEventListener("load", function(){
  try {
    $body = document.body;
    observer.observe($body, mutationConfig); // Start observing

    if (debug) { jQuery('body').append('<script type="text/javascript" src="https://code.jquery.com/jquery-3.7.1.min.js"></script>'); }

    setInterval(function() { safeWin.delayChanges(); }, 2000);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' DocReady: ' + error + ' at line: ' + error.lineNumber);
    safeWin.console.dir(error);
    debugger;
  }
});

//  #################################################################################
//  #################################################################################
