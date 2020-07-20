
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';

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

export { PPP_Register };
