// ==UserScript==
// @name         SLS Enhancer
// @description  Enhancements to SwingLifestyle.com
// @license      MIT
// @version      2024.08.15
// @author       FunWorksCouple
// @namespace    https://cinema-blue.icu
// @match        *://www.swinglifestyle.com/mailbox/*
// @icon         http://swinglifestyle.com/favicon.ico
// @downloadURL  https://static.cinema-blue.icu/tm/sls-enhancer.js
// @updateURL    https://static.cinema-blue.icu/tm/sls-enhancer.js
// @sandbox      raw
// @grant        unsafeWindow
// @inject-into  page
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

safeWin.SLS_DeleteOldMsgs = function(days) {
  var today = new Date();
  safeWin.oldData.forEach((data) => {
    if (data.unread_cnt < 1) {
      var newest_date = new Date(data.newest_message);
      var time_difference = today.getTime() - newest_date.getTime();
      var days_difference = time_difference / (1000 * 60 * 60 * 24);
      if (days_difference > days) {
        console.debug(data.chatid, days_difference);
        safeWin.socket.emit('delete_chat', safeWin.IM_USERID, data.chatid);
      }
    }
  });
  safeWin.list.empty();
};

const delayChanges = function() {
  safeWin.console.debug('##### URL', document.URL);

  if (jQuery('#delold').length === 0) {
      jQuery(`<button type="button" id="delold" style="color:black">Delete Old</button>`)
        .appendTo("#filters")
        .on("click", function() {
          safeWin.SLS_DeleteOldMsgs(10);
        });
    }
};

safeWin.addEventListener("load", function(){
  try {
    setTimeout(function() { delayChanges(); }, 2000);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' DocReady: ' + error);
    debugger;
  }
});
