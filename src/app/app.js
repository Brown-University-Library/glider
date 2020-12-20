import { LOG } from '../misc/logger.js';
import { p4vDB } from './p4v_map.js';
import { PARSING_CONSTANTS } from '../system-settings.js';

/*

  The GliderApp object is the hub of the Glider architecture.
  Parts, PartViews, Places, and Phases do not communicate directly with each
  other -- all communication is done via the GliderApp object.

  Therefore, you will see methods below that are 
  specifically used by each of the major functional areas. For example, 
  when a Phase changes state, it notifies the GliderApp, who is aware of
  the Parts that this effects, and notifies them accordingly.

  @todo - make p4vDB into a general store for all p4v data (move placeData into it)

*/

class GliderApp {

  constructor(initParameters, store) {

    this.p4vDB = new p4vDB(initParameters);

    // Once Vue components have been initialized, create map
    //  between Vue instances and Part IDs

    this.setPartVueComponents = vueObject => this.p4vDB.initPartComponentsByIdMap(vueObject);

    // Set up store

    this.store = store;
    this.store.onVarChange = this.updatePartVarFromStore;
    this.store.app = this;

    this.flightInstanceId = initParameters.flightInstanceId;

    /*

    @todo

      In the Phase, make the onPhaseChange methods assignable rather than hard-coded 
      onto the App object.
      Currently, there is a dependency on the App object. But Phases can be independent.
      Instead, App can add its methods to the Phases.

    */

  }

  // Phase methods

  // Called by Phase.setState()
  // Update Parts and PartViews when Phase state changes

  phaseChange(phaseId, state) {
    this.p4vDB.getPartsAndPartViewsByPhase(phaseId).forEach(
      partOrPartView => { 
        partOrPartView.setGliderState(state);
      }
    );
  }

  // Called by Phase.saveTimeGraphToStore()
  // Passes PhaseBoundary object

  updatePhaseBoundaries(phaseBoundaries) {
    // @todo is this where the timegraphs are syncronised across
    //  clients?
  }

  // Part state methods

  /*
    THIS IS AN IMPLEMENTATION of using Vue watchers to sync
      shared variables across partViews, parts, and the store.
    It seems like a lot of work, but the variables behave just
      like local component variables because they ARE local.
  */

  registerPart() {}

  addPartInstanceToRegistry() {
    // Called by _super Vue component
  } 

  savePartComponentReferences(vueObject) {
    this.getVueComponentById
  }

  getPartTypeAccessors() {}

  // Given a Part ID or PartView ID and variable name, 
  // mint a store ID

  getStoreItemId({ flightInstanceId, partOrPartViewId, varName }) {
    const partId = this.p4vDB.getAssociatedPartId(partOrPartViewId);
    return PARSING_CONSTANTS.STORE.GET_ITEM_ID({flightInstanceId, partId, varName});
  }

  // Given a store ID, parse out the Flight ID, part ID, 
  // and variable name

  parseStoreItemId(itemId) {
    const [flightInstanceId, partId, varName] = 
            itemId.split(PARSING_CONSTANTS.STORE.ITEM_ID_DELIMITER);
    return {flightInstanceId, partId, varName}
  }

  // Given a store item ID and value, update
  //  all associated Parts and PartViews (with an option to skip one)
  // @todo: this is currently unused

  distributeUpdateToPartsAndViews({itemId, itemVal, doNotUpdate = null}) {

    const partId = this.parseStoreItemId(itemId).partId,
          part = partId ? this.p4vDB.getPartOrPartView(partId) : undefined;

    if (part) {

      // Update PartViews and/or Part instance that is
      //  NOT the Part/PartView that is doing the updating

      const partViews = this.p4vDB.getPartViewsFromPart(part),
            partsAndPartViews = [part].concat(partViews);

      partsAndPartViews.filter(p => p !== doNotUpdate)
                       .forEach(p => p[varName] = itemVal);
    }
  }

  // This is called when an update originates from the 
  //  store (i.e. via storeSync)
  // Called from SharedStore

  updatePartVarFromStore(itemId, itemVal) {

    const { partId, varName } = this.parseStoreItemId(itemId),
          partComponent = this.p4vDB.getPartOrPartView(partId),
          partViewComponents = this.p4vDB.getPartViewsFromPart(partId),
          partAndPartViewComponents = [partComponent].concat(partViewComponents);

    // Temporarily suspend watchers to avoid updating 
    //  the store (again!)

    partAndPartViewComponents.forEach(p => {
      p.setWithoutWatch(varName, itemVal);
    });
  }

  // Called from initParts.js
  // Given an array of sharedVariable names,
  //  return a hash of varNames to watcher functions

  getPartTypeWatchers({ sharedVariableNames, partTypeName }) {

    const app = this;

    // Generate a watcher function for varName
    // Watcher: store.setItemLocally(storeItemId, val);
    //          update associated Parts / PartViews

    function getWatcherForVarName(varName) {

      // This is the watcher callback when shared variable
      // varName changes

      return function(val) {

        // Note that in this context, 'this' is the Part/PartView
        //   Vue component.

        // Check to see if the "suspend watch" flag isn't set
        //   (to prevent update feedback loops)
        // Note that if the watch IS suspended, it gets reset
        //   automatically as it's checked.

        if (this.watchNotSuspended(varName)) {

          // Update store with new value

          const storeItemId = app.getStoreItemId({ 
            flightInstanceId: app.flightInstanceId,
            partOrPartViewId: this.id, 
            varName
          });

          app.store.setItemLocally(storeItemId, val);

          // Update associated Part and PartViews
          // @todo: could this be simplified with a well-designed 
          //        API in p4vDB?
          //        OR by sharing state via renderless components?
          // This basically takes a Part of PV id and returns an array
          //  of the Part and PVs except for the PV that initiated the change
          //  Could this be p4vDB.getPartAndPartViewsToUpdateFromChangeIn(this.id)

          const partId = app.p4vDB.getAssociatedPartId(this.id),
                part = app.p4vDB.getPartOrPartView(partId),
                partViews = app.p4vDB.getPartViewsFromPart(partId),
                partViewsExceptThisOne = partViews.filter(pv => pv !== this),
                partAndPartViewsToUpdate = partViewsExceptThisOne.concat(part);

          partAndPartViewsToUpdate.forEach(p => {
            p.setWithoutWatch(varName, val);
          });
        }
      }  
    }

    // Take the given array of varNames and generate an object
    //  that maps each varName to a watch callback generated by 
    //  getWatcherForVarName(varName), defined above.

    function watcherReducer(watcherAccumulator, varName) {
      watcherAccumulator[varName] = getWatcherForVarName(varName);
      return watcherAccumulator;
    }

    const watchersByVarName = sharedVariableNames.reduce(watcherReducer, {});
    return watchersByVarName;
  }

  placesPartviews() {}
}

export { GliderApp };
