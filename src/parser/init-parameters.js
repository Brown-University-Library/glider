
import { urlOptions }        from './url-options.js';
import { parseFlightMarkup } from './markup-parser.js';
import { getPlaceDefs }      from './place-definitions.js';
import { PARSING_CONSTANTS } from '../system-settings.js';

const clientId = PARSING_CONSTANTS.GET_CLIENT_ID();

// Extract initialization data from markup and URL query string
//  (executed only once DOM is loaded - that's why these are functions)

// @todo need to incorporate user settings:
// - in flight-defs element?
// - as Glider constructor argument?
// - as JSON file?

function getInitParameters(documentSections) {
  return Object.freeze(
    Object.assign(
      {}, 
      parseFlightMarkup(documentSections), 
      urlOptions, 
      getPlaceDefs(documentSections),
      {clientId}
    )
  );
}

export { getInitParameters }

