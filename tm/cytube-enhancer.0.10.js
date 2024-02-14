// ==UserScript==
// @name         CyTube Enhancer
// @author       Cinema-Blue
// @description  Make changes to CyTube for better experience. Tested in Chrome & Firefox.
// @version      0.10.026
// @namespace    https://cinema-blue.icu
// @iconURL      https://cinema-blue.icu/img/favicon.png
// @match        https://cytu.be/r/*
// @match        https://baked.live/tv/*
// @sandbox      raw
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @run-at       document-end
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// @require      https://cdn.socket.io/4.5.4/socket.io.min.js
// ==/UserScript==
'use strict';

/* globals $ */
/* globals jQuery, socket, waitForKeyElements */
/* globals USEROPTS, execEmotes, stripImages, getNameColor */

var safeWin = window.unsafeWindow || window;

const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### CyTube Enhancer Loading v' + scriptVersion);

let Base_URL = "https://static-cytube.github.io/www/";
// let Base_URL = "https://cinema-blue-ico/www/";

// debugger;

// TODO:
// overrideEmit
// customUserOpts
// CustomCallbacks
// formatChatMessage -> custom.js

// ##################################################################################################################################
// TODO: Duplicate in common.js???
/*
  if ((typeof _orgFormatMsg === "undefined") || (_orgFormatMsg === null)) {
    _orgFormatMsg = safeWin.formatChatMessage;
    safeWin.formatChatMessage = formatChatMessage;
  }
*/
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
};

// ----------------------------------------------------------------------------------------------------------------------------------
function formatChatMessage(data, last) {
  let skip = false;
  if (data.meta.addClass === "server-whisper") { skip = true; }

  // safeWin.console.debug("CyTubeEnhancer.formatChatMessage", JSON.stringify(data, null, 2));

  data.msg = stripImages(data.msg);
  data.msg = execEmotes(data.msg);

  let div = $("<div/>");

  // Add timestamps (unless disabled)
  if (USEROPTS.show_timestamps) {
    let time = $("<span/>").addClass("timestamp").appendTo(div);
    time.text(formatTimeString(data.time));
    if ((data.meta.addClass) && (data.meta.addClassToNameAndTimestamp)) {
      time.addClass(data.meta.addClass);
    }
  }

  // Add username  TODO: Add Reply
  let userName = $("<span/>");
  if (!skip) { userName.appendTo(div); }

  $("<strong/>").addClass("username").text(data.username + ": ").appendTo(userName);
  if (data.meta.modflair) { userName.addClass(getNameColor(data.meta.modflair)); }
  if ((data.meta.addClass) && (data.meta.addClassToNameAndTimestamp)) { userName.addClass(data.meta.addClass); }

  // Add the message itself
  let message = $("<span/>").appendTo(div);
  message[0].innerHTML = data.msg;

  // For /me the username is part of the message
  if (data.meta.action) {
    userName.remove();
    message[0].innerHTML = data.username + " " + data.msg;
  }
  if (data.meta.addClass) { message.addClass(data.meta.addClass); }
  if (data.meta.shadow) { div.addClass("chat-shadow"); }

  return div;
};

// ----------------------------------------------------------------------------------------------------------------------------------
const replaceFormatMsg = function() {
  if (typeof safeWin.formatChatMessage !== "undefined") {
    safeWin.formatChatMessage = formatChatMessage;
    clearInterval(replaceFormatMsgInterval);
  }
}
const replaceFormatMsgInterval = setInterval(replaceFormatMsg, 10);

// ##################################################################################################################################

const removeVid = function() {
  'use strict';
  try {
    safeWin.removeVideo(event);
  } catch (error) {
    safeWin.console.error('##### CyTube Enhancer removeVid: ' + error);
  }
};

// ##################################################################################################################################

const makeNoRefererMeta = function() {
  'use strict';
  let meta = document.createElement('meta');
  meta.name = 'referrer';
  meta.content = 'no-referrer';
  document.head.append(meta);
};

// ##################################################################################################################################

const addModeratorBtns = function() {
  if (safeWin.CLIENT.rank >= 2) {
    $('<button class="btn btn-sm btn-default" id="nextvid" title="Force Skip">Skip</button>')
      .appendTo("#leftcontrols")
      .on("click", function() { socket.emit("playNext"); });

    $('<button class="btn btn-sm btn-default" id="clear" title="Clear Chat">Clear</button>')
      .appendTo("#leftcontrols")
      .on("click", function() {
        socket.emit("chatMsg", { msg: "/clear", meta: {} });
        socket.emit("playerReady");
      });
  }
}

