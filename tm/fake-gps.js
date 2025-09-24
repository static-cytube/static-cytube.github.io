// ==UserScript==
// @name         Fake GPS
// @description  Falsify GPS location
// @author       Cinema-Blue
// @copyright    2025+ Cinema-Blue
// @version      2025.09.24
// @license      MIT
// @icon         https://static.cinema-blue.icu/tm/fake-gps.png
// @downloadURL  https://static.cinema-blue.icu/tm/fake-gps.js
// @updateURL    https://static.cinema-blue.icu/tm/fake-gps.js
// @match        *://*/*
// @sandbox      raw
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// @inject-into  page
// @run-at       document-start
// ==/UserScript==
'use strict';

// https://jshint.com/docs/options/
// jshint curly:true, eqeqeq:true, esversion:10, freeze:true, futurehostile:true, latedef:true, maxerr:10, nocomma:true
// jshint strict:global, trailingcomma:true, varstmt:true
// jshint devel:true, jquery:true
// jshint varstmt: false
// jshint unused:false
// jshint undef:true

/* globals GM_info */

var safeWin = window.unsafeWindow || window;
const scriptName = GM_info.script.name;
const scriptVersion = GM_info.script.version;

// ##################################################################################################################################

(() => {
  //Default latitude in decimal degrees (-90 to 90). Negative = South of Equator. Positive = North of Equator.
  var defaultLatitude = 32.34698300058665;
  //Default longitude in decimal degrees (-180 to 180). Negative = West. Positive = East.
  var defaultLongitude = -86.13845414714567;
  //Default latitude & longitude accuracy in positive decimal degrees.
  var defaultAccuracy = 0.000001;

  // X-Mart
  // defaultLatitude  = 32.37851967354204; defaultLongitude = -86.37748717661302;

  // Auburn
  // defaultLatitude  = 32.546855; defaultLongitude = -85.523036;

  // Prattville
  // defaultLatitude  = 32.497659; defaultLongitude = -86.423608;

  // Birmingham
  // defaultLatitude  = 33.486136; defaultLongitude = -86.803943;

  // Cheaha
  // defaultLatitude  = 33.433931; defaultLongitude = -86.035673;

  // Columbus GA
  // defaultLatitude  = 32.4780248211974; defaultLongitude = -85.05819043230063;

  // XTC Atlanta GA
  // defaultLatitude  = 33.815335093647725; defaultLongitude = -84.365885852741;

  // Mayaguana, Bahamas
  // defaultLatitude = 22.383749882707825; defaultLongitude = 73.0104328464036;

  //Default altitude above sea level in meters.
  var defaultAltitude = 1234;
  //Default altitude accuracy in positive meters. `null` if not available.
  var defaultAltitudeAccuracy = 0.01;

  //Default heading in degrees. 0 to less than 360. 0 = North, 90 = East, 270 = West, etc. `null` if not available.
  var defaultHeading = 0;
  //Default speed in meters per second. `null` if not available.
  var defaultSpeed = 0;

  //Location profiles based on host name of websites.
  //It provides different location information between different websites.
  //All properties for each location profile are optional.
  //If a website host name if not in the list, the default values for all properties will be used.
  //If a property is not specified or has invalid value, the default value will be used.
  //If a property has invalid value range, it will be capped to its value range boundary.
  var locations = {
    "www.example-mockgps.net": {
      latitude: 50.7,
      longitude: 55,
      accuracy: 0.1,
      altitude: 100,
      altitudeAccuracy: 1,
      heading: 79.9,
      speed: 10.5,
    },
    "www.another-example-mockgps.net": {
      latitude: -5.1,
      longitude: 123.4322,
      accuracy: 0.0002,
      altitude: 1234.5,
      altitudeAccuracy: 0.5,
      heading: 222.2,
      speed: 1.3,
    },
  };

  //Time interval in milliseconds (1000ms is second) to report periodic location report.
  var watchInterval = 250;

  //=== CONFIGURATION END ===

  Object.keys(locations).forEach(n => {
    n = locations[n];
    if ("number" === typeof n.latitude) {
      if (n.latitude > 90) {
        n.latitude = 90;
      } else if (n.latitude < -90) {
        n.latitude = -90;
      }
    } else {
      n.latitude = defaultLatitude;
    }

    if ("number" === typeof n.longitude) {
      if (n.longitude > 180) {
        n.longitude = 180;
      } else if (n.longitude < -180) {
        n.longitude = -180;
      }
    } else {
      n.longitude = defaultLongitude;
    }

    if ("number" === typeof n.accuracy) {
      if (n.accuracy <= 0) {
        n.accuracy = defaultAccuracy;
      }
    } else if (n.accuracy !== null) {
      n.accuracy = defaultAccuracy;
    }

    if ("number" !== typeof n.altitude) {
      n.altitude = defaultAltitude;
    }

    if ("number" === typeof n.altitudeAccuracy) {
      if (n.altitudeAccuracy <= 0) {
        n.altitudeAccuracy = defaultAltitudeAccuracy;
      }
    } else if (n.altitudeAccuracy !== null) {
      n.altitudeAccuracy = defaultAltitudeAccuracy;
    }

    if ("number" === typeof n.heading) {
      if (n.heading >= 360) {
        n.heading = 359.999999;
      } else if (n.heading < 0) {
        n.heading = 0;
      }
    } else if (n.heading !== null) {
      n.heading = defaultHeading;
    }

    if ("number" === typeof n.speed) {
      if (n.speed < 0) {
        n.speed = 0;
      }
    } else if (n.speed !== null) {
      n.speed = defaultSpeed;
    }
  });

  navigator.geolocation = navigator.geolocation || {};

  navigator.geolocation.getCurrentPosition = function(succ, err) {
    setTimeout((a, b) => {
      if (!(a = locations[location.hostname])) {
        a = {
          latitude: defaultLatitude,
          longitude: defaultLongitude,
          accuracy: defaultAccuracy,
          altitude: defaultAltitude,
          altitudeAccuracy: defaultAltitudeAccuracy,
          heading: defaultHeading,
          speed: defaultSpeed,
        };
      }
      b = {
        coords: {},
        timestamp: (new Date()).getTime(),
      };
      Object.keys(a).forEach(k => b.coords[k] = a[k]);
      succ(b);
    }, 0);
  };

  navigator.geolocation.watchPosition = function(succ, err) {
    return setInterval((succ, err) => {
      navigator.geolocation.getCurrentPosition(succ, err);
    }, watchInterval, succ, err);
  };

  navigator.geolocation.clearWatch = function(id) {
    clearInterval(id);
  };

})();
