/*!
**|  JS Library Loader
**|  Version: 2024.05.10
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

/* globals socket, CHANNEL, CLIENT, Rank, CHATTHROTTLE, IGNORED, USEROPTS, initPm, pingMessage, formatChatMessage, Callbacks */
/* globals removeVideo, makeAlert, videojs, PLAYER, CHANNELNAME */

if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

//  Channel Settings->Edit->JavaScript: jQuery.getScript("{root}/www/loader.js");

// Defaults
// jshint latedef:false
var START = Date.now();
if (typeof CB === "undefined") { var CB = {}; }

if (typeof CUSTOM_LOADED === "undefined") { var CUSTOM_LOADED = false; }
if (typeof ChannelName_Caption === "undefined") { var ChannelName_Caption = CHANNELNAME; }
if (typeof Room_ID === "undefined") { var Room_ID = "jac"; }
if (typeof AGE_RESTRICT === "undefined") { var AGE_RESTRICT = true; }
if (typeof GUESTS_CHAT === "undefined") { var GUESTS_CHAT = true; }
if (typeof REPORT_EMAIL === "undefined") { var REPORT_EMAIL = "admin@cinema-blue.icu"; }

if (typeof CHANNEL_DEBUG === "undefined") { var CHANNEL_DEBUG = false; }
if (typeof BETA_USER === "undefined") { var BETA_USER = false; }
if (typeof BETA_USERS === "undefined") { var BETA_USERS = []; }
if (typeof UPDATE_DEFAULTS === "undefined") { var UPDATE_DEFAULTS = true; }

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

var Root_URL = "https://static.cinema-blue.icu/";
var Base_URL = Root_URL + "www/";
var Room_URL = Base_URL + Room_ID + "/";
var CustomCSS_URL = Room_URL + 'custom.css';

BETA_USERS = BETA_USERS.map(function(user) { return user.toLowerCase(); });
if (BETA_USERS.indexOf(CLIENT.name.toLowerCase()) > -1) { BETA_USER = true; }

if ((BETA_USER) || (Room_ID.toLowerCase() === 'jac')) {
  CHANNEL_DEBUG = true;
  Base_URL = Base_URL.replace("/www/", "/beta/");
}

// jQuery.ajaxSetup({ async: false, timeout: 10000, cache: true, }); // Minimize Scripts
if (CHANNEL_DEBUG) {
  // jQuery.ajaxSetup({ cache: false, }); // Load fresh
}

// ##################################################################################################################################

CB.jsScriptsIdx = 0;
CB.jsScripts = [
  Base_URL + "common.js",
  Base_URL + "showimg.js",
];

// https://stackoverflow.com/questions/11803215/how-to-include-multiple-js-files-using-jquery-getscript-method

// ----------------------------------------------------------------------------------------------------------------------------------
jQuery.cachedScript = function(url, options) {
  options = jQuery.extend(options || {}, { dataType: "script", cache: true, async: false, timeout: 2000, url: url, });
  return jQuery.ajax(options);
};

// ----------------------------------------------------------------------------------------------------------------------------------
CB.jsScriptsLoader = function() { // Load Javascripts in order
  if (CB.jsScriptsIdx < CB.jsScripts.length) {
    let filename = CB.jsScripts[CB.jsScriptsIdx];

    jQuery.cachedScript(filename)
      .done(function(script, textStatus) {
        window.console.log("loader.getScript " + filename + ": " + textStatus );
        CB.jsScriptsIdx++;
        CB.jsScriptsLoader();  // Recurse
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
CB.linkCSS = function(id, filename) {
  try {
    if (CHANNEL_DEBUG) { filename += '?ac=' + START; }
    jQuery("head").append('<link rel="stylesheet" type="text/css" id="' + id + '" href="' + filename + '" />');
  } catch (e) {
    window.console.error("loader.linkCSS error: " + filename + " - " + JSON.stringify(e));
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

if (!CUSTOM_LOADED) { // Load Once 
  CUSTOM_LOADED = true;
  
  if (window.CLIENT.rank > Rank.Moderator) { // At least Admin
    if (UPDATE_DEFAULTS) { CB.jsScripts.push(Base_URL + "defaults.js"); }
    CB.jsScripts.push(Base_URL + "betterpm.js");
  }

  CB.jsScriptsLoader();

  // ----------------------------------------------------------------------------------------------------------------------------------
  jQuery(document).ready(()=>{
    jQuery(".navbar-brand").replaceWith('<span class="navbar-brand">' + ChannelName_Caption + "</span>");
    jQuery("ul.navbar-nav li:contains('Home')").remove();
    jQuery("ul.navbar-nav li:contains('Discord')").remove();
    
    CB.linkCSS("basecss", Base_URL + "base.css");
    
    jQuery("#chanexternalcss").remove(); // No Conflicts
    
    jQuery("#chancss").remove(); // No Conflicts
    CB.linkCSS("chancss", CustomCSS_URL);
  });
}

// ##################################################################################################################################
/* End of Script */
