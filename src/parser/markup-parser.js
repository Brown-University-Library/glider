
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';
import { P4V_Data } from './markup-parser-data.js';
import * as P4V_Register from './markup-parser-state.js';
import { getDataFromDomElem } from './markup-parser-dom-extract.js';

/*

OUTLINE

- High-level parsing functions 
  (they don't access the DOM directly, but do the high-level
  analysis and recursion)
  - parseFlightPlans()
  - parseFlightPlan()
  - parseDomElem()

- main()
  This is what is exported from the module

The parser is responsible for looking at the Flight Plan (HTML markup)
and returning a data structure that represents that markup in terms of
Parts, PartViews, Places, and Phases (P4V) and the relationships between
them.

This file contains the high-level parsing functions.

The functions that actually look at the DOM and convert it in a fairly
literal way to a data structure are contained in a separate module
and are accessed via the getDataFromDomElem() function.

The parser state at any given DOM element is stored in
a state register p4vReg. The functions contained in module P4V_Register
are responsible for updating the register and returning a new one. 
The register is the means by which parent elements' attributes (e.g. Place)
are inherited by the children.

Ever so often, the parser state is saved to the parsed data store, P4V_Data.
This object is what's returned to the main Glider system (after a bit of cleanup).

*/

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// PARSING FUNCTIONS

// Parse each flightPlan markup with parseFlightPlan()
//  (This allows for separate Flights on a single page, which may or may not
//    prove useful)

function parseFlightPlans(flightPlanDomRoots) {

  let p4vData_all = flightPlanDomRoots.map(
    flightPlanDomRoot => parseFlightPlan(flightPlanDomRoot)
  );

  return p4vData_all;
}

// Parse a FlightPlan root
//  Create a parsed data object, initialize a Register
//  Recurse into child DOM elements
//  Do some cleanup
//  Return the parsed data

function parseFlightPlan(domElem) { 

  let p4vData = new P4V_Data(domElem),
      elemData = getDataFromDomElem(domElem),
      p4vReg = P4V_Register.initialize(elemData);

  // Create root Phase object (SEQ unless specified otherwise)

  if (elemData.phase.type !== PARSING_CONSTANTS.PHASE.TYPES.PAR) {
    p4vReg = P4V_Register.changePhaseToSeq({p4vReg, elemData});
  } else {
    p4vReg = P4V_Register.changePhaseToPar({p4vReg, elemData});
  }

  p4vData.saveRegisterAsRoot(p4vReg);

  const isChildOfPart = false; // @todo: should there be a root Glider Part?

  // PARSE THE DOCUMENT!
  // Recurse to children by passing them to parseDomElem()

  getChildGliderElements(domElem).forEach(
    childElem => parseDomElem(childElem, p4vReg, p4vData, isChildOfPart)
  );
  
  // Post-parse cleanup & return

  p4vData.clean();
  return p4vData;
}

// This is the main parsing function for non-root DOM elements.

