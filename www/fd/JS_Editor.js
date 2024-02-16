/*!
**|  CyTube Customizations
**|   
**@preserve
*/

var ChannelName_Caption = 'Kute Faces';
var Room_ID = 'fd';

var AGE_RESTRICT = true;
var GUESTS_CHAT = false;
var MOTD_RULES = true;
var MOTD_ROOMS = false;

var BOT_NICK = "LarryFlynt";

var ROOM_ANNOUNCEMENT = `<br /><span style="color:blue"> ` +
  `<strong>Ped0 assh0les</strong> got the last room banned. We're not replacing it again. ` +
  `Keep your <i>under-age shit</i> out of here!!! <br /> <br /> ` +
  `We will be checking the log files for violations and issuing <strong>lifetime BANS</strong> by name &amp; IP. ` + 
  `You have been warned! <br /> <br /> ` +
  `Thanks to these morons (IQ < 80), chat and PM will be limited to registered users ONLY. <br /> ` +
  `&nbsp;</span>`;

// ##################################################################################################################################
if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

$.getScript("https://static.cinema-blue.icu/www/loader.js");
