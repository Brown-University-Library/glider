
import { LOG }                from './misc/logger.js';
import { getInitParameters }  from './parser/init-parameters.js';
import { getSharedStore }     from './misc/store.js';
import { initConnection }     from './misc/store-sync.js';
import { connectionConfig }   from './misc/store-sync-conx_pusher_config.js';
import { getGliderAPI }       from './misc/gliderAPI.js';
import { GliderApp }          from './app/app.js';
import { initDom }            from './misc/initDom.js';
import { initParts }          from './part/initParts.js';
import { initPhases }         from './phase/initPhases.js';
import { initPlaces }         from './place/initPlaces.js';

// Some initial setup

let glider = {};

function main() {

  const initParameters = getInitParameters(); // @todo: Pass user overrides

  LOG(['PARSED DATA', initParameters], 4);
  
  const displayDomRoot = initDom(initParameters),
        sharedStore = getSharedStore(initParameters),
        sharedStoreConn = initConnection(initParameters, connectionConfig, sharedStore);

  const gliderApp = new GliderApp(initParameters, sharedStore);

  let parts  = initParts(gliderApp, initParameters, displayDomRoot),
      places = initPlaces(gliderApp, initParameters, displayDomRoot); //,
      // phases = initPhases(gliderApp, initParameters);

  gliderApp.assignPartsToPlaces(parts, places);

  glider = getGliderAPI({
    gliderApp: gliderApp, 
    parts: parts, 
    places: places,
    // phases: phases,
    store: sharedStore,
    storeConn: sharedStoreConn,
    DEBUG: true // If false, return a limited API 
                // @todo: default FALSE -- override in user settings?
  });

  window.glider = glider;
}

document.addEventListener('DOMContentLoaded', main);

export { glider };
