/*!  CyTube Enhancements: Room Defaults
**|  Version: 2024.09.17
**@preserve
*/
'use strict';

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals CHANNEL, Root_URL, CBE, Base_URL, Room_URL, CustomCSS_URL, BOT_NICK, AGE_RESTRICT */

if ((typeof CBE === 'undefined') || (!CBE)) { console.warn("defaults.CBE Missing"); }

// jshint latedef:false
if (typeof UPDATE_CSS === 'undefined')         { var UPDATE_CSS = true; }
if (typeof UPDATE_EMOTES === 'undefined')      { var UPDATE_EMOTES = true; }
if (typeof UPDATE_FILTERS === 'undefined')     { var UPDATE_FILTERS = true; }
if (typeof UPDATE_JS === 'undefined')          { var UPDATE_JS = true; }
if (typeof UPDATE_MOTD === 'undefined')        { var UPDATE_MOTD = true; }
if (typeof UPDATE_OPTIONS === 'undefined')     { var UPDATE_OPTIONS = true; }
if (typeof UPDATE_PERMISSIONS === 'undefined') { var UPDATE_PERMISSIONS = true; }
// jshint latedef:true

const BlockerCSS_URL = Base_URL + 'blocker.css';
const Emotes_URL = Root_URL + 'emoji/emoji.json';
const JS_URL = Room_URL + 'JS_Editor.js';
const MOTD_URL = Room_URL + 'motd.html';

// ##################################################################################################################################

CBE.getEmotes = function() {
  jQuery.getJSON(Emotes_URL, function(data) {
      CBE.traceLog('defaults.getEmotes', data);
      window.socket.emit("importEmotes", data);
    })
    .fail(function(data) {
      CBE.errorData('defaults.getEmotes Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

CBE.getMOTD = function() {
  jQuery.ajax({
    url: MOTD_URL,
    datatype: 'html',
    cache: false,
    error: function(data) {
      CBE.errorData('defaults.getMOTD Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      CBE.traceLog('defaults.getMOTD', data);
      window.socket.emit("setMotd", { motd: data, });
    },
  });

  CBE.setMOTDmessage(); // common.js
};

// ##################################################################################################################################

CBE.getBot = function() {
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

CBE.getCSS = function() {
  let blockerCSS = "";
  let customCSS = "";

  function setCustomCSS() {
    if (AGE_RESTRICT && (blockerCSS.length < 1)) { return; }
    if (customCSS.length < 1) { return; }

    let data = customCSS;
    if (AGE_RESTRICT) { data += blockerCSS; }

    CBE.traceLog('defaults.getCSS.setCustomCSS', data);

    window.socket.emit("setChannelCSS", { css: data, });
  }

  if (AGE_RESTRICT) {
    jQuery.ajax({
      url: BlockerCSS_URL,
      datatype: 'text',
      async: false,
      cache: false,
      error: function(data) {
        CBE.errorData('defaults.getBlockerCSS Error', data.status + ": " + data.statusText);
      },
      success: function(data) {
        CBE.traceLog('defaults.getBlockerCSS', data);
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
      CBE.errorData('defaults.getCustomCSS Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      CBE.traceLog('defaults.getCustomCSS', data);
      customCSS = data;
      setCustomCSS();
    },
  });
};

// ##################################################################################################################################

CBE.getJavascript = function() {
  jQuery.ajax({
    url: JS_URL,
    datatype: 'script',
    async: false,
    cache: false,
    crossDomain: true,
    error: function(data) {
      CBE.errorData('defaults.getJavascript Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      if (data !== CHANNEL.js) {
        CBE.traceLog('defaults.getJavascript', data);
        window.socket.emit("setChannelJS", { js: data, });
        setTimeout(function() {
          CBE.errorData('defaults.getJavascript', 'RELOAD');
          location.reload(true);
        }, 10000);
      }
    },
  });
};

// ##################################################################################################################################

CBE.getFilters = function() {
  let _filterUrls = [ Base_URL + "filters.json", Room_URL + "filters.json", ];

  let _resolveCnt = 0;
  let _ctFilters = [];
  let _ajaxPromises = [];

  for (let i = 0; (i <  _filterUrls.length); i++) {
    _ajaxPromises.push(jQuery.ajax({ url: _filterUrls[i], datatype: 'json', timeout: 500, cache: false, }));
  }

  function setFilters(data) {
    _ctFilters.push(data);

    _resolveCnt++;
    if (_resolveCnt < _filterUrls.length) { return; }

    let combined = [];
    
    _ctFilters.forEach(function(data) {
      combined = combined.concat(data.filter(item => !JSON.stringify(combined).includes(JSON.stringify(item)) )); // Unique
    });

    CBE.traceLog('defaults.getFilters', JSON.stringify(combined));
    window.socket.emit("importFilters", combined);
  }

  jQuery.when(_ajaxPromises).always(function() {
    jQuery.each(_ajaxPromises, function(i) {
      this
        .done(function(result) { setFilters(result); })
        .fail(function(error) { setFilters([]); });
    });
  });
};

// ##################################################################################################################################

CBE.getSettings = function(name, emit) {
  let _ajaxPromises = [];
  let _baseFilters;
  let _roomFilters;

  let _baseURL = Base_URL + name + ".json";
  let _roomURL = Room_URL + name + ".json";

  _ajaxPromises.push(jQuery.ajax({ url: _baseURL, datatype: 'json', timeout: 500, cache: false, beforeSend: function(jqXHR) { jqXHR.order = 0; }, }));
  _ajaxPromises.push(jQuery.ajax({ url: _roomURL, datatype: 'json', timeout: 500, cache: false, beforeSend: function(jqXHR) { jqXHR.order = 1; }, }));

  function setFilters(jqXHR) {
    if (!jqXHR.responseJSON) { jqXHR.responseJSON = {}; }

    if (jqXHR.order < 1) { _baseFilters = jqXHR.responseJSON; }
    else                 { _roomFilters = jqXHR.responseJSON; }
    
    if ((_baseFilters) && (_roomFilters)) {
      let unique = { ..._baseFilters, ..._roomFilters, };
      CBE.traceLog('defaults.getSettings.' + name, JSON.stringify(unique));
      window.socket.emit(emit, unique);
    }
  }

  jQuery.when(_ajaxPromises).always(function() {
    jQuery.each(_ajaxPromises, function(index, value) {
      this
        .success(function(data, textStatus, jqXHR) { setFilters(jqXHR); })
        .fail(function(jqXHR, exception) { setFilters(jqXHR); });
    });
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.getOptions = function() { CBE.getSettings("options", "setOptions"); };

CBE.getPermissions = function() { CBE.getSettings("permissions", "setPermissions"); };

// ##################################################################################################################################
// ##################################################################################################################################

CBE.delayChanges = function() {
  CBE.debugData("defaults.document.ready");

  CBE.getBot();
  if (UPDATE_JS)          { CBE.getJavascript(); }
  if (UPDATE_CSS)         { CBE.getCSS(); }
  if (UPDATE_MOTD)        { CBE.getMOTD(); }
  if (UPDATE_OPTIONS)     { CBE.getOptions(); }
  if (UPDATE_PERMISSIONS) { CBE.getPermissions(); }
  if (UPDATE_EMOTES)      { CBE.getEmotes(); }
  if (UPDATE_FILTERS)     { CBE.getFilters(); }
};

// ----------------------------------------------------------------------------------------------------------------------------------
jQuery(document).ready(function() {
  try {
    setTimeout(function() { CBE.delayChanges(); }, 2500);
  } catch (error) {
    window.console.error('defaults.load error', error);
  }
});

// ##################################################################################################################################
