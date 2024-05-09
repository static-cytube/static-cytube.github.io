// ==UserScript==
// @name         CyTube Enhancer
// @author       Cinema-Blue
// @description  Make changes to CyTube for better experience. Tested in Chrome & Firefox.
// @version      2024-05-08-1110
// @license      MIT
// @namespace    https://cinema-blue.icu
// @iconURL      https://static.cinema-blue.icu/img/favicon.png
// @downloadURL  https://static.cinema-blue.icu/tm/cytube-enhancer.js
// @updateURL    https://static.cinema-blue.icu/tm/cytube-enhancer.js
// @match        https://cytu.be/r/*
// @match        https://baked.live/tv/*
// @match        https://synchtube.ru/r/*
// @sandbox      raw
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// @require      https://cdn.socket.io/4.5.4/socket.io.min.js
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

/* globals jQuery, socket, USEROPTS, BOT_NICK, execEmotes, stripImages, getNameColor */

var safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

let Base_URL = 'https://static.cinema-blue.icu/';

jQuery('<link>').appendTo('head').attr({ type:'text/css', rel:'stylesheet', href:'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.css', });

// ##################################################################################################################################

function formatTimeString(datetime) {
  if (!(datetime instanceof Date)) { datetime = new Date(datetime); }

  let now = new Date();
  let localDT = null;

  if (datetime.toDateString() !== now.toDateString()) { // Different Day
    localDT = new Intl.DateTimeFormat('default', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(datetime); // MM/dd HH:mm
  } else {
    localDT = new Intl.DateTimeFormat('default', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).format(datetime); // HH:mm:ss
  }

  let tsStr = localDT;
  return tsStr.replace(',','') + " ";
}

// ----------------------------------------------------------------------------------------------------------------------------------
function formatChatMessage(data, last) {
  let skip = false;
  if (data.meta.addClass === "server-whisper") { skip = true; }

  // safeWin.console.debug("CyTubeEnhancer.formatChatMessage", JSON.stringify(data, null, 2));

  data.msg = stripImages(data.msg);
  data.msg = execEmotes(data.msg);

  let div = jQuery("<div/>");

  // Add timestamps (unless disabled)
  if (USEROPTS.show_timestamps) {
    let time = jQuery("<span/>").addClass("timestamp").appendTo(div);
    time.text(formatTimeString(data.time));
    if ((data.meta.addClass) && (data.meta.addClassToNameAndTimestamp)) {
      time.addClass(data.meta.addClass);
    }
  }

  // Add username  TODO: Add Reply
  let userName = jQuery("<span/>");
  if (!skip) { userName.appendTo(div); }

  jQuery("<strong/>").addClass("username").text(data.username + ": ").appendTo(userName);
  if (data.meta.modflair) { userName.addClass(getNameColor(data.meta.modflair)); }
  if ((data.meta.addClass) && (data.meta.addClassToNameAndTimestamp)) { userName.addClass(data.meta.addClass); }

  // Add the message itself
  let message = jQuery("<span/>").appendTo(div);
  message[0].innerHTML = data.msg;

  // For /me the username is part of the message
  if (data.meta.action) {
    userName.remove();
    message[0].innerHTML = data.username + " " + data.msg;
  }
  if (data.meta.addClass) { message.addClass(data.meta.addClass); }
  if (data.meta.shadow) { div.addClass("chat-shadow"); }

  return div;
}

// ----------------------------------------------------------------------------------------------------------------------------------
const replaceFormatMsg = function() {
  if (typeof safeWin.formatChatMessage !== 'undefined') {
    safeWin.formatChatMessage = formatChatMessage;
    clearInterval(replaceFormatMsgInterval);
  }
};
const replaceFormatMsgInterval = setInterval(replaceFormatMsg, 20);

// ##################################################################################################################################

const clonePlaylist = function() {
  var playlist = "";
  jQuery('.qe_title').each(function(){
    playlist += '{"title":"' + this.textContent + '","url":"' + this.href + '"},\r\n';
  });

  var playlistlink = document.createElement("a");
  playlistlink.href = URL.createObjectURL(new Blob([playlist,], { type: 'text/plain;charset=utf-8', }));
  playlistlink.download = safeWin.CHANNELNAME + ".txt";
  playlistlink.click();
  URL.revokeObjectURL(playlistlink.href);
};

// ##################################################################################################################################

const removeVid = function() {
  try {
    safeWin.removeVideo(event);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' removeVid: ' + error);
  }
};

// ##################################################################################################################################

const makeNoRefererMeta = function() {
  let meta = document.createElement('meta');
  meta.name = 'referrer';
  meta.content = 'no-referrer';
  document.head.append(meta);
};

// ##################################################################################################################################

const addModeratorBtns = function() {
  if (safeWin.CLIENT.rank >= 2) {
    if (jQuery('#nextvid').length === 0) {
      jQuery('<button class="btn btn-sm btn-default" id="nextvid" title="Force Skip"><i class="fa-solid fa-circle-right"></i>&nbsp;Skip</button>')
        .appendTo("#leftcontrols")
        .on("click", function() { socket.emit("playNext"); });
    }

    if (jQuery('#clear').length === 0) {
      jQuery('<button class="btn btn-sm btn-default" id="clear" title="Clear Chat"><i class="fa-solid fa-scissors"></i>&nbsp;Clear</button>')
        .appendTo("#leftcontrols")
        .on("click", function() {
          socket.emit("chatMsg", { msg: "/clear", meta: {}, });
          socket.emit("playerReady");
        });
    }
  }
};

// ##################################################################################################################################

