/*!
**|  CyTube Enhancements: Room Bot
**|  Version: 2023.08.25
**|
**@preserve
*/
"use strict";

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals socket, CHANNEL, CLIENT, Rank, CHATTHROTTLE, IGNORED, USEROPTS, initPm, pingMessage, formatChatMessage, Callbacks */
/* globals debugData, removeVideo, makeAlert, videojs, CHANNEL_DEBUG, PLAYER, BOT_NICK, IMABOT, MOTD_MSG */
/* globals Buttons_URL, Footer_URL, Favicon_URL, START, ROOM_ANNOUNCEMENT, MOD_ANNOUNCEMENT, ADVERTISEMENT */
/* globals TRIVIA, HIGHLIGHT */

if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

if (typeof TRIVIA === "undefined") { var TRIVIA = false; }
if (typeof HIGHLIGHT === "undefined") { var HIGHLIGHT = []; }

// https://en.wikipedia.org/wiki/List_of_Unicode_characters
window[CHANNEL.name].botReplyMsg = "I'm a bot! Don't expect a reply.";
window[CHANNEL.name].lastChatMsgTime = Date.now();
window[CHANNEL.name].clearDelayMS = 3 * 60 * 60 * 1000;
window[CHANNEL.name].lastVideo = "";

// ##################################################################################################################################

window[CHANNEL.name].botPlayerDefaults = function() {
  try { PLAYER.setVolume(0.0); } catch (e) {}
  removeVideo(event);
};
waitForElement("#ytapiplayer", window[CHANNEL.name].botPlayerDefaults, 100, 10000);

// ##################################################################################################################################

window[CHANNEL.name].doBotReply = function(data) {
  debugData("roombot.doBotReply", data);
  if (data.username.toLowerCase() === CLIENT.name.toLowerCase()) { return; }// Don't talk to yourself

  if (data.msg.startsWith(PREFIX_INFO)) { // Internal Message
    debugData("roombot.PREFIX_INFO", data);
    return;
  }

  window.socket.emit("pm", { to: data.username,
    msg: PREFIX_IGNORE + window[CHANNEL.name].botReplyMsg, meta: {}, });

  if (!data.msg.startsWith(PREFIX_IGNORE)) {
    debugData("roombot.PREFIX_IGNORE", data);
    return; // NOT the Warning
  }
  // if (!data.msg.startsWith("FYI: Guest")) { return; }// NOT the Warning

  setTimeout(()=>{ // Remove PM
    $("#pm-" + data.username).remove();
    $("#pm-placeholder-" + data.username).remove();
  }, 250);
};
window.socket.on("pm", window[CHANNEL.name].doBotReply);

// ##################################################################################################################################

const ipBan = function(username, reason) {
  setTimeout(()=>{
    window.socket.emit("chatMsg", { msg: "/ipban " + username + " " + reason + " " + (new Date()).toISOString(), meta: {}, });
  }, 1500);
};

const sMute = function(username) {
  window.socket.emit("chatMsg", { msg: "/smute " + username, meta: {}, });
};

// addUser: {"name":"username","rank":0,"profile":{"image":"","text":""},"meta":{"afk":false,"muted":false,"smuted":false,"aliases":["username"],"ip":"Ia3B:q149:PVBy:8MYI"}}

