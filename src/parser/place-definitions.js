

/*
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

addPlaceDefs(placeDefs) {
  this.placeDefs = this.placeDefs.concat(placeDefs);
} */

// Place parameters are set in glider-defs as key/value pairs (as element attributes)
// The key is the attribute name, lower case no hyphens - e.g. row-width becomes rowwidth
// The value is normalized to lower case

function getPlaceDefs() {

  let placeDefinitions = [];

  // @todo glider defs selector should be in system-settings

  document.querySelectorAll('glider-defs > place').forEach(placeDefElem => {
    
    let definitionParameters = {};
    
    Array.from(placeDefElem.attributes).forEach(function(att) {
      const placeDefParamKey = att.name.toLowerCase().replace('-', ''),
            placeDefParamVal = att.value.toLowerCase();
      definitionParameters[placeDefParamKey] = placeDefParamVal;
    });
    
    placeDefinitions.push(definitionParameters);
  });

  return { placeDefs: placeDefinitions }
}

export { getPlaceDefs }
