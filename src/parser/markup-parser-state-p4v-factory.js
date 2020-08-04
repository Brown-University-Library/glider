
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';

// Enter a new Part definition

function getPartData(elemData) {
    
  // Compile definition
  
  let partData = {
    id: elemData.part.id,
    type: elemData.part.type === undefined 
          ? PARSING_CONSTANTS.PART.DEFAULT_PART_NAME 
          : elemData.part.type,
    options: elemData.part.options,
    container: elemData.part.container
  };

  if (partData.type === PARSING_CONSTANTS.PART.DEFAULT_PART_NAME) {
    LOG(`DEFAULT PART ID = ${partData.id}`);
  }
  
  // @todo: Check this
  // Parts don't have Places (only Part Views do)
  // But if it's an HTML element, we need to keep the Place information
  
  // THIS SHOULD STORE THE PLACE ID
  
  //if (partData.type === PARSING_CONSTANTS.PART.DEFAULT_PART_NAME) {
    
    if (elemData.place.hasRole || elemData.place.hasRegion) {
      partData.place = PARSING_CONSTANTS.PLACE.GET_ID(elemData.place.role, elemData.place.region);        
      LOG('Identity Part parsed: need to add Place info');
      LOG(partData);
    }
    
  // }
  
  return partData;
}

export { getPartData }