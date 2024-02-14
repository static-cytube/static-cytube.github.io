/*!
**|  CyTube Enhancements: DB Local
**|
**@preserve
*/
/* jshint esversion:6 */
/* jshint strict:true */
/* jshint curly:true */
/* jshint eqeqeq:true */
/* jshint varstmt:true */

/* jshint undef:true */
/* globals $, socket, debugData, CHANNEL */

if (!window[CHANNEL.name]) { window[CHANNEL.name] = {}; }

const maxDate = new Date(8640000000000000);
const minDate = new Date(-8640000000000000);
const personPrefix = Room_ID + "_nick_";
const personMaxAge = 10; // Days
const personMaxIdle = 20; // Minutes
const idleKickMsg = "Maximum Idle Time Elapsed";

function storageAvailable(type) {
  'use strict'; 
  let storage;
  try {
    storage = window[type];
    let x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
      e.code === 22 ||  // everything except Firefox
      e.code === 1014 ||  // Firefox
      e.name === 'QuotaExceededError' ||  // test because code might not be present everything except Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&  // Firefox
    // acknowledge QuotaExceededError only if something already stored
    (storage && storage.length !== 0);
  }
}
window[CHANNEL.name].localStorageAvail = storageAvailable("localStorage");

window[CHANNEL.name].defaultPerson = function(nick) {
  'use strict'; 
  return person = { 
    nick: nick,
    firstseen: Date.now(),
    lastseen: Date.now(),
    botreplied: minDate,
    idlesince: maxDate,
    smuteuntil: minDate,
    banuntil: minDate
  };
};

window[CHANNEL.name].getPerson = function(nick) {
  'use strict'; 
  let person = null;
  if (window[CHANNEL.name].localStorageAvail) {
    let personJSON = localStorage.getItem(personPrefix + nick.toLowerCase());
    try {
      person = JSON.parse(personJSON);
    } catch (e) { }
  }
  if (person === null || person === "null") {
    person = window[CHANNEL.name].defaultPerson(nick);
  }
  return person;
};

window[CHANNEL.name].updatePerson = function(person) {
  'use strict'; 
  if (!window[CHANNEL.name].localStorageAvail) { return; }
  if (person === null || person === "null") { return; }
  
  person.lastseen = Date.now();
  let personJSON = JSON.stringify(person);
  localStorage.setItem(personPrefix + person.nick.toLowerCase(), personJSON);
};

window[CHANNEL.name].lastseenPerson = function(nick) {
  'use strict'; 
  let person = window[CHANNEL.name].getPerson(nick);
  // person.lastseen = Date.now(); // Set by updatePerson
  person.idlesince = maxDate;   
  window[CHANNEL.name].updatePerson(person);
};

window[CHANNEL.name].banPerson = function(nick, until) {
  'use strict'; 
  if (!window[CHANNEL.name].localStorageAvail) { return; }
  if ((until === null) || (until === "null")) { until = maxDate; }
  
  let person = window[CHANNEL.name].getPerson(nick);
  person.banuntil = until;
  window[CHANNEL.name].updatePerson(person);
};

window[CHANNEL.name].unbanPersons = function() {
  'use strict'; 
  if (!window[CHANNEL.name].localStorageAvail) { return; }
  
  //  banlist: [{ "id":123, "ip":"*", "name":"nick", "reason":"asshole", "bannedby":"me" }]
  socket.once("banlist", (data)=>{
    $.each(data, function(index, entry) {
      let person = window[CHANNEL.name].getPerson(entry.name);
      
      if ((person.banuntil > minDate) && (person.banuntil < Date.now())) {
        socket.emit("unban", {id: entry.id, name: entry.name});
        person.banuntil = minDate;
        window[CHANNEL.name].updatePerson(person);
      }
    });
  });
  socket.emit("requestBanlist");
};

window[CHANNEL.name].smutePerson = function(nick, until) {
  'use strict'; 
  if (!window[CHANNEL.name].localStorageAvail) { return; }
  if ((until === null) || (until === "null")) { until = maxDate; }
  
  let person = window[CHANNEL.name].getPerson(nick);
  person.smuteuntil = until;
  window[CHANNEL.name].updatePerson(person);
};

