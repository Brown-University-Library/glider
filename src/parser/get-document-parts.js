
import { PARSING_CONSTANTS } from '../system-settings.js';


function getDocumentSections() {
  
  const docRoot = document;

  const flightPlanDomRoots = Array.from(
    docRoot.querySelectorAll(`.${PARSING_CONSTANTS.FLIGHT_PLAN_ROOT_CLASSNAME}`)
  );

  return {
    flightPlanRoots: flightPlanDomRoots
  }
}


export { getDocumentSections }

