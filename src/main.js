
import { LOG }                     from './misc/logger.js';
import { getDocumentSections }     from './parser/get-document-parts.js';
import { prepareMarkupForParsing } from './parser/prepareMarkupForParsing.js';
import { getInitParameters }       from './parser/init-parameters.js';
import { getSharedStore }          from './store/store.js';
import { initConnection }          from './store/store-sync.js';
import { connectionConfig }        from './store/store-sync-conx_pusher_config.js';
import { getGliderAPI }            from './misc/gliderAPI.js';
import { GliderApp }               from './app/app.js';
import { initDisplayMarkup }       from './misc/initDisplayMarkup.js';
import { initDisplayDom }          from './misc/initDisplayDom.js';
import { initParts }               from './part/initParts.js';
import { initPhases }              from './phase/initPhases.js';
import { initPlaces }              from './place/initPlaces.js';

// Some initial setup

let glider = {};

function main() {

  // Get initializing parameters

  const documentSections = getDocumentSections(),
        preparedDocumentSections = prepareMarkupForParsing(documentSections),
        initParameters = getInitParameters(preparedDocumentSections); // @todo: Pass user overrides
        
  LOG(['PARSED DATA', initParameters], 4);

  // Derive display markup from Flight Plan markup and attach to
  //  DOM as a shadow DOM

  const markupCopy = initParameters.markupRoot.cloneNode(true),
        displayMarkup = initDisplayMarkup(initParameters, markupCopy),
        displayDomRoot = initDisplayDom(initParameters, displayMarkup);

  // Set up Glider architecture

  // Set up shared store and App

  const sharedStore = getSharedStore(initParameters),
        sharedStoreConn = initConnection(initParameters, connectionConfig, sharedStore);

  const gliderApp = new GliderApp(initParameters, sharedStore);
  // Set up Parts, Places, Phases

  let parts  = initParts(gliderApp, initParameters, displayDomRoot),
      places = initPlaces(gliderApp, initParameters, displayDomRoot);
      // phases = initPhases(gliderApp, initParameters);

  let [_parts, _places, phases, _] = [undefined, undefined, undefined, undefined];

  glider = getGliderAPI({
    initParameters,
    gliderApp, parts, places, phases,
    sharedStore, sharedStoreConn,
    displayDomRoot,
    DEBUG: true // If false, return a limited API 
                // @todo: default FALSE -- override in user settings?
  });

  window.glider = glider;
}

document.addEventListener('DOMContentLoaded', main);

export { glider };
