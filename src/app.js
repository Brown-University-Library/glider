
import { getRemoteStore } from './store/firebase.js';
import { isEqual } from './isEqual.js';

/*

  GLIDER.APP

  This is the central clearinghouse that connects Parts, PartViews, Phases, and Places.
  
  None of the components communicate directly with each other; they
  all communicate via the app.

  The app also connects with the store, which in turn connects with the shared store.
*/

// isEqual is from loDash exported as a module:
//  https://github.com/lodash/lodash/tree/4.5.0-npm-packages/lodash.isequal

const conxOptions = {
  apiKey: "AIzaSyDc_8MiQvWdCNpvZcvbJyyQYGeTaVGpBgo",
  authDomain: "glider-feb-2019.firebaseapp.com",
  databaseURL: "https://glider-feb-2019.firebaseio.com",
  projectId: "glider-feb-2019",
  storageBucket: "glider-feb-2019.appspot.com",
  messagingSenderId: "451231012490"
};

let remoteStore = getRemoteStore(conxOptions);
// remoteStore.getFlightState;

window.rs = remoteStore;

// Deep compare -- uses lodash's isEqual()

function isDifferent(a, b) {
  return ! isEqual(a, b); 
}

// Given an array of variable names, create an object to initialize
//  the state of a store (in the Module definition)

function getVuExStateFromPartVarList(sharedVariables, getPartVariableId) {
  
  /* DON'T THROW THIS OUT - MAY BE USEFUL
  remoteStore.getFlightState.then(s => {
    
    console.log('STATE ON REMOTE');
    let remoteValues = s.exportVal();
    
    for (let remoteVarName in remoteValues) {
      if (! remoteVarName.startsWith('_1234')) 
        delete remoteValues[remoteVarName];
    }
    
    console.log(remoteValues);
  }); */
  
  let partVars = Object.keys(sharedVariables);
  
  let stateObj = partVars.reduce((stateObjAcc, partVarName) => {
    const partVarId = getPartVariableId(partVarName);
    stateObjAcc[partVarId] = sharedVariables[partVarName];
    return stateObjAcc;
  }, {});
  
  return stateObj;   
}

// Module definition for Part store
//   Define the getter, mutator, and state

function getPartModuleDefinition(sharedVariables, getPartVariableId) {

  let variableNames = Object.keys(sharedVariables),
    partModuleState = getVuExStateFromPartVarList(sharedVariables, getPartVariableId);

  let varGetter = (partModuleState, getters, rootState) => partVarId => {
    
    console.log(`GETVAL: getting ${partVarId}`);
    console.log(`> partModuleState['${partVarId}'] is: ${partModuleState[partVarId]}`);
    console.log(`> and module state is:`);
    console.log(partModuleState);
    
    return partModuleState[partVarId];
  };
  
  let varSetter = function(partModuleState, [partVarName, partVarValue]) {

    let storePartVarId = getPartVariableId(partVarName);

    // Only update if there's a change in value

    if (isDifferent(partModuleState[storePartVarId], partVarValue)) {
      
      console.log('UPDATING LOCAL STORE:');
      console.log(`> partModuleState['${storePartVarId}'] = ${partVarValue};`);
      console.log('> Module state is now:');
      console.log(partModuleState);
      
      partModuleState[storePartVarId] = partVarValue;
      remoteStore.set(storePartVarId, partVarValue);
    }
  };

  return {    
    state: partModuleState,
    namespaced: true,
    getters: { getVal: varGetter },
    mutations: { 
      setValTo: varSetter
    }
  }
}

// Add Part module listeners for remote store

function addRemoteStoreListener() {
  // TODO - FILL IN
}

// This is called when registering the Part Type component (no instances yet)
// It returns setters and getters for each shared var in the Part type
// These setters and getters are defined at the component level, but executed
//  at the instance level