window[CHANNEL.name].userJoin = function(data) {
  debugData("roombot.userJoin", data);
  if (data.rank > 1) { return; } // Moderator

  let alias = data.meta.aliases.join(",").toLowerCase();
  debugData("roombot.userJoin.alias", alias);

  let smute = false;
  if (MUTE_GUESTS && (data.name.toLowerCase().indexOf("guest") >= 0)) { // Shadow Mute "guests"
    sMute(data.name);
    window.socket.emit("pm", { to: data.name, msg: PREFIX_IGNORE + "FYI: Guest nicks are *Muted* in chat.", meta: {}, });
    smute = true;
  }

  // Whitelist
  if ((alias.indexOf("wyatt") >= 0)) {
    return;
  }

  // Shadow Mute
  if ((alias.indexOf("degrad") >= 0) ||
      (alias.indexOf("hotninja") >= 0) ||
      (alias === "gngbng") ||
      (alias === "ejaculation") ||
      (alias === "silentfap")) {
    sMute(data.name);
    smute = true;
  }

  if (data.meta.smuted && !smute) { // Unmute to start
    window.socket.emit("chatMsg", { msg: "/unmute " + data.name, meta: {}, });
  }

  // Blacklist
  if (alias.indexOf("rape") >= 0) {
    ipBan(data.name, "ped0 cdperv");
  }

  if ((alias.indexOf("perv") >= 0) &&
      ((alias.indexOf("cd") >= 0) || (alias.indexOf("cross") >= 0))) {
    ipBan(data.name, "ped0 cdperv");
  }

  // IP Ban
/*
  if (data.meta.ip.startsWith("zac.yO4.Ivy") ||
      data.meta.ip.startsWith("JjN.rV1.HMH") ||
      data.meta.ip.startsWith("5YQ.MyZ.jOw") ||
      data.meta.ip.startsWith("tz3.+XR.Zsz")) {
    ipBan(data.name, "ped0 cdperv");
  }

  if (data.meta.ip.startsWith("bak.95l.dL+") ||
      data.meta.ip.startsWith("Ak1.nCX.RoJ") ||
      data.meta.ip.startsWith("RM1.G/C.nvZ") ||
      data.meta.ip.startsWith("jW3.yAN.VX7") ||
      data.meta.ip.startsWith("jDA.K5K.vYX") ||
      data.meta.ip.startsWith("KVM.E49.uNC")) {
    ipBan(data.name, "hessian ASSHOLE");
  }
*/

};
window.socket.on("addUser", window[CHANNEL.name].userJoin);

// ##################################################################################################################################

window.socket.on("chatMsg", (data)=>{
  if (data.username.startsWith('[')) { return; } // Ignore Server Messages
  if (data.username.toLowerCase() === BOT_NICK.toLowerCase()) { return; } // Ignore Bot
  debugData("roombot.chatMsg", data);

  window[CHANNEL.name].lastChatMsgTime = Date.now();

  let user = getUser(data.username);
  if (user === null) { return; }
  if (user.rank > 1) { return; } // Moderator

  if ((data.msg.toLowerCase().indexOf("cunt") >= 0)) {
    // sMute(data.username);
  }
 
  if ((data.msg.toLowerCase().indexOf("rape") >= 0) ||
      (data.msg.toLowerCase().indexOf("catfish") >= 0)) {
    // ipBan(data.username, data.msg);
  }
});

// ##################################################################################################################################

const pauseVideo = function(userCount) {
  return; // TODO:
  
  let $entry = $('#queue > li.queue_entry:contains("Video Paused")');
  let uid = $entry.data("uid") || -1;
  debugData("roombot.pauseVideo.uid", uid);

  if (uid > 0) { // Video Paused
    if (userCount > 1) { // Restart Videos
      debugData("roombot.pauseVideo.Restart", 0);
      try { socket.emit("delete", uid); } catch (e) {}
    }
  }
  else if (userCount <= 1) { // Pause Videos
    debugData("roombot.shufflePlaylist");
    window.socket.emit("shufflePlaylist");

    debugData("roombot.queue");
    window.socket.emit("queue", { id: Base_URL + "adults-only.json", pos:"end", type:"cm", "temp":true, });
   
    debugData("roombot.clear");
    window.socket.emit("chatMsg", { msg: "/clear", meta: {}, });

    socket.once("queue",(data)=>{
      debugData("roombot.jumpTo.Temp", data);
      window.socket.emit("jumpTo", data.item.uid);
    });
  }
};

// ##################################################################################################################################
// Replacement Callbacks

const tryReconnect = function() {
  setTimeout(()=>{
    debugData("roombot.tryReconnect", "");
    if (window.socket && window.socket.connected) { return; }
    window.location.reload(true);
  }, 10000);
};

