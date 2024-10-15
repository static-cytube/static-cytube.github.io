// ==UserScript==
// @name         Ad Skipper
// @namespace    https://greasyfork.org/users/1016463-vasu-noraneko217
// @version      4.5.2
// @description  Simple ad skipper for youtube immune to ad blocker restriction (This is not ad blocker)
// @author       Vasu_NoraNeko217
// @match        https://www.youtube.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

var WYTAS_ver='4.5.2'
console.log("WYTAS:YouTube Ad Skipper by Vyasdev217 (https://greasyfork.org/en/users/1016463)");
const observer = new MutationObserver((mutations) => {
  //if(window.location.toString().includes("shorts")){window.location="https://youtube.com"} // To block youtube shorts for better productivity
  mutations.forEach((mutation) => {
      if (document.contains(document.getElementsByClassName("ytp-preview-ad")[0])){console.log("WYTAS:Detected ad (action "+WYTAS_ver+"_1)");document.getElementsByClassName("html5-video-container")[0].children[0].currentTime=250;}
      if(document.contains(document.getElementsByClassName('ytp-skip-ad-button__text')[0])){console.log("WYTAS:Detected ad (action "+WYTAS_ver+"_2)");document.getElementsByClassName('ytp-skip-ad-button__text')[0].click();}
      document.getElementsByTagName("video")[0].playbackRate = pbs.value;
  });
});
const config = {childList:true,subtree:true};
observer.observe(document.body, config);
 
 
///*
var pbs = document.createElement("INPUT");
pbs.type = "number";
pbs.style = "background-color: rgba(0, 0, 0, 0.5); color: white; border: none; cursor: pointer; overflow: hidden; outline: none; width: 5ch; text-align: center; font-size: auto; -webkit-appearance: textfield; -moz-appearance: textfield;";
pbs.title = "Playback speed";
var incrementButton = document.createElement("BUTTON");
incrementButton.textContent = "+";
incrementButton.style = "background-color: rgba(0, 0, 0, 0.5); color: white; border: none; cursor: pointer; outline: none; font-size: 1.5em;";
incrementButton.addEventListener("click", function () {pbs.stepUp();var event = new Event("change", { bubbles: true, cancelable: true });pbs.dispatchEvent(event);});
var decrementButton = document.createElement("BUTTON");
decrementButton.textContent = "-";
decrementButton.style = "background-color: rgba(0, 0, 0, 0.5); color: white; border: none; cursor: pointer; outline: none; font-size: 1.5em;";
decrementButton.addEventListener("click", function () {pbs.stepDown();var event = new Event("change", { bubbles: true, cancelable: true });pbs.dispatchEvent(event);});
var container = document.createElement("DIV");
container.style = "display: flex; align-items: center; margin:10px;";
container.appendChild(decrementButton);
container.appendChild(pbs);
container.appendChild(incrementButton);
pbs.step=0.1;
pbs.min=0;
pbs.value=1.0;
pbs.addEventListener("change",function(){if(pbs.value>0){document.getElementsByTagName("video")[0].playbackRate = pbs.value;}else{pbs.value=1;document.getElementsByTagName("video")[0].playbackRate = pbs.value;}});
document.getElementById('center').appendChild(container);
//*/