const notifyPing = function() {
  try {
    new Audio(Base_URL + 'tm/plink.mp3').play();
  } catch {}
};

// ----------------------------------------------------------------------------------------------------------------------------------
const msgPing = function() {
  try {
    new Audio(Base_URL + 'tm/tink.mp3').play();
  } catch {}
};

// ----------------------------------------------------------------------------------------------------------------------------------
async function notifyMe(chan, title, msg) {
  if (document.hasFocus()) { msgPing(); return; }

  if (!("Notification" in window)) { return; } // NOT supported
    if (Notification.permission === 'denied') { return; }

  if (Notification.permission !== "granted") {
    let permission = await Notification.requestPermission();
  }

  if (Notification.permission !== "granted") { return; }

  const notify = new Notification(chan + ': ' + title, {
    body: msg,
    tag: chan,
    lang: "en-US",
    icon: Base_URL + 'tm/favicon.png',
    silent: false,
  });

  // Close notification if window becomes visible
  document.addEventListener("visibilitychange", (evt) => {
      safeWin.console.debug('##### ' + scriptName + ' visibilitychange');
      try {
        notify.close();
      } catch {}
    }, { once: true, });

  notify.onclick = function() {
    window.parent.focus();
    notify.close();
  };

  setTimeout(() => notify.close(), 20000);

  notifyPing();
}

// ##################################################################################################################################

const nonAdminChanges = function() {
  if (jQuery('#clonePlaylist').length === 0) {
    jQuery('<button class="btn btn-sm btn-default" id="clonePlaylist" title="Clone Playlist"><i class="fa-solid fa-clone"></i>&nbsp;Clone</button>')
        .appendTo("#leftcontrols")
        .on("click", function() { clonePlaylist(); });
  }

  if (jQuery('#removeVideo').length === 0) {
    jQuery('<button class="btn btn-sm btn-default" id="removeVideo" title="Remove Video"><i class="fa-solid fa-trash"></i>&nbsp;Remove&nbsp;Video</button>')
        .appendTo("#leftcontrols")
        .on("click", function() { removeVid(); });
  }

  if (jQuery('#clean').length === 0) {
    jQuery('<button class="btn btn-sm btn-default" id="clean" title="Remove Server Messages"><i class="fa-solid fa-broom"></i>&nbsp;CleanUp</button>')
      .appendTo("#leftcontrols")
      .on("click", function() {
        let _messagebuffer = jQuery("#messagebuffer");
        _messagebuffer.find("[class^=server-whisper]").each(function() { jQuery(this).remove(); });
        _messagebuffer.find("[class^=poll-notify]").each(function() { jQuery(this).remove(); });
        jQuery(".chat-msg-Video:not(:last)").each(function() { jQuery(this).remove(); });
      });
  }
}

// ##################################################################################################################################

const delayChanges = function() {
  if (typeof safeWin.Room_ID !== 'undefined') {
    safeWin.console.debug('##### CyTube Already AWESOME!');
    nonAdminChanges();
    return;
  }

  jQuery("head").append('<link rel="stylesheet" type="text/css" id="basecss" href="' + Base_URL + 'www/base.css" />');
  if (typeof zoomImgCSS === 'undefined') {
    jQuery.getScript(Base_URL + 'www/showimg.js');
  }
  jQuery.getScript(Base_URL + 'www/betterpm.js');

  makeNoRefererMeta();

  jQuery(window).on("focus", function() { jQuery("#chatline").focus(); });

  // Focus
  jQuery("#chatline").attr("spellcheck", "true").attr("autocapitalize", "sentences").focus();

  jQuery("body").keypress(function(e) {
    // Skip if editing input (label, title, description, etc.)
    if (jQuery(e.target).is(':input, [contenteditable]')) {
      return;
    }
    jQuery("#chatline").focus();
  });

  jQuery("#chanjs-save-pref").prop("checked", true);

  if (typeof BOT_NICK === 'undefined') { var BOT_NICK = "xyzzy"; }
  socket.on("pm", function(data) {
    if (data.username.toLowerCase() === safeWin.CLIENT.name.toLowerCase()) { return; } // Don't talk to yourself
    if (data.msg.startsWith(String.fromCharCode(158))) { return; } // PREFIX_INFO
    if (data.to.toLowerCase() === BOT_NICK.toLowerCase()) { return; }

    notifyMe(safeWin.CHANNELNAME, data.username, data.msg);
  });

  socket.on("chatMsg", function(data) {
    if (jQuery("#messagebuffer").find("[class^=server-whisper]").length > 0) { return; } // Don't ping server messages
    msgPing();
    notifyMe(safeWin.CHANNELNAME + ': ' + data.username, data.msg);
  });

  // Enhanced PM Box
  socket.on("addUser", function(data) {
    jQuery("#pm-" + data.name + " .panel-heading").removeClass("pm-gone");
  });

  socket.on("userLeave", function(data) {
    jQuery("#pm-" + data.name + " .panel-heading").addClass("pm-gone");
  });

  nonAdminChanges();
  addModeratorBtns();

  setTimeout(function() {
    if ("none" !== jQuery("#motd")[0].style.display) { jQuery("#motd").toggle(); }
  }, 8000);

  safeWin.console.debug('##### ' + scriptName + ' Loaded');
};

// ----------------------------------------------------------------------------------------------------------------------------------
// https://stackoverflow.com/questions/807878/how-to-make-javascript-execute-after-page-load

safeWin.addEventListener("load", function(){
  try {
    setTimeout(function() { delayChanges(); }, 2000);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' DocReady: ' + error);
    debugger;
  }
});
