
import { PARSING_CONSTANTS } from '../system-settings.js';
import * as systemPartRegistry from './part-library/_all.js';
import { LOG } from '../misc/logger.js';
import Vue from 'https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.esm.browser.js'

/*

  NOTES

  This basically does two things:

  - Scans the Flight markup for Parts/PartViews and registers a corresponding
    component with Vue (remember that you need to set up a Vue component so that
    when it is encountered in the markup, it can be recognised).
  - Prepares the markup for parsing by Vue -- with the components registered,
    Vue will see the @is attributes and create instances

  OUTLINE

  - CREATE PART/PARTVIEW VUE COMPONENTS
    - Get unique list of Part types in markup
    - Register each PartType as a Vue component, 
      along with its PartViews  
      - Initialize this Part Type's shared data
      - If no rendering defined, just do a pass-through
      - If there are shared variables in this Part, then 
        create getters/setters for use in the Part View
    - Register Part component with Vue
    - Create & register (with Vue) this Part's Views as components
  - MODIFY DOM TO ADD @is & @ref & @class TO MARKUP
    - Also adds @is_also for those DOM elements that define
      a Part and (singleton) PartView at the same time
      e.g. HTML elements
    - Associate PartView and Place in GliderApp
  - SET VUE ON TO MARKUP

  - - - - - - - -

  OUTLINE - initPartTypeSharedData() IN PART.js

  - Given a Part Type, check if it has shared data
  - If it doesn't, do nothing. If it does ...
  - Get the setters/getter from App
  - Ask the App to create a Vuex module for this Part Type
  - Ask the App to create a space for each instance of this
    Part Type in the store
  - Add setters/getters to the Part instance's .computed
  - Delete .sharedData property

*/


/* 

  THE DIFFICULTY OF SHARED VARIABLES

  The problem is that until Vue compiles the markup, we don't know things like
  the Part instance IDs. Therefore, we can't create accessors for instances.

  The trick is to create accessors for the Part TYPE that are wrapped in another 
  function that references the instance id off of _this_ -- effectively, it 
  defers the valuation of instance id.

*/ 


/*

  IDEAS:
  
  - This is a good place to optimize:
    - Any Parts type=default that have no Phases or Places associated can be ignored
      (would this take care of the nested HTML problem?)
  - Make implicit types explicit, e.g. state default Part types, Phase types, etc.
    Maybe on @data-part-type-implicit or @phase-type-implicit

*/

/*
  COMPETING APPROACHES: watchers (via .watch property) vs accessors (via .computed property)
  WHO SHALL PREVAIL??
*/

// Given a PartType name and definition,
//  get the watcher functions for any sharedData

function getPartSharedVarWatcher(gliderApp, partTypeName, partTypeDef) {

  // Look to the Part Type definition and see if there is shared state

  let watchers,
      sharedData = partTypeDef.part.sharedData ? partTypeDef.part.sharedData() : undefined;
  const sharedDataExists = (sharedData !== undefined && Object.keys(sharedData).length > 0);

  // If there is, set watcher function

  if (sharedDataExists) {
    const sharedVariableNames = Object.keys(sharedData);

    watchers = gliderApp.getPartTypeWatchers({ 
      sharedVariableNames: sharedVariableNames, 
      partTypeName: partTypeName 
    });
  } else {
    watchers = {};
  }

  return watchers;
}

function getPartSharedVarAccessors(gliderApp, initParameters, partTypeName, partTypeDef) {

  let accessors = {
    part: {},
    view: {}
  };

  // Look to the Part Type definition and see if there is shared state

  let sharedData = partTypeDef.part.sharedData ? partTypeDef.part.sharedData() : undefined;
  const sharedDataExists = (sharedData !== undefined && Object.keys(sharedData).length > 0);
  
  // TEMP KLUDGE - it should not be here ...
  // NOTE: It's also done in _super.js, so is this even necessary?
  // sharedData = Object.assign({ _isActive: false }, sharedData);
  
  if (sharedDataExists) {

    // Get the setters/getters for shared variables
    
    accessors.part = gliderApp.getPartTypeAccessors({
      sharedVariables: sharedData,
      partTypeName: partTypeName,
      flightInstanceId: initParameters.flightInstanceId
    });

    // (in this function you need to map PV-instance id to P-instance id --
    //  this can only happen at run-time)

    accessors.view = gliderApp.getPartTypeViewAccessors({
      sharedVariables: sharedData,
      partTypeName: partTypeName,
      flightInstanceId: initParameters.flightInstanceId
    });

    // START - WHAT DOES THIS HAVE TO DO W STORE?
    //  (isn't it part of the overall Part/PartView setup?)
    //  (and why are we doing this as part of a iteration through
    //  part types - why can't we map all PartViews->Parts at once)

    // Get IDs of all Part Instances that are of this Part Type
    
    const partInstanceIDs = Object.keys(initParameters.parts)
      .filter(partInstance => initParameters.parts[partInstance].type === partTypeName)
      .map(partInstance => initParameters.parts[partInstance].id);

    // Register each instance of this Part Type with the app
    // (WHY?? What purpose does this serve?)

    partInstanceIDs.forEach(partId => {
      gliderApp.registerPart({
        sharedVariables: sharedData,
        partId: partId,
        flightInstanceId: initParameters.flightInstanceId
      })
    });

    // END - WHAT DOES THIS HAVE TO DO W STORE?

    // Add shared variable setters and getters to 
    //  the component's .computed
    // TODO: Currently overwrites .computed -- should this be moved to a mixin?

    // partTypeDef.part.computed = partTypeSettersGetters;

    // delete partTypeDef.part.sharedData;
  }
  
  return accessors;
}

