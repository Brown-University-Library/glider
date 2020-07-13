
import { LOG }               from '../misc/logger.js';
import { PARSING_CONSTANTS } from '../system-settings.js';
import * as PlaceType        from './place.js';

// Go through each Place in initParameters and create a Place instance
//   and add it to a PlaceRegistry.
//   (Remember that Parts don't have Places -- only Part Views do)
// Return the PlaceRegistry

function initPlaces(gliderApp, initParameters, displayDomRoot) {

  // Create the place registry -- explicity defined Places

  const placeRegistry = {},
        placeConstructorByTypeName = PARSING_CONSTANTS.PLACE.TYPE_MARKUP_NAMES;
  
  // Get PlaceDefs from InitParameters & add defaultPlace

  let placeDefs = initParameters.placeDefs;

  const defaultPlaceDef = Object.assign({
    id: PARSING_CONSTANTS.PLACE.DEFAULT_PLACE_NAME,
    type: PARSING_CONSTANTS.PLACE.DEFAULT_PLACE_TYPE
  }, PARSING_CONSTANTS.PLACE.DEFAULT_PLACE_OPTIONS);

  placeDefs.push(defaultPlaceDef);

  // Create Place instances from PlaceDefs and keep in placeRegistry
  //   Let each Place know if it's "here" or not

  placeDefs.forEach(placeDef => {
    const placeConstructorName = placeConstructorByTypeName[placeDef.type],
          placeConstructor = PlaceType[placeConstructorName];
    if (placeConstructor) {
      const additionalOptions = { 
        displayDomRoot: displayDomRoot,
        isHere: (initParameters.herePlace === placeDef.id)
      };
      const placeDefWithOptions = Object.assign(placeDef, additionalOptions);
      placeRegistry[placeDef.id] = new placeConstructor(placeDefWithOptions);
    } else {
      LOG(`You have defined a place of type ${placeDef.type}, which doesn't exist`, 5, 'error');
    }
  });
  
  return placeRegistry;
}

export { initPlaces }
