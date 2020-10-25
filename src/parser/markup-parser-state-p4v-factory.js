
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';

// Enter a new Part definition
//  (note: uses Place information as well as Part)

export function getPartData(elemData) {
    
  // Compile definition
  
  let partData = {
    id: elemData.part.id,
    type: elemData.part.type === undefined 
          ? PARSING_CONSTANTS.PART.DEFAULT_PART_NAME 
          : elemData.part.type,
    options: elemData.part.options,
    container: elemData.part.container, // @todo: can we get rid of .container in favour of .markupNode?
    markupNode: elemData.part.container
  };

  if (partData.type === PARSING_CONSTANTS.PART.DEFAULT_PART_NAME) {
    LOG(`DEFAULT PART ID = ${partData.id}`);
  }
  
  // @todo: Check this
  // Parts don't have Places (only Part Views do)
  // But if it's an HTML element, we need to keep the Place information
  //  in the Part for future use
  
  // THIS SHOULD STORE THE PLACE ID
  /*
  //if (partData.type === PARSING_CONSTANTS.PART.DEFAULT_PART_NAME) {
    
    if (elemData.place.hasRole || elemData.place.hasRegion) {
      partData.place = PARSING_CONSTANTS.PLACE.GET_ID(elemData.place.role, elemData.place.region);        
      LOG('Identity Part parsed: need to add Place info');
      LOG(partData);
    }
    
  // } */
  
  return partData;
}

// @todo - this is currently unused, but may be useful
//         if we decide to have a Part for every element
//        (A register could get a null Part assigned instead of undefined)

export function getNullPartData(elemData) {

  const nullPartDataUpdate = { 
    part: { 
      type: PARSING_CONSTANTS.PART.NULL_PART_NAME 
    } 
  };

  return getPartData(
    Object.assign(elemData, nullPartDataUpdate)
  );
}
