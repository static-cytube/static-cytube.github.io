/*!  CyTube Enhancements: Room Defaults
**|  Version: 2024.09.12
**@preserve
*/
"use strict";

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, $:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals CHANNEL, Root_URL, CB, Base_URL, Room_URL, debugData, logTrace, errorData, CustomCSS_URL, BOT_NICK, setMOTDmessage, AGE_RESTRICT */

if (typeof CB === "undefined") { var CB = {}; }

if (typeof UPDATE_CSS === "undefined")         { var UPDATE_CSS = true; }
if (typeof UPDATE_EMOTES === "undefined")      { var UPDATE_EMOTES = true; }
if (typeof UPDATE_FILTERS === "undefined")     { var UPDATE_FILTERS = true; }
if (typeof UPDATE_JS === "undefined")          { var UPDATE_JS = true; }
if (typeof UPDATE_MOTD === "undefined")        { var UPDATE_MOTD = true; }
if (typeof UPDATE_OPTIONS === "undefined")     { var UPDATE_OPTIONS = true; }
if (typeof UPDATE_PERMISSIONS === "undefined") { var UPDATE_PERMISSIONS = true; }

const BlockerCSS_URL = Base_URL + 'blocker.css';
const Emotes_URL = Root_URL + 'emoji/emoji.json';
const JS_URL = Room_URL + 'JS_Editor.js';
const MOTD_URL = Room_URL + 'motd.html';

const Filters1_URL = Base_URL + 'filters.json';
const Filters2_URL = Room_URL + 'filters.json';
const Options1_URL = Base_URL + 'options.json';
const Options2_URL = Room_URL + 'options.json';
const Permissions1_URL = Base_URL + 'permissions.json';
const Permissions2_URL = Room_URL + 'permissions.json';

// ##################################################################################################################################

CB.getEmotes = function() {
  jQuery.getJSON(Emotes_URL, function(data) {
      logTrace('defaults.getEmotes', data);
      window.socket.emit("importEmotes", data);
    })
    .fail(function(data) {
      errorData('defaults.getEmotes Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

CB.getMOTD = function() {
  jQuery.ajax({
    url: MOTD_URL,
    datatype: 'html',
    cache: false,
    error: function(data) {
      errorData('defaults.getMOTD Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      logTrace('defaults.getMOTD', data);
      window.socket.emit("setMotd", { motd: data, });
    },
  });

  setMOTDmessage(); // common.js
};

// ##################################################################################################################################

CB.getBot = function() {
  window.socket.once("channelRanks", function(data) {
    let nickRank = -1;

    jQuery.each(data, function(index, user) {
      if (user.name.toLowerCase() === BOT_NICK.toLowerCase()) { nickRank = user.rank; }
    });

    if ((window.CLIENT.rank > window.Rank.Admin) && (nickRank < window.Rank.Admin)) {
      window.socket.emit("setChannelRank", { "name": BOT_NICK, "rank": window.Rank.Admin, });
    }
  });
  window.socket.emit("requestChannelRanks");
};

// ##################################################################################################################################

CB.getCSS = function() {
  let blockerCSS = "";
  let customCSS = "";

  function setCustomCSS() {
    if (AGE_RESTRICT && (blockerCSS.length < 1)) { return; }
    if (customCSS.length < 1) { return; }

    let data = customCSS;
    if (AGE_RESTRICT) { data += blockerCSS; }

    logTrace('defaults.getCSS.setCustomCSS', data);

    window.socket.emit("setChannelCSS", { css: data, });
  }

  if (AGE_RESTRICT) {
    jQuery.ajax({
      url: BlockerCSS_URL,
      datatype: 'text',
      async: false,
      cache: false,
      error: function(data) {
        errorData('defaults.getBlockerCSS Error', data.status + ": " + data.statusText);
      },
      success: function(data) {
        logTrace('defaults.getBlockerCSS', data);
        blockerCSS = data;
        setCustomCSS();
      },
    });
  }

  jQuery.ajax({
    url: CustomCSS_URL,
    datatype: 'text',
    async: false,
    cache: false,
    error: function(data) {
      errorData('defaults.getCustomCSS Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      logTrace('defaults.getCustomCSS', data);
      customCSS = data;
      setCustomCSS();
    },
  });
};

// ##################################################################################################################################

CB.getJavascript = function() {
  jQuery.ajax({
    url: JS_URL,
    datatype: 'script',
    async: false,
    cache: false,
    crossDomain: true,
    error: function(data) {
      errorData('defaults.getJavascript Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      if (data !== CHANNEL.js) {
        logTrace('defaults.getJavascript', data);
        window.socket.emit("setChannelJS", { js: data, });
        setTimeout(function() {
          errorData('defaults.getJavascript', 'RELOAD');
          location.reload(true);
        }, 10000);
      }
    },
  });
};

// ##################################################################################################################################

CB.getOptions = function() {
  jQuery.getJSON(Options1_URL, function(data) {
      logTrace('defaults.getOptions', data);
      window.socket.emit("setOptions", data);
    })
    .fail(function(data) {
      errorData('defaults.getOptions Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

CB.getPermissions = function() {
  jQuery.getJSON(Permissions1_URL, function(data) {
      logTrace('defaults.getPermissions', data);
      window.socket.emit("setPermissions", data);
    })
    .fail(function(data) {
      errorData('defaults.getPermissions Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

CB.getFilters = function() {
  var filterUrls = [Filters1_URL, Filters2_URL, ];

  var resolveCnt = 0;
  var ctFilters = [];
  var ajaxPromises = [];

  for (let i = 0; (i <  filterUrls.length); i++) {
    ajaxPromises.push(jQuery.ajax({ url: filterUrls[i], datatype: 'json', timeout: 500, cache: false, }));
  }

  function setFilters(data) {
    ctFilters.push(data);

    resolveCnt++;
    if (resolveCnt < filterUrls.length) { return; }

    var combined = [];
    ctFilters.forEach(function(data) {
      combined = combined.concat(data.filter(item => !JSON.stringify(combined).includes(JSON.stringify(item)) )); // Unique
    });

    logTrace('defaults.getFilters', JSON.stringify(combined));
    window.socket.emit("importFilters", combined);
  }

  jQuery.when(ajaxPromises).always(function() {
    jQuery.each(ajaxPromises, function(i) {
      this
        .done(function(result) { setFilters(result); })
        .fail(function(error) { setFilters([]); });
    });
  });
};

// ##################################################################################################################################

$(document).ready(function() {
  // debugData("defaults.documentReady", "");

  CB.getBot();
  if (UPDATE_JS)          { CB.getJavascript(); }
  if (UPDATE_OPTIONS)     { CB.getOptions(); }
  if (UPDATE_PERMISSIONS) { CB.getPermissions(); }
  if (UPDATE_CSS)         { CB.getCSS(); }
  if (UPDATE_MOTD)        { CB.getMOTD(); }
  if (UPDATE_EMOTES)      { CB.getEmotes(); }
  if (UPDATE_FILTERS)     { CB.getFilters(); }
});

// ##################################################################################################################################
