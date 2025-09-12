// ==UserScript==
// @name         CyTube Enhancer
// @description  Make changes to CyTube for better experience. Tested in Chrome & Firefox.
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2025.09.12
// @license      MIT
// @namespace    https://cinema-blue.icu
// @iconURL      https://static.cinema-blue.icu/img/favicon.png
// @downloadURL  https://static.cinema-blue.icu/tm/cytube-enhancer.js
// @updateURL    https://static.cinema-blue.icu/tm/cytube-enhancer.js
// @exclude      https://cytu.be/r/jackandchat
// @match        https://cytu.be/r/*
// @match        https://baked.live/tv/*
// @match        https://synchtube.ru/r/*
// @match        https://cytube.gvid.tv/r/*
// @sandbox      raw
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.4/socket.io.min.js
// ==/UserScript==
'use strict';

// https://cdnjs.com/libraries/jquery

// https://www.tampermonkey.net/documentation.php

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals jQuery, socket, CLIENT, BOT_NICK, execEmotes, stripImages, getNameColor */

// localStorage.debug = '*';
// localStorage.debug = 'socket.io-client:socket';
localStorage.removeItem('debug');

var safeWin = window.unsafeWindow || window;
if (typeof CBE === 'undefined') { var CBE = {}; }

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;

const debug = false;
if (debug) {
  safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);
  if (typeof jQuery !== 'undefined') { safeWin.console.debug('##### jQuery v', jQuery.fn.jquery); }
}

let Base_URL = 'https://static.cinema-blue.icu/';

jQuery('<link>').appendTo('head').attr({ type:'text/css', rel:'stylesheet', href:'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.css', });

safeWin.localStorage.removeItem('xyz');
safeWin.xyz = 'X';

// ##################################################################################################################################

