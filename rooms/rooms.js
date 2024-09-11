/*!  CyTube Rooms
**|  Description: Adds button that links to other CyTube pr0n rooms
**|  Version: 2024.05.30
**|  License: MIT
**|  Usage: Channel Settings->Edit->JavaScript: jQuery.getScript("https://static.cinema-blue.icu/rooms/rooms.min.js");
**@preserve
*/

// jshint esversion:10, nocomma:true, strict:global
/* globals jQuery, CHANNELNAME, CT_ROOMS_LOADED */

"use strict";

var Root_URL = "https://static.cinema-blue.icu/rooms/";

// ##################################################################################################################################

window.showRooms = function() {
  jQuery("#cytube_x").load(Root_URL + "cytube_x.html");
  jQuery("#cytube_k").load(Root_URL + "cytube_k.html");
  jQuery("#cytube_pg").load(Root_URL + "cytube_pg.html");
  jQuery("#cytube_nn").load(Root_URL + "cytube_nn.html");
  jQuery("#cytube_to").load(Root_URL + "cytube_to.html");
  jQuery("#otherlists").load(Root_URL + "otherlists.html");
  jQuery("#cytube_rooms")
    .on("click", function() { jQuery(this).modal('hide'); }) // Close after click
    .modal('show');
};

// ##################################################################################################################################

window.hideVideoURLs = function() {
  setTimeout(function() {
    jQuery(".qe_title").each(function(idx, data) {
      let _this = jQuery(this);
      if (_this.is("a")) {
        _this.replaceWith('<span class="qe_title" href="' + _this.attr('href') + '">' + _this.text() + '</span>');
      }
    });

    jQuery("#queue li.queue_entry").removeAttr("title");
    if (window.CLIENT.rank > window.Rank.Member) {
      jQuery("#queue li.queue_entry div.btn-group").hide(); // Hide Controls
    }
  }, 2000);
};

if (window.CLIENT.rank < window.Rank.Moderator) {
  window.socket.on("changeMedia",     window.hideVideoURLs());
  window.socket.on("playlist",        window.hideVideoURLs());
  window.socket.on("setPlaylistMeta", window.hideVideoURLs());
  window.socket.on("shufflePlaylist", window.hideVideoURLs());
}

// ##################################################################################################################################

jQuery("head").append('<meta name="referrer" content="no-referrer" />');

if (typeof CT_ROOMS_LOADED === "undefined") { // Only Load Once
  var CT_ROOMS_LOADED = true;

  jQuery(document).ready(function() {
     // Add CSS Style Sheet for Rooms
    jQuery("head").append('<link rel="stylesheet" type="text/css" id="roomscss" href="' + Root_URL + 'rooms.min.css?ac=' + Date.now() + '" />');

    // Add Rooms Button
    jQuery.get(Root_URL + "cytube-rooms.html", function(html_frag) { jQuery('#pmbar').before(html_frag); });
    jQuery("#nav-collapsible > ul").append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:showRooms()">Rooms</a></li>');

    jQuery(".navbar-brand").replaceWith('<span class="navbar-brand">' + CHANNELNAME + "</span>");
    jQuery("ul.navbar-nav li:contains('Home')").remove();
    jQuery("ul.navbar-nav li:contains('Discord')").remove();

    if (window.CLIENT.rank < window.Rank.Member) { // If user NOT Registered then Add Register Button
      jQuery('#nav-collapsible > ul').append('<li><a id="showregister" class="throb_text" target="_blank" href="/register">Register</a></li>');
    }

    jQuery("#chatline")
      .attr("placeholder", "Type here to Chat")
      .attr("spellcheck", "true")
      .attr("autocapitalize", "sentences");

    jQuery(".pm-input")
      .attr("placeholder", "Type Private Message")
      .attr("spellcheck", "true")
      .attr("autocapitalize", "sentences");

    // Set focus to Chat Box
    jQuery(window).on("focus", function() {
      jQuery("#chatline")
        .attr("spellcheck", "true")
        .attr("autocapitalize", "sentences")
        .focus();
    });

    // --------------------------------------------------------------------------------
    if (window.CLIENT.rank < window.Rank.Moderator) { window.hideVideoURLs(); }

    if (window.CLIENT.rank > window.Rank.Moderator) {
      if (jQuery('#clear').length === 0) {
        jQuery('<button class="btn btn-sm btn-default" id="clear" title="Clear Chat"><i class="fa-solid fa-scissors">&nbsp;</i>Clear</button>')
          .appendTo("#leftcontrols")
          .on("click", function() {
            window.socket.emit("chatMsg", { msg: "/clear", meta: {}, });
            window.socket.emit("playerReady");
          });
      }
    }
  });
}

// ##################################################################################################################################
