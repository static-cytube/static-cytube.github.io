/*!  CyTube Enhancements: Common
**|  Version: 2024.07.23
**@preserve
*/

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals socket, CHANNEL, CLIENT, Rank, CHATTHROTTLE, IGNORED, USEROPTS, initPm, setOpt, storeOpts, applyOpts, pingMessage, formatChatMessage, Callbacks */
/* globals addChatMessage, removeVideo, makeAlert, videojs, CHANNEL_DEBUG, PLAYER, BOT_NICK, LOG_MSG, MOTD_MSG */
/* globals Buttons_URL, START, ROOM_ANNOUNCEMENT, MOD_ANNOUNCEMENT, ADVERTISEMENT */
/* globals GUESTS_CHAT, MOTD_ROOMS, MOTD_RULES, Root_URL, Base_URL, Room_URL */

"use strict";

if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

$("head").append('<meta name="referrer" content="no-referrer" />');

// Global Variables
const messageExpireTime = 1000 * 60 * 2; // 2 Minutes
const chatExpireTime = 1000 * 60 * 60 * 2; // 2 Hours
const previewTime = 1000 * 60 * 5; // 5 Minutes

const Rooms_Base = Root_URL + 'rooms/';
const Rooms_URL = Rooms_Base + 'cytube-rooms.html';
const Rules_URL = Rooms_Base + 'cytube-rules.html';
const Footer_URL = Base_URL + 'footer.html';
const Logo_URL =  Room_URL + 'logo.png';
const Favicon_URL = Room_URL + 'favicon.png';

const PREFIX_RELOAD = String.fromCharCode(156); // 0x9C
const PREFIX_IGNORE = String.fromCharCode(157); // 0x9D
const PREFIX_INFO = String.fromCharCode(158); // 0x9E

// var $chatline = $("#chatline");
// var $videoUrls = $(".qe_title");
// var $voteskip = $("#voteskip");
// var $ytapiplayer = $("#ytapiplayer");
var $currenttitle = $("#currenttitle");
var $messagebuffer = $("#messagebuffer");
var $userlist = $("#userlist");
var $userListItems = $("#userlist .userlist_item");

var _originalCallbacks = {};
var _originalEmit = null;
var _notifyPing = null;
var _msgPing = null;
var _store = false;

var GUEST_WARN = false;
const GUEST_WARNING = `NOTICE: You are in Preview mode. You must&nbsp; <a href="https://cytu.be/register">REGISTER</a> &nbsp;to chat or PM in this room.`;

var LAST_PM = "";

