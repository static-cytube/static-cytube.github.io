/*!
**|  CyTube Customizations
**|   
**@preserve
*/

var ChannelName_Caption = 'Jack & Chat';
var Room_ID = 'jac';

var BOT_NICK = "Cinema-Blue-Bot";

var CHANNEL_DEBUG = true;
var AGE_RESTRICT = false;

var BETA_USERS = ['JackAndChatBot','Cinema-Blue-Bot','lisaqtee'];

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

// var MOD_ANNOUNCEMENT = `Admin is on vacation until March 13th. If there are any problems send an email to <strong>admin@cinema-blue.icu</strong><br />Thanks!`;

// var MOTD_MSG = `<br /><span style="color:orange">Here is a list of other rooms <a style="color:orange;font-weight:600" target=_blank" href="https://s.lain.la/xZP2R">https://s.lain.la/xZP2R</a></span>`;

// ##################################################################################################################################
if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

$.getScript("https://static.cinema-blue.icu/beta/loader.js");
