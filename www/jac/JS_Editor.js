/*!
**|  CyTube Customizations
**|   
**@preserve
*/

var ChannelName_Caption = 'Jack & Chat';
var Room_ID = 'jac';

var LOAD_BOT = false;
var BOT_LOG = true;
var BOT_NICK = "Cinema-Blue-Bot";

var CHANNEL_DEBUG = true;
var AGE_RESTRICT = false;

var MOTD_RULES = true;
var MOTD_ROOMS = false;

// var BETA_USERS = ['Cinema-Blue-Bot','lisaqtee'];

var TRIVIA = false;

// var HIGHLIGHT = ['HIGHLIGHTS'];

var ADVERTISEMENT = `<a href="http://www.swinglifestyle.com/?signup=FunWorksCouple" target="_blank">` + 
  `<img src="https://static.cinema-blue.icu/ads/sls04.gif" alt="SwingLifeStyle" border="0"></a>` +
  `<br /><a href="http://www.swinglifestyle.com/?signup=FunWorksCouple" target="_blank">Sponsor</a>`;

var ADVERTISEMENT = `<a href="https://www.lovense.com/solace-automatic-hands-free-male-masturbator" target="_blank">` + 
  `<img src="https://static.cinema-blue.icu/ads/lovense01.webp" alt="Support this Room" border="0"></a><br />` +
  `<strong>Sponsor</strong>`;

var ROOM_ANNOUNCEMENT = `<br /><span style="color:Blue;font-weight:Bold;">Welcome back!</span><br />` +
  `<br />` +
  `The original <strong>Solo Beauty</strong> room was mysteriously deleted on October 29th probably by the room owner.<br />` +
  `We are trying to recreate this popular room for <em>your</em> enjoyment.&nbsp; Please be patient.<br />` +
  `<br />` +
  `If you are interested in being a <span style="color:Blue">Moderator</span>, have a Comment or <em>Constructive</em> Criticism,<br />` +
  `please contact <a style="font-weight:Bold" href="mailto:admin@cinema-blue.icu">admin@cinema-blue.icu</a></span><br />` +
  ``;

// var MOD_ANNOUNCEMENT = `Lisa is on vacation until March 13th. If there are any problems send an email to <strong>admin@cinema-blue.icu</strong><br />Thanks!`;

// var CLEAR_MSG = `Here is a list of other rooms https://s.lain.la/xZP2R `;

// var MOTD_MSG = `<br /><span style="color:orange">Here is a list of other rooms <a style="color:orange;font-weight:600" target=_blank" href="https://s.lain.la/xZP2R">https://s.lain.la/xZP2R</a></span>`;

// ##################################################################################################################################
if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

jQuery.ajaxSetup({ cache: false, });
jQuery.getScript("https://static.cinema-blue.icu/beta/loader.js");