window[CHANNEL.name].unmutePersons = function() {
  'use strict'; 
  socket.once("channelRanks", (data)=>{
    $.each(data, function(index, person) {
       if ((person.smuteuntil > minDate) && (person.smuteuntil < Date.now())) {
        socket.emit("chatMsg", {msg: "/unmute " + person.name, meta:{}});
        person.smuteuntil = minDate;
        window[CHANNEL.name].updatePerson(person);
      }
    });
  });
  socket.emit("requestChannelRanks");
};

// Move to common.js
function addMinutes(date, minutes) {
  'use strict'; 
  let checkTime = date ? date.getTime() : new Date().getTime();
  return new Date(checkTime + (minutes * 60 * 1000));
}
function addDays(date, days) {
  'use strict'; 
  let checkTime = date ? date.getTime() : new Date().getTime();
  return new Date(checkTime + (days * 24 * 60 * 1000));
}

window[CHANNEL.name].initPersons = function() {
  'use strict'; 
  // Update Current Users
  socket.once("channelRanks", (data)=>{
    $.each(data, function(index, entry) {
      window[CHANNEL.name].lastseenPerson(entry.name);
    });
  });
  socket.emit("requestChannelRanks");
  
  // Remove Old Persons
  $.each(localStorage, function(key, person) {
    if (key.startsWith(personPrefix)) {
      if (Date.now() > addDays(person.lastseen, personMaxAge)) {
        localStorage.removeItem(key);
      }
    }
  }); 
};

window[CHANNEL.name].afkPerson = function(data) {
  'use strict'; 
  if (!window[CHANNEL.name].localStorageAvail) { return; }
  let person = window[CHANNEL.name].getPerson(data.name);
  
  if (data.afk) {
    if (person.idlesince >= maxDate) {
      person.idlesince = Date.now();
    }
  }
  else {
    person.idlesince = maxDate; // Reset   
  }
  
  window[CHANNEL.name].updatePerson(person);
};

window[CHANNEL.name].kickIdlePersons = function() {
  'use strict'; 
  socket.once("channelRanks", (data)=>{
    $.each(data, function(index, entry) {
      if (entry.rank < 1) {
        let person = window[CHANNEL.name].getPerson(entry.name);
        if (person.idlesince < maxDate) {
          if (Date.now() > addMinutes(person.idlesince, personMaxIdle)) {
            socket.emit("chatMsg", { msg: "/kick " + entry.name + " " + idleKickMsg, meta: {} });
          } 
        }
      }
    });
  });
  socket.emit("requestChannelRanks"); // Get All Users
};

/********************  DOCUMENT READY  ********************/
if (window[CHANNEL.name].localStorageAvail) {
  $(document).ready(function() {
    'use strict'; 
    socket.on("addUser", (data)=>{window[CHANNEL.name].lastseenPerson(data.name);});
    socket.on("userLeave", (data)=>{window[CHANNEL.name].lastseenPerson(data.name);});
    // socket.on("chatMsg", (data)=>{window[CHANNEL.name].lastseenPerson(data.username);});
    socket.on("setAFK", (data)=>{window[CHANNEL.name].afkPerson(data);});
    
    window[CHANNEL.name].initPersons();
    
    window.setInterval(()=>{ 
      window[CHANNEL.name].kickIdlePersons();
      // window[CHANNEL.name].unbanPersons();
      // window[CHANNEL.name].unmutePersons();
    }, 60000);
  });
}

/* End of Script */

// "nick_lisaqtee": "{"nick":"LisaQTee","firstseen":1649367693820,"lastseen":1649367693820,"replied":"-271821-04-20T00:00:00.000Z","idlesince":"+275760-09-13T00:00:00.000Z","smuteuntil":"-271821-04-20T00:00:00.000Z","banuntil":"-271821-04-20T00:00:00.000Z"}"
