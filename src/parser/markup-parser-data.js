
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
  
  // Enter a new Part definition in registry

  addPart(elemData) {
    
    LOG("ADDING PART: ${elemData.part.type} ID ${elemData.part.id}", 3);
    LOG(elemData, 1);
    
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
    
    // @todo: Check this
    // Parts don't have Places (only Part Views do)
    // But if it's an HTML element, we need to keep the Place information
    
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
      id: `pv-${p4vRegister.part.id}-${partViewName}`, // @todo NO MAGIC VALUES!
      name: partViewName,
      container: p4vRegister.partView.container,
      place: this.makePlaceId(p4vRegister.place.role, p4vRegister.place.region)
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
}

export { P4V_Data };
