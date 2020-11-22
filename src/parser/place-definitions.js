
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';

// Place parameters are set in glider-defs as key/value pairs (as element attributes)
// The key is the attribute name, lower case no hyphens - e.g. row-width becomes rowwidth
// The value is normalized to lower case

function getPlaceDefs() {

  let placeDefinitions = {};

  document.querySelectorAll(PARSING_CONSTANTS.PLACE.DEF_MARKUP_SELECTOR)
          .forEach(placeDefElem => {

    let definitionParameters = {};
    
    Array.from(placeDefElem.attributes).forEach(function(att) {
      const placeDefParamKey = att.name.toLowerCase().replace('-', ''),
            placeDefParamVal = att.value.toLowerCase();
      definitionParameters[placeDefParamKey] = placeDefParamVal;
    });
    
    if (definitionParameters.id) {
      placeDefinitions[definitionParameters.id] = definitionParameters;
    } else {
      LOG(`NO ID PROVIDED FOR PLACE DEFINITION - ignored`, 7, 'warn');
    }
  });

  const numberOfDefs = Object.keys(placeDefinitions).length;

  if (numberOfDefs) {
    LOG([`FOUND ${numberOfDefs} PLACE DEFINITIONS`, placeDefinitions], 1);
  } else {
    LOG(`FOUND NO PLACE DEFINITIONS`, 1);
  }

  return { placeDefs: placeDefinitions }
}

export { getPlaceDefs }
