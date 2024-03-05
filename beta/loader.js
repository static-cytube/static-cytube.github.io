/*!
**|  JS Library Loader
**|  Version: 2024.03.05
**|
**@preserve
*/
"use strict";

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt:false
// jshint unused:false
// jshint undef:true

/* globals CHANNEL, CLIENT, Rank, CHANNELNAME */

if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

//  Channel Settings->Edit->JavaScript: $.getScript("{root}/www/loader.js");

// Defaults
// jshint latedef:false
var START = Date.now();
if (!window[CHANNEL.name].CUSTOM_LOADED) { window[CHANNEL.name].CUSTOM_LOADED = false; }
if (typeof ChannelName_Caption === "undefined") { var ChannelName_Caption = CHANNELNAME; }
if (typeof Room_ID === "undefined") { var Room_ID = "jac"; }
if (typeof AGE_RESTRICT === "undefined") { var AGE_RESTRICT = true; }
if (typeof GUESTS_CHAT === "undefined") { var GUESTS_CHAT = true; }
if (typeof REPORT_EMAIL === "undefined") { var REPORT_EMAIL = "admin@cinema-blue.icu"; }

if (typeof CHANNEL_DEBUG === "undefined") { var CHANNEL_DEBUG = false; }
if (typeof BETA_USER === "undefined") { var BETA_USER = false; }
if (typeof BETA_USERS === "undefined") { var BETA_USERS = []; }

if (typeof BOT_NICK === "undefined") { var BOT_NICK = "Cinema-Blue-Bot"; }
if (typeof ROOM_ANNOUNCEMENT === "undefined") { var ROOM_ANNOUNCEMENT = ""; }
if (typeof MOD_ANNOUNCEMENT === "undefined") { var MOD_ANNOUNCEMENT = ""; }
if (typeof ADVERTISEMENT === "undefined") { var ADVERTISEMENT = ""; }

if (typeof MOTD_MSG === "undefined") { var MOTD_MSG = ""; }
if (typeof MOTD_RULES === "undefined") { var MOTD_RULES = true; }
if (typeof MOTD_ROOMS === "undefined") { var MOTD_ROOMS = true; }

if (typeof LOG_MSG === "undefined") { var LOG_MSG = (window.CLIENT.rank < Rank.Owner); }
if (window.CLIENT.rank > Rank.Moderator) { LOG_MSG = false; } // NOT Owner+

// jshint latedef:true

// ##################################################################################################################################

window.console.debug('#################################################################################  Host', document.location.hostname);

// window[CHANNEL.name].Root_URL = "https://static-cytube.github.io/";
window[CHANNEL.name].Root_URL = "https://static.cinema-blue.icu/";
window[CHANNEL.name].Base_URL = window[CHANNEL.name].Root_URL + "www/";
window[CHANNEL.name].Room_URL = window[CHANNEL.name].Base_URL + window[CHANNEL.name].Room_ID + "/";
window[CHANNEL.name].CustomCSS_URL = window[CHANNEL.name].Room_URL + 'custom.css';

BETA_USERS = BETA_USERS.map(function(user) { return user.toLowerCase(); });
if (BETA_USERS.indexOf(CLIENT.name.toLowerCase()) > -1) { BETA_USER = true; }

if ((BETA_USER) || (Room_ID.toLowerCase() === 'jac')) {
  CHANNEL_DEBUG = true;
  window[CHANNEL.name].Base_URL = window[CHANNEL.name].Base_URL.replace("/www/", "/beta/");
}

// ##################################################################################################################################

window[CHANNEL.name].jsScriptsIdx = 0;
window[CHANNEL.name].jsScripts = [
  window[CHANNEL.name].Base_URL + "common.js",
  // TODO: window[CHANNEL.name].Base_URL + "showimg.js",
];

// ----------------------------------------------------------------------------------------------------------------------------------
const jsScriptsLoad = function() { // Load Javascripts in order
  if (window[CHANNEL.name].jsScriptsIdx < window[CHANNEL.name].jsScripts.length) {
    let filename = window[CHANNEL.name].jsScripts[window[CHANNEL.name].jsScriptsIdx];

    $.getScript(filename)
      .done(function(script, textStatus) {
        window.console.log("loader.getScript " + filename + ": " + textStatus );
        window[CHANNEL.name].jsScriptsIdx++;
        jsScriptsLoad();  // Recurse
      })
      .fail(function(jqxhr, settings, exception) {
        if (arguments[0].readyState === 0) {
          window.console.error(filename + " FAILED to load!");
        } else {
          window.console.error(filename + " loaded but FAILED to parse! " + arguments[2].toString());
        }
      });
  }
};

// ----------------------------------------------------------------------------------------------------------------------------------
const loadCSS = function(id, filename) {
  try {
    $("head").append('<link rel="stylesheet" type="text/css" id="' + id + '" href="' + filename + '?ac=' + START + '" />');
  } catch (e) {
    window.console.error("loader.loadCSS error: " + filename + " - " + JSON.stringify(e));
  }
};

// ##################################################################################################################################

/*
  window.CLIENT.rank
  Rank.Guest: 0
  Rank.Member: 1
  Rank.Leader: 1.5
  Rank.Moderator: 2
  Rank.Admin: 3
  Rank.Owner: 10
  Rank.Siteadmin: 255
*/

if (!window[CHANNEL.name].CUSTOM_LOADED) { // Load Once
  window[CHANNEL.name].CUSTOM_LOADED = true;

  if (window.CLIENT.rank > Rank.Moderator) { // At least Admin
    window[CHANNEL.name].jsScripts.push(window[CHANNEL.name].Base_URL + "defaults.js");
    // TODO: window[CHANNEL.name].jsScripts.push(window[CHANNEL.name].Base_URL + "betterpm.js");
  }

  jsScriptsLoad();

  // ----------------------------------------------------------------------------------------------------------------------------------
  $(document).ready(function() {
    $(".navbar-brand").replaceWith('<span class="navbar-brand">' + ChannelName_Caption + "</span>");
    $("ul.navbar-nav li:contains('Home')").remove();
    $("ul.navbar-nav li:contains('Discord')").remove();

    loadCSS("basecss", window[CHANNEL.name].Base_URL + "base.css");

    $("#chanexternalcss").remove(); // No Conflicts

    $("#chancss").remove(); // No Conflicts
    loadCSS("chancss", window[CHANNEL.name].CustomCSS_URL);
  });
}

// ##################################################################################################################################
/* End of Script */
