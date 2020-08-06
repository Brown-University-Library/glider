
import { LOG } from '../misc/logger.js';
import { PARSING_CONSTANTS } from '../system-settings.js';

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
  
  // Enter a new PartView definition in registry

  addPartView(p4vReg) {

    LOG("ADDING PART VIEW");
    LOG(p4vReg);
    
    let partViewName = (p4vReg.partView.name === undefined)
      ? PARSING_CONSTANTS.PART.DEFAULT_PARTVIEW_NAME 
      : p4vReg.partView.name;
    
    // Compile definition

    let options = {
      partId: p4vReg.part.id,
      id: `pv-${p4vReg.part.id}-${partViewName}`, // @todo NO MAGIC VALUES!
      name: partViewName,
      container: p4vReg.partView.container,
      place: PARSING_CONSTANTS.PLACE.GET_ID(p4vReg.place.role, p4vReg.place.region)
      // Note that full place info is stored in .places[placeId]
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
  
  // Map a Place ID to an array of PartView IDs

  associatePartViewWithPlace(p4vReg) {
    
    let partId = p4vReg.part.id,
        partViewName = p4vReg.partView.name,
        placeId = p4vReg.place.id;
    
    // Initialize new Place entry with an empty array

    if (this.placesPartviews[placeId] === undefined) {
      this.placesPartviews[placeId] = []; 
    }
    
    // Add PartView to array
    // @todo: THIS IS NOT THE PLACE TO MINT A PV ID!!

    this.placesPartviews[placeId].push(`pv-${partId}-${partViewName}`);

    LOG(`Setting PartView ${partViewName} belonging to Part ${partId} to Place ${p4vReg.place.id}`);
  }

  // @todo NASTY KLUDGE: called during parser cleanup

  associatePartViewWithPlace2({ partView, place }) {

    const partViewId = partView.id,
          placeId = place;

    if (this.placesPartviews[placeId] === undefined) {
      this.placesPartviews[placeId] = []; 
    }

    console.log(`this.placesPartviews[${placeId}].push(${partViewId});`)

    this.placesPartviews[placeId].push(partViewId);
  }

  // Given a register (parser state), save the info contained
  //  therein

  saveRegister(p4vReg) {

    // Save the Part if it's new

    if (!this.parts[p4vReg.part.id]) {
      this.parts[p4vReg.part.id] = p4vReg.part;
    }

    // Save this Place if it's new

    if (!this.places[p4vReg.place.id]) {
      this.places[p4vReg.place.id] = p4vReg.place; 
    }

    this.associatePartWithPhase(p4vReg);

    // If there's a PartView, save associated data

    if (p4vReg.partView !== PARSING_CONSTANTS.PART.VIEW_UNDEF 
        && p4vReg.partView !== undefined) {
      this.addPartView(p4vReg);
      this.associatePartWithPartView(p4vReg);
      this.associatePartViewWithPlace(p4vReg);
    }
  }
}

export { P4V_Data };
