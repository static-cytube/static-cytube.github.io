/*!
**|  CyTube Enhancements: Room Defaults
**|  Version: 2024.03.05
**|
**@preserve
*/
"use strict";

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals window.socket, Rank, CHANNEL, BOT_NICK, Root_URL, Base_URL, Room_URL, debugData, logError, errorData */
/* globals CustomCSS_URL, AGE_RESTRICT, setMOTDmessage */

if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

if (!window[CHANNEL.name].UPDATE_CSS)         { window[CHANNEL.name].UPDATE_CSS = true; }
if (!window[CHANNEL.name].UPDATE_EMOTES)      { window[CHANNEL.name].UPDATE_EMOTES = true; }
if (!window[CHANNEL.name].UPDATE_FILTERS)     { window[CHANNEL.name].UPDATE_FILTERS = true; }
if (!window[CHANNEL.name].UPDATE_JS)          { window[CHANNEL.name].UPDATE_JS = true; }
if (!window[CHANNEL.name].UPDATE_MOTD)        { window[CHANNEL.name].UPDATE_MOTD = true; }
if (!window[CHANNEL.name].UPDATE_OPTIONS)     { window[CHANNEL.name].UPDATE_OPTIONS = true; }
if (!window[CHANNEL.name].UPDATE_PERMISSIONS) { window[CHANNEL.name].UPDATE_PERMISSIONS = true; }

window[CHANNEL.name].BlockerCSS_URL = window[CHANNEL.name].Base_URL + 'blocker.css';
window[CHANNEL.name].Emotes_URL = window[CHANNEL.name].Root_URL + 'emoji/emoji.json';
window[CHANNEL.name].Filters_URL = window[CHANNEL.name].Room_URL + 'filters.json';
window[CHANNEL.name].JS_URL = window[CHANNEL.name].Room_URL + 'JS_Editor.js';
window[CHANNEL.name].MOTD_URL = window[CHANNEL.name].Room_URL + 'motd.html';
window[CHANNEL.name].Options_URL = window[CHANNEL.name].Base_URL + 'options.json';
window[CHANNEL.name].Permissions_URL = window[CHANNEL.name].Base_URL + 'permissions.json';

const logError = function(desc, data) {
  window.console.error(formatConsoleMsg(desc, data));
};

// ##################################################################################################################################

const getOptions = function() {
  jQuery.getJSON(window[CHANNEL.name].Options_URL, function(data) {
      logError('defaults.getOptions', data);
      window.socket.emit("setOptions", data);
    })
    .fail(function(data) {
      errorData('defaults.getOptions Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getPermissions = function() {
  jQuery.getJSON(window[CHANNEL.name].Permissions_URL, function(data) {
      logError('defaults.getPermissions', data);
      window.socket.emit("setPermissions", data);
    })
    .fail(function(data) {
      errorData('defaults.getPermissions Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getFilters = function() {
  jQuery.getJSON(window[CHANNEL.name].Filters_URL, function(data) {
      logError('defaults.getFilters', data);
      window.socket.emit("importFilters", data);
    })
    .fail(function(data) {
      errorData('defaults.getFilters Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getEmotes = function() {
  jQuery.getJSON(window[CHANNEL.name].Emotes_URL, function(data) {
      logError('defaults.getEmotes', data);
      window.socket.emit("importEmotes", data);
    })
    .fail(function(data) {
      errorData('defaults.getEmotes Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getMOTD = function() {
  jQuery.ajax({
    url: window[CHANNEL.name].MOTD_URL,
    type: 'GET',
    datatype: 'html',
    cache: false,
    error: function(data) {
      errorData('defaults.getMOTD Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      logError('defaults.getMOTD', data);
      window.socket.emit("setMotd", { motd: data, });
    },
  });

  setMOTDmessage(); // common.js
};

// ##################################################################################################################################

const getBot = function() {
  window.socket.once("channelRanks", function(data) {
    let nickRank = -1;

    jQuery.each(data, function(index, person) {
      debugData("defaults.channelRanks", person);
      if (person.name.toLowerCase() === BOT_NICK.toLowerCase()) { nickRank = person.rank; }
    });

    if ((window.CLIENT.rank > Rank.Admin)  && (nickRank < Rank.Admin)) {
      window.socket.emit("setChannelRank", { "name": BOT_NICK, "rank": Rank.Admin, });
    }
  });
  window.socket.emit("requestChannelRanks");
};

// ##################################################################################################################################

const getCSS = function() {
  let blockerCSS = "";
  let customCSS = "";

  function setCustomCSS() {
    if (AGE_RESTRICT && (blockerCSS.length < 1)) { return; }
    if (customCSS.length < 1) { return; }

    let data = customCSS;
    if (AGE_RESTRICT) { data += blockerCSS; }

    logError('defaults.getCSS.setCustomCSS', data);

    window.socket.emit("setChannelCSS", { css: data, });
  }

  if (AGE_RESTRICT) {
    jQuery.ajax({
      url: window[CHANNEL.name].BlockerCSS_URL,
      type: 'GET',
      datatype: 'text',
      cache: false,
      error: function(data) {
        errorData('defaults.getBlockerCSS Error', data.status + ": " + data.statusText);
      },
      success: function(data) {
        logError('defaults.getBlockerCSS', data);
        blockerCSS = data;
        setCustomCSS();
      },
    });
  }

  jQuery.ajax({
    url: window[CHANNEL.name].CustomCSS_URL,
    type: 'GET',
    datatype: 'text',
    cache: false,
    error: function(data) {
      errorData('defaults.getCustomCSS Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      logError('defaults.getCustomCSS', data);
      customCSS = data;
      setCustomCSS();
    },
  });
};

// ##################################################################################################################################

const getJS = function() {
  jQuery.ajax({
    url: window[CHANNEL.name].JS_URL,
    type: 'GET',
    datatype: 'script',
    async: false,
    cache: false,
    crossDomain: true,
    error: function(data) {
      errorData('defaults.getJS Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      if (data !== CHANNEL.js) {
        logError('defaults.getJS', data);
        window.socket.emit("setChannelJS", { js: data, });
        setTimeout(function() {
          logError('defaults.RELOAD');
          location.reload(true);
        }, 4000);
      }
    },
  });
};

// ##################################################################################################################################

//  DOCUMENT READY
jQuery(document).ready(function() {
  debugData("defaults.documentReady", "");

  // getBot();
  // if (window[CHANNEL.name].UPDATE_JS) { getJS(); }
  if (window[CHANNEL.name].UPDATE_PERMISSIONS) { getPermissions(); }
  if (window[CHANNEL.name].UPDATE_OPTIONS)     { getOptions(); }
  if (window[CHANNEL.name].UPDATE_CSS)         { getCSS(); }
  if (window[CHANNEL.name].UPDATE_MOTD)        { getMOTD(); }
  if (window[CHANNEL.name].UPDATE_EMOTES)      { getEmotes(); }
  if (window[CHANNEL.name].UPDATE_FILTERS)     { getFilters(); }
});

// ##################################################################################################################################
// ##################################################################################################################################
