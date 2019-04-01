
import { PARSING_CONSTANTS } from './settings.js';

/*

  IDEAS:
  
  - This is a good place to optimize:
    - Any Parts type=default that have no Phases or Places associated can be ignored
      (would this take care of the nested HTML problem?)
  - Make implicit types explicit, e.g. state default Part types, Phase types, etc.
    Maybe on @data-part-type-implicit or @phase-type-implicit

*/

// These functions take the P4v Store and create
//  the Places, Phases, and Parts/Part Views

function createParts(p4vStore, p4vData, partRegistry, PartUtils, Vue, flightInstanceId) {
  
  // Get unique list of Part types in markup

  let partTypeList = Array.from(new Set(
    Object.values(p4vData.parts).map(part => part.type)
  ));
  
  // Register each PartType as a Vue component,
  //  along with its PartViews
  
  partTypeList.forEach(partTypeName => { // TODO: Probably partType should be renamed partTypeName
    
    if (partRegistry[partTypeName] !== undefined) {
      
      console.log(`REGISTERING VUE COMPONENT FOR ${partTypeName}. Definition:`);
      console.log(partRegistry[partTypeName].part);
      
      let partTypeDef = partRegistry[partTypeName];
      
      // All Parts extend the base _super.part component
      
      partTypeDef.part.extends = partRegistry['_super'].part;
      
      // Initialize this Part Type's shared data
      // TODO: turn this into a function w return value (it's a black box)
      
      PartUtils.initPartTypeSharedData(partTypeName, partTypeDef, p4vData, p4vStore, flightInstanceId);
      
      // If no rendering defined, just do a pass-through
      // TODO: is this the best option?
      
      if (partTypeDef.part.template === undefined && partTypeDef.part.render === undefined) {
        partTypeDef.part.template = '<div><slot></slot></div>';
      }
      
      // If there are shared variables in this Part, then create getters/setters
      //  for use in the Part View
      
      let partSharedVarAccessors = Object.keys(partTypeDef.part.computed || {})
        .reduce((gettersSetters, sharedVarName) => {
          
          let getter = function() {
            return p4vStore.getters.getPartViewSharedVariable(this.id, sharedVarName);
          };
          
          let setter = function(value) {
            console.log(`SETTING ${sharedVarName} TO ${value} in VUE!`)
            // p4vStore.commit('setPartViewSharedVariable', [this.id, sharedVarName, value]);
            p4vStore.setPartViewSharedVariable(this.id, sharedVarName, value);
          };
          
          gettersSetters[sharedVarName] = { get: getter, set: setter };
          return gettersSetters;
          
        }, {});
      
      // Register Part component
      
      Vue.component(partTypeName, partTypeDef.part);
      
      // Register this Part's Views as components
      //   (which also extend from _super.part)
      
      if (partTypeDef.views) {
        
        partTypeDef.views.forEach(partView => {
          
            let partViewVueName = PARSING_CONSTANTS.PART.GET_VUE_COMPONENT_NAME(partTypeName, partView.partviewName);
          
            partView.extends = partRegistry['_super'].views[0];
            partView.computed = Object.assign(partSharedVarAccessors, partView.computed);
          
            console.log(`REGISTERING VUE COMPONENT FOR ${partViewVueName}. Definition:`);
            console.log(partView);
          
            Vue.component(partViewVueName, partView);
          }
        );
      }
    } else {
      console.error(`Unknown Part Type ${partTypeName}! (not registered)`);
    }
  });
  
  // For each Part and PartView in the p4vData,
  //  add an @is attribute to the element to
  //  signal to Vue that it is a component
  // Also, add a @ref and set it to ID
  // Also, add a suitable class name to @class
  
  // Parts - add @is and @ref, and add classname
  
  for (let partId in p4vData.parts) {
    let partDef = p4vData.parts[partId];
    partDef.container.setAttribute('is', partDef.type);
    partDef.container.classList.add(
      PARSING_CONSTANTS.PART.GET_CSS_CLASS(partDef.type)
    );
    partDef.container.setAttribute('ref', partId);
  }
  
  // Part Views - add @is and @ref and add classname

  for (let partViewId in p4vData.partViews) {
    
    let partViewDef = p4vData.partViews[partViewId],
        parentPartId = partViewDef.partId,
        parentPartType = p4vData.parts[parentPartId].type;
    
    console.log(`SETTING PARTVIEW @IS TO ${parentPartType}-${partViewDef.name}`);
    
    // KLUDGE: Copy over id in data structure to DOM node
    
    partViewDef.container.setAttribute('id', partViewId);
    
    // If also a Part, then move that over to @isAlso
    //  and register this partView in a Place 
    //  (not sure that this is the place to do that ...)
    
    if (partViewDef.container.getAttribute('is') !== null) {
      partViewDef.container.setAttribute(
        'is_also',
        partViewDef.container.getAttribute('is')
      );
      
      partViewDef.container.setAttribute('part_id', parentPartId);

      if (p4vData.parts[parentPartId].place) {
        // console.log('8888888888888');
        // console.log(p4vData.parts[parentPartId]);
        // console.log(`${partViewId} is in ${p4vData.parts[parentPartId].place}`);
        p4vStore.addPartViewToPlace(partViewId, p4vData.parts[parentPartId].place);      }
    }
    
    partViewDef.container.setAttribute('is', `${parentPartType}-${partViewDef.name}`);
    partViewDef.container.classList.add(
      PARSING_CONSTANTS.PART.GET_CSS_CLASS(parentPartType, partViewDef.name)
    );
    partViewDef.container.setAttribute('ref', partViewId);
  }
  
  // Now release Vue on it!
  // (What if Phases/Places want to adjust the markup before Vue-ifying? Should this step be deferred?)
  // Maybe this should be merged into a general "make it so" step that includes kickstarting the Phases
/*
  new Vue({
    el: '#glider-root'
  });
  */
  
}

