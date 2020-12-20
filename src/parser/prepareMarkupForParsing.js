
import { LOG } from '../misc/logger.js';
import { PARSING_CONSTANTS } from '../system-settings.js';
import { getIdFromDomPosition } from './getIdFromDomPosition.js';

// Put ID's on all elements in Glider root (for now)
// These IDs map to P4V IDs, for easy cross-checking

function addElementIds(domNode) {
  domNode.querySelectorAll('*').forEach(elem => {
    if (elem.getAttribute('id') === null) {
      elem.setAttribute('id', `g${getIdFromDomPosition(elem)}`);
    }
  });
}

// If none found, assume the DOM element passed _is_ the FlightPlan root

function initializeBodyElemAsFlightPlan() {

  LOG(`No flight plan root explcitly declared: using <BODY> tag`); // @todo no magic

  // If body element, then create a child elem and make that the
  //   Glider root 
  // (why? Because Vue can't use the body element)

  let gliderRoot,
      domRoot = document.body;

  gliderRoot = document.createElement(PARSING_CONSTANTS.FLIGHT_PLAN_DEFAULT_ROOT_ELEM);

  if (domRoot.attributes['phase-type']) { // @todo no magic
    gliderRoot.setAttribute(
      'phase-type',  // @todo no magic
      domRoot.getAttribute('phase-type') // @todo no magic
    );
  }

  // Move all children of body to under the new 
  //  flightPlan root

  while (domRoot.firstChild) { 
    gliderRoot.appendChild(domRoot.firstChild);
  }

  // Move new flightPlan root to the DOM

  document.body.appendChild(gliderRoot);

  return gliderRoot;
}

// @todo: how to handle if there's an existing @id ?
// @todo: if there can be more than one flightplan, we should only use class
// @todo: Vue uses #glider-root, this area uses .glider-root -- which is it?

function addFlightPlanClassAndId(flightPlanRoot) {
  flightPlanRoot.classList.add(PARSING_CONSTANTS.FLIGHT_PLAN_ROOT_CLASSNAME);
  flightPlanRoot.setAttribute('id', 'glider-root'); // @todo NO MAGIC
}

// If glider-defs is inside of GliderRoot, then move it to head

function moveGliderDefsToHead(flightPlanRoot) {

    const gliderDefs = flightPlanRoot.querySelector(
      PARSING_CONSTANTS.DEFS_ELEMENT_NAME
    );

    if (gliderDefs) {
      document.head.appendChild(gliderDefs);
    }
}


function prepareMarkupForParsing(documentSections) {

  let newDocumentSections = {};

  if (documentSections.flightPlanRoots.length === 0) {
    newDocumentSections.flightPlanRoots = new Array(initializeBodyElemAsFlightPlan());
  } else {
    newDocumentSections.flightPlanRoots = documentSections.flightPlanRoots;
  }

  newDocumentSections.flightPlanRoots.forEach(
    flightPlanRoot => {
      addFlightPlanClassAndId(flightPlanRoot);
      addElementIds(flightPlanRoot);
      moveGliderDefsToHead(flightPlanRoot);
    }
  );

  return Object.assign({}, documentSections, newDocumentSections);
}

export { prepareMarkupForParsing }