/*
function getPartSharedVarAccessors(partTypeDef, gliderApp) {

  // TODO: This assumes that there are no computed vars that AREN'T shared??
  //  Maybe this is only at the PartType level as opposed to the Part Instance level,
  //  so it's OK.

  const sharedVarNames = Object.keys(partTypeDef.part.computed || {});

  const sharedVarAccessors = sharedVarNames.reduce((accessors, sharedVarName) => {
    
    const getter = function() {
      console.log(`GETTING ${sharedVarName} IN VUE!`);
      const partInstanceId = this.id;
      return gliderApp.getPartViewSharedVariable(partInstanceId, sharedVarName);
    };
    
    const setter = function(value) {
      console.log(`SETTING ${sharedVarName} TO ${value} in VUE!`);
      const partInstanceId = this.id;
      gliderApp.setPartViewSharedVariable(partInstanceId, sharedVarName, value);
    };
    
    accessors[sharedVarName] = { get: getter, set: setter };
    return accessors;
  }, {});

  return sharedVarAccessors;
}
*/

// Given the root of the display markup, prepare that markup 
//  for compilation into Vue components

function prepareDisplayDomForVueCompilation(initParameters, displayDomRoot) {

  // For each Part and PartView in the initParameters,
  //  add an @is attribute to the element to
  //  signal to Vue that it is a component
  // Also, add a @ref and set it to ID
  // Also, add a suitable class name to @class
  
  for (let partId in initParameters.parts) {
    const partDef = initParameters.parts[partId],
          partContainer = displayDomRoot.getElementById(partId);
    partContainer.setAttribute('is', partDef.type);
    partContainer.classList.add(
      PARSING_CONSTANTS.PART.GET_CSS_CLASS(partDef.type)
    );
    partContainer.setAttribute('ref', partId);
  }
  
  // Part Views - add @is and @ref and add classname

  // @todo disentangle the shadowDom markup references from the lightDOM
  // maybe .container is not the right term, since it points to the lightDOM
  // markup -- maybe .markupNode?

  for (let partViewId in initParameters.partViews) {
    
    const partViewDef = initParameters.partViews[partViewId],
          parentPartId = partViewDef.partId,
          parentPartType = initParameters.parts[parentPartId].type,
          partViewContainerId = partViewDef.container.id,
          partViewContainer = displayDomRoot.getElementById(partViewContainerId);
    
    // KLUDGE: Copy over id in data structure to DOM node
    // @todo figure out why I'm doing this ...

    partViewContainer.setAttribute('id', partViewId);
    
    // If also a Part, then move that over to @isAlso
    //  and register this partView in a Place 
    //  (not sure that this is the place to do that ...)

    // @todo Since we now have an independent Display DOM, can't we just 
    //  change the display DOM to have two elements - one for the 
    //  Part and one for the Part View?? (ie no need for @isAlso)
    
    if (partViewContainer.getAttribute('is') !== null) {

      partViewContainer.setAttribute(
        'is_also',
        partViewContainer.getAttribute('is')
      );
      
      partViewContainer.setAttribute('part_id', parentPartId);

      /*  DON'T ERASE THIS YET - BUT IS THIS THE PLACE TO DO IT?
          I THINK THIS IS HANDLED IN MAIN.JS BY:
          gliderApp.assignPartsToPlaces(parts, places);

      // Associate PartView with a Place

      if (initParameters.parts[parentPartId].place) {
        gliderApp.addPartViewToPlace(partViewId, initParameters.parts[parentPartId].place);
      } */
    }
    
    partViewContainer.setAttribute('is', `${parentPartType}-${partViewDef.name}`);
    partViewContainer.classList.add(
      PARSING_CONSTANTS.PART.GET_CSS_CLASS(parentPartType, partViewDef.name)
    );
    partViewContainer.setAttribute('ref', partViewId);
  }
}

// Go through all the PartViews found in the Flight Plan markup and 
//   register a corresponding Vue component
// @todo createVueComponentsFromPartTypes_views and createVueComponentsFromPartTypes_part
//   are very similar - can they be abstracted?

