
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
    this.placeDefs = {};
    this.phases = {};
    
    this.rootPhaseId = null;
    
    this.phasesParts = {};
    this.partsPartViews  = {};
    this.placesPartviews = {};
    
    this.phaseChildren = {};
  }
  
  setRootPhase(rootPhase) {
    this.rootPhaseId = rootPhase.id; 
  }
  
  // Associate the parent Phase with an array 
  //  of child Phases

  createParentChildPhaseRelationship(parentPhase, childPhase) {

    if (parentPhase && parentPhase.id) { // If parent == undefined, then it's the root

      if (this.phaseChildren[parentPhase.id] === undefined) {
        this.phaseChildren[parentPhase.id] = [];
      }
      
      // Only save if not already saved

      if (!this.phaseChildren[parentPhase.id].includes(childPhase.id)) {
        this.phaseChildren[parentPhase.id].push(childPhase.id);
        LOG(`Creating Parent-Child Phase relationship between 
              ${parentPhase.id} and ${childPhase.id}`);
      }
    }
  }
  
  // Enter a new PartView definition in registry

  addPartView(p4vReg) {

    LOG([
      `ADDING PART VIEW ${PARSING_CONSTANTS.PART.GET_VIEW_ID(p4vReg.part.id, p4vReg.part.name)}`, 
      p4vReg
    ]);
    
    let partViewName = (p4vReg.partView.name === undefined)
      ? PARSING_CONSTANTS.PART.DEFAULT_PARTVIEW_NAME 
      : p4vReg.partView.name;
    
    // Compile definition

    let options = {
      partId: p4vReg.part.id,
      id: PARSING_CONSTANTS.PART.GET_VIEW_ID(p4vReg.part.id, partViewName),
      name: partViewName,
      container: p4vReg.partView.container, // @todo phase out .container
      markupNode: p4vReg.partView.container,
      place: PARSING_CONSTANTS.PLACE.GET_ID(p4vReg.place.role, p4vReg.place.region)
      // Note that full place info is stored in .places[placeId]
    };
    
    // Save this PartView in registry if it's new
    
    if (this.partViews[options.id] === undefined) {
      this.partViews[options.id] = options; 
    } else {
      LOG([ 
        `Partview ${options.id} already in DB!!`, 
        "Here's the entry:", 
        this.partViews[options.id]
      ]);
    }
    
    return options;
  }
  
  // @todo: ugh. This object is NOT responsible for creating 
  //     new P4V objects

  // NEED TO GO TO STATE REGISTER OR PARSER TO SEE ABOUT CREATING
  //  NEW (implied) DEFAULT VIEWS TO PARTS -- how is this handled?

  // CURRENTLY NOT USED

  addDefaultPartViewToView(partId) {
    
    LOG("ADDING DEFAULT PART VIEW TO ${partId}");
    
    // Compile definition

    let options = {
      partId: partId,
      id: PARSING_CONSTANTS.PART.GET_VIEW_ID(partId, PARSING_CONSTANTS.PART.DEFAULT_VIEW_NAME),
      name: PARSING_CONSTANTS.PART.DEFAULT_VIEW_NAME,
      container: this.parts[partId].container
    };
    
    // Save this PartView in registry if it's new
    
    if (this.partViews[options.id] === undefined) {
      this.partViews[options.id] = options; 
    }
    
    return options;
  }
  
  // Associate this Phase and Part
  // (the Phase has an array of Parts)
  // @todo: should this be a Set?

  associatePartWithPhase(p4vReg) {
    
    if (p4vReg.phase && p4vReg.phase.id && 
        p4vReg.part && p4vReg.part.id) {

      const phaseId = p4vReg.phase.id,
            partId = p4vReg.part.id;
      
      if (this.phasesParts[phaseId] === undefined) {
        this.phasesParts[phaseId] = [];
      }
      
      // Only associate if not already saved
  
      if (!this.phasesParts[phaseId].includes(partId)) {
        this.phasesParts[phaseId].push(partId);
        LOG(`Setting Part ${partId} to Phase ${phaseId}`);
      }
    }
  }
  
  associatePartWithPartView(p4vReg) {
    
    const partId = p4vReg.part.id,
          partViewId = p4vReg.partView.id;
    
    if (partId && partViewId) {
      if (this.partsPartViews[partId] === undefined) {
        this.partsPartViews[partId] = [];
      }
      
      if (!this.partsPartViews[partId].includes(partViewId)) {
        this.partsPartViews[partId].push(partViewId);
        LOG(`Setting PartId ${partId} to PartViewId ${partViewId}`);
      }      
    }
  }
  
  // Map a Place ID to an array of PartView IDs

  associatePartViewWithPlace(p4vReg) {
    
    const partId = p4vReg.part.id,
          partViewName = p4vReg.partView.name,
          partViewId = PARSING_CONSTANTS.PART.GET_VIEW_ID(partId, partViewName),
          placeId = p4vReg.place.id;

    if (partId && partViewName && placeId) {

      // Initialize new Place entry with an empty array

      if (this.placesPartviews[placeId] === undefined) {
        // this.placesPartviews[placeId] = new Set(); // BETTER APPROACH
        this.placesPartviews[placeId] = [];
      }
      
      // Add PartView to array
      // this.placesPartviews[placeId].add(partViewId);

      if (!this.placesPartviews[placeId].includes(partViewId)) {
        this.placesPartviews[placeId].push(partViewId);
        LOG(`Setting PartView ${partViewName} belonging to 
              Part ${partId} to Place ${p4vReg.place.id}`);
      }
    }
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

  // @todo: remember if a Part/PV are defined on same element
  //        don't associate PV and Place if either is not defined
  //        don't save something if it's already been saved

  saveRegister(p4vReg) {

    LOG([`SAVING REGISTER for ${p4vReg.part.id}`, p4vReg]);

    // Save the Part if it's new

    if (p4vReg.part && p4vReg.part.id && !this.parts[p4vReg.part.id]) {
      this.parts[p4vReg.part.id] = p4vReg.part;
    }

    // Save this Place if it's new

    if (p4vReg.place && p4vReg.place.id && !this.places[p4vReg.place.id]) {
      this.places[p4vReg.place.id] = p4vReg.place; 
    }

    // Save this Phase if it's new

    if (p4vReg.phase && p4vReg.phase.id && this.phases[p4vReg.phase.id] === undefined) {
      this.phases[p4vReg.phase.id] = p4vReg.phase; 
      this.createParentChildPhaseRelationship(
        p4vReg.phase.parent, p4vReg.phase
      );
    }

    this.associatePartWithPhase(p4vReg);

    // If there's a PartView, save associated data
    // @todo - look up PARSING_CONSTANTS.PART.VIEW_UNDEF -- is this used elsewhere?

    if (p4vReg.partView !== PARSING_CONSTANTS.PART.VIEW_UNDEF 
        && p4vReg.partView !== undefined) {
      this.addPartView(p4vReg);
      this.associatePartWithPartView(p4vReg);
      this.associatePartViewWithPlace(p4vReg);
    }

    LOG(['SAVED REGISTER - data is now', this]);
  }

  // Call this to save the register as the
  //   Glider root
  // @todo should the root Part be a PartType?

  saveRegisterAsRoot(p4vReg) {
    p4vReg.phase.parent = undefined;
    this.saveRegister(p4vReg);
    this.setRootPhase(p4vReg.phase);
  }

  // Post-parse cleanup
  // @todo -- prune tree of unnecessary Parts/Phases?

  clean() {
    
  }
}

export { P4V_Data };
