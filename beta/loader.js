/*!  Cinema-Blue Loader
**|  Description: Loads CyTube enhancements
**|  Version: 2025.01.20
**|  License: MIT
**|  Usage: Channel Settings->Edit->JavaScript: jQuery.getScript("https://static.cinema-blue.icu/www/loader.min.js");
**@preserve
*/
'use strict';

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true, varstmt:false, unused:false, undef:true

// Channel Settings->Edit->JavaScript: jQuery.getScript("https://static.cinema-blue.icu/www/loader.min.js");

// jshint latedef:false

// ##################################################################################################################################

jQuery.holdReady(true);

// Defaults
var START = Date.now();
var TODAY = new Date().toISOString().split('T')[0];

if (typeof ChannelName_Caption === 'undefined') { var ChannelName_Caption = window.CHANNELNAME; }
if (typeof Room_ID             === 'undefined') { var Room_ID = 'jac'; }
if (typeof AGE_RESTRICT        === 'undefined') { var AGE_RESTRICT = true; }
if (typeof GUESTS_CHAT         === 'undefined') { var GUESTS_CHAT = true; }
if (typeof REPORT_EMAIL        === 'undefined') { var REPORT_EMAIL = 'admin@cinema-blue.icu'; }

if (typeof CHANNEL_DEBUG       === 'undefined') { var CHANNEL_DEBUG = false; }
if (typeof BETA_USERS          === 'undefined') { var BETA_USERS = []; }
if (typeof UPDATE_DEFAULTS     === 'undefined') { var UPDATE_DEFAULTS = true; }

if (typeof BOT_NICK            === 'undefined') { var BOT_NICK = 'Cinema-Blue-Bot'; }
if (typeof ROOM_ANNOUNCEMENT   === 'undefined') { var ROOM_ANNOUNCEMENT = ''; }
if (typeof MOD_ANNOUNCEMENT    === 'undefined') { var MOD_ANNOUNCEMENT = ''; }
if (typeof ADVERTISEMENT       === 'undefined') { var ADVERTISEMENT = ''; }

if (typeof MOTD_MSG            === 'undefined') { var MOTD_MSG = ''; }
if (typeof MOTD_RULES          === 'undefined') { var MOTD_RULES = true; }
if (typeof MOTD_ROOMS          === 'undefined') { var MOTD_ROOMS = true; }

if (typeof LOG_MSG === 'undefined') { var LOG_MSG = (window.CLIENT.rank < window.Rank.Owner); }
if (window.CLIENT.rank > window.Rank.Moderator) { LOG_MSG = false; } // NOT Owner+

// ----------------------------------------------------------------------------------------------------------------------------------
if (typeof CBE === 'undefined') { var CBE = {}; }

CBE.loaderSrc = document.currentScript.src.toLowerCase();
CBE.minifyJS = CBE.loaderSrc.includes('.min.');

if (typeof BETA_USER === 'undefined') { var BETA_USER = CBE.loaderSrc.includes('/beta/'); }

// jshint latedef:true

// ##################################################################################################################################

CBE.urlParam = function(name) {
  var results = new RegExp(`[\?&]${name}=([^&#]*)`).exec(window.location.href);
  if (!results || !results.length) { return null; }
  return results[1];
};

// ----------------------------------------------------------------------------------------------------------------------------------
CBE.getFileDate = function(url) {
  let fileDate = new Date(0);
  
  jQuery.ajax({ type: "HEAD", async: false, cache: false, timeout: 500, url: url, })
    .success(function(data, textStatus, jqXHR) { 
      let dateStr = jqXHR.getResponseHeader("last-modified");
      fileDate = new Date(dateStr);
    });
    
  return fileDate;
};

CBE.lastUpdate = CBE.getFileDate(document.currentScript.src);
// window.console.debug("lastUpdate:", CBE.lastUpdate);

// ##################################################################################################################################