function createVueComponentsFromPartTypes_views(partTypeDef, sharedVarWatchers, partTypeName, partRegistry) {

  let components = {},
      partDefSharedDataFunction = partTypeDef.part.sharedData,
      partViewDefs = partTypeDef.views;

  if (Array.isArray(partViewDefs)) {

    partViewDefs.forEach(partViewDef => {

      const partViewVueName = PARSING_CONSTANTS.PART.GET_VUE_COMPONENT_NAME(partTypeName, partViewDef.partviewName);

      partViewDef.extends = partRegistry['_super'].views[0]; // @todo: should this be a mixin?

      // Assign watchers for shared variables

      if (sharedVarWatchers) {
        // partViewDef.computed = Object.assign(sharedVarAccessors, partViewDef.computed);
        partViewDef.watch = Object.assign(sharedVarWatchers, partViewDef.watchers);
      }

      // Add shared variables on the Part into the PartView via mixin
      // @todo - eventually there should be a better solution - 
      //         e.g. renderless components to share state?

      let sharedDataMixin = {
        data: partDefSharedDataFunction
      };

      if (! Array.isArray(partViewDef.mixins)) {
        partViewDef.mixins = [];
      }

      partViewDef.mixins.push(sharedDataMixin);
      console.log('QQQQQQQQQQ');
      //console.log(partViewDef.watchers);
      console.log(partViewDef);

      components[partViewVueName] = partViewDef;
    });
  }

  return components;
}

// Go through all the Parts found in the Flight Plan markup and 
//   register a corresponding Vue component

function createVueComponentsFromPartTypes_part(partDef, sharedVarAccessors, partTypeName, partRegistry) {

  partDef.extends = partRegistry['_super'].part;

  // Parts should never have a template 
  //  (that's what Views are for)

  if (partDef.template === undefined && partDef.render === undefined) {
    partDef.template = '<div><slot></slot></div>';
  }

  // Assign watchers for shared variables

  if (sharedVarAccessors) {
    partDef.watchers = Object.assign(sharedVarAccessors, partDef.watchers);
  }

  const partVueName = PARSING_CONSTANTS.PART.GET_VUE_COMPONENT_NAME(partTypeName);

  // Add shared variables on the Part into the PartView via mixin

  let sharedDataMixin = {
    data: partDef.sharedData
  };

  if (! Array.isArray(partDef.mixin)) {
    partDef.mixin = [];
  }

  partDef.mixin.push(sharedDataMixin);

  return { [partVueName] : partDef }
}

// Go through all the Part Types found in the Flight Plan markup and 
//   generate a corresponding Vue component definition
//   (the components' definitions are found in the Part registry)

function createVueComponentsFromPartTypes(gliderApp, initParameters, partRegistry) {

  // Compile list of Parts used in Flight Plan markup

  const partTypeInventory = new Set(
    Object.values(initParameters.parts).map(part => part.type)
  );

  // For each Part Type, create (Vue) watcher functions for shared variables
  //  and create Vue component definitions

  let componentDefs = {};

  partTypeInventory.forEach(partTypeName => {

    if (partRegistry[partTypeName] === undefined) {
      LOG(`Unknown Part Type ${partTypeName}! (not registered)`, 5, 'error');
    } else {

      // Generate watchers that update GliderApp when a shared variable changes

      const partTypeDef = partRegistry[partTypeName],
            sharedVarWatchers = getPartSharedVarWatcher(gliderApp, partTypeName, partTypeDef);
      
      // Get component definitions for this PartType and add to componentDefs

      componentDefs = Object.assign(
        componentDefs, 
        createVueComponentsFromPartTypes_part( partTypeDef.part, sharedVarWatchers, partTypeName, partRegistry),
        createVueComponentsFromPartTypes_views(partTypeDef, sharedVarWatchers, partTypeName, partRegistry)
      );
    }
  });

  console.log('IIIIIIIIII');
  console.log(componentDefs);

  return componentDefs;
}

// Final step: have Vue compile the display code 
//  into Vue object instances

function compileMarkupInVue(gliderDisplayDomRoot, componentDefs, gliderApp) {
  const mountPoint = gliderDisplayDomRoot.children[0];
  let vueRoot = new Vue({ 
    el: mountPoint, 
    components: componentDefs,
    data: { app: gliderApp }
  });
  return vueRoot;
}


// Main function: register Vue components for each Part Type in the markup;
//                make a copy of the markup for display purposes - put in a shadow DOM; 
//                prepare that markup copy for compilation by Vue

// @todo is initParts() the place to create the shadow DOM copy of the markup?
//   maybe this should be in main.js

function initParts(gliderApp, initParameters, displayDomRoot) {

  const userPartRegistry = {}, // @todo implement this -- user parts from from initParameters?
        partRegistry = Object.assign(userPartRegistry, systemPartRegistry);

  let componentDefs = createVueComponentsFromPartTypes(gliderApp, initParameters, partRegistry);
  prepareDisplayDomForVueCompilation(initParameters, displayDomRoot);
  const vueRoot = compileMarkupInVue(displayDomRoot, componentDefs, gliderApp);
  gliderApp.setPartVueComponents(vueRoot);

  //window.gliderVueRoot = vueRoot; // @todo temp

  return vueRoot.$refs;
}

export { initParts };
