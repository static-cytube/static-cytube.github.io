/*!
**|  CyTube Customizations
**|   
**@preserve
*/

var ChannelName_Caption = 'Sophia Diamond';
var Room_ID = 'sd';

var ALLOW_GUESTS = true;
var AGE_RESTRICT = false;

var MOTD_RULES = false;
var MOTD_ROOMS = false;

var BOT_NICK = 'Chat_Bot';

var ROOM_ANNOUNCEMENT = `This popular room just disappeared. To reclaim it send an email to <strong>admin@jackandchat.net</strong>`;

// ##################################################################################################################################
if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

$.getScript("https://static-cytube.github.io/www/loader.js");