CBE.formatChatTime = function(datetime) {
  if (!(datetime instanceof Date)) { datetime = new Date(datetime); }

  let _now = new Date();
  let localDT = null;

  if (debug) {
    safeWin.console.debug("CyTubeEnhancer.formatChatTime.now", _now);
    safeWin.console.debug("CyTubeEnhancer.formatChatTime.datetime", datetime);
    safeWin.console.debug("CyTubeEnhancer.formatChatTime.diff", (_now - datetime));
    safeWin.console.debug("CyTubeEnhancer.formatChatTime.diff", (_now - datetime));
  }

  if (datetime.getMonth() !== _now.getMonth()) { // Different Month
    localDT = new Intl.DateTimeFormat('default', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(datetime); // MM/dd HH:mm
  } else if (datetime.toDateString() !== _now.toDateString()) { // Different Day
    localDT = new Intl.DateTimeFormat('default', {
        day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(datetime); // dd HH:mm
  } else {
    localDT = new Intl.DateTimeFormat('default', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).format(datetime); // HH:mm:ss
  }

  let tsStr = localDT;
  return tsStr.replace(',','') + " ";
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.formatChatMessage = function(data, last) {
  let skip = false;
  if (data.meta.addClass === "server-whisper") { skip = true; }

  if (debug) {
    safeWin.console.debug("CyTubeEnhancer.formatChatMessage.data", JSON.stringify(data, null, 2));
    safeWin.console.debug("CyTubeEnhancer.formatChatMessage.last", JSON.stringify(last, null, 2));
  }

  data.msg = stripImages(data.msg);
  data.msg = execEmotes(data.msg);

  let div = jQuery("<div/>");

  // Add timestamps (unless disabled)
  if (safeWin.USEROPTS.show_timestamps) {
    let time = jQuery("<span/>").addClass("timestamp").appendTo(div);
    time.text(CBE.formatChatTime(data.time));
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
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.replaceFormatMsg = function() {
  if (typeof safeWin.formatChatMessage !== 'undefined') {
    safeWin.formatChatMessage = CBE.formatChatMessage;
    clearInterval(CBE.replaceFormatMsgInterval);
  }
};
CBE.replaceFormatMsgInterval = setInterval(CBE.replaceFormatMsg, 10);

// ##################################################################################################################################

CBE.alwaysChanges = function() {
  safeWin.USEROPTS.first_visit = false;
  safeWin.USEROPTS.blink_title = "onlyping";
  safeWin.USEROPTS.boop = "onlyping";
  safeWin.USEROPTS.notifications = "never";
  safeWin.USEROPTS.hidevid = false;
  safeWin.USEROPTS.modhat = true;
  safeWin.USEROPTS.show_ip_in_tooltip = true;
  safeWin.USEROPTS.show_shadowchat = true;
  safeWin.USEROPTS.show_timestamps = true;
  safeWin.USEROPTS.sort_afk = false;
  safeWin.USEROPTS.sort_rank = false;

  if (safeWin.USEROPTS.synch) {
    safeWin.USEROPTS.sync_accuracy = 10;
  }

  jQuery("#chatline")
    .css({"color":"white", })
    .attr("placeholder", CLIENT.name)
    .attr("spellcheck", "true")
    .attr("autocapitalize", "sentences");

  jQuery(".pm-input")
    .css({"color":"white", })
    .attr("placeholder", CLIENT.name)
    .attr("spellcheck", "true")
    .attr("autocapitalize", "sentences");

  if ((jQuery("#videowrap").width() / jQuery("#wrap").width()) > 0.6) {
    safeWin.CyTube.ui.changeVideoWidth(1);
  }
};

// ##################################################################################################################################

CBE.nonAdminChanges = function() {
  CBE.alwaysChanges();

  if (jQuery('#clonePlaylist').length === 0) {
    jQuery('<button class="btn btn-sm btn-default" id="clonePlaylist" title="Clone Playlist"><i class="fa-solid fa-clone"></i>&nbsp;Clone</button>')
        .appendTo("#leftcontrols")
        .on("click", function() { CBE.clonePlaylist(); });
  }

  if (jQuery('#removeVideo').length === 0) {
    jQuery('<button class="btn btn-sm btn-default" id="removeVideo" title="Remove Video"><i class="fa-solid fa-trash"></i>&nbsp;Remove&nbsp;Video</button>')
        .appendTo("#leftcontrols")
        .on("click", function() { CBE.removeVid(); });
  }

  if (jQuery('#clean').length === 0) {
    jQuery('<button class="btn btn-sm btn-default" id="clean" title="Remove Server Messages"><i class="fa-solid fa-broom"></i>&nbsp;CleanUp</button>')
      .appendTo("#leftcontrols")
      .on("click", function() {
        let _messagebuffer = jQuery("#messagebuffer");
        _messagebuffer.find("[class^=server-whisper]").each(function() { jQuery(this).parent().remove(); });
        _messagebuffer.find("[class^=poll-notify]").each(function() { jQuery(this).remove(); });
        _messagebuffer.find("[class^=chat-msg-\\\\\\$server]").each(function() { jQuery(this).remove(); });
        _messagebuffer.find("[class^=server-msg]").each(function() { jQuery(this).remove(); });
        _messagebuffer.find("[class^=chat-shadow]").each(function() { jQuery(this).remove(); });
        jQuery(".chat-msg-Video:not(:last)").each(function() { jQuery(this).remove(); });
      });
  }

  if (jQuery('#leader').length === 0) {
    jQuery('<button class="btn btn-sm btn-default" id="leader">Leader</button>')
      .appendTo("#plcontrol")
      .on("click", function() {
        CLIENT.leader = !CLIENT.leader;
        if (CLIENT.leader) { jQuery(this).removeClass("btn-default").addClass("btn-warning"); }
        else { jQuery(this).removeClass("btn-warning").addClass("btn-default"); }
      });
  }
};

// ##################################################################################################################################

CBE.clonePlaylist = function() {
  var playlist = "";
  jQuery('.qe_title').each(function(){
    playlist += '{"url":"' + jQuery(this).attr('href') + '","title":"' + jQuery(this).text() + '"},\r\n';
  });

  if (playlist.trim().length < 1) {
    alert("Playlist EMPTY");
    return;
  }

  var playlistlink = document.createElement("a");
  playlistlink.href = URL.createObjectURL(new Blob([playlist,], { type: 'text/plain;charset=utf-8', }));
  playlistlink.download = safeWin.CHANNELNAME + ".txt";
  playlistlink.click();
  URL.revokeObjectURL(playlistlink.href);
};

// ##################################################################################################################################

CBE.removeVid = function() {
  try {
    safeWin.removeVideo(event);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' removeVid: ' + error);
  }
};

// ##################################################################################################################################

CBE.resizeVid = function() {
  let videoWidth = 'col-md-8 col-lg-8';
  jQuery("#videowrap").attr("class", videoWidth);
  jQuery("#rightcontrols").attr("class", videoWidth);
  jQuery("#rightpane").attr("class", videoWidth);

  let chatWidth = 'col-md-4 col-lg-4';
  jQuery("#chatwrap").attr("class", chatWidth);
  jQuery("#leftcontrols").attr("class", chatWidth);
  jQuery("#leftpane").attr("class", chatWidth);
};

// ##################################################################################################################################

CBE.makeNoRefererMeta = function() {
  let meta = document.createElement('meta');
  meta.name = 'referrer';
  meta.content = 'no-referrer';
  document.head.append(meta);
};

// ##################################################################################################################################

CBE.refreshVideo = function() {
  if (safeWin.PLAYER) {
    safeWin.PLAYER.mediaType = "";
    safeWin.PLAYER.mediaId = "";
  } else if (safeWin.CurrentMedia) {
    safeWin.loadMediaPlayer(safeWin.CurrentMedia);
  }

  // playerReady triggers server to send changeMedia which reloads player
  safeWin.socket.emit('playerReady');
};

// ##################################################################################################################################

CBE.overrideMediaRefresh = function() { // Override #mediarefresh.click to increase USEROPTS.sync_accuracy
  jQuery(document).off('click', '#mediarefresh').on('click', '#mediarefresh', function() {
    if (safeWin.USEROPTS.sync_accuracy < 41) {
      safeWin.USEROPTS.synch = true;
      safeWin.USEROPTS.sync_accuracy += 20;
    } else {
      safeWin.USEROPTS.synch = false;
    }
    safeWin.storeOpts();
    safeWin.applyOpts();

    CBE.refreshVideo();
  });
};

// ##################################################################################################################################

CBE.addModeratorBtns = function() {
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

CBE.notifyPing = function() {
  try {
    new Audio(Base_URL + 'tm/plink.mp3').play();
  } catch {}
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.msgPing = function() {
  try {
    new Audio(Base_URL + 'tm/tink.mp3').play();
  } catch {}
};

// ----------------------------------------------------------------------------------------------------------------------------------
async function notifyMe(chan, title, msg) {
  if (document.hasFocus()) { CBE.msgPing(); return; }

  if (!("Notification" in safeWin)) { return; } // NOT supported
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
      if (debug) { safeWin.console.debug('##### ' + scriptName + ' visibilitychange'); }
      try {
        notify.close();
      } catch {}
    }, { once: true, });

  notify.onclick = function() {
    safeWin.parent.focus();
    notify.close();
  };

  setTimeout(() => notify.close(), 20000);

  CBE.notifyPing();
}

// ##################################################################################################################################

CBE.delayChanges = function() {
  if (typeof safeWin.Room_ID !== 'undefined') {
    safeWin.console.info('##### CyTube Already AWESOME!');
    CBE.nonAdminChanges();
    return;
  }
  CBE.alwaysChanges();

  jQuery("head").append('<link rel="stylesheet" type="text/css" id="basecss" href="' + Base_URL + 'www/base.min.css?v=' + Date.now() + '" />');
  jQuery('#chancss').remove();

  if (typeof zoomImgCSS === 'undefined') {
    jQuery.getScript(Base_URL + 'www/showimg.min.js');
  }
  jQuery.getScript(Base_URL + 'www/betterpm.min.js');

  CBE.makeNoRefererMeta();

  jQuery(safeWin).on("focus", function() { jQuery("#chatline").focus(); });

  jQuery("#chatline").on("focus", function() {
    jQuery("#chatline")
      .css({"color":"white", })
      .attr("placeholder", CLIENT.name)
      .attr("spellcheck", "true")
      .attr("autocapitalize", "sentences");
  });

  jQuery("body").keypress(function(e) {
    // Skip if editing input (label, title, description, etc.)
    if (jQuery(e.target).is(':input, [contenteditable]')) {
      return;
    }
    jQuery("#chatline").focus();
  });

  jQuery("#chanjs-save-pref").prop("checked", true);
  jQuery("#chanjs-deny").css("display", "inline");

  if (typeof BOT_NICK === 'undefined') { var BOT_NICK = "xyzzy"; }
  socket.on("pm", function(data) {
    if (data.username.toLowerCase() === safeWin.CLIENT.name.toLowerCase()) { return; } // Don't talk to yourself
    if (data.msg.startsWith(String.fromCharCode(158))) { return; } // PREFIX_INFO
    if (data.to.toLowerCase() === BOT_NICK.toLowerCase()) { return; }

    notifyMe(safeWin.CHANNELNAME, data.username, data.msg);
  });

  socket.on("chatMsg", function(data) {
    if (jQuery("#messagebuffer").find("[class^=server-whisper]").length > 0) { return; } // Don't ping server messages
    CBE.msgPing();
    notifyMe(safeWin.CHANNELNAME + ': ' + data.username, data.msg);
  });

  // Enhanced PM Box
  socket.on("addUser", function(data) {
    jQuery("#pm-" + data.name + " .panel-heading").removeClass("pm-gone");
  });

  socket.on("userLeave", function(data) {
    jQuery("#pm-" + data.name + " .panel-heading").addClass("pm-gone");
  });

  socket.on("changeMedia", function(data) {
    let msg = `{"url":"` + data.id + `","type":"` + data.type + `","title":"` + data.title + `"},`;
    safeWin.console.debug(msg);
    CBE.resizeVid();
  });

  CBE.nonAdminChanges();
  CBE.addModeratorBtns();
  CBE.overrideMediaRefresh();

  setTimeout(function() {
    jQuery("#motd").height()
    if (("none" !== jQuery("#motd")[0].style.display) &&
        (jQuery("#motd").height() > 192))
      { jQuery("#motd").toggle(); }
  }, 4000);

  // window.CyTube.ui.changeVideoWidth(1);

  safeWin.console.info('##### ' + scriptName + ' Loaded');
};

// ----------------------------------------------------------------------------------------------------------------------------------
// https://stackoverflow.com/questions/807878/how-to-make-javascript-execute-after-page-load

safeWin.addEventListener("load", function(){
  try {
    safeWin.addEventListener('error', async function(ev) {
      if (ev.target instanceof HTMLVideoElement) {
        safeWin.console.error("##### EventListener.ERROR " + ev.target, ev);
        safeWin.console.debug("ev.target", JSON.stringify(ev.target, null, 2));
      }
    }, true);

    setTimeout(function() { CBE.delayChanges(); }, 2000);
  } catch (error) {
    safeWin.console.error('##### ' + scriptName + ' DocReady: ' + error);
    debugger;
  }
});
