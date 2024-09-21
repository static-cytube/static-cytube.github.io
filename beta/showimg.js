/*!  CyTube Enhancements: Show Images in Chat
**|  Version: 2024.07.18
**@preserve
*/
'use strict';

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true
/* globals scrollChat, Root_URL */

// ##################################################################################################################################

var zoomImgMsg = jQuery("#messagebuffer");

var zoomImgCSS = `<style type="text/css" id="zoomImgCSS">
.zoomImg {
  cursor: zoom-in;
  transition: 0.3s;
  max-height: 72px;
  max-width: 160px;
}
.zoomImg:hover {opacity: 0.85;}

.zoomImgModal {
  display: none;
  cursor: zoom-out;
  position: fixed;
  z-index: 10000;
  padding-top: 10px;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: black;
  background-color: rgba(0,0,0,0.6);
}
.zoomedImg {
  margin: auto;
  display: block;
  max-width: 100%;
  max-height: 100%;
  -webkit-animation-name: zoom;
  -webkit-animation-duration: 0.2s;
  animation-name: zoom;
  animation-duration: 0.2s;
}

@-webkit-keyframes zoom {
  from {-webkit-transform:scale(0)} 
  to {-webkit-transform:scale(1)}
}
@keyframes zoom {
  from {transform:scale(0)} 
  to {transform:scale(1)}
}

/* 100% Image Width on Smaller Screens */
@media only screen and (max-width: 700px){
  .zoomedImg {
    width: 100%;
  }
}
</style>
`;

jQuery('head').append(zoomImgCSS);
jQuery('footer').after('<div id="zoomImgModal" class="zoomImgModal"></div>');
var zoomImgModal = jQuery('#zoomImgModal');

// ----------------------------------------------------------------------------------------------------------------------------------
window.zoomImgError = function(img) {
  img.onerror = "";
  window.console.error('imgError: ' + img.src);
  img.src = Root_URL + "emoji/x.webp";
  return true;
};

// ----------------------------------------------------------------------------------------------------------------------------------
window.zoomImgWait = function(url) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(img);
    img.src = url;
  });
};
  
const zoomImgExtensions = `a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".pnj"], ` + 
  `a[href*=".gif"], a[href*=".gifv"], a[href*=".svg"], a[href*=".svgz"], a[href*=".webp"]`;

// ----------------------------------------------------------------------------------------------------------------------------------
window.zoomImgChat = function() {
  if (jQuery(window).width() <= 800) { return; }

  zoomImgMsg.find(zoomImgExtensions).each(function() {
    window.zoomImgWait(this.href)
      .then(img => {
        let chatImg = jQuery('<img>',{class:'zoomImg',rel:'noopener noreferrer',title:'Click to Zoom',alt:'Bad Image',})
          .attr('src', encodeURI(this.href))
          .on('error', 'window.zoomImgError(this)"')
          .on('click', function(){
            let popImg = jQuery('<img>',{class:'zoomedImg',title:'Click to Close',src:encodeURI(jQuery(this).attr("src")),});
            zoomImgModal.html('').append(popImg).on('click', function(){zoomImgModal.css({"display":"none",}).html('');});
            zoomImgModal.css({"display":"block",});
          })
          .load(()=>{ scrollChat(); });
          
        jQuery(this).parent().html(chatImg);
      });
  });
};

// ----------------------------------------------------------------------------------------------------------------------------------
jQuery(document).ready(function() {
  window.socket.on('chatMsg', (data)=>{
    if (typeof data === 'undefined') { return; }
    if (data === null) { return; }
    if (typeof data.msg === 'undefined') { return; }
    if (data.msg === null) { return; }
    if (data.msg.includes('https')) { window.zoomImgChat(); }
  });
  window.zoomImgChat();
});

// ##################################################################################################################################
// ##################################################################################################################################

/*
https://iframe.ly/api/iframely?api_key=d160d7c38aa4a3a3371b0c&url=https%3A%2F%2Fwww.flickr.com%2Fphotos%2F9somboon%2F35071348993%2Fin%2Fexplore-2017-07-12%2F

https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.hawtcelebs.com%2Fwp-content%2Fuploads%2F2020%2F02%2Femma-roberts-at-2020-vanity-fair-oscar-party-in-beverly-hills-02-09-2020-4.jpg&f=1&nofb=1&ipt=2cb299ec8c2e5bf2f1c530546ffabe8ff0c28208b6f8ae0f51351de3c8d76ffc&ipo=images

const zoomImgExtensions = 'a[href*=".jpg"], a[href*=".jpeg"], a[href*=".png"], a[href*=".pnj"], ' + 
  'a[href*=".gif"], a[href*=".gifv"], a[href*=".svg"], a[href*=".svgz"], a[href*=".webm"], a[href*=".webp"]';

jQuery('#myModal').append(jQuery('<img>',{id:'img01',class:'modal-content',src:'theImg.png'}))
jQuery('<img>',{id:'img01',class:'modal-content',$img.attr('src')})

<div id="myModal" class="modal">
  <span class="imgClose">&times;</span>
  <img class="modal-content" id="img01">
</div>

<a href="https://download.samplelib.com/mp4/sample-5s.mp4" target="_blank" rel="noopener noreferrer">
  <video muted="" inline="" style="max-height: 72px; max-width: 160px;" title=" Click to Open in a Tab" src="https://download.samplelib.com/mp4/sample-5s.mp4" type="video/mp4"></video>
  </a>

<a href="http://docs.google.com/gview?url=https://sifr.in/img/292/1/courseAndroid.xlsx&embedded=true">Open your excel file</a>

  zoomImgMsg.find(videoExtensions).each(function() {
    let thisParent = jQuery(this).parent();
    CBE.errorData("zoomImgChat.this", this.toString());
    CBE.errorData("zoomImgChat.this", thisParent.html());
    
    let ext = 'mp4';
    if (this.toString().toLowerCase().includes(".webm")) { ext = 'webm'; }
    if (this.toString().toLowerCase().includes(".ogg"))  { ext = 'ogg'; }
    
    let video = `<a href="#" rel="noopener noreferrer" onClick='window.open("` + this.href + `");return false;'>` +
      '<video muted inline style="max-height: 72px; max-width: 160px;" src="' + this.href + '" type="video/' + ext + '"  title=" Click to Open in a Tab" /></a>';
    thisParent.html(video)
  });

*/
