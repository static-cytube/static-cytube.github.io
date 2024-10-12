// ==UserScript==
// @name         JS & CSS Test
// @description  Test JS and CSS
// @author       Cinema-Blue
// @copyright    2024+ Cinema-Blue
// @version      2024-10-11
// @license      MIT
// @namespace    https://cinema-blue.icu
// @match        https://cytu.be/r/JackAndChat
// @grant        unsafeWindow
// @grant        GM_getResourceURL
// @run-at       document-start
// ==/UserScript==
'use strict';

var safeWin = window.unsafeWindow || window;

// ##################################################################################################################################################################
const testCSS = `<style type="text/css" id="testCSS">
@charset "UTF-8";

/* Global Variables */
:root {
  --afk: #606060;
  --user: #d4b791;
  --user_guest: #888888;
  --user_mod: DeepSkyBlue;
  --user_admin: Orange;
  --inputbg: #0000FF;
}

#messagebuffer .username, .pm-buffer .username {
  color: var(--user);
  font-size: 75%;
  font-weight: 100;
  font-stretch: ultra-condensed;
}


#userlist, .username {
  color: var(--user);
}

.userlist_afk .glyphicon {
  color: var(--afk);
}
.userlist_guest {
  color: var(--user_guest) !important;
}

.adminnick,
.userlist_siteadmin, .userlist_siteadmin > .username,
.userlist_owner, .userlist_owner > .username {
  color: var(--user_admin) !important;
}
.userlist_op, .userlist_op > .username { color: var(--user_mod) !important; }

</style>`;

// ##################################################################################################################################################################
(function() {
  const scriptName = GM_info.script.name;
  const scriptVersion = GM_info.script.version;
  safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

  safeWin.addEventListener("load", function() {
    document.head.innerHTML += '<link rel="stylesheet" type="text/css" id="basecss" href="https://static.cinema-blue.icu/beta/base.css?v=' + Date.now() + '" />';

    // document.head.innerHTML += testCSS;
  });
})();
