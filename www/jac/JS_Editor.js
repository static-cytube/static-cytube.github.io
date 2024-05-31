/*! CyTube Customizations
**@preserve
*/

var ChannelName_Caption = 'Jack & Chat';
var Room_ID = 'jac';

var CHANNEL_DEBUG = true;
var UPDATE_DEFAULTS = false;
var UPDATE_JS = false;

var AGE_RESTRICT = false;

var MOTD_RULES = true;
var MOTD_ROOMS = true;

// var BETA_USERS = ['Cinema-Blue-Bot','lisaqtee'];

var ADVERTISEMENT = `<a href="http://www.swinglifestyle.com/?signup=FunWorksCouple" target="_blank">` + 
  `<img src="https://static.cinema-blue.icu/ads/sls04.gif" alt="SwingLifeStyle" border="0"></a>` +
  `<br /><a href="http://www.swinglifestyle.com/?signup=FunWorksCouple" target="_blank">Sponsor</a>`;

var ROOM_ANNOUNCEMENT =
  `If you are interested in being a <span style="color:Blue">Moderator</span>, have a Comment or <em>Constructive</em> Criticism,<br />` +
  `please contact <a style="font-weight:Bold" href="mailto:admin@cinema-blue.icu">admin@cinema-blue.icu</a></span><br />` +
  ``;

// var MOD_ANNOUNCEMENT = `Lisa is on vacation until March 13th. If there are any problems send an email to <strong>admin@cinema-blue.icu</strong><br />Thanks!`;
// var MOTD_MSG = `<br /><span style="color:orange">Here is a list of other rooms <a style="color:orange;font-weight:600" target=_blank" href="https://s.lain.la/xZP2R">https://s.lain.la/xZP2R</a></span>`;

// ##################################################################################################################################

jQuery.ajax({dataType:'script',cache:0,async:0,url:"https://static.cinema-blue.icu/beta/loader.js",});
