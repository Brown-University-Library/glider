
// import Firebase from 'https://www.gstatic.com/firebasejs/5.7.0/firebase.js';
// import {Vue} from 'https://cdn.jsdelivr.net/npm/vue@2.5.17/dist/vue.js';
// import {Vuex} from 'https://unpkg.com/vuex@3.0.1/dist/vuex.js';

// import Vue from './vue.esm.browser.js';
// import Vuex from './vuex.js';

import { getGliderOptions } from './options.js';

import { parseFlightMarkup } from './p4v-parser.js';

import { getApp } from './app.js';
import { phaseFactory } from './phase.js';

import * as PartUtils from './part.js';
import * as partTypeRegistry from './part-library/_all.js';
import { getPlaceRegistry } from './place.js';

import { createParts, createPlaces, createPhases } from './p4v-factory.js';
//import Glider from './glider.js'; 


// window.location.hash = `#/${prompt("Flight ID", "Letters and digits only")}/dslWall`;
// (maybe prompt for flightID, incorporate into URL, which allows user to hit refresh?)
// #/FLIGHT_ID/ROLE/JUMPHASH
// If jumphash = 'main' then this is the initializing instance

// window.location.hash = `#/2345/phone/main`; // TEMP -- manually seeding flight instance ID and Place
// window.location.hash = `#/2345/phone`; // TEMP -- manually seeding flight instance ID and Place

let { flightInstanceId, herePlace, nowPhase, initialize } = getGliderOptions();

console.log(`PARSED URL ${flightInstanceId}; ${herePlace}`);
console.log(flightInstanceId, herePlace, nowPhase, initialize);

Vue.use(Vuex);

// Global glider object for export

let glider = {};

function gliderBootASAP() {
  // Init store here?
}

// Main Glider bootup sequence

function gliderBootOnDomLoad() {

  // Add default stylesheet unless overridden
  
  if (! document.querySelector('#glider-style')) {
    const gliderStylesheetLink = document.createElement('link');
    gliderStylesheetLink.setAttribute('id', 'glider-style'); // TODO: NO MAGIC
    gliderStylesheetLink.rel = 'stylesheet';
    gliderStylesheetLink.href = 'https://glider.glitch.me/glider/style.css'; // TODO: NO MAGIC
    document.head.appendChild(gliderStylesheetLink);
  }
  
  // Add classname to body tag for this place
  
  document.body.classList.add(`place-here-${herePlace}`);  // TODO: NO MAGIC
  
  // Parse the flight markup and get the data structure

  let parsedP4v = parseFlightMarkup();
  
  console.log('-------------------------------------------------------');
  console.log("DATA RETURNED FROM PARSER");
  console.log(parsedP4v);
  
  // Add start button (TEMP, until we do async loading)
  
  let startButton = document.createElement('section');
  startButton.setAttribute('id', 'glider-start');
  startButton.setAttribute('class', 'not-ready2');
  startButton.innerHTML = '<p>✈️<br />Start</p>';
  startButton.onclick = function() {
    window.glider.run(); 
    this.parentNode.removeChild(this);
  };

  document.body.appendChild(startButton);

  // Take that data structure and initialize the p4v store
  // TODO: This can be done immediately (no need for the DOM to load)
  
  let gliderApp = getApp(flightInstanceId, parsedP4v, initialize);
  
  gliderApp.here = herePlace;
  gliderApp.isInitializingInstance = initialize;
  window.gApp = gliderApp;
  

  
  // Create the parts/part views, places, and phases
  // TODO: flightInstanceId should live as part of the store (or something)
  //  so that it's globally accessible -- shouldn't be passed as a parameter

  console.log('-------------------------------------------------------');
  console.log("CREATING PARTS");
  createParts(gliderApp, parsedP4v, partTypeRegistry, PartUtils, Vue, flightInstanceId);
  
  console.log('-------------------------------------------------------');
  console.log('CREATING PLACES');
  console.log(parsedP4v.places);
  
  const placeRegistry = getPlaceRegistry(parsedP4v);
  let places = createPlaces(gliderApp, parsedP4v, placeRegistry, herePlace);
  
  console.log('-------------------------------------------------------');
  console.log('CREATING PHASES');
  let phases = createPhases(gliderApp, parsedP4v, phaseFactory);
  console.log(phases);
  
  // Initialize global glider API
  /*
  glider = new Glider(gliderApp);
  glider.store = gliderApp;
  glider.places = places;
  glider.phases = phases;
  glider.registerPlace = placeRegistry;
  
  window.glider = glider;
  */
  
  // Start Glider! (should this be in a module?)

  window.glider = {};
  window.herePlace = herePlace;
  window.glider.phases = phases;
  window.glider.phases2Parts = parsedP4v.phasesParts;
  
  const RENDER = true;
  
  if (RENDER) {
    console.log('-------------------------------------------------------');
    console.log('RENDERING VUE');
    console.log('BEFORE');
    console.log(Vue.options);
    window.wtf = Vue.options;
    
    let rootVue = new Vue({ 
      el: '#glider-root', // TODO: NO MAGIC!
      data: {
        abc: 'def', // TEST
        store: gliderApp,
        app: gliderApp,
        parts: {},
        partviews: {}
      }
    });
    
    window.glider.parts = rootVue.$refs;
    
    // window.glider.isRunning = false;
    
    window.glider.run = function () { 
      this.isRunning = true;
      // this.parts['pv-nextBut-defaultView'].makeGliderRun();
      this.phases['glider-root'].run(); 
    }
    // window.vv = rootVue;
    console.log('AFTER');
    console.log(Vue.options);
  }

  // phases.run();
}

// Do what you can before the markup, then
// boot up Glider once Flight markup is loaded

gliderBootASAP();
document.addEventListener('DOMContentLoaded', gliderBootOnDomLoad);

export { glider };
