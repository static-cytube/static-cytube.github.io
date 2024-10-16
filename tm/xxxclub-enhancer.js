// ==UserScript==
// @name         XXXClub Enhancer
// @namespace    https://cinema-blue.icu
// @version      2024-10-18
// @description  Add magnet to browse page
// @author       You
// @match        https://xxxclub.to/torrents/browse/*
// @match        https://xxxclub.to/torrents/search/*
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

/* globals $, jQuery */

const safeWin = window.unsafeWindow || window;

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

(function() {
  'use strict';

  const scriptVersion = GM_info.script.version;
  safeWin.console.debug('##### XXXClub Enhancer Loading v' + scriptVersion);

  window.attached = false;

  safeWin.addEventListener("load", function() {
    $('body').attr('class', 'night');
    $('.recdiv').remove();
    $('.recimg').remove();
    $('head').append(customCSS);

    var $modalOverlay = $('body').prepend('<div id="modalOverlay"></div>');

    var $browse_list = $('.browsetableinside ul');
    $browse_list.find('li').each(function() { $(this).find('span:first').remove(); }); // Remove "Category"
    var $link_list = $browse_list.find('a[href^="/torrents/details/"]');

    $link_list.each(function() {
      let $link = $(this);
      $link.before('<a title="Magnet Link" href="#"><label><i class="fa fa-magnet">&nbsp;</i></label></a>');

      let $span = $link.parent();
      let $target = $link.prev();
      let $imgFloat = $link.next();

      $link
        .attr('target', '_blank')
        .removeAttr('onpointerenter')
        .removeAttr('onpointerleave');

      $span.on('pointerover', { id: $imgFloat.attr('id') }, function(e) {
        $('#' + e.data.id).css('display', 'block');
      });

      $span.on('pointerout', { id: $imgFloat.attr('id') }, function(e) {
        $('#' + e.data.id).css('display', 'none');
      });

      $imgFloat
        .removeAttr('class').attr('class', 'modalImg')
        .detach().appendTo('#modalOverlay');

        $.ajax({
        url: $(this).attr('href'),
        cache: false,
        error: function(data) { },
        success: function(data) {
          let magnetLink = $(data).find("a[href^='magnet:']").attr('href');
          $target
            .attr('href', magnetLink)
            .css('color', 'red')
            .on('click', function() { $(this).removeAttr('style'); });

          let imgLink = $(data).find('.detailsposter').attr('src');
          $imgFloat.attr('src', imgLink);
        }
      });
    });
  });
})();
