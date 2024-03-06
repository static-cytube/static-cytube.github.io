/*!
**|  CyTube Customizations
**|
**@preserve
*/

var ChannelName_Caption = 'BABECOCK';
var Room_ID = 'babecock';

var ALLOW_GUESTS = true;

// ##################################################################################################################################
if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

$.getScript("https://static.cinema-blue.icu/www/loader.js");

// Roll my own, every 30 seconds
function wrapLinksInImages() {
  var messages = document.getElementById('messagebuffer');

  for (message of messages.childNodes) {
    let isChat = message.classList[0].startsWith('chat-msg-');
    let isServerChat = message.classList[0].startsWith('chat-msg-\\');
    if (!isChat) continue;
    if (isServerChat) continue;

    for (msgNode of message.childNodes) {
      // Skips timestamps.
      if (msgNode.classList.contains('timestamp')) continue;

      let chatNode = msgNode.firstChild;
      if (!chatNode) continue;

      // Skips nodes that contain anything other than an anchor.
      if (chatNode.tagName != 'A') continue;
      let href = chatNode.getAttribute('href');
      console.log("chatNode.href", href);
      if (!href.match(/JPG|GIF|WEBP|PNG/i)) continue;

      // Skips links that have already an image embedded.
      if (chatNode.firstChild.nodeName != '#text') continue;

      let imgNode = document.createElement('IMG');
      imgNode.setAttribute('src', href);
      imgNode.setAttribute('style', 'max-height: 80px;')
      chatNode.replaceChildren(imgNode);
    }
  }
}

setInterval(wrapLinksInImages, 30000);
wrapLinksInImages();

// Hearts for good boys
function addHearts() {

  let heartedUsers = {'jason342': '❤️jason342'};

  let users = document.getElementsByClassName('userlist_item');
  for (node of users) {
    let username = node.childNodes[1].innerText;
    if (heartedUsers[username]) {
      node.childNodes[1].innerText = heartedUsers[username];
    }
  }
}

setInterval(addHearts, 30000);
addHearts();
