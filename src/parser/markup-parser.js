
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';
import { P4V_Data } from './markup-parser-data.js';
import { PPP_Register } from './markup-parser-state.js';
import { getDataFromDomElem } from './markup-parser-dom-extract.js';

// @todo -- there is an 'app' property here that is mis-named -- 
//   rename it parsedData or something

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
//  Create an App object, initialize a PPP Register
//  Recurse into child DOM elements
//  Do some cleanup
//  Return the App object

function parseFlightPlan(domElem) { 

  let p4vData = new P4V_Data(domElem),
      elemData = getDataFromDomElem(domElem),
      initPart, initPlace, initPhase;
  
  // Create root Phase object (seq unless specified otherwise)

  // let newPhaseType = (elemData.phase.type === 'par') ? 'par' : 'seq'; 
  if (elemData.phase.type !== 'par') {
    elemData.phase.type = 'seq';
  }
  
  initPhase = p4vData.addPhase(elemData);

  // Create root Part object
  
  initPart = { id: 'rootPart' }; // TODO: KLUDGE

  // Create root Place object
  // @todo This should probably be an 'all' Place
  //  i.e. ROLE=undefined, and REGION=UNDEFINED

  initPlace = { 
    id: 'rootPlace', 
    role: '_undefined1', 
    region: undefined }; // @todo this is a KLUDGE

  // Create initial PPPRegister

  let pppRegister_init = new PPP_Register({
    app: p4vData,
    part: initPart,
    partView: PARSING_CONSTANTS.PART.VIEW_UNDEF,
    place: initPlace,
    phase: initPhase
  });

  // Save this to to the P4V_Data store - and set root Phase

  pppRegister_init.save();
  p4vData.setRootPhase(initPhase);

  // PARSE!
  // Recurse to children by passing them to parseDomElem()

  let forceNewPhase = true;

  Array.from(domElem.children).forEach(
    childElem => parseDomElem(childElem,  pppRegister_init, forceNewPhase)
  );
  
  // Post-parse cleanup
  
  // Add DefaultView IFF there is a Part with no associated View
  
  Object.keys(p4vData.parts)
    .filter(partId => p4vData.partsPartViews[partId] === undefined)
    .forEach(partWithNoViewId => p4vData.addDefaultPartViewToView(partWithNoViewId));
  
  // For PartViews that have no Place specified, 
  //   copy from associated Part
  // (These PartViews are default Views from combined Part/PartView
  //   elements)

  Object.values(p4vData.partViews)
        .filter(partView => !partView.place && p4vData.parts[partView.partId].place)
        .forEach(partView => {
          partView.place = p4vData.parts[partView.partId].place;
          delete p4vData.parts[partView.partId].place;
        });

  // @todo -- prune tree of nested HTML Parts/PartViews
  // @todo -- replace all these IDs with pointers, to simplify the code that
  //          consumes this object

  return p4vData;
}

// This is the main parsing function for non-root DOM elements.
// Checks to see if there's a change in PPP

// @todo this is a very long function - break up

