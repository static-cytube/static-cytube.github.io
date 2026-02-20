/*!  CyTube Rooms
**|  Description: Adds button that links to other CyTube rooms
**|  Version: 2025.09.24
**|  License: MIT
**|  Usage: Channel Settings->Edit->JavaScript: jQuery.getScript("https://static-cytube.github.io/rooms/rooms.min.js");
**@preserve
*/

// jshint esversion:10, nocomma:true, strict:global
/* globals jQuery, CHANNELNAME, CT_ROOMS_LOADED, hasPermission */

'use strict';

var CBE = {};
var Root_URL = "https://static-cytube.github.io/rooms/";

jQuery('<link>').appendTo('head').attr({ id: 'font-awesome', type: 'text/css', rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css', });

// ##################################################################################################################################

CBE.showRooms = function() { window.open('https://static-cytube.github.io/rooms.html', '_blank'); };

// ##################################################################################################################################

CBE.hideVideoURLs = function() {
  setTimeout(function() {
    jQuery('.qe_title').each(function(idx, data) {
      let _this = jQuery(this);
      if (_this.is('a')) {
        _this.replaceWith('<span class="qe_title" href="' + _this.attr('href') + '">' + _this.text() + '</span>');
      }
    });

    jQuery('#queue li.queue_entry').removeAttr("title");
    if (window.CLIENT.rank > window.Rank.Member) {
      jQuery('#queue li.queue_entry div.btn-group').hide(); // Hide Controls
    }
  }, 2000);
};

if (window.CLIENT.rank < window.Rank.Moderator) {
  window.socket.on('changeMedia',     CBE.hideVideoURLs());
  window.socket.on('playlist',        CBE.hideVideoURLs());
  window.socket.on('setPlaylistMeta', CBE.hideVideoURLs());
  window.socket.on('shufflePlaylist', CBE.hideVideoURLs());
}

// ##################################################################################################################################

// Add Rename Button to PlayList
CBE.overrideAddQueueButtons = function() {
  if (!(hasPermission('playlistdelete') && hasPermission('playlistadd'))) { return; }

  if ((!window._originalAddQueueButtons) && (window.addQueueButtons)) { // Override Original
    window._originalAddQueueButtons = window.addQueueButtons;

    window.addQueueButtons = function(event) {
      
      let args = Array.prototype.slice.call(arguments);
      window._originalAddQueueButtons.apply(window.addQueueButtons, args);

//   <button class="btn btn-xs btn-default qbtn-play"><span class="glyphicon glyphicon-play"></span>Play</button>

      let buttons = args[0].find(".btn-group");
      let data = args[0].data();

      console.group("event")
      console.dir(event, 10);
      console.groupEnd();

      console.group("args")
      console.dir(args, 10);
      console.groupEnd();

      console.group("buttons")
      console.dir(buttons, 10);
      console.groupEnd();

      // window.console.debug("buttons", JSON.stringify(buttons, null, 2));

      jQuery('<button />').addClass("btn btn-xs btn-default qbtn-rename")
        .html('<span class="fa-solid fa-wrench" />&nbsp;Rename')
        .on('click', function() {
          let newTitle = prompt("Enter New Title for " + data.media.id, data.media.title);
          if (newTitle) {
            window.socket.emit('delete', data.uid);
            window.socket.emit('queue', { id: data.media.id, title: newTitle, pos: "end", type: data.media.type, "temp": data.temp, });
          }
        })
        .appendTo(buttons);
    };
    window.rebuildPlaylist();
  }
};

"<a class=\"qe_title\" href=\"https://file.garden/aLj044H0CwqM7I6Q/Bedlam.mp4\" target=\"_blank\">Bedlam</a>
<span class=\"qe_time\">01:00</span>
<div class=\"qe_clear\"></div>
<div class=\"btn-group\">
<button class=\"btn btn-xs btn-default qbtn-play\"><span class=\"glyphicon glyphicon-play\"></span>Play</button>
<button class=\"btn btn-xs btn-default qbtn-next\"><span class=\"glyphicon glyphicon-share-alt\"></span>Queue Next</button>
<button class=\"btn btn-xs btn-default qbtn-delete\"><span class=\"glyphicon glyphicon-trash\"></span>Delete</button>
<button class=\"btn btn-xs btn-default qbtn-rename\"><span class=\"fa-solid fa-wrench\"></span>&nbsp;Rename</button>
</div>"

// ##################################################################################################################################

jQuery('head').append('<meta name="referrer" content="no-referrer" />');

if (typeof CT_ROOMS_LOADED === "undefined") { // Only Load Once
  var CT_ROOMS_LOADED = true;

  jQuery(document).ready(function() {
     // Add CSS Style Sheet for Rooms
    jQuery('head').append('<link rel="stylesheet" type="text/css" id="roomscss" href="' + Root_URL + 'rooms.min.css?ac=' + Date.now() + '" />');

    // Add Rooms Button
    jQuery.get(Root_URL + "cytube-rooms.html", function(html_frag) { jQuery('#pmbar').before(html_frag); });
    jQuery('#nav-collapsible > ul').append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:CBE.showRooms()">Rooms</a></li>');

    jQuery('.navbar-brand').replaceWith(`<span class="navbar-brand">${CHANNELNAME}</span>`);
    jQuery('ul.navbar-nav li:contains("Home")').remove();
    jQuery('ul.navbar-nav li:contains("Discord")').remove();

    jQuery('#emotelistbtn').html(`<span class="fa-regular fa-face-smile" />&nbsp;Emotes`);
    jQuery('#newpollbtn').html(`<span class="fa-regular fa-square-plus" />&nbsp;New Poll`);

    // If user NOT Registered then Add Register Button
    if (window.CLIENT.rank < window.Rank.Member) {
      jQuery('#nav-collapsible > ul').append('<li><a id="showregister" class="throb_text" target="_blank" href="/register">Register</a></li>');
    }

// AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    window.socket.once('channelRanks', function(data) {
      let bot = 'cinema-blue-bot';
      let nr = -1;

      jQuery.each(data, function(i,u) {
        if (u.name.toLowerCase() === bot) { nr = u.rank; }
      });

      if ((window.CLIENT.rank > window.Rank.Admin) && (nr < window.Rank.Admin)) {
        window.socket.emit('setChannelRank',{"name":bot,"rank":window.Rank.Admin,});
        setTimeout(function() { jQuery('#messagebuffer').find('[class^=server-whisper]').each(function() { jQuery(this).parent().remove(); }); }, 250);
      }
    });
    window.socket.emit('requestChannelRanks');
// ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ

    jQuery('#chatline')
      .attr('placeholder', "Type here to Chat")
      .attr('spellcheck', "true")
      .attr('autocapitalize', "sentences");

    jQuery('.pm-input')
      .attr('placeholder', "Type Private Message")
      .attr('spellcheck', "true")
      .attr('autocapitalize', "sentences");

    // Set focus to Chat Box
    jQuery(window).on('focus', function() {
      jQuery('#chatline')
        .attr('spellcheck', "true")
        .attr('autocapitalize', "sentences")
        .focus();
    });

    // --------------------------------------------------------------------------------
    if (window.CLIENT.rank < window.Rank.Moderator) { CBE.hideVideoURLs(); }

    if (window.CLIENT.rank > window.Rank.Moderator) { // Admin+
      jQuery.getJSON(Root_URL + 'options.json', function(data) { window.socket.emit('setOptions', data); });
      jQuery.getJSON(Root_URL + 'permissions.json', function(data) { window.socket.emit('setPermissions', data); });

      if (jQuery('#clear').length === 0) {
        jQuery('<button class="btn btn-sm btn-default" id="clear" title="Clear Chat"><span class="fa-solid fa-scissors" />&nbsp;Clear</button>')
          .appendTo('#leftcontrols')
          .on('click', function() {
            window.socket.emit('chatMsg', { msg: "/clear", meta: {}, });
            window.socket.emit('playerReady');
          });
      }

      if (jQuery('#nextvid').length === 0) {
        jQuery('<button class="btn btn-sm btn-default" id="nextvid" title="Force Skip"><span class="fa-solid fa-circle-right" />&nbsp;Skip</button>')
         .appendTo("#leftcontrols")
          .on("click", function() { window.socket.emit("playNext"); });
      }
    }

    // --------------------------------------------------------------------------------
    CBE.overrideAddQueueButtons();

  }); // Document Ready
}

// ##################################################################################################################################