CBE.Root_URL = 'https://static.cinema-blue.icu/';
CBE.Base_URL = CBE.Root_URL + 'www/';
CBE.Room_URL = CBE.Base_URL + Room_ID + '/';
CBE.CustomCSS_URL = CBE.Room_URL + 'custom.css'; // Used in common.js, defaults.js

BETA_USERS = BETA_USERS.map(function(user) { return user.toLowerCase(); });
if (BETA_USERS.indexOf(window.CLIENT.name.toLowerCase()) > -1) { BETA_USER = true; }

if (Room_ID.toLowerCase() === 'jac') { BETA_USER = true; }

if (BETA_USER) {
  CHANNEL_DEBUG = true;
  CBE.minifyJS = false;
  CBE.Base_URL = CBE.Base_URL.replace('/www/', '/beta/');
}

CBE.urlVersion = 'v=' + TODAY;
if (CHANNEL_DEBUG) { 
  CBE.urlVersion = 'v=' + START;
}

if (TODAY === CBE.lastUpdate.toISOString().split('T')[0]) { CBE.urlVersion = 'v=' + START; } // Override if today

// ##################################################################################################################################

jQuery(document).ajaxError(function(event, jqxhr, settings, thrownError) {
  window.console.error('AJAX Request Failed:', settings.url, thrownError);
});

// ##################################################################################################################################

CBE.linkCSS = function(id, filename, minify = CBE.minifyJS) {
  try {
    if (minify) { filename = filename.replace('.css', '.min.css'); }
    jQuery('head').append(`<link rel="stylesheet" type="text/css" id="${id}" href="${filename}?${CBE.urlVersion}" />`);
  } catch (e) {
    window.console.error(`loader.linkCSS error: ${filename} - ${JSON.stringify(e)}`);
  }
};

// ##################################################################################################################################

CBE.jsScripts = [
  `${CBE.Base_URL}common.js`,
  `${CBE.Base_URL}showimg.js`,
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

if (typeof CUSTOM_LOADED === 'undefined') { // Load Once
  var CUSTOM_LOADED = true;

  CBE.linkCSS('basecss', CBE.Base_URL + 'base.css');

  jQuery('#chanexternalcss').detach().appendTo('head');  // Move down

  CBE.linkCSS('customcss', CBE.CustomCSS_URL, false);

  jQuery('#chancss').remove(); // Remove Adults Only Screen

  // ----------------------------------------------------------------------------------------------------------------------------------
  if (window.CLIENT.rank >= window.Rank.Admin) {
    CBE.jsScripts.push(CBE.Base_URL + 'betterpm.js');
    if (UPDATE_DEFAULTS) { CBE.jsScripts.push(`${CBE.Base_URL}defaults.js`); }
  }

  CBE.jsScripts.forEach(function(script, idx, array) {
    if (CBE.minifyJS) { script = script.replace('.js', '.min.js'); }

    jQuery.ajax({
      dataType: 'script',
      cache: true,
      async: true,
      timeout: 2000,
      url: script + '?' + CBE.urlVersion,
      error: function(data) {
        CBE.errorData('common.getFooter Error', data.status + ": " + data.statusText);
      },
      success: function(data) {
        CBE.debugData("common.getFooter", data);
        jQuery("p.credit").html(data);
      },
    })
    .done(function(data) {
      jQuery.holdReady(false);
      window.console.debug('loader.Script.done:', data);
    });;

    window.console.debug('loader.Script:', script);
  });

  // ----------------------------------------------------------------------------------------------------------------------------------
  jQuery(document).ready(function() {
    jQuery('.navbar-brand').replaceWith(`<span class="navbar-brand">${ChannelName_Caption}</span>`);
    jQuery('ul.navbar-nav li:contains("Home")').remove();
    jQuery('ul.navbar-nav li:contains("Discord")').remove();
  });
}

// ##################################################################################################################################
/* End of Script */
