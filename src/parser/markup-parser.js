
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js'

/*

OUTLINE

- Constants used by the parser

- Utility functions
  - getHash()
  - getIdFromDomPosition()
  
- Misc parsing functions
  - getPlaceDefinitions()

- P4V_Data class
  (The data structure that will initialize the P4v objects)

- Register class
  (This object keeps track of "current" Parts, Places, Phases
  as the DOM is parsed)

- High-level parsing functions 
  (they don't access the DOM directly, but do the high-level
  analysis and recursion)
  - parseFlightPlans()
  - parseFlightPlan()
  - parseDomElem()

- Data from DOM functions
  (Routines that look at the DOM and pull out the data as
  it relates to P4v definitions. This data is passed back to 
  the high-level parsing functions)
  - getDataFromDomElem(), which calls:
    - getPhaseDataFromDomElem()
    - getPartDataFromDomElem()
    - getPlaceDataFromDomElem()

- main()
  This is what is exported from the module

*/


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// Utilities

// Simple hash function adapted from 
//  https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
// NOTE: Can return negative numbers; e.g. hash for 'strign' is -891986113

function getHash(string) {
  
  let hash = 0;
  
  string.split('').forEach(char => {
    hash = ((hash << 5) - hash) + char.charCodeAt();
    hash = hash & hash; // Convert to 32bit integer
  });
  
  return Math.abs(hash);
}

// Get a unique identifier based on the position of the element in the DOM tree.
// Good for auto-generating IDs for elements that will be the same across Clients
// (Currently not used)