// ##################################################################################################################################

const notifyPing = function() {
  'use strict';
  try {
    new Audio('https://cdn.freesound.org/previews/25/25879_37876-lq.mp3').play();
  } catch {}
}

// ----------------------------------------------------------------------------------------------------------------------------------
const msgPing = function() {
  'use strict';
  try {
    new Audio('https://cdn.freesound.org/previews/662/662411_11523868-lq.mp3').play();
  } catch {}
}

// ----------------------------------------------------------------------------------------------------------------------------------
async function notifyMe(chan, title, msg) {
  'use strict';

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
    icon: 'https://static-cytube.github.io/img/favicon.png',
    silent: false,
  });

  document.addEventListener("visibilitychange", (evt) => {
      safeWin.console.debug('##### CyTube Enhancer visibilitychange');
      try {
        notify.close();
      } catch {}
    }, { once: true });

  notify.onclick = function() {
    window.parent.focus();
    notify.close();
  }

  setTimeout(() => notify.close(), 20000);

  notifyPing();
}

// ##################################################################################################################################

const delayChanges = function() {
  'use strict';

  if (typeof safeWin.Room_ID !== "undefined") {
    safeWin.console.debug('##### CyTube Already AWESOME!');
    // addModeratorBtns();
    return;
  }

  $("head").append('<link rel="stylesheet" type="text/css" id="basecss" href="' + Base_URL + 'base.css" />');
  if (typeof zoomImgCSS === "undefined") {
    $.getScript(Base_URL + "showimg.js");
  }
  $.getScript(Base_URL + "betterpm.js");

  if (typeof BOT_NICK === "undefined") { var BOT_NICK = 'xyzzy'; }
  
  makeNoRefererMeta();

  $(window).on("focus", function() { $("#chatline").focus(); });

  // Focus
  $("#chatline").attr("spellcheck", "true").attr("autocapitalize", "sentences").focus();

  $("body").keypress(function(e) {
    // Skip if editing input (label, title, description, etc.)
    if ($(e.target).is(':input, [contenteditable]')) {
      return;
    }
    $("#chatline").focus();
  });

  $("#chanjs-save-pref").prop("checked", true);
  // $("#chanjs-deny").click();

  socket.on("pm", function(data) {
    if (data.username.toLowerCase() === safeWin.CLIENT.name.toLowerCase()) { return; } // Don't talk to yourself
    if (data.msg.startsWith(String.fromCharCode(158))) { return; } // PREFIX_INFO
    if (data.to.toLowerCase() === BOT_NICK.toLowerCase()) { return; }

    notifyMe(safeWin.CHANNELNAME, data.username, data.msg);
  });

  socket.on("chatMsg", function(data) {
    msgPing();
    notifyMe(safeWin.CHANNELNAME + ': ' + data.username, data.msg);
  });

  // Enhanced PM Box
  socket.on("addUser", function(data) {
    $("#pm-" + data.name + " .panel-heading").removeClass("pm-gone");
  });

  socket.on("userLeave", function(data) {
    $("#pm-" + data.name + " .panel-heading").addClass("pm-gone");
  });

  $('<button class="btn btn-sm btn-default" id="removeVideo" title="Remove Video">Remove Video</button>')
      .appendTo("#leftcontrols")
      .on("click", function() { removeVid(); });

  $('<button class="btn btn-sm btn-default" id="clean" title="Remove Server Messages">CleanUp</button>')
    .appendTo("#leftcontrols")
    .on("click", function() {
      let $messagebuffer = $("#messagebuffer");
      $messagebuffer.find("[class^=chat-msg-\\\\\\$server]").each(function() { $(this).remove(); });
      $messagebuffer.find("[class^=chat-msg-\\\\\\$voteskip]").each(function() { $(this).remove(); });
      $messagebuffer.find("[class^=server-msg]").each(function() { $(this).remove(); });
      $messagebuffer.find("[class^=poll-notify]").each(function() { $(this).remove(); });
      $(".chat-msg-Video:not(:last)").each(function() { $(this).remove(); });
    });

  addModeratorBtns();

  setTimeout(function() {
    if ("none" !== $("#motd")[0].style.display) { $("#motd").toggle(); }
  }, 10000);

  safeWin.console.debug('##### CyTube Enhancer Loaded');
};

// ----------------------------------------------------------------------------------------------------------------------------------
safeWin.jQuery(document).ready(function() {
  'use strict';
  try {
    setTimeout(function() { delayChanges(); }, 4000);
  } catch (error) {
    safeWin.console.error('##### CyTube Enhancer: ' + error);
    debugger;
  }
});