function parseDomElem(domElem, p4vReg_inherited, p4vData, isChildOfPart = false) { 

  const elemData = getDataFromDomElem(domElem);
  let p4vReg = P4V_Register.copy(p4vReg_inherited);

  LOG([`PARSING DOM ELEM ${domElem.id}`, {domElem, p4vData, elemData, p4vReg_inherited}]);

  // These are the parser inputs

  const declaresNewPart = elemData.part.definesNewPart,
        declaresNewPartView = elemData.part.definesNewPartView,
        appliesPlace = elemData.place.hasPlace,
        declaresPhase = elemData.phase.definesNewPhase,
        hasChild = (domElem.childElementCount > 0);

  // Parts

  if (declaresNewPart) { // Create a Part
    p4vReg = P4V_Register.changePartTo({p4vReg, elemData});
    // tellChildrenTheyHaveAPartParent = true;
  } else if (isChildOfPart) { // Inherit part
    // This happens by default - noop?
  } else if (declaresNewPartView || appliesPlace || declaresPhase) {
    // Default part
    p4vReg = P4V_Register.changePartToDefault({p4vReg, elemData});
  } else { // All else fails: no Part -- clear
    // @todo - is it simpler just to have EVERY element have a Part?
    // p4vReg = P4V_Register.clearPart(p4vReg); // ORIGINAL
    p4vReg = P4V_Register.changePartToDefault({p4vReg, elemData}); // TESTING THIS - every elem has a Part
  }

  // PartViews

  if (declaresNewPartView) { // Set to new PV
    p4vReg = P4V_Register.changePartViewTo({p4vReg, elemData});
  } else if (  (declaresNewPart && !hasChild) || // Set to default PV
               (!declaresNewPart && (isChildOfPart || appliesPlace || declaresPhase))) {
    p4vReg = P4V_Register.changePartViewToDefault({p4vReg, elemData});
  } else if (declaresNewPart) { // If a Part -- then let children declare PVs
    p4vReg = P4V_Register.clearPartView(p4vReg);
  } else {
    // p4vReg = P4V_Register.clearPartView(p4vReg);  // ORIGINAL
    p4vReg = P4V_Register.changePartViewToDefault({p4vReg, elemData}); // TESTING THIS - every elem has a Part
  }

  // Places
  // Once role is set, it can't be changed by descendents

  if (appliesPlace) {
    p4vReg = P4V_Register.changePlaceTo({p4vReg, elemData});
  }

  // Phases

  // All elements are assigned a Phase. If there are child
  //  elements, then it's a container (i.e. SEQ or PAR).
  // By default, it's a PAR -- it's only SEQ if it's declared
  //  and even then it can't be on a Part 
  //  (since PartViews need to be active at the same time)

  if (hasChild) {
    const declaresSEQ = elemData.phase.type === PARSING_CONSTANTS.PHASE.TYPES.SEQ;
    if (declaresSEQ && !declaresNewPart) { // It's a SEQ
      p4vReg = P4V_Register.changePhaseToSeq({p4vReg, elemData});
    } else { // It's a PAR
      p4vReg = P4V_Register.changePhaseToPar({p4vReg, elemData});
      if (declaresSEQ) {
        LOG(PARSING_CONSTANTS.ERROR.NO_SEQ_ON_PART, 1, 'warn');
      }
    }
  } else { // No Child - it's a LEAF
    p4vReg = P4V_Register.changePhaseToLeaf({p4vReg, elemData});
  } 

  const tellChildrenTheyHaveAPartParent = (declaresNewPart && !declaresNewPartView && hasChild),
        tellParentToCreateDefaultPV = (declaresNewPart && isChildOfPart);

  // Recurse!

  const childReturnVals = getChildGliderElements(domElem).map(
    child => {
      LOG([`RECURSING FROM ${domElem.id} TO ${child.id}`, p4vReg]);
      return parseDomElem(
      child, p4vReg, p4vData,
      tellChildrenTheyHaveAPartParent
    )}
  );

  // If no child defines a PartView, 
  //   then create a default one for this Part

  // @todo - only run this if there are children

  // Save register

  p4vData.saveRegister(p4vReg);

  // Return info about this elem

  return {
    createDefaultView: tellParentToCreateDefaultPV
  }
}

// Utility function: given a domNode, return all child nodes
//  that are to be parsed (filter out the skips)

function getChildGliderElements(domElem) {
  return Array.from(domElem.children).filter(childElem => 
    ! PARSING_CONSTANTS.SKIP_ELEMENTS.includes(childElem.tagName.toLowerCase())
  )
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Main -- call parseFlightPlans after DOM loaded.
// Currently only deals with the first Flight on the page

function main(documentSections) {
  
  // Return the p4v data object (Class P4V_Data)
  
  let p4vDataArr = parseFlightPlans(documentSections.flightPlanRoots);

  if (p4vDataArr.length > 0) {
    return p4vDataArr[0];
  } else {
    return null; 
  }
}

export { main as parseFlightMarkup }
