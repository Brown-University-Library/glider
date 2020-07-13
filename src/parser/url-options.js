
import { PARSING_CONSTANTS } from '../system-settings.js';

// This gets the Glider options from the URL and from parameters passed
// Specifically, it gets the flight instanceId, herePlace and the Phase target

// URL format: #<FLIGHT_ID>/<CLIENT PLACE-ROLE>/<PHASE-TARGET>

function getUrlOptions() {
  
  let urlHash = window.location.hash,
      initialize, jumpTarget;
  
  // Parse options from URL hash

  let [flightInstanceId, clientPlace, target] = urlHash.slice(1).split('/');

  if (target === 'main') {
    initialize = true;
    jumpTarget = null;
  } else {
    initialize = false;
    jumpTarget = target;
  }

  // @todo: default herePlace should be defined by flightPlan
  //  (maybe indicated by @default attribute, OR the first in the list)

  const options = {
    flightInstanceId: flightInstanceId || PARSING_CONSTANTS.DEFAULT_FLIGHT_ID,
    herePlace: clientPlace || PARSING_CONSTANTS.PLACE.DEFAULT_PLACE_NAME,
    nowPhase: jumpTarget,
    initialize: initialize
  }

  // Update URL to reflect defaults

  window.location.hash = [options.flightInstanceId, options.herePlace, options.nowPhase].join('/');
  
  return options;
}

const urlOptions = getUrlOptions();

export { urlOptions };
