// ==UserScript==
// @name         XXXClub Enhancer
// @namespace    https://cinema-blue.icu
// @version      2025-10-22
// @description  Add magnet to browse page
// @author       You
// @match        https://xxxclub.to/torrents/*
// @icon         https://xxxclub.to/assets/icons/favicon-16x16.png
// @license      MIT
// @grant        unsafeWindow
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// ==/UserScript==
'use strict';

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals jQuery */

const safeWin = window.unsafeWindow || window;

const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;
safeWin.console.debug('##### ' + scriptName + ' Loading v' + scriptVersion);

const customCSS = `<style id="customCSS">
@charset "UTF-8";

.maincontainer {
  max-width: 100%;
  margin-left: 20%;
}

#modalOverlay {
  position: fixed;
  top: 4px;
  left: 4px;
  width: auto;
  height: auto;
  max-width: 20%;
  z-index: 10;
}

.modalImg {
  display: none;
  width: auto;
  height: auto;
}

.browsediv {
  padding: 0px !important;
  padding-left: 10px !important;
}
.internalbrowsediv {
  margin-bottom: 0;
}
.browsetablediv {
  margin: 0;
}
.browsetableinside {
  padding: 0px;
}
.browsetableinside li {
  height: 0px !important;
  white-space: nowrap;
}
.browsetableinside span {
  padding-top: 3px !important;
  padding-bottom: 3px !important;
}
.browsetableinside span a {
  font-size: 14px;
}

.page-footer {
  display: none;
}
</style>`;

window.attached = false;

const maxRetries = 30;
const retryDelay = 3000;
let linkCnt = 0;

safeWin.makeAjaxRequest = function(url, target, imgFloat, retries = 0) {
  // safeWin.console.debug(scriptName + " makeAjaxRequest: ", retries, url);

  jQuery.ajax({
    url: url,
    cache: false,
    success: function(responseText) {
      linkCnt--;
      if (linkCnt <= 0) { safeWin.console.debug(scriptName + " DONE"); }

      // safeWin.console.debug(scriptName + " Response: ", responseText);

      let magnetLink = jQuery(responseText).find("a[href^='magnet:']").attr('href');
      target
        .attr('href', magnetLink)
        .css('color', 'red')
        .on('click', function() { jQuery(this).css('color', 'LightGreen'); });
      //        .on('click', function() { jQuery(this).removeAttr('style'); });

      let imgLink = jQuery(responseText).find('.detailsposter').attr('src');
      imgFloat.attr('src', imgLink);
    },
    error: function(jqXHR, textStatus, errorThrown) {
      // safeWin.console.error(scriptName + ": AJAX Error:", textStatus, errorThrown);

      if (retries < maxRetries) {
        // safeWin.console.debug(scriptName + ": Retrying after error");
        setTimeout(function() { safeWin.makeAjaxRequest(url, target, imgFloat, retries + 1); }, retryDelay);
      } else {
        safeWin.console.error(scriptName + ": Max retries exceeded after error");
      }
    },
  });
};

safeWin.addEventListener("load", function() {
  jQuery('body').attr('class', 'night');
  jQuery('.recdiv').remove();
  jQuery('.recimg').remove();
  jQuery('head').append(customCSS);

  jQuery('body').prepend('<div id="modalOverlay"></div>');

  // ####################################################################################################
  if (window.location.pathname.includes('browse') || window.location.pathname.includes('search')) {
    let $browse_list = jQuery('.browsetableinside ul');
    $browse_list.find('li').each(function() { jQuery(this).find('span:first').remove(); }); // Remove "Category"
    let $link_list = $browse_list.find('a[href^="/torrents/details/"]');

    $link_list.each(function() {
      linkCnt++;

      let $link = jQuery(this);
      $link.before('<a title="Magnet Link" href="#"><label><i class="fa fa-magnet">&nbsp;</i></label></a>');

      let $span = $link.parent();
      let $target = $link.prev();
      let $imgFloat = $link.next();

      $link
        .attr('target', '_blank')
        .removeAttr('onpointerenter')
        .removeAttr('onpointerleave');

      $span.on('pointerover', { id: $imgFloat.attr('id'), }, function(e) {
        jQuery('#' + e.data.id).css('display', 'block');
      });

      $span.on('pointerout', { id: $imgFloat.attr('id'), }, function(e) {
        jQuery('#' + e.data.id).css('display', 'none');
      });

      $imgFloat
        .removeAttr('class').attr('class', 'modalImg')
        .detach().appendTo('#modalOverlay');

      safeWin.makeAjaxRequest(jQuery(this).attr('href'), $target, $imgFloat);
    });
  }

  // ####################################################################################################
  if (window.location.pathname.includes('details')) {
    jQuery('a[href^="magnet:"]').each(function() { // Find all anchor tags with magnet: URIs
      safeWin.console.debug('Magnet link found:', jQuery(this).attr('href'));

      let $anchor = jQuery(this);
      let magnetUrl = $anchor.attr('href');

      $anchor.on('click', function(e) {
        e.preventDefault(); // Prevent default link behavior

        window.location.href = magnetUrl;

        setTimeout(function() {
          window.close();
        }, 100);
      });

      $anchor.css('background-color', 'orange');
    });
  }
});