function parseDomElem(domElem, pppRegister, forceNewPhase = false, isChildOfPart = false) { 

  // Do not parse if the glider-defs element
  
  if (domElem.tagName === 'GLIDER-DEFS') return; // @todo no magic

  let elemData = getDataFromDomElem(domElem),
      pppRegister_new = pppRegister.copy(),
      registerChanged = false,
      tellChildrenTheyHaveAPartParent = false,
      forceChildrenToHaveNewPhase;

  LOG('DOM ELEMENT PARSED: ' + elemData.domNode.id);
  LOG(elemData.part);  
  
  // If a Part definition, create new and update register

  // If this is the direct child of a Part
  //   AND if it also defines a new PartView, 
  //     then set it to the PartView indicated in the markup
  //   OTHERWISE, set the register PartView to the default view -- DISABLED
  
  const partViewImplicitlyDeclared = isChildOfPart;

  if (partViewImplicitlyDeclared) {

    if (elemData.part.definesNewPartView) {
      let newPartViewName = elemData.part.view;
      pppRegister_new = pppRegister_new.changePartViewTo(newPartViewName, domElem);
    } // else { // DISABLED, FOR NOW
      // pppRegister_new = pppRegister_new.changePartViewTo(
      //  PARSING_CONSTANTS.PART.PART_DEFAULT_VIEW_NAME, domElem
      // )
      // }

    registerChanged = true;
  }

  // Conditions for defining a new Part:
  //  Either the markup explicitly declares a new Part OR
  //   it defines a new Phase which requires a Part to reference
  //   (which is always the case with Phase children of Container Phases)
  // Ignore Part definition if also defines a PartView
  //  (NOTE: this may be changed in the future)

  const newPartExplicitlyDeclared = (elemData.part.definesNewPart && ! isChildOfPart),
    newPartImplicityDeclared = (elemData.phase.definesNewPhase || forceNewPhase);

  if (newPartImplicityDeclared) { // NOTIFICATION MESSAGE
    LOG(
      `NEW PART IMPLICITLY DECLARED FOR ${elemData.domNode.id} because ` +
      (elemData.phase.definesNewPhase ? 'this elem defines a new Phase ' : '') +
      (forceNewPhase ? 'a new Phase is being forced': '')
    );
  }
  
  if (! elemData.part.definesNewPartView && 
      (newPartExplicitlyDeclared || newPartImplicityDeclared) ) {
    
    let newPart = pppRegister.app.addPart(elemData);
    pppRegister_new = pppRegister_new.changePartTo(newPart);

    registerChanged = true;
    tellChildrenTheyHaveAPartParent = true;
  }

/*
  if (elemData.part.definesNewPart || elemData.part.definesNewPartView) {
    let newPart = getNewPart(elemData, pppRegister.app);
    pppRegister_new = pppRegister_new.changePartTo(newPart)
      .changePartViewTo(newPart);
    registerChanged = true;
  } */

  // If a change of Place Role or Region, create new and update register
  //   Check if Role is defined in the DOM; update Role in PPPRegister, but
  //     only if it is currently undefined

  if (elemData.place.hasRole || elemData.place.hasRegion) {

    // If the role hasn't already been determined (in an ancestor)
    // AND the role is defined in the current element, then
    // use that new role

    let newPlaceRole;
    
    if (elemData.place.hasRole) {
      newPlaceRole = elemData.place.role;
    } else {
      newPlaceRole = pppRegister.place.role;
    }

    let newPlaceRegion = elemData.place.region,
        newPlaceData = { 
          place: { 
            role: newPlaceRole, 
            region: newPlaceRegion 
          }
        },
        newPlaceElemData = Object.assign({}, elemData, newPlaceData);
    
    // let newPlace = getNewPlace(elemData, pppRegister.app);

    // Add place to P4v data structure
    
    let newPlace = pppRegister.app.addPlace(newPlaceElemData); 

    pppRegister_new = pppRegister_new.changePlaceTo(newPlace);
    registerChanged = true;
  }
  
  // If a change of Phase (i.e. explicitly declared in markup)
  //   or forced to create a new Phase (because this is the child of a par or seq),
  //   or has child elements (which defaults to a PAR container)
  // then create new Phase and update register

  /*
  
    CHANGE: Can't have new Phase if also defines a PartView.
    Need to throw a warning if a Phase is being forced and there's a PartView definition
    (e.g. if the Parent part also has a SEQ/PAR definition on it)
  
  */
  
  if (elemData.part.definesNewPartView && forceNewPhase) {
    console.warn(`Element ${elemData.domNode.id}: 
                  Can't have a new Phase and PartView defined on the same element. New Phase ignored.`); 
  }
  
  let hasChildren = (elemData.domNode.children.length > 0);
  
  if (! elemData.part.definesNewPartView && 
      (elemData.phase.definesNewPhase || forceNewPhase || hasChildren)) {

    let parentPhase = pppRegister.phase,
        newPhase = pppRegister.app.addPhase(elemData);

    LOG(`CREATING NEW PHASE ID ${newPhase.id}`);
    
    pppRegister.app.createParentChildPhaseRelationship(parentPhase, newPhase);
    // parentPhase.addChild(newPhase); // New Phase is child of parent
  
    pppRegister_new = pppRegister_new.changePhaseTo(newPhase);
    registerChanged = true;
  }

  // If register has changed, save this PPP coordinate

  if (registerChanged) {
    pppRegister_new.save();
  }

  // Force children to have new Phases if this is a container Phase
  //  OR if this element has children (defaults to PAR)
  
  forceChildrenToHaveNewPhase = (
    hasChildren ||
    (elemData.phase.definesNewPhase && elemData.phase.isContainer) 
  );
  
  // Parse child elements -- recurse

  Array.from(domElem.children).forEach(
    child => parseDomElem(
      child, 
      pppRegister_new, 
      forceChildrenToHaveNewPhase, 
      tellChildrenTheyHaveAPartParent
    )
  );
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Main -- call parseFlightPlans on DOM load
// Currently only deals with the first Flight on the page

function main() {
  
  // Put ID's on all elements in body (for now)
  // These IDs map to P4V IDs, for easy cross-checking
  
  // @todo -- move this to a DOM pre-processing routine
  //          (along with other stuff similarly marked in this js file)

  document.body.querySelectorAll('*').forEach(elem => {
    if (elem.getAttribute('id') === null) {
      elem.setAttribute('id', `g${getIdFromDomPosition(elem)}`);
    }
  });
  
  // Return the p4v data object (Class P4V_Data)
  
  let p4vDataArr = parseFlightPlans(document.body);

  if (p4vDataArr.length > 0) {
    return p4vDataArr[0];
  } else {
    return null; 
  }
}

// init();

export { main as parseFlightMarkup }
