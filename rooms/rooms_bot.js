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

const customCSS = `<style type="text/css" id="customCSS">
#showrooms {
  color: orange;
  font-weight:600;
}
#mediarefresh:after {
  content: "Fix Video";
  padding-left: 6px;
  color: Orange;
}
#voteskip:after {
  content: "Vote to Skip";
  padding-left: 4px;
  color: Yellow;
}
</style>`;

// ##################################################################################################################################

CBE.showRooms = function() { window.open('https://static-cytube.github.io/rooms.html', '_blank'); };

// ##################################################################################################################################

if (typeof CT_ROOMS_LOADED === "undefined") { // Only Load Once
  var CT_ROOMS_LOADED = true;

  jQuery(document).ready(function() {
    document.head.innerHTML += customCSS; // CSS for buttons

    // Add Rooms Button
    jQuery.get(Root_URL + "cytube-rooms.html", function(html_frag) { jQuery('#pmbar').before(html_frag); });
    jQuery('#nav-collapsible > ul').append('<li><a id="showrooms" href="javascript:void(0)" onclick="javascript:CBE.showRooms()">Rooms</a></li>');

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

  }); // Document Ready
}

// ##################################################################################################################################