const BOT_Callbacks = {

  disconnect: function() {
    debugData("roombot.BOT_Callbacks.disconnect", KICKED);
    if (KICKED) { return; }

    $("<div/>")
      .addClass("server-msg-disconnect")
      .text("Disconnected from server.")
      .appendTo($("#messagebuffer"));
    scrollChat();

    tryReconnect();
    return;
  },

  // Socket.IO error callback
  error: function(msg) {
    errorData("roombot.BOT_Callbacks.errorMsg", msg);

    window.SOCKET_ERROR_REASON = msg;
    $("<div/>")
      .addClass("server-msg-disconnect")
      .text("Unable to connect: " + msg)
      .appendTo($("#messagebuffer"));
    scrollChat();

    tryReconnect();
    return;
  },

  errorMsg: function(data) {
    errorData("roombot.BOT_Callbacks.errorMsg", data);

    $("<div/>")
      .addClass("server-msg-disconnect")
      .text("ERROR: " + data.msg)
      .appendTo($("#messagebuffer"));
    scrollChat();
    return;
  },

  pm: function(data) {
    debugData("roombot.BOT_Callbacks.pm", data);
    if (data.username === CLIENT.name) { return; }

    let chatMsg = { time: Date.now(), username: data.username, msg: "ToBot: " + data.msg,
          meta:{ shadow: false, addClass: "action", addClassToNameAndTimestamp: true, }, };
    addChatMessage(chatMsg);
    return;
  },

  announcement: function(data) {
    debugData("roombot.BOT_Callbacks.announcement", data);
    return;
  },

  usercount: function(userCount) {
    debugData("roombot.BOT_Callbacks.userCount", userCount);

    CHANNEL.usercount = userCount;
    let countText = userCount + " connected user";
    if(userCount !== 1) {
      countText += "s";
    }
    $("#usercount").text(countText);

    pauseVideo(userCount);
    return;
  },

  chatMsg: function(data) {
    if ((data.username === "[server]") && (data.msg.indexOf("joined") >= 0)) { return; }
    addChatMessage(data);
  },

  // changeMedia: {"id":"https://files.catbox.moe/3cqnvd.mp4","title":"The Young Like It Hot (1983) s1","seconds":412,"duration":"06:52","type":"fi","meta":{"codec":"mov/h264","bitrate":760.093},"currentTime":-3,"paused":true}
  changeMedia: function(data) {
    debugData("roombot.BOT_Callbacks.changeMedia", data);
    window[CHANNEL.name].botPlayerDefaults();
    let chatMsg = { time: Date.now(), username: "Video", msg: data.title + " [" + data.duration + "]",
          meta:{ shadow: false, addClass: "action", addClassToNameAndTimestamp: true, }, };
    addChatMessage(chatMsg);

/*    
    if (Room_ID.toLowerCase() !== 'hwm') {
      if ((window[CHANNEL.name].lastVideo.length > 0) &&
          (window[CHANNEL.name].lastVideo !== data.id)) {
        debugData("roombot.BOT_Callbacks.changeMedia.Survey", data);
        let msg = "To help improve this room, please fill out Lisa's Survey for 2022 https://forms.gle/N4ZJ9UJbnFuwHLat9 ";
        socket.emit("chatMsg", { msg:msg, meta:{} }); // Change Style
      }
    }
    window[CHANNEL.name].lastVideo = data.id;
*/

    return;
  },

  mediaUpdate: function(data) {
    // debugData("roombot.BOT_Callbacks.mediaUpdate", data);
    return;
  },
};

// ----------------------------------------------------------------------------------------------------------------------------------
window[CHANNEL.name].setupBOT_Callbacks = function(data) {
  debugData("roombot.setupCallbacks", data);
  for (let key in BOT_Callbacks) {
    if (BOT_Callbacks.hasOwnProperty(key)) {
      debugData("roombot.setupCallbacks.key", key);
      window.Callbacks[key] = BOT_Callbacks[key];
    }
  }
};
window.socket.on('changeMedia', window[CHANNEL.name].setupBOT_Callbacks);

// ##################################################################################################################################

window[CHANNEL.name].randomMsgDelayMS = 45 * 60 * 1000;
// if (CHANNEL_DEBUG) { window[CHANNEL.name].randomMsgDelayMS = 10 * 1000; }

window[CHANNEL.name].lastRandomMsgTime = Date.now();
window[CHANNEL.name].lastBotMsg = 0;
window[CHANNEL.name].botMsgs = [
  `Please report any issues, abusive or :red:illegal:z: activity to :cyan:report@cinema-blue.icu`,

  `:green:CyTube TIP::z: Add your _ASL_ to your :cyan:Account->Profile:z: so it shows up when you hover over your nickname`,
  `:green:CyTube TIP::z: If you select :cyan:Options->General->Layout->SyncTube:z: the chat will be on the right side, MyCircle style`,
  `:green:CyTube TIP::z: To skip the current video click the :cyan:"Vote to Skip":z: button`,
  `:green:CyTube TIP::z: You can now Vote for the next video below.`,
];