// Go through each Place in p4vData and create a Place object
//   (Remember that Parts don't have Places -- only Part Views do)

function createPlaces(p4vStore, p4vData, placeRegistry, clientPlace) {
    
  let places = {},
      placeId;
  

  /*  c// onsole.log('YYYYYYYYYYYY');
  c// onsole.log(p4vStore.placesPartviews);
  c// onsole.log(p4vData.placesPartviews);
  
*/
    for (placeId in p4vData.places) {
    
    let placeData = p4vData.places[placeId],
        placeObject = placeRegistry[placeData.role];

   
    // console.log(`Is ${placeId} here? ${placeObject.isHere}`);
    
    // Assuming the Place is found in the registry ...
    // (TODO: this should be fixed to allow for new entries)
    
    if (placeObject === undefined) {
      console.error(`Place '${placeData.role}' not found in registry`);
      // TODO: Should default to something
    } else {
       console.log(`PLACE OBJECT ${placeData.role}`);
 //     console.log(placeObject);
      console.log(p4vData.placesPartviews[placeId]);

      console.log(p4vStore.placesPartviews[placeId]);      

      placeObject.clientPlace = clientPlace; // TODO: is this the time to do this?
             // Go through each PV assigned to this Place
      //  and assign it to a PlaceRegion (default if unspecified)
      
      p4vStore.placesPartviews[placeId].forEach(
        partViewId => placeObject.assignPartViewToRegion(
          placeData.region, p4vData.partViews[partViewId]
        )
      );    }
  }
  
  // Have the Place watch a VuEx registry
  // that maps a place-ID with an array of PartView-IDs
  
  // Associated with that registry -- a trigger that
  // IF a View is added, then throw the View at it
  // AND if a View is removed, then undo it (not a priority)
  
  return places;
}

// Go through each Phase object in p4vData.phases
//  and create a corresponding object, then use the
//  parent/child information in p4vData.phaseChildren
//  to associate those Phase objects
// Return hash of phases by ID

function createPhases(gliderApp, p4vData, phaseFactory) {
  
  let phases = {};
  
  // Create Phase objects
  
  for (let phaseId in p4vData.phases) {
    // let phaseData = p4vData.phases[phaseId];
    let phaseData = Object.assign({ app: gliderApp }, p4vData.phases[phaseId]);

    console.log("PHASE DATA");
    console.log(phaseData);
    phases[phaseId] = phaseFactory(phaseData);
  }
  
  // Associate child Phases with parents
  
  for (let parentPhaseId in p4vData.phaseChildren) {
    
    let parentPhase = phases[parentPhaseId],
      phaseChildren = p4vData.phaseChildren[parentPhaseId].map(id => phases[id]);
    
    phaseChildren.forEach(childPhase => parentPhase.addChild(childPhase));
  }
  
  console.log("CREATING PHASES IN FACTORY");
  console.log(phases);
  
  return phases;
}

export { createParts, createPlaces, createPhases }

