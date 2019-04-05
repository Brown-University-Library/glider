

// Given a Part definition, set up shared data entries in store

export function initPartTypeSharedData(partTypeName, partDef, p4vData, localStore, flightInstanceId) {
  
  let sharedData = partDef.part.sharedData ? partDef.part.sharedData() : undefined;

  // TEMP KLUDGE - it should not be here ...
  // sharedData = Object.assign({ _isActive: false }, sharedData);
  
  let sharedDataExists = (sharedData !== undefined && Object.keys(sharedData).length > 0);
  
  if (sharedDataExists) {

    // Get the setters/getters for shared variables
    
    let partTypeSettersGetters = localStore.getPartTypeSettersGetters({ 
      sharedVariables: sharedData,
      flightInstanceId: flightInstanceId
    });

    // Create a Part module in store for each instance of this Part Type
    //  (this instance ID list is pulled from P4Vdata)
    
    const partInstanceIDs = Object.keys(p4vData.parts)
      .filter(partKey => p4vData.parts[partKey].type === partTypeName)
      .map(partKey => p4vData.parts[partKey].id);
    
    // Register each instance of this Part Type with the store

    partInstanceIDs.forEach(partId => {
      localStore.registerPart({
        sharedVariables: sharedData,
        partId: partId,
        flightInstanceId: flightInstanceId
      })
    });

    // Add shared variable setters and getters to 
    //  the component's .computed
    // TODO: Currently overwrites .computed -- should this be moved to a mixin?

    partDef.part.computed = partTypeSettersGetters; 

    delete partDef.part.sharedData;
  }
  
  return partDef;
}

