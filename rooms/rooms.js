/*!
**|  CyTube Rooms
**|  Version: 2024.05.13
**@preserve
*/
"use strict";

//  Channel Settings->Edit->JavaScript: jQuery.getScript("https://static.cinema-blue.icu/rooms.js");

var Root_URL = "https://static.cinema-blue.icu/rooms/";

// ##################################################################################################################################

const showRooms = function() {
  jQuery("#cytube_x").load(Root_URL + "cytube_x.html");
  jQuery("#cytube_k").load(Root_URL + "cytube_k.html");
  jQuery("#cytube_pg").load(Root_URL + "cytube_pg.html");
  jQuery("#cytube_nn").load(Root_URL + "cytube_nn.html");
  jQuery("#cytube_to").load(Root_URL + "cytube_to.html");
  jQuery("#otherlists").load(Root_URL + "otherlists.html");
  jQuery("#cytube_rooms").modal('show');
};

// ##################################################################################################################################

jQuery("head").append('<meta name="referrer" content="no-referrer" />');

if (typeof ROOMS_LOADED === "undefined") { // Only Load Once 
  var ROOMS_LOADED = true;

  jQuery(document).ready(()=>{
        // Add CSS Style Sheet for Rooms
    jQuery("head").append('<link rel="stylesheet" type="text/css" id="roomscss" href="' + Root_URL + 'rooms.css?ac=' + Date.now() + '" />');

    // Add Rooms Button
    jQuery.get(Root_URL + "cytube-rooms.html", function(html_frag) { jQuery('#pmbar').before(html_frag); });
    jQuery("#nav-collapsible > ul").append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:showRooms()">Rooms</a></li>');
    jQuery("#cytube_rooms").on("click", function() { jQuery(this).modal('hide'); }); // Close after click

    jQuery(".navbar-brand").replaceWith('<span class="navbar-brand">' + CHANNELNAME + "</span>");
    jQuery("ul.navbar-nav li:contains('Home')").remove();
    jQuery("ul.navbar-nav li:contains('Discord')").remove();

    if (window.CLIENT.rank < Rank.Member) { // If user NOT Registered then Add Register Button
      $('#nav-collapsible > ul').append('<li><a id="showregister" class="throb_text" target="_blank" href="/register">Register</a></li>');
    }

    // Set focus to Chat Box
    $(window).on("focus", function() { 
      $("#chatline")
        .attr("placeholder", "Type here to Chat")
        .attr("spellcheck", "true")
        .focus();
    });

  });
}

// ##################################################################################################################################
