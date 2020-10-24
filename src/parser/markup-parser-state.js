
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';
import { getPartData } from './markup-parser-state-p4v-factory.js';

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  REGISTER
  A data structure that represents the state of Phases/Places/Parts/PartViews
  for the current element being parsed. The Register is what is passed
  from parent markup element to child to indicate what is 'inherited.'
  This is all functional - a Registry is passed, modified and a new
  Registry returned.
*/

// Return a new register with updated options
// @todo: make this into a real copy (deep clone, not shallow)

function copyAndUpdate({p4vReg, stateUpdate}) {
  const newPlace = { place: Object.assign({}, p4vReg.place) };
  return Object.assign({}, p4vReg, newPlace, stateUpdate);
}

export function copy(p4vReg) {
  const stateUpdate = {};
  return copyAndUpdate({p4vReg, stateUpdate});
}

export function changePartTo({p4vReg, elemData}) {
  const stateUpdate = {part: getPartData(elemData)};
  return copyAndUpdate({p4vReg, stateUpdate});
}

// @todo check this

export function changePartToDefault({p4vReg, elemData}) {
  const defaultType = PARSING_CONSTANTS.PART.DEFAULT_PART_NAME,
        stateUpdate = {
          part: Object.assign(getPartData(elemData), { type: defaultType }) 
        };
  return copyAndUpdate({p4vReg, stateUpdate});
}

export function clearPart(p4vReg) {
  const stateUpdate = { part: undefined };
  // @todo - should this be a null Part type? See getNullPartData()
  return copyAndUpdate({p4vReg, stateUpdate});
}

// @todo test this
// Also: is the PV name and container in elemData?

export function changePartViewTo({p4vReg, elemData}) {
  
  let partViewName = elemData.part.view || 
                     PARSING_CONSTANTS.PART.DEFAULT_VIEW_NAME;
  
  // Compile definition

  let partViewData = {
    partId: p4vReg.part.id,
    id: PARSING_CONSTANTS.PART.GET_VIEW_ID(p4vReg.part.id, partViewName),
    name: partViewName,
    container: elemData.domNode,
    place: PARSING_CONSTANTS.PLACE.GET_ID(p4vReg.place.role, p4vReg.place.region)
    // Note that full place info is stored in .places[placeId]
    // Also note that this assumes that the Place is set in the registry before 
    //  the PartView
    // @todo - the place cross-reference could be set when saving ...
    //  as could all cross-references (e.g. partId)
  };

  if (p4vReg.partView && p4vReg.partView.name) {
    LOG(`CHANGING PART-VIEW FROM: ${p4vReg.partView.name} TO: ${partViewName}`);
  } else {
    LOG(`INITIALIZING PARTVIEW REGISTER TO: ${partViewName}`)
  }

  const stateUpdate = { partView: partViewData };
  return copyAndUpdate({p4vReg, stateUpdate});
}

// Create a default view and save it to Registry

export function changePartViewToNewDefault({p4vReg, elemData}) {

  const partViewName = PARSING_CONSTANTS.PART.DEFAULT_VIEW_NAME;

  let partViewData = {
    partId: p4vReg.part.id,
    id: PARSING_CONSTANTS.PART.GET_VIEW_ID(p4vReg.part.id, partViewName),
    name: partViewName,
    container: elemData.domNode, // @todo: get rid of .container eventually
    markupNode: elemData.domNode,
    place: PARSING_CONSTANTS.PLACE.GET_ID(p4vReg.place.role, p4vReg.place.region)
    // Note that full place info is stored in .places[placeId]
    // Also note that this assumes that the Place is set in the registry before 
    //  the PartView
  };

  console.log(`CREATING DEFAULT PART VIEW ${partViewData.id}`)

  const stateUpdate = { partView: partViewData };
  return copyAndUpdate({p4vReg, stateUpdate});
}

// @todo - is this the same as the above?

export function changePartViewToDefault({p4vReg, elemData}) {
  return changePartViewToNewDefault({p4vReg, elemData}); // KLUDGE
}

export function clearPartView(p4vReg) {
  const stateUpdate = { partView: PARSING_CONSTANTS.PART.VIEW_UNDEF };
  return copyAndUpdate({p4vReg, stateUpdate});
}

// Can take either elemData from parser or a
//   { role, region } object

export function changePlaceTo({p4vReg, elemData}) { 

  // LOG([`CHANGING PLACE for ${p4vReg.part.id} from`, p4vReg.place, ' to ', elemData.place]);

  const placeDataRoot = elemData.place ? elemData.place : elemData;

  let placeRole, placeRegion;

  // If updating the role, and the current value in the register
  //  has not been set (i.e. is set to default), then update register
  //  and set region to default.

  if (placeDataRoot.role && 
      p4vReg.place.role === PARSING_CONSTANTS.PLACE.DEFAULT_PLACE_NAME) {
    placeRole = placeDataRoot.role;
    placeRegion = PARSING_CONSTANTS.PLACE.DEFAULT_REGION_NAME;
  } else {
    placeRole = p4vReg.place.role;
  }

  // If updating the region, and the current value in the register
  //  has not been set, then update register

  if (placeDataRoot.region && 
      p4vReg.place.region === PARSING_CONSTANTS.PLACE.DEFAULT_REGION_NAME) {
    placeRegion = placeDataRoot.region;
  } else {
    placeRegion = p4vReg.place.region;
  }

  const placeData = {
    id: PARSING_CONSTANTS.PLACE.GET_ID(placeRole, placeRegion),
    role: placeRole,
    region: placeRegion,
    markupNode: elemData.domNode
  };

  const stateUpdate = { place: placeData };
  return copyAndUpdate({p4vReg, stateUpdate});
}

function changePhaseTo({p4vReg, elemData, phaseType}) {

  const parentPhase = p4vReg.phase;

  // Compile Phase definition

  let phaseData = {
    delay: elemData.phase.delay,
    id: elemData.phase.id,
    parent: parentPhase,
    markupNode: elemData.domNode,
    type: phaseType
  };

  // If duration is unspecified, then make it infinitely long
  
  phaseData.duration = elemData.phase.hasDuration 
    ? elemData.phase.duration 
    : Number.POSITIVE_INFINITY;

  const stateUpdate = {phase: phaseData};
  return copyAndUpdate({p4vReg, stateUpdate});
}

export function changePhaseToSeq({p4vReg, elemData}) {
  const phaseType = PARSING_CONSTANTS.PHASE.TYPES.SEQ;
  return changePhaseTo({p4vReg, elemData, phaseType});
}

export function changePhaseToPar({p4vReg, elemData}) {
  const phaseType = PARSING_CONSTANTS.PHASE.TYPES.PAR;
  return changePhaseTo({p4vReg, elemData, phaseType});
}

export function changePhaseToLeaf({p4vReg, elemData}) {
  const phaseType = PARSING_CONSTANTS.PHASE.TYPES.LEAF;
  return changePhaseTo({p4vReg, elemData, phaseType});
}

// Create a new Register (only done when parsing Glider root)

export function initialize(elemData) {

  let part, partView, phase;

  const place = {
    role: PARSING_CONSTANTS.PLACE.DEFAULT_PLACE_NAME,
    region: PARSING_CONSTANTS.PLACE.DEFAULT_REGION_NAME
  }

  const initState = { part, partView, place, phase };

  // Apply 3 functions in turn & return the final state
  
  return [changePlaceTo, changePhaseTo, changePartTo, changePartViewTo].reduce(
    (p4vReg, changeToFn) => changeToFn({p4vReg, elemData}),
    initState
  );
}

