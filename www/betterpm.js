/*!  CyTube PM Enhancements
**|  Version 2024.09.11
 **|  Copyright Xaekai 2014-16
 **|  Copyright Cinema-Blue 2024
 **@preserve
 */

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true, devel:true, jquery:true, varstmt:false, unused:false, undef:true

/* globals CLIENT */

"use strict";

// window.window.localStorage.clear();

// This is a self-executing anonymous function.
// The first set of parentheses contain the expressions to be executed, and the second set of parentheses executes those expressions.
(function(CyTube_BetterPM) { return CyTube_BetterPM(window, document, window.jQuery); })

// ##################################################################################################################################

(function(window, document, $, undefined) {
  if (typeof Storage === "undefined") {
    console.error("[Better PMs]", "localStorage not supported. Aborting load.");
    return;
  } else if (typeof window.CLIENT.name === "undefined") {
    console.error("[Better PMs]", "Client is an anonymous user. Aborting load.");
    return;
  } else {
    console.info("[Better PMs]", "Loading Module.");
  }
  
  class BetterPrivateMessages {
    static get maxPMs() { return 50; }
    static get maxMS() { return (1000 * 60 * 60 * 24 * 7); } // 60604800000 = 1 week

    constructor() {
      this.cleanStorage();

      if (window.localStorage.getItem(this.keyPrev()) === null) {
        window.localStorage.setItem(this.keyPrev(), JSON.stringify([]));
      }
      
      this.prevOpen = JSON.parse(window.localStorage.getItem(this.keyPrev()));
      this.cacheObj = {};
      
      $("#pmbar").on("deployCache", ((onEvent, user) => {
          this.deployCache(user);
          this.saveOpen();
        }));
        
      $("#pmbar").on("newMessage", ((onEvent, userNick, data) => {
          this.newMessage(userNick, data);
          this.saveOpen();
        }));
        
      $(window).on("unload.openprivs", (() => {
          this.saveOpen();
          this.flushCache();
        }));

      return this;
    }

    keyPrev() { return `bpmPrev_${window.CHANNEL.name}_${window.CLIENT.name}`; }
    keyHistory(userNick) { return `bpmHist_${window.CHANNEL.name}_${window.CLIENT.name}_${userNick}`; }

    cleanStorage() {
      return; // TODO: Testing

      for (let key of Object.keys(window.localStorage)) {
        if (key.toLowerCase().startsWith("bpmprev")) {
          if (window.localStorage[key].length < 3) {
            window.localStorage.removeItem(key);
          }
        }
      }

      let now = Date.now();
      for (let key of Object.keys(window.localStorage)) {
        if (key.toLowerCase().startsWith("bpmhist")) {
          let recentMsgs = [];
          jQuery(JSON.parse(window.localStorage[key])).each((function() {
            if ((now - this.time) > this.maxMS()) {
              recentMsgs.push(this);
            }
          }));

          if (recentMsgs.length > 0) {
            window.localStorage.setItem(key, JSON.stringify(recentMsgs));
          } else {
            window.localStorage.removeItem(key);
          }
        }
      }
    }
    
    flushCache() {
      Object.keys(this.cacheObj).forEach((userNick => {
        window.localStorage.setItem(this.keyHistory(userNick), JSON.stringify(this.cacheObj[userNick]));
      }));
    }
    
    initCache(userNick) {
      if (typeof this.cacheObj[userNick] === "undefined") {
        this.cacheObj[userNick] = JSON.parse(window.localStorage.getItem(this.keyHistory(userNick)));
      }
    }
    
    deployCache(userNick) {
      if (window.localStorage.getItem(this.keyHistory(userNick)) === null) { return; }
    
      this.initCache(userNick);
      this.cacheObj[userNick].slice((this.cacheObj[userNick].length > this.maxPMs) ? (this.cacheObj[userNick].length - this.maxPMs) : 0)
        .forEach((idx => {window.Callbacks.pm(idx, true); }));
    }
    
    saveOpen() {
      var currOpen = [];
      $("#pmbar > div[id^=pm]:not(.pm-panel-placeholder)").each(function() {
        currOpen.push($(this).attr("id").replace(/^pm-/, ""));
      });
      window.localStorage.setItem(this.keyPrev(), JSON.stringify(currOpen));
    }
    
    newMessage(userNick, msg) {
      if (window.localStorage.getItem(this.keyHistory(userNick)) === null) {
        window.localStorage.setItem(this.keyHistory(userNick), JSON.stringify([]));
      }
      this.initCache(userNick);
      this.cacheObj[userNick].push(msg);
      this.flushCache();
    }
    
    startUp() {
      $("#pmbar > div[id^=pm]:not(.pm-panel-placeholder)").each(function() {
        return; // TODO

        var currentUser = $(this).attr("id").replace(/^pm-/, "");
        this.prevOpen.push(currentUser);
        $(this).find("div.pm-buffer").each(function() { return; });
      });
        
      this.prevOpen.forEach((user => { window.initPm(user); }));

      // DELETE???
      window.localStorage.setItem(this.keyPrev(), JSON.stringify([]));

      return this;
    }
  }
  
  // ##################################################################################################################################

  window.initPm = function(user) {
    if ($("#pm-" + user).length > 0) { return $("#pm-" + user); }
    
    var pm = $("<div/>")
      .addClass("panel panel-default pm-panel")
      .appendTo($("#pmbar"))
      .data("last", { name: "", }).attr("id", "pm-" + user);
      
    var title = $("<div/>")
      .addClass("panel-heading")
      .text(user)
      .appendTo(pm);
      
    var closeBtn = $("<button/>")
      .addClass("close pull-right")
      .html("&times;")
      .appendTo(title)
      .click(function() {
        pm.remove();
        $("#pm-placeholder-" + user).remove();
      });
      
    var body = $("<div/>")
      .addClass("panel-body")
      .appendTo(pm)
      .hide();
      
    var placeholder;
    
    title.click(function() {
      body.toggle();
      pm.removeClass("panel-primary").addClass("panel-default");
        
      if (!body.is(":hidden")) {
        placeholder = $("<div/>")
          .addClass("pm-panel-placeholder")
          .attr("id", "pm-placeholder-" + user)
          .insertAfter(pm);
          
        var left = pm.position().left;
        
        pm.css("position", "absolute")
          .css("bottom", "0px")
          .css("left", left);

        $("#pm-input-" + user).focus(); // focus imput box
      } else {
        pm.css("position", "");
        $("#pm-placeholder-" + user).remove();
      }
    });
    
    var buffer = $("<div/>")
      .addClass("pm-buffer linewrap")
      .appendTo(body);
      
    $("<hr/>").appendTo(body);
      
    var input = $("<input/>")
      .addClass("form-control pm-input")
      .attr("id", "pm-input-" + user)
      .attr("type", "text")
      .attr("maxlength", 240)
      .attr("placeholder", CLIENT.name)
      .attr("spellcheck", "true")
      .attr("autocapitalize", "sentences")
      .appendTo(body);
      
    input.keydown(function(onEvent) {
      if (onEvent.keyCode === 13) {
        if (window.CHATTHROTTLE) { return; }
        var meta = {};
        var msg = input.val();
        if (msg.trim() === "") { return; }
        
        if (window.USEROPTS.modhat && (window.CLIENT.rank >= window.Rank.Moderator)) {
          meta.modflair = window.CLIENT.rank;
        }
        
        if ((window.CLIENT.rank >= window.Rank.Moderator) && (msg.indexOf("/m ") === 0)) {
          meta.modflair = window.CLIENT.rank;
          msg = msg.substring(3);
        }
        
        window.socket.emit("pm", { to: user, msg: msg, meta: meta, });
        input.val("");
      }
    });
    
    $("#pmbar").trigger("deployCache", user);
    
    ({
      startCheck: function(user) {
        if (!$("#pm-" + user).length) { return; }

        var buffer = window.initPm(user).find(".pm-buffer");

        if (buffer.children().last().length) {
          buffer.children().last()[0].scrollIntoView();
        }
        
        buffer[0].scrollTop = buffer[0].scrollHeight;
        
        if (buffer[0].scrollHeight === this.scrollHeight && this.scrollHeight !== 0) {
          return;
        } else {
          this.scrollHeight = buffer[0].scrollHeight;
          setTimeout(this.startCheck.bind(this), this.timeout, user);
        }
      },
      scrollHeight: -1,
      timeout: 250,
    })
    .startCheck(user);
    return pm;
  };
  
  // ##################################################################################################################################

  window.Callbacks.pm = function(data, backlog) { // Override CyTube Callbacks.pm
    var name = data.username;
    if (window.IGNORED.indexOf(name) !== -1) { return; }

    if (data.username === window.CLIENT.name) {
      name = data.to;
    } else {
      window.pingMessage(true);
    }
    
    var pm = window.initPm(name);
    var msg = window.formatChatMessage(data, pm.data("last"));
    var buffer = pm.find(".pm-buffer");
    msg.appendTo(buffer);
    buffer.scrollTop(buffer.prop("scrollHeight"));
    
    if (pm.find(".panel-body").is(":hidden")) {
      pm.removeClass("panel-default").addClass("panel-primary");
    }
    
    if (!backlog) {
      var userNick = (window.CLIENT.name !== data.username) ? data.username : data.to;
      $("#pmbar").trigger("newMessage", [userNick, data, ]);
    }
  };
  
  // ##################################################################################################################################

  if (!window.CLIENT.BetterPMs) { window.CLIENT.BetterPMs = (new BetterPrivateMessages()).startUp(); }
});

// ##################################################################################################################################
// ##################################################################################################################################
