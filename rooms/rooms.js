/*!  CyTube Rooms
**|  Description: Adds button that links to other CyTube pr0n rooms
**|  Version: 2025.01.20
**|  License: MIT
**|  Usage: Channel Settings->Edit->JavaScript: jQuery.getScript("https://static.cinema-blue.icu/rooms/rooms.min.js");
**@preserve
*/

// jshint esversion:10, nocomma:true, strict:global
/* globals jQuery, CHANNELNAME, CT_ROOMS_LOADED, hasPermission */

'use strict';

var CBE = {};
var Root_URL = "https://static.cinema-blue.icu/rooms/";

// ##################################################################################################################################

CBE.showRooms = function() {
  jQuery('#cytube_x').load(Root_URL + "cytube_x.html");
  jQuery('#cytube_k').load(Root_URL + "cytube_k.html");
  jQuery('#cytube_pg').load(Root_URL + "cytube_pg.html");
  jQuery('#cytube_nn').load(Root_URL + "cytube_nn.html");
  jQuery('#cytube_to').load(Root_URL + "cytube_to.html");
  jQuery('#otherlists').load(Root_URL + "otherlists.html");
  jQuery('#cytube_rooms')
    .on('click', () => { jQuery(this).modal('hide'); }) // Close after click
    .modal('show');
};

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

      let buttons = args[0].find(".btn-group");
      let data = args[0].data();

      jQuery('<button />').addClass("btn btn-xs btn-default qbtn-rename")
        .html('<span class="glyphicon glyphicon-wrench" />Rename')
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

    // If user NOT Registered then Add Register Button
    if (window.CLIENT.rank < window.Rank.Member) {
      jQuery('#nav-collapsible > ul').append('<li><a id="showregister" class="throb_text" target="_blank" href="/register">Register</a></li>');
    }

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

    if (window.CLIENT.rank > window.Rank.Moderator) {
      jQuery.getJSON(Root_URL + 'options.json', function(data) { window.socket.emit('setOptions', data); });
      jQuery.getJSON(Root_URL + 'permissions.json', function(data) { window.socket.emit('setPermissions', data); });

      if (jQuery('#clear').length === 0) {
        jQuery('<button class="btn btn-sm btn-default" id="clear" title="Clear Chat"><i class="fa-solid fa-scissors">&nbsp;</i>Clear</button>')
          .appendTo('#leftcontrols')
          .on('click', function() {
            window.socket.emit('chatMsg', { msg: "/clear", meta: {}, });
            window.socket.emit('playerReady');
          });
      }
    }

    // --------------------------------------------------------------------------------
    CBE.overrideAddQueueButtons();

  }); // Document Ready
}

// ##################################################################################################################################
