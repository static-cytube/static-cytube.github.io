/*!
**|  CyTube Enhancements: Room Defaults
**|  Version: 2024.03.04
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

/* globals window.socket, CHANNEL, Root_URL, Base_URL, Room_URL, debugData, logTrace, errorData, CustomCSS_URL, AGE_RESTRICT */

if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

if (typeof UPDATE_CSS === "undefined")         { var UPDATE_CSS = true; }
if (typeof UPDATE_EMOTES === "undefined")      { var UPDATE_EMOTES = true; }
if (typeof UPDATE_FILTERS === "undefined")     { var UPDATE_FILTERS = true; }
if (typeof UPDATE_JS === "undefined")          { var UPDATE_JS = true; }
if (typeof UPDATE_MOTD === "undefined")        { var UPDATE_MOTD = true; }
if (typeof UPDATE_OPTIONS === "undefined")     { var UPDATE_OPTIONS = true; }
if (typeof UPDATE_PERMISSIONS === "undefined") { var UPDATE_PERMISSIONS = true; }

var BlockerCSS_URL = Base_URL + 'blocker.css';
var Emotes_URL = Root_URL + 'emoji/emoji.json';
var Filters_URL = Room_URL + 'filters.json';
var JS_URL = Room_URL + 'JS_Editor.js';
var MOTD_URL = Room_URL + 'motd.html';
var Options_URL = Base_URL + 'options.json';
var Permissions_URL = Base_URL + 'permissions.json';

// ##################################################################################################################################

const getOptions = function() {
  jQuery.getJSON(Options_URL, function(data) {
      logTrace('defaults.getOptions', data);
      window.socket.emit("setOptions", data);
    })
    .fail(function(data) {
      errorData('defaults.getOptions Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getPermissions = function() {
  jQuery.getJSON(Permissions_URL, function(data) {
      logTrace('defaults.getPermissions', data);
      window.socket.emit("setPermissions", data);
    })
    .fail(function(data) {
      errorData('defaults.getPermissions Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getFilters = function() {
  jQuery.getJSON(Filters_URL, function(data) {
      logTrace('defaults.getFilters', data);
      window.socket.emit("importFilters", data);
    })
    .fail(function(data) {
      errorData('defaults.getFilters Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getEmotes = function() {
  jQuery.getJSON(Emotes_URL, function(data) {
      logTrace('defaults.getEmotes', data);
      window.socket.emit("importEmotes", data);
    })
    .fail(function(data) {
      errorData('defaults.getEmotes Error', data.status + ": " + data.statusText);
    });
};

// ##################################################################################################################################

const getMOTD = function() {
  jQuery.ajax({
    url: MOTD_URL,
    type: 'GET',
    datatype: 'html',
    cache: false,
    error: function(data) {
      errorData('defaults.getMOTD Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      logTrace('defaults.getMOTD', data);
      window.socket.emit("setMotd", { motd: data });
    },
  });

  setMOTDmessage(); // common.js
};

// ##################################################################################################################################

const getJS = function() {
  jQuery.ajax({
    url: JS_URL,
    type: 'GET',
    datatype: 'script',
    cache: false,
    error: function(data) {
      errorData('defaults.getJS Error', data.status + ": " + data.statusText);
    },
    success: function(data) {
      if (data !== CHANNEL.js) {
        logTrace('defaults.getJS', data);
        window.socket.emit("setChannelJS", { js: data });
        location.reload(true);
      }
    },
  });
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
    
    logTrace('defaults.getCSS.setCustomCSS', data);
    
    window.socket.emit("setChannelCSS", { css: data, });
  }
  
  if (AGE_RESTRICT) {
    jQuery.ajax({
      url: BlockerCSS_URL,
      type: 'GET',
      datatype: 'text',
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
    type: 'GET',
    datatype: 'text',
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

//  DOCUMENT READY
jQuery(document).ready(function() {
  debugData("defaults.documentReady", "");

  if (UPDATE_JS)          { getJS(); }
  if (UPDATE_OPTIONS)     { getOptions(); }
  if (UPDATE_PERMISSIONS) { getPermissions(); }
  if (UPDATE_CSS)         { getCSS(); }
  if (UPDATE_MOTD)        { getMOTD(); }
  if (UPDATE_EMOTES)      { getEmotes(); }
  if (UPDATE_FILTERS)     { getFilters(); }
});

// ##################################################################################################################################
