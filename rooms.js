/*!
**|  CyTube Rooms
**|  Version: 2024.05.11
**@preserve
*/
"use strict";

//  Channel Settings->Edit->JavaScript: jQuery.getScript("https://static.cinema-blue.icu/rooms.js");

var Root_URL = "https://static.cinema-blue.icu/";
var Base_URL = Root_URL + "www/";

// ##################################################################################################################################

const showRooms = function() {
  jQuery("#cytube_x").load(Root_URL + "inc/cytube_x.html");
  jQuery("#cytube_k").load(Root_URL + "inc/cytube_k.html");
  jQuery("#cytube_pg").load(Root_URL + "inc/cytube_pg.html");
  jQuery("#cytube_nn").load(Root_URL + "inc/cytube_nn.html");
  jQuery("#cytube_to").load(Root_URL + "inc/cytube_to.html");
  jQuery("#otherlists").load(Root_URL + "inc/otherlists.html");
  jQuery("#cytube_rooms").modal();
};

// ##################################################################################################################################

if (typeof ROOMS_LOADED === "undefined") { // Only Load Once 
  ROOMS_LOADED = true;

  jQuery(document).ready(()=>{
    jQuery("head").append('<link rel="stylesheet" type="text/css" id="roomscss" href="' + Root_URL + 'rooms.css" />');

    jQuery(".navbar-brand").replaceWith('<span class="navbar-brand">' + CHANNELNAME + "</span>");
    jQuery("ul.navbar-nav li:contains('Home')").remove();
    jQuery("ul.navbar-nav li:contains('Discord')").remove();

    jQuery.get(Base_URL + "cytube-rooms.html", function(html_frag) { jQuery('#pmbar').before(html_frag); });
    jQuery("#nav-collapsible > ul").append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:showRooms()">Rooms</a></li>');
  });
}

// ##################################################################################################################################