function getPartTypeSettersGetters({ sharedVariables, flightInstanceId }) {
  
  let sharedVariablesGettersSetters = {},
      localStore = this;
  
  Object.entries(sharedVariables).forEach(([varName, varInitVal]) => {
    
    let getFullVarId = (varName, partInstanceId) => `_${flightInstanceId}-${partInstanceId}-${varName}`;
    
    sharedVariablesGettersSetters[varName] = {
      
      get: function () {
        
        let fullVarId = getFullVarId(varName, this.id),
            namespacedGetVal = `${this.id}/getVal`;
        
        console.log(`PART GETTER NEW: localStore.getters['${namespacedGetVal}']('${fullVarId}')`);
        console.log(localStore);
        console.log('RESULT: ' + localStore.getters[namespacedGetVal](fullVarId));
        return localStore.getters[namespacedGetVal](fullVarId);
      },
      
      set: function (newValue) {
        
        let fullVarId = getFullVarId(varName, this.id),
            namespacedSetValTo = `${this.id}/setValTo`;
        
        console.log(`PART SETTER NEW: localStore.commit(${namespacedSetValTo}, [${varName}, ${newValue}])`);
        localStore.commit(namespacedSetValTo, [varName, newValue]);
      }
    }
  });
  
  return sharedVariablesGettersSetters;
}

// Note that this will be a method off of the main root VuEx store
// This registers a Part INSTANCE -- it creates a store module

function registerPart({ sharedVariables, partId, flightInstanceId }) {
    
  console.log(`REGISTERING PART ${partId} IN STORE`);
  
  let localStore = this,
      partModuleId = partId,
      variableNames = Object.keys(sharedVariables);
  
  // Given a Part varId, return the full store ID
  //  (namespaced for the FlightInstanceId and the PartId)
  
  let getPartVariableId = partVarId => `_${flightInstanceId}-${partId}-${partVarId}`;
  
  // Get Part instance's VuEx module definition & add to store
  // TODO: Also (to be coded) initialize shared variables to whatever's in sharedVariables 
  //   UNLESS there's a value in remote store
  
  let partModule = getPartModuleDefinition(sharedVariables, getPartVariableId);
  localStore.registerModule(partModuleId, partModule);
  
  // Add a remoteStore listener for each Part variable
  // If a remotestore entry changes, then --> update the localStore
  
  // MOVE TO addRemoteStoreListener() ABOVE
  
  let namespacedGetVal = `${partModuleId}/getVal`,
      namespacedSetValTo = `${partModuleId}/setValTo`;
  
  variableNames.forEach(partVarName => {

    // Define callback for when a value changes on the remote store
    // (callback updates local store with remote value)
    
    const partVarId = getPartVariableId(partVarName);
    
    let onRemoteChange = remoteVarValue => {
      let localVarValue = localStore.getters[namespacedGetVal](partVarId);
      if (isDifferent(remoteVarValue, localVarValue)) {
        console.log(`CHANGE ON REMOTE STORE: localStore.commit('${namespacedSetValTo}', ['${partVarName}', ${remoteVarValue}]);`);
        localStore.commit(namespacedSetValTo, [partVarName, remoteVarValue]);
      }
    };

    // Apply that callback
    
    remoteStore.listenForChanges(
      getPartVariableId(partVarName),
      onRemoteChange,
      sharedVariables[partVarName]
    );
  });
  
  return true; // TODO: What's a useful return value??
}

function getPartViewPartModule(p4vData) {
  let partViewPart = {};
  
  //p4vData.partViews.
  
  for (let partId in p4vData.partsPartViews) {
    // partViewPart[partId].forEach(partView => );
  }
}

// Initialize flag indicates whether to first clean out the remote DB