window[CHANNEL.name].sexFacts = [
  `:green:Sex Fact::z: The dorsal nerve of the clitoris contains 10281 nerve endings!`,
  `:green:Sex Fact::z: The record for the most female orgasms is 134 in one hour!`,
  `:green:Sex Fact::z: In German “contraceptive” is “Schwangerschaftsverhütungsmittel”. By the time you've finished saying it, it's too late!`,
  `:green:Sex Fact::z: A single human male produces enough sperm in two weeks to impregnate every fertile woman on the planet`,
  `:green:Sex Fact::z: A man can reduce his chances of getting prostate cancer by having at least four orgasms per week`,
  `:green:Sex Fact::z: The eye and the vagina are self-cleaning organs`,
  `:green:Sex Fact::z: The word “clitoris” is Greek for “divine and goddess like”`,
  `:green:Sex Fact::z: Women who went to college are more likely to enjoy giving and receiving oral sex`,
  `:green:Sex Fact::z: Scientists are unsure why humans have pubic hair, but they theorize that the hair traps secretions that hold pheromones`,
  `:green:Sex Fact::z: Approximately 1 in 5 Americans has indulged in sex with a colleague at work`,
  `:green:Sex Fact::z: According to the Kinsey Institute, the average speed of sperm during ejaculation is 28 mph!`,
  `:green:Sex Fact::z: Men who help with housework also tend to have more sex`,
  `:green:Sex Fact::z: In 2004 Pornstar Lisa Sparxx had intercourse with a world record 919 men in 24 hours!`,
  `:green:Sex Fact::z: The most successful X-rated movie in history is Deep Throat`,
  `:green:Sex Fact::z: Some women can orgasm through only nipple stimulation. A Nipplegasm`,
  `:green:Sex Fact::z: At least one in 5 people use their smartphones during sex`,
  `:green:Sex Fact::z: The average male orgasm lasts 6 seconds. The average female orgasm lasts 20 seconds`,
  `:green:Sex Fact::z: Studies found that women wearing warm socks during sex increased their chance of reaching an orgasm`,
  `:green:Sex Fact::z: After fingers and vibrators, women choose candles as a sex toys`,
  `:green:Sex Fact::z: The most common cause of penile rupture is vigorous masturbation. Be careful out there!`,
  `:green:Sex Fact::z: Nearly 10 percent of all dreams include sex`,
  `:green:Sex Fact::z: 3 percent of people have no sexual fantasies at all`,
  `:green:Sex Fact::z: A headache may actually make you more in the mood`,
  `:green:Sex Fact::z: A big penis won’t “stretch out” or ruin a vagina`,
  `:green:Sex Fact::z: When it comes to pleasure, penis girth is more important than length`,
  `:green:Sex Fact::z: Want to do better at work? Have more sex at home`,
  `:green:Sex Fact::z: Vibrators were first developed as a medical deviceas a treatment for “hysteria”`,
  `:green:Sex Fact::z: 75 percent of women don’t orgasm from “regular” sex`,
  `:green:Sex Fact::z: Breakup sex isn’t always a bad idea`,
  `:green:Sex Fact::z: Older people have some of the best sex`,
  `:green:Sex Fact::z: The most popular sex fantasy isn’t Princess Leia in a gold bikini after all. It's multi-partner or group sex`,
  `:green:Sex Fact::z: The penis and vagina account for less than 10 percent of erogenous zones`,
  `:green:Sex Fact::z: 1 in 6 women have never had an orgasm`,
  `:green:Sex Fact::z: You can break a penis`,
  `:green:Sex Fact::z: The secret to mindblowing sex? Lube`,
  `:green:Sex Fact::z: Lack of erection doesn’t mean he’s not turned on`,
  `:green:Sex Fact::z: 80 percent of women will experience chronic painful sex`,
  `:green:Sex Fact::z: Most women can have more than one orgasm but few take advantage of it`,
  `:green:Sex Fact::z: 70 percent of men watch porn compared to just 33 percent of women. `,
  `:green:Sex Fact::z: Besides men, lesbians have the most orgasms`,
  `:green:Sex Fact::z: Semen is diet-friendly`,
  `:green:Sex Fact::z: A each teaspoon of semen contains 300 to 500 million sperm`,
];