// ----------------------------------------------------------------------------------------------------------------------------------
// https://fontawesome.com/search?c=media-playback&o=r
// https://cdnjs.com/libraries/font-awesome
$('<link>').appendTo('head').attr({ type: 'text/css', rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.css', });

// ##################################################################################################################################

if (typeof Storage !== "undefined") {
  let tst = 'store';
  try {
    localStorage.setItem(tst, tst);
    localStorage.removeItem(tst);
    _store = true;
  } catch {}
}

// ##################################################################################################################################

function Sleep(sleepMS) {
  // USE: await Sleep(2000);
  return new Promise(function(resolve) { setTimeout(resolve, sleepMS); });
}

// ----------------------------------------------------------------------------------------------------------------------------------
const timeString = function(datetime) {
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
const formatConsoleMsg = function(desc, data) {
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
const logTrace = function(desc, data) {
  window.console.log(formatConsoleMsg(desc));

  if (CHANNEL_DEBUG && (typeof data !== 'undefined') && (data)) {
    window.console.debug(JSON.stringify(data, null, 2));
  }
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send debug msg to console
const debugData = function(desc, data) {
  if (!CHANNEL_DEBUG) { return; }
  window.console.debug(formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send warning msg to console
const warnData = function(desc, data) {
  window.console.warn(formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send error msg to console
const errorData = function(desc, data) {
  window.console.error(formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Send log msg to console
const logData = function(desc, data) {
  window.console.log(formatConsoleMsg(desc, data));
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Admin Debugger
const debugListener = function(eventName, data) {
  if (eventName.toLowerCase() === "mediaupdate") { return; }
  window.console.info(formatConsoleMsg(eventName, data));
};

// ##################################################################################################################################

const hmsToSeconds = function(hms) {
  let part = hms.split(':'), secs = 0, mins = 1;
  while (part.length > 0) {
    secs += (mins * parseInt(part.pop(), 10));
    mins *= 60;
  }
  return secs;
};

// ----------------------------------------------------------------------------------------------------------------------------------
const secondsToHMS = function(secs) {
  let start = 15;
       if (secs >= 36000) { start = 11; }
  else if (secs >= 3600)  { start = 12; }
  else if (secs >= 600)   { start = 14; }
  return new Date(secs * 1000).toISOString().substring(start, 19);
};

// ##################################################################################################################################

const whisper = function(msg) {
  addChatMessage({
      msg: msg, time: Date.now(), username: '[server]', msgclass: 'server-whisper',
    meta: { shadow: false, addClass: 'server-whisper', addClassToNameAndTimestamp: true, },
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
const fChat = function(msg) {
  addChatMessage({ msg: msg, time: Date.now(), username: CLIENT.name, meta: {}, });
};

// ----------------------------------------------------------------------------------------------------------------------------------
const fPM = function(to, msg) {
  msg = window.formatChatMessage({ "username": CLIENT.name, "msg": msg, "meta": {}, "time": Date.now(), "to": to, }, { "name": "", }, );
  let buf = window.initPm(to).find(".pm-buffer");
  msg.appendTo(buf);
};

// ##################################################################################################################################

// JQuery Wait for an HTML element to exist
const waitForElement = function(selector, callback, checkFreqMs, timeoutMs) {
  let startTimeMs = Date.now();
  (function loopSearch() {
    if ($(selector).length) {
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

const notifyPing = function() {
  if (Notification.permission !== "granted") { return; }
  try {
    if (_notifyPing) { _notifyPing.play(); }
  } catch {}
};

// ----------------------------------------------------------------------------------------------------------------------------------
const msgPing = function() {
  if (Notification.permission !== "granted") { return; }
  try {
    if (_msgPing) { _msgPing.play(); }
  } catch {}
};

// ##################################################################################################################################

// Get User from UserList
const getUser = function(name) {
  let user = null;
  $userListItems.each(function(index, item) {
    let data = $(item).data();
    if (Object.keys(data).length < 6) { return null; }
    if (data.name.toLowerCase() === name.toLowerCase()) { user = data; }
  });
  return user;
};

// ----------------------------------------------------------------------------------------------------------------------------------
const isUserHere = function(name) {
  return (getUser(name) !== null);
};

// ----------------------------------------------------------------------------------------------------------------------------------
// Is User Idle?
const isUserAFK = function(name) {
  let afk = false;
  let user = getUser(name);
  if (!user) { afk = false; } else { afk = user.meta.afk; }
  return afk;
};

// ##################################################################################################################################

async function notifyMe(chan, title, msg) {
  debugData("common.notifyMe", arguments);

  if (document.hasFocus()) { msgPing(); return; }

  if (!("Notification" in window)) { return; } // NOT supported

  if (Notification.permission === 'denied') {
    debugData("common.notifyMe.permission", Notification.permission);
    return;
 }

  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }

  debugData("common.notifyMe.permission", Notification.permission);
  if (Notification.permission !== "granted") { return; }

  notifyPing();

  const notify = new Notification(chan + ': ' + title, {
    body: msg,
    tag: chan,
    lang: "en-US",
    icon: 'https://static.cinema-blue.icu/img/favicon.png',
    silent: false,
  });

  document.addEventListener("visibilitychange", function(evt) {
      try {
        debugData("common.notifyMe.visibilitychange", evt);
        notify.close();
      } catch {}
    }, { once: true, });

  notify.onclick = function() {
    debugData("common.notifyMe.onclick");
    window.parent.focus();
    notify.close();
  };

  setTimeout(function() { notify.close(); }, 20000);
}

// ##################################################################################################################################

//  Room Announcements
const roomAnnounce = function(msg) {
  if (msg.length < 1) { return; }
  if (window.CLIENT.rank < window.Rank.Member) { return; }
  if (BOT_NICK.toLowerCase() === CLIENT.name.toLowerCase()) { return; }

  $(function() {
    makeAlert("Message from Admin", msg).attr("id","roomAnnounce").appendTo("#announcements");
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
//  Moderator Announcements
const modAnnounce = function(msg) {
  if (msg.length < 1) { return; }
  if (window.CLIENT.rank < window.Rank.Moderator) { return; }
  if (BOT_NICK.toLowerCase() === CLIENT.name.toLowerCase()) { return; }

  $(function() {
    makeAlert("Moderators", msg).attr("id","modAnnounce").appendTo("#announcements");
  });
};

// ##################################################################################################################################

const hideVideoURLs = function() {
  setTimeout(function() {
    $(".qe_title").each(function(idx, data) {
      let _this = $(this);
      if (_this.is("a")) {
        _this.replaceWith('<span class="qe_title" href="' + _this.attr('href') + '">' + _this.text() + '</span>');
      }
    });

    $("#queue li.queue_entry").removeAttr("title");
    if (window.CLIENT.rank > Rank.Member) {
      $("#queue li.queue_entry div.btn-group").hide(); // Hide Controls
    }
  }, 2000);
};

if (window.CLIENT.rank < Rank.Moderator) {
  window.socket.on("changeMedia",     hideVideoURLs());
  window.socket.on("playlist",        hideVideoURLs());
  window.socket.on("setPlaylistMeta", hideVideoURLs());
  window.socket.on("shufflePlaylist", hideVideoURLs());
}

// ##################################################################################################################################

// Change the Video Title

window[CHANNEL.name].VideoInfo = { title: "None", current: 0, duration: 0, };

var VIDEO_TITLE = { title: "None", current: 0, duration: 0, };

const setVideoTitle = function() {
  if (VIDEO_TITLE.duration < 1) { VIDEO_TITLE.duration = VIDEO_TITLE.current; }
  let remaining = Math.round(VIDEO_TITLE.duration - VIDEO_TITLE.current);
  $currenttitle.html("Playing: <strong>" + VIDEO_TITLE.title + "</strong> &nbsp; (" + secondsToHMS(remaining) + ")");
};

// ----------------------------------------------------------------------------------------------------------------------------------
const refreshVideo = function() {
  debugData("common.refreshVideo", window.CurrentMedia);

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
const videoFix = function() {
  debugData("common.videoFix");

  let vplayer = videojs('ytapiplayer');
  vplayer.on("error", function(e) {
    errorData("common.Reloading Player", e);
    vplayer.createModal("ERROR: Reloading player!");

    window.setTimeout(function() { refreshVideo(); }, 2000);
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
function videoErrorHandler(event) {
  errorData('common.videoErrorHandler', event);
  refreshVideo();
}

// ----------------------------------------------------------------------------------------------------------------------------------
const overrideMediaRefresh = function() { // Override #mediarefresh.click to increase USEROPTS.sync_accuracy
  $(document).off('click', '#mediarefresh').on('click', '#mediarefresh', function() {
    if (window.USEROPTS.sync_accuracy < 20) {
      window.USEROPTS.synch = true;
      window.USEROPTS.sync_accuracy += 2;
      storeOpts();
      applyOpts();
    }

    refreshVideo();
  });
};

// ##################################################################################################################################

// Turn AFK off if PMing
const pmAfkOff = function(data) {
  if (isUserAFK(CLIENT.name)) { window.socket.emit("chatMsg", { msg: "/afk", }); }
};
if (window.CLIENT.rank < window.Rank.Admin) { window.socket.on("pm", pmAfkOff); } // Below Admin

// ##################################################################################################################################

// Auto Expire Messages
const autoMsgExpire = function() {
  // Mark Server Messages
  $messagebuffer.find("[class^=chat-msg-\\\\\\$]:not([data-expire])").each(function() { $(this).attr("data-expire", Date.now() + messageExpireTime);});
  $messagebuffer.find("[class^=server-msg]:not([data-expire])").each(function() { $(this).attr("data-expire", Date.now() + messageExpireTime);});
  $messagebuffer.find("div.poll-notify:not([data-expire])").attr("data-expire", Date.now() + (messageExpireTime * 2));

  if (window.CLIENT.rank < window.Rank.Moderator) { // Mark Chat Messages
    $messagebuffer.find("[class*=chat-shadow]:not([data-expire])").each(function() { $(this).attr("data-expire", Date.now() + messageExpireTime);});
    $messagebuffer.find("[class*=chat-msg-]:not([data-expire])").each(function() { $(this).attr("data-expire", Date.now() + chatExpireTime);});
  }

  // Remove Expired Messages
  $messagebuffer.find("div[data-expire]").each(function() {
    if (Date.now() > parseInt($(this).attr("data-expire"))) {
      $(this).remove();
    }
  });

  if (document.visibilityState === "hidden") { // delay if hidden
    $messagebuffer.find("div[data-expire]").each(function() {
      $(this).attr("data-expire", parseInt($(this).attr("data-expire")) + 400);
    });
  }
};

const fixUserlist = function() {
  // Put userlist_owner in data-content
  $userlist.find(".userlist_owner:not([data-content])").each(function() { $(this).attr("data-content", $(this).text()); });
  $userlist.find(".userlist_op:not([data-content])").each(function() { $(this).attr("data-content", $(this).text()); });
};

// ##################################################################################################################################

const cacheEmotes = function() {
  for (let loop = 0; (loop < CHANNEL.emotes.length); loop++) {
    let _img = document.createElement('img');
    _img.src = CHANNEL.emotes[loop].image;
    _img.onerror = function() {
      window.console.error("Error loading '" + this.src + "'");
    };
  }

  try {
    _notifyPing = new Audio('https://cdn.freesound.org/previews/25/25879_37876-lq.mp3');
    _msgPing = new Audio('https://cdn.freesound.org/previews/662/662411_11523868-lq.mp3');
  } catch {}
};

// ##################################################################################################################################

const getFooter = function() {
  $.ajax({
    url: Footer_URL,
    type: 'GET',
    datatype: 'text',
    cache: false,
    error: function(data) {
      errorData('common.getFooter Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      debugData("common.getFooter", data);
      $("p.credit").html(data);
    },
  });
};

// ##################################################################################################################################

const makeNoRefererMeta = function() {
  let meta = document.createElement('meta');
  meta.name = 'referrer';
  meta.content = 'no-referrer';
  document.head.append(meta);
};
$("head").append('<meta name="referrer" content="no-referrer" />');

// ##################################################################################################################################

// Intercept Original Callbacks
const CustomCallbacks = {
  
  changeMedia: function(data) {
    debugData("CustomCallbacks.changeMedia", data);
    _originalCallbacks.changeMedia(data);

    window.CurrentMedia = data;
    VIDEO_TITLE.title = data.title;
    VIDEO_TITLE.current = data.currentTime;
    VIDEO_TITLE.duration = data.seconds;
    setVideoTitle();

    waitForElement('#ytapiplayer', function() {
      let newVideo = document.getElementById('ytapiplayer');
      if (newVideo) { newVideo.addEventListener('error', videoErrorHandler, true); }
    }, 100, 10000);

    if (GUEST_WARN) {
      GUEST_WARN = false;
      setTimeout(function() { whisper(GUEST_WARNING); }, 20000);
      setTimeout(function() { window.location.replace('/register'); }, previewTime);
    }
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  chatMsg: function(data) {
    debugData("CustomCallbacks.chatMsg", data);

    // if ((window.CLIENT.rank < window.Rank.Admin) && (data.username[0] === '[')) { return; } // Eat Server Messages

    if ((data.username[0] !== '[') &&  // Ignore Server
        (data.username !== window.CLIENT.name)) {  // Don't talk to yourself
      msgPing();
    }

    _originalCallbacks.chatMsg(data);
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  disconnect: function(data) {
    debugData("CustomCallbacks.disconnect", data);
    if (window.KICKED) {
      removeVideo();
    }
    _originalCallbacks.disconnect(data);
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  mediaUpdate: function(data) {
    // debugData("CustomCallbacks.mediaUpdate", data);
    _originalCallbacks.mediaUpdate(data);

    if ((window.PLAYER) && (window.PLAYER.player) && (window.PLAYER.player.error_)) {
      refreshVideo();
      return;
    }

    VIDEO_TITLE.current = data.currentTime;
    setVideoTitle();
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  pm: function(data) {
    debugData("CustomCallbacks.pm", data);
    if (window.CLIENT.name.toLowerCase() === BOT_NICK.toLowerCase()) { return; }
    if (data.to.toLowerCase() === BOT_NICK.toLowerCase()) { return; }
    if (window.xyz === 'Z') { return; }
    if (data.msg.startsWith(PREFIX_INFO)) { return; }

    if (data.username.toLowerCase() !== window.CLIENT.name.toLowerCase()) { // Don't talk to yourself
      notifyMe(window.CHANNELNAME, data.username, data.msg);
    }

    if (data.msg.startsWith(PREFIX_RELOAD)) {
      location.reload(true);
      return;
    }

    _originalCallbacks.pm(data);
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  addUser: function(data) { // Enhanced PM Box
    debugData("CustomCallbacks.addUser", data);
    _originalCallbacks.addUser(data);

    $("#pm-" + data.name).attr("id", "#pm-" + data.name); // Make it easier to find
    $("#pm-" + data.name + " .panel-heading").removeClass("pm-gone");

    setTimeout(function() { fixUserlist(); }, 500);

    if (BOT_NICK.toLowerCase() !== CLIENT.name.toLowerCase()) {
      setTimeout(function() { $(".userlist_owner:contains('"+ BOT_NICK + "')").parent().css("display","none"); }, 6000);
    }
  },

  // ----------------------------------------------------------------------------------------------------------------------------------
  userLeave: function(data) { // Enhanced PM Box
    debugData("CustomCallbacks.userLeave", data);
    $("#pm-" + data.name + " .panel-heading").addClass("pm-gone");
    _originalCallbacks.userLeave(data);
  },
  
  // ----------------------------------------------------------------------------------------------------------------------------------
  channelCSSJS: function(data) {
    debugData("CustomCallbacks.channelCSSJS", data);
    _originalCallbacks.channelCSSJS(data);
    
    $("#chancss").remove(); // No Conflicts
    $("head").append('<link rel="stylesheet" type="text/css" id="chancss" href="' + CustomCSS_URL + '?' + new Date().toISOString() + '" />');
  },
};

// ----------------------------------------------------------------------------------------------------------------------------------
const initCallbacks = function(data) {
  for (let key in CustomCallbacks) {
    if (CustomCallbacks.hasOwnProperty(key)) {
      debugData("common.initCallbacks.key", key);
      _originalCallbacks[key] = window.Callbacks[key];
      window.Callbacks[key] = CustomCallbacks[key];
    }
  }
};

// ##################################################################################################################################

const overrideEmit = function() {
  if ((!_originalEmit) && (window.socket.emit)) { // Override Original socket.emit
    _originalEmit = window.socket.emit;

    window.socket.emit = function() {
      let args = Array.prototype.slice.call(arguments);

      if ((args[0] === "chatMsg") || (args[0] === "pm")) {

        if ((!GUESTS_CHAT) && (window.CLIENT.rank < window.Rank.Member)) {
          whisper(GUEST_WARNING);
          return;
        }

        if (window.xyz === 'Z') {
          if (args[0] === "chatMsg") { fChat(args[1].msg); }
          if (args[0] === "pm") { fPM(args[1].to, args[1].msg); }
          return;
        }

        let pmMsg = args[1].msg.trim();
        if ((pmMsg[0] !== '/') && (! pmMsg.startsWith('http'))) {
          pmMsg = pmMsg[0].toLocaleUpperCase() + pmMsg.slice(1); // Capitalize
          args[1].msg = pmMsg;
        }

        if (args[0] === "pm") {
          LAST_PM = args[1].msg;
        }
      }

      _originalEmit.apply(window.socket, args);

/*
      if (LOG_MSG && (args[0] === "pm")) {
        debugData("common.emit.pm", args);
        if (isUserHere(BOT_NICK)) {
          let dmArgs = args;
          let dmMsg = PREFIX_INFO + args[1].to + ': ' + args[1].msg;
          dmArgs[1].to = BOT_NICK;
          dmArgs[1].msg = dmMsg;
          _originalEmit.apply(window.socket, dmArgs);
        }
      }
*/
    };
  }
};

// ----------------------------------------------------------------------------------------------------------------------------------
const overrideAny = function() {
  socket.prependAny((eventName, data)=>{
    if (eventName !== "kick") { return; }
    debugData("CustomCallbacks.kick", data);
    removeVideo();
    if (data.reason.includes("anne")) {
      window.xyz = 'Z';
      if (_store) { window.localStorage.setItem('xyz', window.xyz); }
    }
  });
};

// ##################################################################################################################################

const setMOTDmessage = function() {
  if ((MOTD_MSG === null) || (MOTD_MSG.length < 1)) { return; }
  $("#motd div:last").append(MOTD_MSG);
};

// ##################################################################################################################################

const customUserOpts = function() {
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

const showRules = function() { $("#cytube_rules").modal(); };

const showRooms = function() {
  $("#cytube_x").load(Rooms_Base + "cytube_x.html");
  $("#cytube_k").load(Rooms_Base + "cytube_k.html");
  $("#cytube_pg").load(Rooms_Base + "cytube_pg.html");
  $("#cytube_nn").load(Rooms_Base + "cytube_nn.html");
  $("#cytube_to").load(Rooms_Base + "cytube_to.html");
  $("#otherlists").load(Rooms_Base + "otherlists.html");
  $("#cytube_rooms")
    .on("click", function() { $(this).modal('hide'); }) // Close after click
    .modal('show');
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
$(document).ready(function() {
  if (_store) { window.xyz = window.localStorage.getItem('xyz'); }
  if (!window.xyz) { window.xyz = 'X'; }

  customUserOpts();
  initCallbacks();
  getFooter();

  if (window.CLIENT.rank < window.Rank.Moderator) { hideVideoURLs(); }

  // --------------------------------------------------------------------------------
  if (MOTD_RULES) {
    $.get(Rules_URL, function(html_frag) { $('#pmbar').before(html_frag); debugData("common.ready.Rules", html_frag); });
    $('#nav-collapsible > ul').append('<li><a id="showrules" href="javascript:void(0)" onclick="javascript:showRules()">Rules</a></li>');
  }

  if (MOTD_ROOMS) {
    $.get(Rooms_URL, function(html_frag) { $('#pmbar').before(html_frag); });
    $('#nav-collapsible > ul').append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:showRooms()">Rooms</a></li>');
  }

  if (window.CLIENT.rank < window.Rank.Member) {
    $('#nav-collapsible > ul').append('<li><a id="showregister" class="throb_text" target="_blank" href="/register">Register</a></li>');
  }

  // --------------------------------------------------------------------------------
  $('#plonotification').remove();
  $('#plmeta').insertBefore("#queue");

  $('<link id="roomfavicon" href="' + Favicon_URL + '?ac=' + START + '" type="image/x-icon" rel="shortcut icon" />').appendTo("head");

  // --------------------------------------------------------------------------------
  if (ROOM_ANNOUNCEMENT !== null) { roomAnnounce(ROOM_ANNOUNCEMENT); }
  if (MOD_ANNOUNCEMENT !== null) { modAnnounce(MOD_ANNOUNCEMENT); }
  setTimeout(function() {$("#announcements").fadeOut(800, function() {$(this).remove();});}, 90000);

  if ((ADVERTISEMENT) &&
      (window.CLIENT.rank < window.Rank.Moderator)) {
    $("#pollwrap").after('<div id="adwrap" class="col-lg-12 col-md-12">' + ADVERTISEMENT + '</div>');
    // $("#customembed").before('<div id="adwrap" class="col-lg-7 col-md-7">' + ADVERTISEMENT + '</div>');
  }

  $(window).on("focus", function() { $("#chatline").focus(); });

  // --------------------------------------------------------------------------------
  window.setInterval(function() {  // Check every second
    autoMsgExpire();

    // Remove LastPass Icon. TODO There MUST be a better way!
    $("#chatline").attr("spellcheck", "true").css({"background-image":"none",});
    $(".pm-input").attr("spellcheck", "true").css({"background-image":"none",});
  }, 1000);

  window.setInterval(function() {  // Check 5 seconds
    fixUserlist();
  }, 5000);

  $("body").keypress(function(evt) {
    // Skip if editing input (label, title, description, etc.)
    if ($(evt.target).is(':input, [contenteditable]')) { return; }
    $("#chatline").focus();
  });

  $("#chatline").attr("placeholder", "Type here to Chat").focus();

  // --------------------------------------------------------------------------------
  if (window.CLIENT.rank > window.Rank.Guest) {
    let modflair = $("#modflair");
    if (modflair.hasClass("label-default")) { modflair.trigger("click"); }
  }

  // --------------------------------------------------------------------------------
  if (window.CLIENT.rank > window.Rank.Moderator) {  // Admin++

    socket.on("errorMsg", function(data) {
      if (data.msg.startsWith("PM failed:")) {
        navigator.clipboard.writeText(LAST_PM); // Save Last PM in Clipboard
      }
    });

    if ($('#leader').length === 0) {
      $('<button class="btn btn-sm btn-default" id="leader">Leader</button>')
        .appendTo("#plcontrol")
        .on("click", function() {
          CLIENT.leader = !CLIENT.leader;
          if (CLIENT.leader) { $(this).removeClass("btn-default").addClass("btn-warning"); }
          else               { $(this).removeClass("btn-warning").addClass("btn-default"); }
        });
    }

    if ($('#clear').length === 0) {
      $('<button class="btn btn-sm btn-default" id="clear" title="Clear Chat"><i class="fa-solid fa-scissors">&nbsp;</i>Clear</button>')
        .appendTo("#leftcontrols")
        .on("click", function() {
          window.socket.emit("chatMsg", { msg: "/clear", meta: {}, });
          window.socket.emit("playerReady");
        });
    }
  }

  if (window.CLIENT.rank >= window.Rank.Moderator) {  // Moderator++
    if ($('#clean').length === 0) {
      $('<button class="btn btn-sm btn-default" id="clean" title="Clean Server Messages"><i class="fa-solid fa-broom">&nbsp;</i>CleanUp</button>')
        .appendTo("#leftcontrols")
        .on("click", function() {
          let _messagebuffer = $("#messagebuffer");
          _messagebuffer.find("[class^=server-whisper]").each(function() { $(this).parent().remove(); });
          _messagebuffer.find("[class^=poll-notify]").each(function() { $(this).remove(); });
          _messagebuffer.find("[class^=chat-msg-\\\\\\$server]").each(function() { $(this).remove(); });
          _messagebuffer.find("[class^=server-msg]").each(function() { $(this).remove(); });
          _messagebuffer.find("[class^=chat-shadow]").each(function() { $(this).remove(); });
          $(".chat-msg-Video:not(:last)").each(function() { $(this).remove(); });
          $(".chat-msg-" + BOT_NICK).each(function() { $(this).remove(); });
        });
    }

    if ($('#nextvid').length === 0) {
      $('<button class="btn btn-sm btn-default" id="nextvid" title="Force Skip"><i class="fa-solid fa-circle-right">&nbsp;</i>Skip</button>')
        .appendTo("#leftcontrols")
        .on("click", function() { window.socket.emit("playNext"); });
    }
  }

  if ((!GUESTS_CHAT) && (window.CLIENT.rank < window.Rank.Member)) {
    GUEST_WARN = true;
    $("#pmbar").remove();
  }

  // --------------------------------------------------------------------------------
  overrideMediaRefresh();
  refreshVideo();
  cacheEmotes();
  overrideEmit();
  setMOTDmessage();
  overrideAny();
});

/********************  END OF SCRIPT  ********************/
