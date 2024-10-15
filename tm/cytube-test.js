// ==UserScript==
// @name         CyTube Test
// @namespace    https://cinema-blue.icu
// @version      2024-10-12
// @description  Try to take over the world!
// @author       Me
// @match        https://cytu.be/r/*
// @icon         http://cytu.be/favicon.ico
// @grant        none
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.4/socket.io.min.js
// ==/UserScript==
'use strict';

/* globals jQuery, socket */

var safeWin = window.unsafeWindow || window;
var retryMS = 1;

const inject = function() {
  if (safeWin.socket && safeWin.socket.emit && safeWin.socket.prependAny) {
    safeWin.console.debug("##########  INJECT");

    if (!safeWin.__originalEmit) {
      safeWin.__originalEmit = safeWin.socket.emit;
      safeWin.socket.emit = function() {
        let args = Array.prototype.slice.call(arguments);
        safeWin.console.debug("##########  EMIT >>> ", JSON.stringify(arguments, null, 2));
        safeWin.__originalEmit.apply(safeWin.socket, args);
      };
    }

    safeWin.socket.prependAny((eventName, data)=>{
      if (eventName === "mediaUpdate") return;
      safeWin.console.debug("##########  <<< EVENT " + eventName, JSON.stringify(data, null, 2));
    });
  }

  else {
    setTimeout(()=>{ inject(); }, retryMS);
    return null;
  }
};

setTimeout(()=>{ inject(); }, 1);
