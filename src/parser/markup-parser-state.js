
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';
import { getPartData } from './markup-parser-state-p4v-factory.js';

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// REGISTER CLASS
// A data structure that represents the state of Phases/Places/Parts/PartViews
//  for the current element being parsed. 
// Can save its state to the P4V_Data data structure for export to the rest of Glider.

class P4V_Register {

  constructor (options) {

    this.part = options.part;
    this.partView = options.partView;
    this.place = options.place;
    this.phase = options.phase;
    
    this.place.roleNotSet = (this.place.role === undefined);
  }

  get state() {
    return {
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
    return new P4V_Register(newState);
  }

  // Change some aspect of the register and return an 
  //  updated copy

  changePartTo(elemData) {
    const partData = getPartData(elemData);
    return this.updateAndCopy({ part: partData });
  }

  changePartViewTo(partViewName, partViewDomElemContainer) {
    LOG(`CHANGING PART-VIEW FROM: ${this.partView.name} TO: ${partViewName}`);
    return this.updateAndCopy({ 
      partView: { name: partViewName, container: partViewDomElemContainer }
    });
  }
  
  // Can take either elemData from parser or a
  //   { role, region } object

  changePlaceTo(placeElemData) { 

    LOG(['CHANGING PLACE TO:', placeElemData]);

    const placeDataRoot = placeElemData.place ? placeElemData.place : placeElemData;

    // Compile definition
    
    let placeRole = placeDataRoot.role,
        placeRegion = placeDataRoot.region === undefined 
          ? PARSING_CONSTANTS.PLACE.DEFAULT_REGION_NAME
          : placeDataRoot.region;
    
    let placeData = {
      id: PARSING_CONSTANTS.PLACE.GET_ID(placeRole, placeRegion),
      role: placeRole,
      region: placeRegion
    };

    return this.updateAndCopy({ place: placeData });
  }

  changePhaseTo(phase) { 
    return this.updateAndCopy({ phase: phase });
  }

  copy() {
    return this.updateAndCopy({});
  }
}

export { P4V_Register };
