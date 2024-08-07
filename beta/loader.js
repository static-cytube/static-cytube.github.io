/*!  Cinema-Blue Loader
**|  Description: Loads CyTube enhancements
**|  Version: 2024.07.18
**|  License: MIT
**|  Usage: Channel Settings->Edit->JavaScript: jQuery.getScript("https://static.cinema-blue.icu/www/loader.min.js");
**@preserve
*/
"use strict";

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true, varstmt:false, unused:false, undef:true

if (!window[window.CHANNEL.name]) { window[window.CHANNEL.name] = {}; }

//  Channel Settings->Edit->JavaScript: jQuery.ajax({dataType:'script',cache:true,url:'https://static.cinema-blue.icu//www/loader.js'});

// jshint latedef:false

// Defaults
var START = Date.now();
var TODAY = new Date().toISOString().split('T')[0];
if (typeof CB === "undefined") { var CB = {}; }

if (typeof ChannelName_Caption === "undefined") { var ChannelName_Caption = window.CHANNELNAME; }
if (typeof Room_ID             === "undefined") { var Room_ID = "jac"; }
if (typeof AGE_RESTRICT        === "undefined") { var AGE_RESTRICT = true; }
if (typeof GUESTS_CHAT         === "undefined") { var GUESTS_CHAT = true; }
if (typeof REPORT_EMAIL        === "undefined") { var REPORT_EMAIL = "admin@cinema-blue.icu"; }

if (typeof CHANNEL_DEBUG       === "undefined") { var CHANNEL_DEBUG = false; }
if (typeof BETA_USER           === "undefined") { var BETA_USER = false; }
if (typeof BETA_USERS          === "undefined") { var BETA_USERS = []; }
if (typeof UPDATE_DEFAULTS     === "undefined") { var UPDATE_DEFAULTS = true; }

if (typeof BOT_NICK            === "undefined") { var BOT_NICK = "Cinema-Blue-Bot"; }
if (typeof ROOM_ANNOUNCEMENT   === "undefined") { var ROOM_ANNOUNCEMENT = ""; }
if (typeof MOD_ANNOUNCEMENT    === "undefined") { var MOD_ANNOUNCEMENT = ""; }
if (typeof ADVERTISEMENT       === "undefined") { var ADVERTISEMENT = ""; }

if (typeof MOTD_MSG            === "undefined") { var MOTD_MSG = ""; }
if (typeof MOTD_RULES          === "undefined") { var MOTD_RULES = true; }
if (typeof MOTD_ROOMS          === "undefined") { var MOTD_ROOMS = true; }

if (typeof LOG_MSG === "undefined") { var LOG_MSG = (window.CLIENT.rank < window.Rank.Owner); }
if (window.CLIENT.rank > window.Rank.Moderator) { LOG_MSG = false; } // NOT Owner+

// jshint latedef:true

// ##################################################################################################################################

var Root_URL = "https://static.cinema-blue.icu/";
var Base_URL = Root_URL + "www/";
var Room_URL = Base_URL + Room_ID + "/";
var CustomCSS_URL = Room_URL + 'custom.css';
var minifyJS = document.currentScript.src.toLowerCase().includes(".min.");

BETA_USERS = BETA_USERS.map(function(user) { return user.toLowerCase(); });
if (BETA_USERS.indexOf(window.CLIENT.name.toLowerCase()) > -1) { BETA_USER = true; }

if ((BETA_USER) || (Room_ID.toLowerCase() === 'jac')) {
  CHANNEL_DEBUG = true;
  Base_URL = Base_URL.replace("/www/", "/beta/");
}

if (CHANNEL_DEBUG) { 
  var VERSION = 'version=' + START;
} else {
  var VERSION = 'version=' + TODAY;
}

// ##################################################################################################################################

CB.linkCSS = function(id, filename, minify = minifyJS) {
  try {
    if (minify) { filename = filename.replace(".css", ".min.css"); }

    $("head").append('<link rel="stylesheet" type="text/css" id="' + id + '" href="' + filename + '?' + VERSION + '" />');
  } catch (e) {
    window.console.error("loader.linkCSS error: " + filename + " - " + JSON.stringify(e));
  }
};

// ##################################################################################################################################

CB.jsScripts = [
  Base_URL + "common.js",
  Base_URL + "showimg.js",
];

// ----------------------------------------------------------------------------------------------------------------------------------
/*  window.CLIENT.rank
  Guest: 0
  Member: 1
  Leader: 1.5
  Moderator: 2
  Admin: 3
  Owner: 10
  Siteadmin: 255
*/

if (typeof CUSTOM_LOADED === "undefined") { // Load Once
  var CUSTOM_LOADED = true;

  if (window.CLIENT.rank >= window.Rank.Admin) {
    if (UPDATE_DEFAULTS) { CB.jsScripts.push(Base_URL + "defaults.js"); }
    CB.jsScripts.push(Base_URL + "betterpm.js");
  }

  CB.jsScripts.forEach(function(script) {
    if (minifyJS) { script = script.replace(".js", ".min.js"); }
    jQuery.ajax({dataType: 'script', cache: true, async: false, timeout: 1000, url: script + '?' + VERSION, });
    window.console.debug("loader.Script:", script);
  });

  // ----------------------------------------------------------------------------------------------------------------------------------
  $(document).ready(function() {
    CB.linkCSS("basecss", Base_URL + "base.css");
    CB.linkCSS("customcss", CustomCSS_URL, false);

    // No Conflicts
    $("#chancss").remove();
    $("#chanexternalcss").remove();

    $(".navbar-brand").replaceWith('<span class="navbar-brand">' + ChannelName_Caption + "</span>");
    $("ul.navbar-nav li:contains('Home')").remove();
    $("ul.navbar-nav li:contains('Discord')").remove();
  });
}

// ##################################################################################################################################
/* End of Script */