/*!  CyTube Enhancements: Common
**|  Version: 2024.09.21
**@preserve
*/

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals socket, addChatMessage, removeVideo, makeAlert, applyOpts, storeOpts, videojs */
/* globals CHANNEL, CLIENT, CHANNEL_DEBUG, PLAYER, BOT_NICK, MOTD_MSG */
/* globals START, ROOM_ANNOUNCEMENT, MOD_ANNOUNCEMENT, ADVERTISEMENT */
/* globals CBE, GUESTS_CHAT, MOTD_ROOMS, MOTD_RULES, Rank */

'use strict';

// ----------------------------------------------------------------------------------------------------------------------------------
jQuery('head').append('<meta name="referrer" content="no-referrer" />');

// https://fontawesome.com/search?c=media-playback&o=r
// https://cdnjs.com/libraries/font-awesome
jQuery('<link>').appendTo('head').attr({ id: 'font-awesome', type: 'text/css', rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css', });

// ----------------------------------------------------------------------------------------------------------------------------------
// Global Variables
const messageExpireTime = 1000 * 60 * 2; // 2 Minutes
const chatExpireTime = 1000 * 60 * 60 * 2; // 2 Hours
const previewTime = 1000 * 60 * 5; // 5 Minutes

const Rooms_Base = CBE.Root_URL + 'rooms/';

const Rules_URL = Rooms_Base + 'cytube-rules.html';
const Rooms_URL = Rooms_Base + 'cytube-rooms.html';
const Footer_URL = CBE.Base_URL + 'footer.html';
const Logo_URL =  CBE.Room_URL + 'logo.png';
const Favicon_URL = CBE.Room_URL + 'favicon.png';

const PREFIX_RELOAD = String.fromCharCode(156); // 0x9C
const PREFIX_IGNORE = String.fromCharCode(157); // 0x9D
const PREFIX_INFO = String.fromCharCode(158); // 0x9E
const PREFIX_MUTE = String.fromCharCode(159); // 0x9F

var GUEST_WARN = false;
const GUEST_WARNING = `NOTICE: You are in Preview mode. You must&nbsp; <a href="https://cytu.be/register">REGISTER</a> &nbsp;to chat or PM in this room.`;

CBE.$chatline = jQuery("#chatline");
CBE.$messagebuffer = jQuery("#messagebuffer");
CBE.$userlist = jQuery("#userlist");
CBE.$userListItems = jQuery("#userlist .userlist_item");

CBE._originalCallbacks = {};
CBE._originalEmit = null;
CBE._originalRemoveVideo = null;
CBE._notifyPing = null;
CBE._msgPing = null;
CBE._store = false;

CBE.LAST_PM = "";

// ##################################################################################################################################

// Test for localStorage
if (typeof Storage !== "undefined") {
  let tst = 'store';
  try {
    localStorage.setItem(tst, tst);
    localStorage.removeItem(tst);
    CBE._store = true;
  } catch {}
}

// ##################################################################################################################################

CBE.Sleep = function(sleepMS) {
  // USE: await Sleep(2000);
  return new Promise(function(resolve) { setTimeout(resolve, sleepMS); });
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.timeString = function(datetime) {
  if (!(datetime instanceof Date)) { datetime = new Date(datetime); }

  let now = new Date();
  let localDT = new Intl.DateTimeFormat('default', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).format(datetime);

  let parts = localDT.split(/[\s,]+/);
  let tsStr = parts[1];
  if (datetime.toDateString() !== now.toDateString()) { tsStr = parts[0] + " " + tsStr; }

  return "[" + tsStr + "]";
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.formatConsoleMsg = function(desc, data = null) {
  let msg = desc;

  if ((typeof data !== 'undefined') && (data)) {
    if (typeof data === 'function') {
      msg += ': ' + data.toString();
     } else {
      msg += ': ' + JSON.stringify(data, null, 2);
    }
  }

  return "[" + new Date().toTimeString().split(" ")[0] + "] " + msg;
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.traceLog = function(desc, data = null) {
  window.console.log(CBE.formatConsoleMsg(desc));

  if (CHANNEL_DEBUG && (typeof data !== 'undefined') && (data)) {
    window.console.debug(JSON.stringify(data, null, 2));
  }
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send debug msg to console
CBE.debugData = function(desc, data = null) {
  if (!CHANNEL_DEBUG) { return; }
  window.console.debug(CBE.formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send warning msg to console
CBE.warnData = function(desc, data = null) {
  window.console.warn(CBE.formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send error msg to console
CBE.errorData = function(desc, data = null) {
  window.console.error(CBE.formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send log msg to console
CBE.logData = function(desc, data = null) {
  window.console.log(CBE.formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Admin Debugger
CBE.debugListener = function(eventName, data) {
  if (eventName.toLowerCase() === "mediaupdate") { return; }
  window.console.info(CBE.formatConsoleMsg(eventName, data));
};

// ##################################################################################################################################

CBE.hmsToSeconds = function(hms) {
  let part = hms.split(':'), secs = 0, mins = 1;
  while (part.length > 0) {
    secs += (mins * parseInt(part.pop(), 10));
    mins *= 60;
  }
  return secs;
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.secondsToHMS = function(secs) {
  let start = 15;
       if (secs >= 36000) { start = 11; }
  else if (secs >= 3600)  { start = 12; }
  else if (secs >= 600)   { start = 14; }
  return new Date(secs * 1000).toISOString().substring(start, 19);
};

// ##################################################################################################################################

CBE.whisper = function(msg) {
  addChatMessage({
    msg: msg, time: Date.now(), username: '[server]', msgclass: 'server-whisper',
    meta: { shadow: false, addClass: 'server-whisper', addClassToNameAndTimestamp: true, },
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.fChat = function(msg) {
  addChatMessage({ msg: msg, time: Date.now(), username: CLIENT.name, meta: {}, });
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.fPM = function(to, msg) {
  msg = window.formatChatMessage({ "username": CLIENT.name, "msg": msg, "meta": {}, "time": Date.now(), "to": to, }, { "name": "", }, );
  let buf = window.initPm(to).find(".pm-buffer");
  msg.appendTo(buf);
};

// ##################################################################################################################################

// JQuery Wait for an HTML element to exist
CBE.waitForElement = function(selector, callback, checkFreqMs, timeoutMs) {
  let startTimeMs = Date.now();
  (function loopSearch() {
    if (jQuery(selector).length) {
      callback();
      return;
    }
    else {
      setTimeout(function() {
        if (timeoutMs && ((Date.now() - startTimeMs) > timeoutMs)) { return; }
        loopSearch();
      }, checkFreqMs);
    }
  })();
};

// ##################################################################################################################################

CBE.notifyPing = function() {
  if (Notification.permission !== "granted") { return; }
  try {
    if (CBE._notifyPing) { CBE._notifyPing.play(); }
  } catch {}
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.msgPing = function() {
  if (Notification.permission !== "granted") { return; }
  try {
    if (CBE._msgPing) { CBE._msgPing.play(); }
  } catch {}
};

// ##################################################################################################################################

// Get User from UserList
CBE.getUser = function(name) {
  let user = null;
  CBE.$userListItems.each(function(index, item) {
    let data = jQuery(item).data();
    if (Object.keys(data).length < 6) { return null; }
    if (data.name.toLowerCase() === name.toLowerCase()) { user = data; }
  });
  return user;
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.isUserHere = function(name) {
  return (CBE.getUser(name) !== null);
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Is User Idle?
CBE.isUserAFK = function(name) {
  let afk = false;
  let user = CBE.getUser(name);
  if (!user) { afk = false; } else { afk = user.meta.afk; }
  return afk;
};

// ##################################################################################################################################

async function notifyMe(chan, title, msg) {
  CBE.debugData("common.notifyMe", arguments);

  if (document.hasFocus()) { CBE.msgPing(); return; }

  if (!("Notification" in window)) { return; } // NOT supported

  if (Notification.permission === 'denied') {
    CBE.debugData("common.notifyMe.permission", Notification.permission);
    return;
 }

  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }

  CBE.debugData("common.notifyMe.permission", Notification.permission);
  if (Notification.permission !== "granted") { return; }

  CBE.notifyPing();

  const notify = new Notification(chan + ': ' + title, {
    body: msg,
    tag: chan,
    lang: "en-US",
    icon: 'https://static.cinema-blue.icu/img/favicon.png',
    silent: false,
  });

  document.addEventListener("visibilitychange", function(evt) {
      try {
        CBE.debugData("common.notifyMe.visibilitychange", evt);
        notify.close();
      } catch {}
    }, { once: true, });

  notify.onclick = function() {
    CBE.debugData("common.notifyMe.onclick");
    window.parent.focus();
    notify.close();
  };

  setTimeout(function() { notify.close(); }, 20000);
}

// ##################################################################################################################################

//  Room Announcements
CBE.roomAnnounce = function(msg) {
  if (msg.length < 1) { return; }
  if (window.CLIENT.rank < window.Rank.Member) { return; }
  if (BOT_NICK.toLowerCase() === CLIENT.name.toLowerCase()) { return; }

  jQuery(function() {
    makeAlert("Message from Admin", msg).attr("id","roomAnnounce").appendTo("#announcements");
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
//  Moderator Announcements
CBE.modAnnounce = function(msg) {
  if (msg.length < 1) { return; }
  if (window.CLIENT.rank < window.Rank.Moderator) { return; }
  if (BOT_NICK.toLowerCase() === CLIENT.name.toLowerCase()) { return; }

  jQuery(function() {
    makeAlert("Moderators", msg).attr("id","modAnnounce").appendTo("#announcements");
  });
};

// ##################################################################################################################################

CBE.hideVideoURLs = function() {
  setTimeout(function() {
    jQuery(".qe_title").each(function(idx, data) {
      let _this = jQuery(this);
      if (_this.is("a")) {
        _this.replaceWith('<span class="qe_title" href="' + _this.attr('href') + '">' + _this.text() + '</span>');
      }
    });

    jQuery("#queue li.queue_entry").removeAttr("title");
    if (window.CLIENT.rank > Rank.Member) {
      jQuery("#queue li.queue_entry div.btn-group").hide(); // Hide Controls
    }
  }, 2000);
};

if (window.CLIENT.rank < Rank.Moderator) {
  window.socket.on("changeMedia",     CBE.hideVideoURLs());
  window.socket.on("playlist",        CBE.hideVideoURLs());
  window.socket.on("setPlaylistMeta", CBE.hideVideoURLs());
  window.socket.on("shufflePlaylist", CBE.hideVideoURLs());
}

// ##################################################################################################################################

// Change the Video Title

CBE.VideoInfo = { title: "None", current: 0, duration: 0, };

CBE.setVideoTitle = function() {
  if (CBE.VideoInfo.duration < 1) { CBE.VideoInfo.duration = CBE.VideoInfo.current; }
  let remaining = Math.round(CBE.VideoInfo.duration - CBE.VideoInfo.current);
  jQuery("#currenttitle").html("Playing: <strong>" + CBE.VideoInfo.title + "</strong> &nbsp; (" + CBE.secondsToHMS(remaining) + ")");
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.refreshVideo = function() {
  CBE.debugData("common.refreshVideo", window.CurrentMedia);

  if (window.PLAYER) {
    PLAYER.mediaType = "";
    PLAYER.mediaId = "";
  } else if (window.CurrentMedia) {
    window.loadMediaPlayer(window.CurrentMedia);
  }

  // playerReady triggers server to send changeMedia which reloads player
  window.socket.emit('playerReady');
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Player Error Reload
CBE.videoFix = function() {
  CBE.debugData("common.videoFix");

  let vplayer = videojs('ytapiplayer');
  vplayer.on("error", function(e) {
    CBE.errorData("common.Reloading Player", e);
    vplayer.createModal("ERROR: Reloading player!");

    window.setTimeout(function() { CBE.refreshVideo(); }, 2000);
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.videoErrorHandler = function(event) {
  CBE.errorData('common.videoErrorHandler', event);
  CBE.refreshVideo();
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.overrideMediaRefresh = function() { // Override #mediarefresh.click to increase USEROPTS.sync_accuracy
  jQuery(document).off('click', '#mediarefresh').on('click', '#mediarefresh', function() {
    if (window.USEROPTS.sync_accuracy < 20) {
      window.USEROPTS.synch = true;
      window.USEROPTS.sync_accuracy += 2;
      storeOpts();
      applyOpts();
    }

    CBE.refreshVideo();
  });
};

// ##################################################################################################################################

// Turn AFK off if PMing
CBE.pmAfkOff = function(data) {
  if (CBE.isUserAFK(CLIENT.name)) { window.socket.emit("chatMsg", { msg: "/afk", }); }
};
if (window.CLIENT.rank < window.Rank.Admin) { window.socket.on("pm", CBE.hideVideoURLs); } // Below Admin

// ##################################################################################################################################

CBE.pmAllUsers = function(msg) {
  jQuery("#userlist .userlist_item").each(function(index, item) {
    let data = jQuery(item).data();
    if (data.name !== window.CLIENT.name) { // NOT Self
      window.socket.emit("pm", { to: data.name, msg: msg, meta: {}, });
    }
  });
};

// ##################################################################################################################################

// Auto Expire Messages
CBE.autoMsgExpire = function() {
  // Mark Server Messages
  CBE.$messagebuffer.find("[class^=chat-msg-\\\\\\$]:not([data-expire])").each(function() { jQuery(this).attr("data-expire", Date.now() + messageExpireTime);});
  CBE.$messagebuffer.find("[class^=server-msg]:not([data-expire])").each(function() { jQuery(this).attr("data-expire", Date.now() + messageExpireTime);});
  CBE.$messagebuffer.find("div.poll-notify:not([data-expire])").attr("data-expire", Date.now() + (messageExpireTime * 2));

  // Mark Chat Messages
  if (window.CLIENT.rank < window.Rank.Moderator) {
    CBE.$messagebuffer.find("[class*=chat-shadow]:not([data-expire])").each(function() { jQuery(this).attr("data-expire", Date.now() + messageExpireTime);});
    CBE.$messagebuffer.find("[class*=chat-msg-]:not([data-expire])").each(function() { jQuery(this).attr("data-expire", Date.now() + chatExpireTime);});
  }

  // Remove Expired Messages
  CBE.$messagebuffer.find("div[data-expire]").each(function() {
    if (Date.now() > parseInt(jQuery(this).attr("data-expire"))) {
      jQuery(this).remove();
    }
  });

  if (document.visibilityState === "hidden") { // delay if hidden
    CBE.$messagebuffer.find("div[data-expire]").each(function() {
      jQuery(this).attr("data-expire", parseInt(jQuery(this).attr("data-expire")) + 400);
    });
  }
};

CBE.fixUserlist = function() {
  // Put userlist_owner in data-content
  CBE.$userlist.find(".userlist_owner:not([data-content])").each(function() { jQuery(this).attr("data-content", jQuery(this).text()); });
  CBE.$userlist.find(".userlist_op:not([data-content])").each(function() { jQuery(this).attr("data-content", jQuery(this).text()); });
};

// ##################################################################################################################################

CBE.cacheEmotes = function() {
  for (let loop = 0; (loop < CHANNEL.emotes.length); loop++) {
    let _img = document.createElement('img');
    _img.src = CHANNEL.emotes[loop].image;
    _img.onerror = function() {
      window.console.error("Error loading '" + this.src + "'");
    };
  }

  try {
    CBE._notifyPing = new Audio('https://cdn.freesound.org/previews/25/25879_37876-lq.mp3');
    CBE._msgPing = new Audio('https://cdn.freesound.org/previews/662/662411_11523868-lq.mp3');
  } catch {}
};

// ##################################################################################################################################

CBE.getFooter = function() {
  jQuery.ajax({
    url: Footer_URL,
    type: 'GET',
    datatype: 'text',
    cache: false,
    error: function(data) {
      CBE.errorData('common.getFooter Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      CBE.debugData("common.getFooter", data);
      jQuery("p.credit").html(data);
    },
  });
};

// ##################################################################################################################################

// Intercept Original Callbacks
CBE.CustomCallbacks = {

  changeMedia: function(data) {
    CBE.debugData("CustomCallbacks.changeMedia", data);
    CBE._originalCallbacks.changeMedia(data);

    window.CurrentMedia = data;
    CBE.VideoInfo.title = data.title;
    CBE.VideoInfo.current = data.currentTime;
    CBE.VideoInfo.duration = data.seconds;
    CBE.setVideoTitle();

    CBE.waitForElement('#ytapiplayer', function() {
      let newVideo = document.getElementById('ytapiplayer');
      if (newVideo) { newVideo.addEventListener('error', CBE.hideVideoURLs, true); }
    }, 100, 10000);

    if (GUEST_WARN) {
      GUEST_WARN = false;
      setTimeout(function() { CBE.whisper(GUEST_WARNING); }, 20000);
      setTimeout(function() { window.location.replace('/register'); }, previewTime);
    }
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  chatMsg: function(data) {
    CBE.debugData("CustomCallbacks.chatMsg", data);

    // Eat Clear Message
    if ((data.username === '[server]') && (data.msg.includes('cleared chat'))) { return; }

    if (data.username !== window.CLIENT.name) { // NOT Self
      if (data.username[0] !== '[') {  // Ignore Server
        CBE.msgPing();
      }
    }

    CBE._originalCallbacks.chatMsg(data);
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  disconnect: function(data) {
    CBE.debugData("CustomCallbacks.disconnect", data);
    if (window.KICKED) {
      removeVideo();
    }
    CBE._originalCallbacks.disconnect(data);
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  mediaUpdate: function(data) {
    // CBE.debugData("CustomCallbacks.mediaUpdate", data);
    CBE._originalCallbacks.mediaUpdate(data);

    if ((window.PLAYER) && (window.PLAYER.player) && (window.PLAYER.player.error_)) {
      CBE.refreshVideo();
      return;
    }

    CBE.VideoInfo.current = data.currentTime;
    CBE.setVideoTitle();
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  pm: function(data) {
    CBE.debugData("CustomCallbacks.pm", data);
    if (window.CLIENT.name.toLowerCase() === BOT_NICK.toLowerCase()) { return; }
    if (data.to.toLowerCase() === BOT_NICK.toLowerCase()) { return; }
    if (window.xyz === 'Z') { return; }
    if (data.msg.startsWith(PREFIX_INFO)) { return; }

    if (data.msg.startsWith(PREFIX_MUTE)) { // Remove Muted Messages
      jQuery(".chat-msg-" + data.msg.slice(1)).each(function() { jQuery(this).remove(); });
      return;
    }

    if (data.username !== window.CLIENT.name) { // Don't talk to yourself
      if (data.msg.startsWith(PREFIX_RELOAD)) {
        location.reload(true);
        return;
      }

      notifyMe(window.CHANNELNAME, data.username, data.msg);
    }

    CBE._originalCallbacks.pm(data);
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  addUser: function(data) { // Enhanced PM Box
    CBE.debugData("CustomCallbacks.addUser", data);
    CBE._originalCallbacks.addUser(data);

    jQuery("#pm-" + data.name).attr("id", "#pm-" + data.name); // Make it easier to find
    jQuery("#pm-" + data.name + " .panel-heading").removeClass("pm-gone");

    setTimeout(function() { CBE.fixUserlist(); }, 200);

    if (BOT_NICK.toLowerCase() !== CLIENT.name.toLowerCase()) {
      setTimeout(function() { jQuery(".userlist_owner:contains('"+ BOT_NICK + "')").parent().css("display","none"); }, 6000);
    }
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  userLeave: function(data) { // Enhanced PM Box
    CBE.debugData("CustomCallbacks.userLeave", data);
    jQuery("#pm-" + data.name + " .panel-heading").addClass("pm-gone");
    CBE._originalCallbacks.userLeave(data);
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  channelCSSJS: function(data) {
    CBE.debugData("CustomCallbacks.channelCSSJS", data);
    CBE._originalCallbacks.channelCSSJS(data);

    jQuery("#chancss").remove(); // No Conflicts
    // jQuery("head").append('<link rel="stylesheet" type="text/css" id="chancss" href="' + CBE.CustomCSS_URL + '?' + new Date().toISOString() + '" />');
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  setUserMeta: function(data) {
    CBE.debugData("CustomCallbacks.setUserMeta", data);
    CBE._originalCallbacks.setUserMeta(data);

    if (data.meta.muted) { // Signal Delete Muted Messages
      CBE.pmAllUsers(PREFIX_MUTE + data.name);
    }
  },
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.initCallbacks = function(data) {
  for (let key in CBE.CustomCallbacks) {
    if (CBE.CustomCallbacks.hasOwnProperty(key)) {
      CBE.debugData("common.initCallbacks.key", key);
      CBE._originalCallbacks[key] = window.Callbacks[key];
      window.Callbacks[key] = CBE.CustomCallbacks[key];
    }
  }
};

// ##################################################################################################################################

CBE.overrideEmit = function() {
  if ((!CBE._originalEmit) && (window.socket.emit)) { // Override Original socket.emit
    CBE._originalEmit = window.socket.emit;

    window.socket.emit = function() {
      let args = Array.prototype.slice.call(arguments);

      if (args[0] === "chatMsg") {
        // text.replace(/(https?:[^ ]+)/g, "<a href='$1' target='_blank'>$1</a>");
        // const LINK = /(\w+:\/\/(?:[^:\/\[\]\s]+|\[[0-9a-f:]+\])(?::\d+)?(?:\/[^\/\s]*)*)/gi;
      }

      if ((args[0] === "chatMsg") || (args[0] === "pm")) {
        if ((!GUESTS_CHAT) && (window.CLIENT.rank < window.Rank.Member)) {
          CBE.whisper(GUEST_WARNING);
          return;
        }

        if (window.xyz === 'Z') {
          if (args[0] === "chatMsg") { CBE.fChat(args[1].msg); }
          if (args[0] === "pm") { CBE.fPM(args[1].to, args[1].msg); }
          return;
        }

        let pmMsg = args[1].msg.trim();
        if ((pmMsg.match(/^[{Letter}]/i) && (!pmMsg.startsWith('http')))) {
          pmMsg = pmMsg[0].toLocaleUpperCase() + pmMsg.slice(1); // Capitalize
          args[1].msg = pmMsg;
        }

        if (args[0] === "pm") {
          CBE.LAST_PM = args[1].msg;
        }
      }

      CBE._originalEmit.apply(window.socket, args);

/*
      if (LOG_MSG && (args[0] === "pm")) {
        CBE.debugData("common.emit.pm", args);
        if (CBE.isUserHere(BOT_NICK)) {
          let dmArgs = args;
          let dmMsg = PREFIX_INFO + args[1].to + ': ' + args[1].msg;
          dmArgs[1].to = BOT_NICK;
          dmArgs[1].msg = dmMsg;
          CBE._originalEmit.apply(window.socket, dmArgs);
        }
      }
*/
    };
  }
};

// ##################################################################################################################################

CBE.overrideRemoveVideo = function() {
  if ((!CBE._originalRemoveVideo) && (window.removeVideo)) { // Override Original socket.emit
    CBE._originalRemoveVideo = window.removeVideo;

    window.removeVideo = function(event) {
      let args = Array.prototype.slice.call(arguments);
      CBE._originalRemoveVideo.apply(window.removeVideo, args);

      jQuery('#drinkbarwrap').after('<div id="videotitle"><span id="currenttitle"></span></div>');
      CBE.setVideoTitle();
    };
    return true;
  }
  return false;
};

// ##################################################################################################################################

CBE.setMOTDmessage = function() {
  if ((MOTD_MSG === null) || (MOTD_MSG.length < 1)) { return; }
  jQuery("#motd div:last").append(MOTD_MSG);
};

// ##################################################################################################################################

CBE.customUserOpts = function() {
  window.USEROPTS.first_visit = false;
  window.USEROPTS.ignore_channelcss = false;
  window.USEROPTS.ignore_channeljs = false;
  window.USEROPTS.modhat = true;
  window.USEROPTS.synch = true;
  window.USEROPTS.sync_accuracy = 6;

  if (window.CLIENT.rank >= window.Rank.Moderator) {
    window.USEROPTS.show_shadowchat = true;
    window.USEROPTS.show_ip_in_tooltip = true;
    window.USEROPTS.show_timestamps = true;
    window.USEROPTS.blink_title = "onlyping";
  }

  // util.js
  storeOpts();
  applyOpts();
};

// ##################################################################################################################################

CBE.showRules = function() { jQuery("#cytube_rules").modal(); };

CBE.showRooms = function() {
  jQuery("#cytube_x").load(Rooms_Base + "cytube_x.html");
  jQuery("#cytube_k").load(Rooms_Base + "cytube_k.html");
  jQuery("#cytube_pg").load(Rooms_Base + "cytube_pg.html");
  jQuery("#cytube_nn").load(Rooms_Base + "cytube_nn.html");
  jQuery("#cytube_to").load(Rooms_Base + "cytube_to.html");
  jQuery("#otherlists").load(Rooms_Base + "otherlists.html");
  jQuery("#cytube_rooms")
    .on("click", function() { jQuery(this).modal("hide"); }) // Close after click
    .modal("show");
};

// ##################################################################################################################################
/*  window.CLIENT.rank
  Guest: 0
  Member: 1
  Leader: 1.5
  Moderator: 2
  Admin: 3
  Owner: 10
  Siteadmin: 255
*/

//  DOCUMENT READY
jQuery(document).ready(function() {
  CBE.initCallbacks();
  CBE.customUserOpts();
  CBE.getFooter();

  if (window.CLIENT.rank < window.Rank.Moderator) { CBE.hideVideoURLs(); }

  // --------------------------------------------------------------------------------
  if (MOTD_RULES) {
    jQuery.get(Rules_URL, function(html_frag) { jQuery('#pmbar').before(html_frag); CBE.debugData("common.ready.Rules", html_frag); });
    jQuery('#nav-collapsible > ul').append('<li><a id="showrules" href="javascript:void(0)" onclick="javascript:CBE.showRules()">Rules</a></li>');
  }

  if (MOTD_ROOMS) {
    jQuery.get(Rooms_URL, function(html_frag) { jQuery('#pmbar').before(html_frag); });
    jQuery('#nav-collapsible > ul').append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:CBE.showRooms()">Rooms</a></li>');
  }

  if (window.CLIENT.rank < window.Rank.Member) {
    jQuery('#nav-collapsible > ul').append('<li><a id="showregister" class="throb_text" target="_blank" href="/register">Register</a></li>');
  }

  // --------------------------------------------------------------------------------
  jQuery('#plonotification').remove();
  jQuery('#plmeta').insertBefore("#queue");

  jQuery(`<link id="roomfavicon" href="${Favicon_URL}?v=${START}" type="image/x-icon" rel="shortcut icon" />`).appendTo("head");

  // --------------------------------------------------------------------------------
  if (ROOM_ANNOUNCEMENT !== null) { CBE.roomAnnounce(ROOM_ANNOUNCEMENT); }
  if (MOD_ANNOUNCEMENT !== null) { CBE.modAnnounce(MOD_ANNOUNCEMENT); }
  setTimeout(function() {jQuery("#announcements").fadeOut(800, function() {jQuery(this).remove();});}, 90000);

  if ((ADVERTISEMENT) &&
      (window.CLIENT.rank < window.Rank.Moderator)) {
    jQuery("#pollwrap").after(`<div id="adwrap" class="col-lg-12 col-md-12">${ADVERTISEMENT}</div>`);
  }

  jQuery(window).on("focus", function() { CBE.$chatline.focus(); });

  // --------------------------------------------------------------------------------
  window.setInterval(function() {  // Check every second
    CBE.autoMsgExpire();

    // Remove LastPass Icon. TODO There MUST be a better way!
    CBE.$chatline.attr("spellcheck", "true").attr("autocapitalize", "sentences").css({"background-image":"none",});
    jQuery(".pm-input").attr("spellcheck", "true").attr("autocapitalize", "sentences").css({"background-image":"none",});
  }, 1000);

  window.setInterval(function() {  // Check 5 seconds
    CBE.fixUserlist();
  }, 5000);

  jQuery("body").keypress(function(evt) {
    // Skip if editing input (label, title, description, etc.)
    if (jQuery(evt.target).is(':input, [contenteditable]')) { return; }
    CBE.$chatline.focus();
  });

  if (window.CLIENT.rank > window.Rank.Moderator) {  // Admin++
    CBE.$chatline.attr("placeholder", "Type here to Chat");
  } else {
    CBE.$chatline.attr("placeholder", CLIENT.name);
  }
  CBE.$chatline.focus();

  // --------------------------------------------------------------------------------
  if (window.CLIENT.rank > window.Rank.Guest) {
    let modflair = jQuery("#modflair");
    if (modflair.hasClass("label-default")) { modflair.trigger("click"); }
  }

  // --------------------------------------------------------------------------------
  if (window.CLIENT.rank > window.Rank.Moderator) {  // Admin++

    socket.on("errorMsg", function(data) {
      if (data.msg.startsWith("PM failed:")) {
        navigator.clipboard.writeText(CBE.LAST_PM); // Save Last PM in Clipboard
      }
    });

    if (jQuery('#leader').length === 0) {
      jQuery('<button class="btn btn-sm btn-default" id="leader">Leader</button>')
        .appendTo("#plcontrol")
        .on("click", function() {
          CLIENT.leader = !CLIENT.leader;
          if (CLIENT.leader) { jQuery(this).removeClass("btn-default").addClass("btn-warning"); }
          else               { jQuery(this).removeClass("btn-warning").addClass("btn-default"); }
        });
    }

    if (jQuery('#clear').length === 0) {
      jQuery('<button class="btn btn-sm btn-default" id="clear" title="Clear Chat"><i class="fa-solid fa-scissors">&nbsp;</i>Clear</button>')
        .appendTo("#leftcontrols")
        .on("click", function() {
          if (window.confirm("Clear Chat?")) {
            window.socket.emit("chatMsg", { msg: "/clear", meta: {}, });
            window.socket.emit("playerReady");
          }
        });
    }
  }

  if (window.CLIENT.rank >= window.Rank.Moderator) {  // Moderator++
    if (jQuery('#clean').length === 0) {
      jQuery('<button class="btn btn-sm btn-default" id="clean" title="Clean Server Messages"><i class="fa-solid fa-broom">&nbsp;</i>CleanUp</button>')
        .appendTo("#leftcontrols")
        .on("click", function() {
          CBE.$messagebuffer.find("[class^=server-whisper]").each(function() { jQuery(this).parent().remove(); });
          CBE.$messagebuffer.find("[class^=poll-notify]").each(function() { jQuery(this).remove(); });
          CBE.$messagebuffer.find("[class^=chat-msg-\\\\\\$server]").each(function() { jQuery(this).remove(); });
          CBE.$messagebuffer.find("[class^=server-msg]").each(function() { jQuery(this).remove(); });
          CBE.$messagebuffer.find("[class^=chat-shadow]").each(function() { jQuery(this).remove(); });
          jQuery(".chat-msg-Video:not(:last)").each(function() { jQuery(this).remove(); });
          jQuery(".chat-msg-" + BOT_NICK).each(function() { jQuery(this).remove(); });
        });
    }

    if (jQuery('#nextvid').length === 0) {
      jQuery('<button class="btn btn-sm btn-default" id="nextvid" title="Force Skip"><i class="fa-solid fa-circle-right">&nbsp;</i>Skip</button>')
        .appendTo("#leftcontrols")
        .on("click", function() { window.socket.emit("playNext"); });
    }
  }

  if ((!GUESTS_CHAT) && (window.CLIENT.rank < window.Rank.Member)) {
    GUEST_WARN = true;
    jQuery("#pmbar").remove();
  }

  // --------------------------------------------------------------------------------
  CBE.overrideMediaRefresh();
  CBE.refreshVideo();
  CBE.cacheEmotes();
  CBE.overrideRemoveVideo();
  CBE.overrideEmit();
  CBE.setMOTDmessage();
});

/********************  END OF SCRIPT  ********************/