function getIdFromDomPosition(domElement) {
  
  function makeId(domElement) {

    if (domElement === document.body) return ''; // boundary condition

    let previousSiblingCount = 0,
        currSibling = domElement;

    while (currSibling = currSibling.previousSibling) 
      previousSiblingCount++;

    return previousSiblingCount + '.' + makeId(domElement.parentNode);
  }
  
  return getHash(makeId(domElement));
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Misc Parsing functions

// @todo Getting the Glider-defs (including places) seems like a different
//  function from the rest of this module -- move to its own module?

function getPlaceDefinitions() {
  
  let placeDefinitions = [];
  
  const toCamelCase = function(dashTerm) { 
    return dashTerm.replace(/-(\w)/gi, (s, letter) => letter.toUpperCase());
  };
  
  document.querySelectorAll('glider-defs > place').forEach(placeDefElem => {
    
    let definitionParameters = {};
    
    Array.from(placeDefElem.attributes).forEach(function(att) {
      // definitionParameters[toCamelCase(att.name)] = placeDefElem.getAttribute(att.name);
      definitionParameters[att.name.toLowerCase()] = placeDefElem.getAttribute(att.name).toLowerCase();
    });
    
    placeDefinitions.push(definitionParameters);
  });
  
  return placeDefinitions;
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// P4V_Data CLASS
// A mini "database" of Phases, Places, Parts, and Part-Views that
//  are pulled from the Flightplan markup.
// This is the object that gets returned from the parser
//  to initialize Glider

class P4V_Data {
  
  constructor(flightPlanDomRoot) {
    
    this.markupRoot = flightPlanDomRoot;

    this.parts = {};
    this.partViews = {};
    this.places = {};
    this.placeDefs = [];
    this.phases = {};
    
    this.rootPhaseId = null;
    
    this.phasesParts = {};
    this.partsPartViews  = {};
    this.placesPartviews = {};
    
    this.phaseChildren = {};
  }
  
  // Enter a new Phase definition in registry

  addPhase(elemData) {

    // Compile definition

    let options = {};

    options.delay = elemData.phase.delay;
    // options.duration = elemData.phase.duration;
    options.id = elemData.phase.id;

    // If duration is unspecified, then make it infinitely long
    
    if (elemData.phase.hasDuration) {
      options.duration = elemData.phase.duration
    } else {
      options.duration = Number.POSITIVE_INFINITY;
    }
    
    // Set Phase type -- seq, par, or leaf

    let type,
        hasChildren = (elemData.domNode.children.length > 0),
        noPartDefined = ! elemData.part.type;

    if (elemData.phase.hasType) { // Phase type explicitly declared in markup
      type = elemData.phase.type;
    } else if (noPartDefined && hasChildren) { // HTML elements with children
      type = 'par'
    } else if (elemData.phase.hasNoPhaseDescendents) {
      type = 'leaf';
    } else { // Default -- this is the case for all DOM elements that have children
             //  whether they are explicit Phases or not
      type = 'par'; 
    }
    
    // Save this Phase in registry if it's new
    
    let optionsWithType = Object.assign({}, options, { type: type });
    
    if (this.phases[options.id] === undefined) {
      this.phases[options.id] = optionsWithType; 
    }

    return options;
  }
  
  setRootPhase(rootPhase) {
    this.rootPhaseId = rootPhase.id; 
  }
  
  createParentChildPhaseRelationship(parentPhase, childPhase) {
    if (this.phaseChildren[parentPhase.id] === undefined) {
      this.phaseChildren[parentPhase.id] = [];
    }
    
    this.phaseChildren[parentPhase.id].push(childPhase.id);
  }
  
  // Enter a new Part definition in registry

  addPart(elemData) {
    
    LOG("ADDING PART", 3);
    LOG(elemData, 3);
    
    // Compile definition
    
    let options = {
      id: elemData.part.id,
      type: elemData.part.type === undefined 
        ? PARSING_CONSTANTS.PART.DEFAULT_PART_NAME 
        : elemData.part.type,
      options: elemData.part.options,
      container: elemData.part.container
    };

    if (options.type === PARSING_CONSTANTS.PART.DEFAULT_PART_NAME) {
      LOG(`DEFAULT PART ID = ${options.id}`);
    }
    
    // TODO: Check this
    // If an HTML element, need to keep Place information
    // (maybe in the end we should create the PartView here as well -- think on this)
    
    // THIS SHOULD STORE THE PLACE ID
    
    //if (options.type === PARSING_CONSTANTS.PART.DEFAULT_PART_NAME) {
      
      if (elemData.place.hasRole || elemData.place.hasRegion) {
        options.place = this.makePlaceId(elemData.place.role, elemData.place.region);        
        LOG('Identity Part parsed: need to add Place info');
        LOG(options);
      }
      
    // }

    // Save this Part in registry if it's new
    
    if (this.parts[options.id] === undefined) {
      this.parts[options.id] = options; 
    }
    
    return options;
  }
  
  // Enter a new PartView definition in registry

  addPartView(p4vRegister) {

    LOG("ADDING PART VIEW");
    LOG(p4vRegister);
    
    let partViewName = (p4vRegister.partView.name === undefined)
      ? PARSING_CONSTANTS.PART.DEFAULT_PARTVIEW_NAME 
      : p4vRegister.partView.name;
    
    // Compile definition
    
    let options = {
      partId: p4vRegister.part.id,
      id: `pv-${p4vRegister.part.id}-${partViewName}`, // TODO: NO MAGIC VALUES!
      name: partViewName,
      container: p4vRegister.partView.container
    };
    
    // Save this PartView in registry if it's new
    
    if (this.partViews[options.id] === undefined) {
      this.partViews[options.id] = options; 
    }
    
    return options;
  }
  
  addDefaultPartViewToView(partId) {
    
    LOG("ADDING DEFAULT PART VIEW");
    
    // Compile definition

    let options = {
      partId: partId,
      id: `pv-${partId}-${PARSING_CONSTANTS.PART.DEFAULT_VIEW_NAME}`, // TODO: NO MAGIC VALUES!
      name: PARSING_CONSTANTS.PART.DEFAULT_VIEW_NAME,
      container: this.parts[partId].container
    };
    
    // Save this PartView in registry if it's new
    
    if (this.partViews[options.id] === undefined) {
      this.partViews[options.id] = options; 
    }
    
    return options;
  }
  


  // TODO: this should be in a place where all the other 
  //  IDs are minted -- maybe off of PARSING_CONSTANTS?
  
  makePlaceId(role, region) {
    
    if (region === undefined) {
      region = PARSING_CONSTANTS.PLACE.DEFAULT_REGION_NAME; 
    }
    
    return `pl-${role}-${region}`
  }
  
  // Enter a new Place definition in registry
  
  addPlace(elemData) {

    // Compile definition
    
    let placeRole = elemData.place.role,
        placeRegion = elemData.place.region === undefined 
          ? PARSING_CONSTANTS.PLACE.DEFAULT_REGION_NAME
          : elemData.place.region;
    
    let options = {
      id: this.makePlaceId(placeRole, placeRegion),
      // id: `pl-${placeRole}-${placeRegion}`, // TODO: this should be a function off of PARSING_CONSTANTS
      role: placeRole,
      region: placeRegion
    };
    
    // Save this Place in registry if it's new
    
    if (this.places[options.id] === undefined) {
      this.places[options.id] = options; 
    }
    
    return options;
  }
  
  associatePartWithPhase(p4vReg) {
    
    let phaseId = p4vReg.phase.id;
    
    if (this.phasesParts[phaseId] === undefined) {
      this.phasesParts[phaseId] = [];
    }
    
    this.phasesParts[phaseId].push(p4vReg.part.id);
    
    LOG(`Setting Part ${p4vReg.part.id} to Phase ${phaseId}`);
  }
  
  associatePartWithPartView(p4vReg) {
    
    let partId = p4vReg.part.id,
        partViewId = p4vReg.partView;
    
    if (this.partsPartViews[partId] === undefined) {
      this.partsPartViews[partId] = [];
    }
    
    this.partsPartViews[partId].push(partViewId);
    
    LOG(`Setting PartId ${partId} to PartViewId ${partViewId}`);
  }
  
  associatePartViewWithPlace(p4vReg) {
    
    let partId = p4vReg.part.id,
        partViewName = p4vReg.partView.name,
        placeId = p4vReg.place.id;
    
    if (this.placesPartviews[placeId] === undefined) {
      this.placesPartviews[placeId] = []; 
    }
    
    this.placesPartviews[placeId].push(`pv-${partId}-${partViewName}`);
    
    LOG(`Setting PartView ${partViewName} belonging to Part ${partId} to Place ${p4vReg.place.id}`);
  }
  
  addPlaceDefs(placeDefs) {
     this.placeDefs = this.placeDefs.concat(placeDefs);
  }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// REGISTER CLASS
// A data structure that represents the state of Phases/Places/Parts/PartViews
//  for the current element being parsed. 
// Can save its state to the P4V_Data data structure for export to the rest of Glider.

class PPP_Register {

  constructor (options) {
    this.app = options.app;
    this.part = options.part;
    this.partView = options.partView;
    this.place = options.place;
    this.phase = options.phase;
    
    this.place.roleNotSet = (this.place.role === undefined);
  }

  get state() {
    return {
      app: this.app,
      part: this.part,
      place: this.place,
      partView: this.partView,
      partViewContainer: this.partViewContainer,
      phase: this.phase
    }
  }

  // Return a new register with updated options

  updateAndCopy(stateUpdate) {
    let newState = Object.assign(this.state, stateUpdate);
    return new PPP_Register(newState);
  }

  // Change some aspect of the register and return an 
  //  updated copy

  changePartTo(part) { 
    return this.updateAndCopy({ part: part });
  }

  changePartViewTo(partViewName, partViewDomElemContainer) {
    LOG(`CHANGING PART-VIEW FROM: ${this.partView.name} TO: ${partViewName}`);
    return this.updateAndCopy({ 
      partView: { name: partViewName, container: partViewDomElemContainer }
    });
  }
  
  changePlaceTo(place) { 
    LOG("CHANGING PLACE TO: ");
    LOG(place);
    return this.updateAndCopy({ place: place });
  }

  changePhaseTo(phase) { 
    return this.updateAndCopy({ phase: phase });
  }

  copy() {
    return this.updateAndCopy({});
  }

  // Save register to P4V_Data store

  save() {

    this.app.associatePartWithPhase(this);

    if (this.partView !== PARSING_CONSTANTS.PART.VIEW_UNDEF 
        && this.partView !== undefined) {
      this.app.addPartView(this);
      this.app.associatePartWithPartView(this);
      this.app.associatePartViewWithPlace(this);
    }
  }
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// PARSING FUNCTIONS

// Find all FlightPlans on page and parse each with parseFlightPlan()
//  Returns an array of App objects
//  (This allows for separate Flights on a single page, which may or may not
//    prove useful)

function parseFlightPlans(domRoot) {

  let flightPlanDomRoots = Array.from(
    domRoot.querySelectorAll(PARSING_CONSTANTS.FLIGHT_PLAN_SELECTOR)
  );

  // If none found, assume the DOM element passed _is_ the FlightPlan root

  if (flightPlanDomRoots.length === 0) {

    LOG(`No flight plan root declared: using <${domRoot.tagName}>`);

    // If body element, then create a child div and make that the
    //  Glider root (Vue can't use the body element)

    // TODO: THIS DOESN'T BELONG IN A PARSER -- THIS MARKUP MODIFICATION
    //  SHOULD BE DONE PRIOR TO PARSING

    let gliderRoot;

    if (domRoot === document.body) {
      gliderRoot = document.createElement(PARSING_CONSTANTS.FLIGHT_PLAN_DEFAULT_ROOT_ELEM);
      if (domRoot.attributes['phase-type']) { // @todo no magic
        gliderRoot.setAttribute(
          'phase-type',  // @todo no magic
          domRoot.getAttribute('phase-type') // @todo no magic
        );
      }
      while (domRoot.firstChild) { 
        gliderRoot.appendChild(domRoot.firstChild);
      }
      document.body.appendChild(gliderRoot);

      // If glider-defs is inside of GliderRoot, then move it just before

      const gliderDefs = gliderRoot.querySelector('glider-defs');  // @todo no magic

      if (gliderDefs) {
        gliderRoot.parentElement.insertBefore(gliderDefs, gliderRoot);
      }
      
    } else {
      gliderRoot = domRoot;
    }

    gliderRoot.classList.add(PARSING_CONSTANTS.FLIGHT_PLAN_ROOT_CLASSNAME);
    gliderRoot.setAttribute('id', 'glider-root'); // @todo: how to handle if there's an existing @id ?
    // @todo: Vue uses #glider-root, this area uses .glider-root -- which is it?
    flightPlanDomRoots = [gliderRoot];
  }

  // Parse each FlightPlan and gather data in an array

  let p4vData_all = flightPlanDomRoots.map(
    flightPlanDomRoot => parseFlightPlan(flightPlanDomRoot)
  );

  return p4vData_all;
}

// Parse a FlightPlan root
//  Create an App object, initialize a PPP Register
//  Recurse into child DOM elements
//  Return the App object

function parseFlightPlan(domElem) { 

  let p4vData = new P4V_Data(domElem),
      elemData = getDataFromDomElem(domElem),
      initPart, initPlace, initPhase;

  // Initialize p4vData with place information
  
  p4vData.addPlaceDefs(getPlaceDefinitions());
  
  // Create root Phase object (seq unless specified otherwise)

  // let newPhaseType = (elemData.phase.type === 'par') ? 'par' : 'seq'; 
  if (elemData.phase.type !== 'par') {
    elemData.phase.type = 'seq';
  }
  
  initPhase = p4vData.addPhase(elemData);

  // Create root Part object
  
  initPart = { id: 'rootPart' }; // TODO: KLUDGE

  // Create root Place object
  // TODO (Patrick): This should probably be an 'all' Place
  //  i.e. ROLE=undefined, and REGION=UNDEFINED

  initPlace = { id: 'rootPlace', role: "_undefined1", region: undefined }; // TODO: KLUDGE

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

  // Recurse to children by passing them to parseDomElem()

  let forceNewPhase = true;

  Array.from(domElem.children).forEach(
    childElem => parseDomElem(childElem,  pppRegister_init, forceNewPhase)
  );
  
  // Cleanup data
  
  // Add DefaultView IFF there is a Part with no associated View
  
  Object.keys(p4vData.parts)
    .filter(partId => p4vData.partsPartViews[partId] === undefined)
    .forEach(partWithNoViewId => p4vData.addDefaultPartViewToView(partWithNoViewId));
  
  // Add default place for Views that have none specified

  /*
  Object.keys(p4vStore.partViews)
    .filter(partViewId => p4vStore.partsPartViews[partViewId] === undefined)
    .forEach(partWithNoViewId => p4vStore.addDefaultPartViewToView(partWithNoViewId));
  */

  return p4vData;
}

// This is the main parsing function for non-root DOM elements.
// Checks to see if there's a change in PPP

function parseDomElem(domElem, pppRegister, forceNewPhase = false, isChildOfPart = false) { 

  // Do not parse if the glider-defs element
  
  if (domElem.tagName === 'GLIDER-DEFS') return;

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
    LOG(`NEW PART IMPLICITLY DECLARED FOR ${elemData.domNode.id} because 
    elemData.phase.definesNewPhase = ${elemData.phase.definesNewPhase} OR 
    forceNewPhase = ${forceNewPhase}`);
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
        newPlaceElemData = Object.assign({}, elemData, { place: { role: newPlaceRole, region: newPlaceRegion }});
    
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
      //newPhaseOptions = getPhaseConstructorOptionsFromElemData(elemData),
      //newPhase = Phase.createType(newPhaseOptions.type, newPhaseOptions);
      // newPhase = getNewPhase(elemData, pppRegister.app);
      newPhase = pppRegister.app.addPhase(elemData);

    LOG("CREATING NEW PHASE ID: " + newPhase.id);
    
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
// DATA-FROM-DOM FUNCTIONS
// These functions extract the information from the markup and
//  return a data structure for further parsing.
// The idea is that if it ain't in the markup, it's not dealt with
//  here.

function getDataFromDomElem(domElem) {

  let phaseData = getPhaseDataFromDomElem(domElem),
    partData = getPartDataFromDomElem(domElem),
    placeData = getPlaceDataFromDomElem(domElem);

  // tested to this point
  // console.log(`PlaceData is ${placeData.id}`);

  return {
    domNode: domElem,
    part: partData,
    place: placeData,
    phase: phaseData
  }
}

// DATA-FROM-DOM FUNCTIONS: Phase

function getPhaseDataFromDomElem(domElem) {

  function getPhaseIdFromDomElem(domElem) {
    return domElem.getAttribute(PARSING_CONSTANTS.PHASE.ID_ATT_NAME);
  }

  function getPhaseTypeFromDomElem(domElem) {
    return domElem.getAttribute(PARSING_CONSTANTS.PHASE.TYPE_ATT_NAME);
  }

  function getDelayFromDomElem(domElem) {
    let delayAttValue = domElem.getAttribute(PARSING_CONSTANTS.PHASE.DELAY_ATT_NAME);
    return (delayAttValue !== null) ? normalizeTimeToMS(delayAttValue) : null;
  }

  function getDurationFromDomElem(domElem) {
    let durationAttValue = domElem.getAttribute(PARSING_CONSTANTS.PHASE.DURATION_ATT_NAME);
    return (durationAttValue !== null) ? normalizeTimeToMS(durationAttValue) : null;
  }

  // Given a duration as string, return a float normalized to milliseconds
  //  (currently only handles ms and s)

  function normalizeTimeToMS(timeString) {

    let msMatch = timeString.match(/^\s*([\d\.]+)\s*ms\s*$/i);
    if (msMatch !== null) 
      return parseFloat(msMatch[1]);

    let sMatch = timeString.match(/^\s*([\d\.]+)\s*s\s*$/i);
    if (sMatch !== null) 
      return parseFloat(sMatch[1]) * 1000;

    return parseFloat(timeString);
  }

  // Does this domElem have any ancestors that defined Phases?

  function elemHasNoPhaseDescendents(domElem) {
    let descendantPhases = domElem.querySelectorAll(
      PARSING_CONSTANTS.PHASE.PHASE_DESCENDANT_SELECTOR
    );
    
    return (descendantPhases.length === 0);
  }

  // Get Phase data from DOM

  let dur = getDurationFromDomElem(domElem),
      delay = getDelayFromDomElem(domElem),
      specifiedId = getPhaseIdFromDomElem(domElem),
      id = (specifiedId !== null) 
            ? specifiedId 
            : 'ph' + getIdFromDomPosition(domElem),
      phaseType = getPhaseTypeFromDomElem(domElem);

  // Compile data object

  let phaseData = { 
    id: id,
    hasId: (id !== null),
    duration: dur,
    hasDuration: (dur !== null),
    delay: delay,
    hasDelay: (delay !== null),
    hasNoPhaseDescendents: elemHasNoPhaseDescendents(domElem),
    type: phaseType,
    hasType: (phaseType !== null),
    isContainer: (phaseType === 'par' || phaseType === 'seq')
  };

  phaseData.definesNewPhase = (phaseData.hasDuration || phaseData.hasDelay || phaseData.hasType);

  return phaseData;
}

// DATA-FROM-DOM FUNCTIONS: Parts

function getPartDataFromDomElem(domElem) {

  // Check the immediate children of domElem to
  //  see if they define View(s). 
  // Returns False if there are no Views defined; 
  //  True otherwise
  // DISABLED FOR NOW

  /*
  function checkIfHasChildViews(domElem) {
    return Array.from(domElem.children).some(childElem => {
      return (getPartTypeView(childElem).view !== undefined)
    });
  } */
  
  // Routines for extracting PartView names from DOM

  function getPartTypeViewFromString(identifierString) {

    let partTypeViewData = {};

    let parsedTypeViewData = identifierString
      .replace(RegExp(`^${PARSING_CONSTANTS.PART.SELECTOR_PREFIX}`), '')
      .split(PARSING_CONSTANTS.PART.TYPE_VIEW_DELIMITER);

    if (parsedTypeViewData[0] !== undefined) {
      partTypeViewData.type = parsedTypeViewData[0];
    }

    if (parsedTypeViewData[1] !== undefined) {
      partTypeViewData.view = parsedTypeViewData[1];
    }
    
    return partTypeViewData;
  }

  function getPartTypeViewFromPartAttribute(domElem) {
    let attString = domElem.getAttribute(PARSING_CONSTANTS.PART.PART_ATT_NAME);

    return (attString !== null)
      ? getPartTypeViewFromString(attString)
      : {};
  }

  function getPartTypeViewFromPartTypeViewAttributes(domElem) {

    let partTypeViewData = {},
      partTypeAtt = domElem.getAttribute(PARSING_CONSTANTS.PART.TYPE_ATT_NAME),
      partViewAtt = domElem.getAttribute(PARSING_CONSTANTS.PART.VIEW_ATT_NAME);

    if (partTypeAtt !== null) {
      partTypeViewData.type = partTypeAtt;
    }
    
    if (partViewAtt !== null) {
      partTypeViewData.view = partViewAtt;
    }

    return partTypeViewData;
  }

  function getPartTypeViewFromClassname(domElem) {

    let partClassname = Array.from(domElem.classList).find(
      className => className.startsWith(PARSING_CONSTANTS.PART.CLASSNAME_PREFIX)
    );

    let partTypeViewData;

    if (partClassname !== undefined) {
      partTypeViewData = getPartTypeViewFromString(
        partClassname.slice(PARSING_CONSTANTS.PART.CLASSNAME_PREFIX.length)
      )
    } else {
      partTypeViewData = {}
    }

    return partTypeViewData;
  }

  // Returns a data structure { part: <PART TYPE NAME>, view: <VIEW_NAME> }
  
  function getPartTypeView(domElem) {
    return Object.assign({},
      getPartTypeViewFromClassname(domElem),
      getPartTypeViewFromPartAttribute(domElem),
      getPartTypeViewFromPartTypeViewAttributes(domElem)
    );
  }

  function getPartIdFromDomElem(domElem) {

    let id,
      plainId = domElem.getAttribute(PARSING_CONSTANTS.PART.ID_ATT_NAME),
      partId = domElem.getAttribute(PARSING_CONSTANTS.PART.PART_ID_ATT_NAME),
      partRefId = domElem.getAttribute(PARSING_CONSTANTS.PART.PART_REF_ATT_NAME);
    
    if (partId != null) {
      id = partId;
    } else if (plainId != null) {
      id = plainId.replace(/^#/, '');
    } else if (partRefId != null) {
      id = partRefId;
    } else {
      id = undefined;
    }

    return id;
  }

  // TODO: This is an (insecure) kludge -- see 
  //  getPartOptionsFromDomElem_TODO for the proper solution

  function getPartOptionsFromDomElem(domElem) {

    const optionsString = domElem.getAttribute(PARSING_CONSTANTS.PART.OPTIONS_ATT_NAME);

    let optionsData;

    if (optionsString !== null && optionsString !== '') {

      const BRACES = /^\s*\{|\}\s*$/g;

      const evalString = "(function() { return {" 
        + optionsString.replace(BRACES, '')
        + "} })()";

      optionsData = eval(evalString);
      
    } else {
      optionsData = {};
    }

    return optionsData;
  }


  // Attribute format is JSON (without the enclosing {  })
  // Pre-processing: 
  // 1. remove enclosing {  } if present
  // 2. add {  }
  // 3. add quotes around keys (if missing)
  //    (from https://gist.github.com/larruda/967110d74d98c1cd4ee1)


  // KEEP THIS FOR LATER - it's the better way
  // Currently it works EXCEPT that single quotes around values
  // don't parse in JSON -- e.g { a: 'b' } -- the single 
  //  quotes around 'b' have to be converted to "b"
  // It currently already handles single quotes around the key

  function getPartOptionsFromDomElem_TODO(domElem) {

    // Convert single quotes around object values to double quotes

    /* 
    
      The output is called OUT

        1. Look for " or ' -- keep copying to OUT until you find it
        2. IF you find a " then
          Grab all the following text to the next " (skipping over the ones with a preceding \)
          Push this text to OUT
          Go back to 1.
        3. IF you find a ' then
          Grab all the following text to the next ' (skipping the ones with a preceding \)
          Call this X
          Look within X for any " -- replace it with \"
          Wrap X with double quotes
          Push this to OUT
          Go back to 1.

    */

    function transformSingleQuotesToDouble(jsonString) {
      // TODO: code this up
      return jsonString;
    }

    // Remove curly brackets (if exist), then add them

    function wrapJsonInCurlyBrackets(jsonString) {

      let jsonStringNoBrackets = jsonString.replace(/^\s*\{|\}\s*$/g, ''),
        jsonStringWithBrackets = '{' + jsonStringNoBrackets + '}';

      return jsonStringWithBrackets;
    }

    // Make sure that object keys have double quotes around them
    // (required of JSON)

    function ensureQuotesAroundKeyNames(jsonString) {

      const SPACE = '\\s*',
        OPEN_BRACE = SPACE + '\{' + SPACE,
        // CLOSE_CURLY_BRACKET = SPACE + '\}' + SPACE,
        COMMA = SPACE + ',' + SPACE,
        QUOT = `["']`,
        KEY_TEXT = '[a-zA-Z0-9_\\-\\s]+',
        // KEY_TEXT = '[^\\2]+',
        COLON = ':';

      const keysThatNeedQuotesRegEx = new RegExp(
        `(${OPEN_BRACE}|${COMMA})(${QUOT}?)(${KEY_TEXT})(${QUOT}?)${COLON}`,
        'g'
      );
/*
      console.log(`(${OPEN_BRACE}|${COMMA})(${QUOT}?)(${KEY_TEXT})(${QUOT}?)${COLON}`);
      console.log(jsonString);
      console.log(jsonString.replace(keysThatNeedQuotesRegEx, '$1"$3":'));
*/
      return jsonString.replace(keysThatNeedQuotesRegEx, '$1"$3":');
    }

    let optionsString = domElem.getAttribute(PARSING_CONSTANTS.PART.OPTIONS_ATT_NAME);

    if (optionsString !== null) {
      
      // optionsString = '{' + optionsString + '}'; // Add {  }

      optionsString = wrapJsonInCurlyBrackets(optionsString);
      optionsString = ensureQuotesAroundKeyNames(optionsString);

      /*
      optionsString = optionsString.replace( // Enclose bare keywords with quotes
        keysThatNeedQuotesRegEx,
        //  /(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9]+)(['"])?:/g,
        '$1"$3":' );
      */
      optionsString = transformSingleQuotesToDouble(optionsString);

        LOG(optionsString);
      return JSON.parse(optionsString);
    } else return null;
  }

  // Get Part data from DOM
  // note: Cannot create a Part and PartView in the same element

  let id = getPartIdFromDomElem(domElem),
    partTypeView = getPartTypeView(domElem),
    options = getPartOptionsFromDomElem(domElem),
    partContainer = domElem,
    definesNewPartView = (partTypeView.view !== undefined),
    definesNewPart = (partTypeView.type !== undefined && ! definesNewPartView);
    // hasChildViews = checkIfHasChildViews(domElem);

  return {
    type: partTypeView.type,
    view: partTypeView.view,
    id: id,
    hasId: (id !== undefined),
    options: options,
    container: partContainer,
    definesNewPart: definesNewPart,
    definesNewPartView: definesNewPartView,
    // hasChildViews: hasChildViews
  }
}

// DATA-FROM-DOM FUNCTIONS: Places temp from Joel. 
// @todo Still need to figure out how this Place data gets to App.js
// @todo does every phase need place defined? Probably, right?

function getPlaceDataFromDomElem(domElem) {

  // Given a string (e.g. place-red-green) return a 
  //  data structure (e.g. { role: 'red', region: 'green' })

  function getRoleRegionFromString(identifierString) {

    let roleRegionData = {};

    let parsedRoleRegion = identifierString
      .replace(RegExp(`^${PARSING_CONSTANTS.PLACE.SELECTOR_PREFIX}`), '')
      .split(PARSING_CONSTANTS.PLACE.ROLE_REGION_DELIMITER);

    if (parsedRoleRegion[0] !== undefined)
      roleRegionData.role = parsedRoleRegion[0];
      
    if (parsedRoleRegion[1] !== undefined)
      roleRegionData.region = parsedRoleRegion[1];

    return roleRegionData;
  }

  function getPlaceFromPlaceAttribute(domElem) {

    let attString = domElem.getAttribute(PARSING_CONSTANTS.PLACE.PLACE_ATT_NAME);

    return (attString !== null) 
      ? getRoleRegionFromString(attString) 
      : {};
  }

  function getPlaceFromRoleRegionAttributes(domElem) {

    let roleRegionData = {},
      roleAtt = domElem.getAttribute(PARSING_CONSTANTS.PLACE.ROLE_ATT_NAME),
      regionAtt = domElem.getAttribute(PARSING_CONSTANTS.PLACE.REGION_ATT_NAME);

    if (roleAtt !== null) 
      roleRegionData.role = roleAtt;
    if (regionAtt !== null) 
      roleRegionData.region = regionAtt;

    return roleRegionData;
  }

  function getPlaceFromClassname(domElem) {

    let placeClassname = Array.from(domElem.classList).find(
      className => className.startsWith(PARSING_CONSTANTS.PLACE.CLASSNAME_PREFIX)
    );

    let roleRegionData = (placeClassname !== undefined)
      ? getRoleRegionFromString(placeClassname)
      : {};

    return roleRegionData;
  }

  // Collect the { role: <str>, region: <str> } data structures
  //  from attributes and/or classnames and merge them in order of 
  //  precedence (from lowest to highest)

  let placeData = Object.assign( {},
    getPlaceFromClassname(domElem),
    getPlaceFromPlaceAttribute(domElem),
    getPlaceFromRoleRegionAttributes(domElem)
  );

  placeData.hasRole = (placeData.role !== undefined);
  placeData.hasRegion = (placeData.region !== undefined);

  return placeData;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// Main -- call parseFlightPlans on DOM load
// Currently only deals with the first Flight on the page

function main() {
  
  // Put ID's on all elements in body (for now)
  // These IDs map to P4V IDs, for easy cross-checking
  
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
