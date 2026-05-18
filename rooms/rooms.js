/*!  CyTube Rooms
**|  Description: Adds button that links to other CyTube rooms
**|  Version: 2026.05.18
**|  License: MIT
**|  Usage: Channel Settings->Edit->JavaScript: jQuery.getScript("https://static-cytube.github.io/rooms/rooms.min.js");
**@preserve
*/

// jshint esversion:10, nocomma:true, strict:global
/* globals jQuery */

'use strict';

var CBE = {};
var Root_URL = "https://static-cytube.github.io/rooms/";

// ##################################################################################################################################

CBE.showRooms = function() { window.open('https://static-cytube.github.io/rooms.html', '_blank'); };

// ##################################################################################################################################

if (typeof CT_ROOMS_LOADED === "undefined") { // Only Load Once
  var CT_ROOMS_LOADED = true;

  jQuery(document).ready(function() {
    // Add Rooms Button
    jQuery.get(Root_URL + "cytube-rooms.html", function(html_frag) { jQuery('#pmbar').before(html_frag); });
    jQuery('#nav-collapsible > ul').append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:CBE.showRooms()">Rooms</a></li>');

  }); // Document Ready
}

// ##################################################################################################################################