// ----------------------------------------------------------------------------------------------------------------------------------
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i], ];
  }
}

// ----------------------------------------------------------------------------------------------------------------------------------
window[CHANNEL.name].randomMsgInit = function() {
  if (Room_ID.toLowerCase() !== 'hwm') {
    window[CHANNEL.name].botMsgs.push(`:cyan:If you like _HotWife and MILF_ videos check out https://s.lain.la/SDYgW `);
  }
  if (Room_ID.toLowerCase() !== 'fd') {
    window[CHANNEL.name].botMsgs.push(`:cyan:If you like _Teen_ videos check out https://s.lain.la/nu9g6 `);
  }
  if (Room_ID.toLowerCase() !== 'cum') {
    window[CHANNEL.name].botMsgs.push(`:cyan:If you like _Cum Shot_ videos check out https://s.lain.la/XAIF0 `);
  }
  if (Room_ID.toLowerCase() !== 'clx') {
    window[CHANNEL.name].botMsgs.push(`:cyan:If you like _Classic/Retro_ videos check out https://s.lain.la/PEJXd `);
  }
/*
  if (Room_ID.toLowerCase() !== 'eh') {
    window[CHANNEL.name].botMsgs.push(`:cyan:If you like _Hentai_ videos check out https://cytu.be/r/Ecchi-Hentai `);
  }
  if (Room_ID.toLowerCase() !== 'blk') {
    window[CHANNEL.name].botMsgs.push(`:cyan:If you like _BLACKED_ videos check out the _NEW_ Full of BBC https://cytu.be/r/Full_of_BBC `);
  }
*/

  if (TRIVIA) { window[CHANNEL.name].botMsgs = window[CHANNEL.name].botMsgs.concat(sexFacts); }

  if (typeof HIGHLIGHT !== "undefined") { 
    window[CHANNEL.name].botMsgs = window[CHANNEL.name].botMsgs.concat(HIGHLIGHT);
  }
  
  shuffleArray(window[CHANNEL.name].botMsgs);
};

// ----------------------------------------------------------------------------------------------------------------------------------
window[CHANNEL.name].randomMsg = function() {
  window[CHANNEL.name].lastRandomMsgTime = Date.now();
  if (CHANNEL.usercount < 2) { return; }

  let msg = window[CHANNEL.name].botMsgs[window[CHANNEL.name].lastBotMsg];
  socket.emit("chatMsg", { msg:msg, meta:{}, });

  window[CHANNEL.name].lastBotMsg++;
  if (window[CHANNEL.name].lastBotMsg >= window[CHANNEL.name].botMsgs.length) {
    window[CHANNEL.name].lastBotMsg = 0;
  }
};

// ##################################################################################################################################

// Check every 2 seconds
setInterval(()=>{
  if (PERIODIC_CLEAR && (window[CHANNEL.name].lastChatMsgTime + window[CHANNEL.name].clearDelayMS) < Date.now()) {
    window.socket.emit("chatMsg", { msg: "/clear", meta: {}, });
    if (CLEAR_MSG.length > 0) {
      window.socket.emit("chatMsg", { msg:CLEAR_MSG, meta: {}, });
    }
    window[CHANNEL.name].lastChatMsgTime = Date.now();
  }

  if (Date.now() > (Math.max(window[CHANNEL.name].lastRandomMsgTime, window[CHANNEL.name].lastChatMsgTime) + window[CHANNEL.name].randomMsgDelayMS)) {
    window[CHANNEL.name].randomMsg();
  }

  // Keep Bot AFK
  if (!isUserAFK(CLIENT.name)) { window.socket.emit("chatMsg", { msg: "/afk", }); }
}, 2000);

// ##################################################################################################################################

//  DOCUMENT READY
$(document).ready(function() {
  debugData("roombot.documentReady", "");

  $("#chatline").css({"color":"crimson", });

  window[CHANNEL.name].randomMsgInit();

  window[CHANNEL.name].setupBOT_Callbacks();

  let userCount = $("#userlist .userlist_item").length;
  pauseVideo(userCount);
});

// ##################################################################################################################################