function getLocalStore(flightInstanceId, p4vData, initialize) {

  if (initialize) {
    remoteStore.deleteFlightEntries(flightInstanceId);
  }
  
  // Create getters and setters for PartViews
  // Generate a hash between PartViews ID and their containing Part ID
  
  const partViewsToParts = Object.values(p4vData.partViews).reduce((acc, partView) => { 
    acc[partView.id] = partView.partId;
    return acc;
   }, {});
  
  let getPartViewSharedVariable = function(state) {
    return function(partViewId, varName) {
      let partId = state.partViewsToParts[partViewId],
          varId = `_${state.flightInstanceId}-${partId}-${varName}`; // TODO: FIX THIS

      return state[partId][varId];
    }
  };
  
  // Parts to PartView registry
  // TODO: Can this be done straight off of p4vData?
  
  let partsToPartViews = Object.keys(partViewsToParts).reduce((acc, partViewId) => { 
    let partId = partViewsToParts[partViewId];
    if (acc[partId] === undefined) acc[partId] = [];
    acc[partId].push(partViewId);
    return acc;
  }, {});
  
  // Methods by which Phases can notify Parts
  
  let phasesParts = p4vData.phasesParts,
      partInstanceRegistry = {}; // Keeps track of components by ID
  
  function addPartInstanceToRegistry(part) {
    partInstanceRegistry[part.id] = part;
    console.log(`ADDING ${part.id} TO PART REGISTRY`);
    console.log(part);
  }
  
  function phaseActive(phase) {
    
    console.log(`ACTIVATING PHASE ${phase.id}`);
    
    phasesParts[phase.id].forEach(partId => {
      
      console.log(`> ACTIVATING PART ${partId}`);
      
      // Activate Part
      
      let part = partInstanceRegistry[partId];
      
      if (part) { part.makeActive() }
      
      // Activate associated PartView(s)
      
      if (partsToPartViews[partId] !== undefined) {
        partsToPartViews[partId].forEach(
          partViewId => partInstanceRegistry[partViewId].makeActive()
        );
      }
    });
  }
  
  function phaseInactive(phase) {
    // phasesParts[phaseId].forEach(part => part.deactivate()); // TODO -- need to resolve PartId to Part component
    console.log(`DEACTIVATING PHASE ${phase.id}`);
    phasesParts[phase.id].forEach(partId => { 
      console.log(`> DEACTIVATING PART ${partId}`) 
      let part = partInstanceRegistry[partId];
      if (part) { part.makeInactive() }
      if (partsToPartViews[partId] !== undefined) {
        partsToPartViews[partId].forEach(
          partViewId => partInstanceRegistry[partViewId].makeInactive()
        );
      }
    });
  }
  
  /*
  let setPartViewSharedVariable = function(state, [partViewId, varName, newValue]) {
    let partId = state.partViewsToParts[partViewId],
        varId = `_${state.flightInstanceId}-${partId}-${varName}`; // TODO: FIX THIS

    state[partId][varId] = newValue;
    // state.commit("${partId}/setValTo", ['count', 1000]); // MAKE THIS WORK
  }; */
  
  // TODO: add a sync'ed module for application-level state, e.g. currentPhase
  //  (there are other values that are NOT sync'ed)
  
  let elEstor = new Vuex.Store({
    state: {
      flightInstanceId: flightInstanceId,
      partViewsToParts: partViewsToParts
    },
    mutations: {
      // setPartViewSharedVariable: setPartViewSharedVariable
    },
    modules: {},
    getters: {
      getPartViewSharedVariable: getPartViewSharedVariable
    }
  });

  elEstor.registerPart = registerPart;
  
  elEstor.getPartTypeSettersGetters = getPartTypeSettersGetters;
  elEstor.setPartViewSharedVariable = function(partViewId, varName, newValue) {
    let partId = this.state.partViewsToParts[partViewId];

    console.log(`SETTING ${varName} IN ${partId} TO ${newValue} in STORE!`);
    
    this.commit(`${partId}/setValTo`, [varName, newValue]);
  };
  
  elEstor.addPartInstanceToRegistry = addPartInstanceToRegistry;
  
  elEstor.phaseActive   = phaseActive;
  elEstor.phaseInactive = phaseInactive;
  
  elEstor.placesPartviews = p4vData.placesPartviews;
  elEstor.addPartViewToPlace = function (partViewId, placeId) {
    
    // TODO: not sure this is necessary
    
    if (this.placesPartviews[placeId] === undefined) {
      this.placesPartviews[placeId] = [];
    }
    
    this.placesPartviews[placeId].push(partViewId);
    
    console.log(this.placesPartviews[placeId]);
  };
  
  return elEstor; 
}

export { getLocalStore as getApp };
