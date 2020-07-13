import { LOG } from '../misc/logger.js';
import { PartsDB } from './pppvDB.js';

class GliderApp {

  constructor(initParameters, store) {

    this.partsDB = new PartsDB(initParameters);
    window.partsDB = this.partsDB; // TEMP

    this.placeData = initParameters.places;

    // Once Vue components have been initialized, create map
    //  between Vue instances and Part IDs

    this.setPartVueComponents = vueObject => this.partsDB.initPartComponentsByIdMap(vueObject);

    // etc.

    this.store = store;
    this.store.onVarChange = this.updatePartVarFromStore;
    this.store.app = this;

    this.flightInstanceId = initParameters.flightInstanceId;



    /*

    @todo

    In the Phase, make the onPhaseChange methods assignable rather than hard-coded 
    onto the App object.
    This introduces a dependency on the App object. Phases can be independent.
    Instead, App can add its methods to the Phases.

    */

  }

  // Phase methods

  phaseChange() {}
  updatePhaseBoundaries() {}

  // Part state methods

  registerPart() {}
  addPartInstanceToRegistry() {} // Called by _super Vue component

  savePartComponentReferences(vueObject) {
    this.getVueComponentById
  }

  getPartTypeAccessors() {

  }

  // THIS IS AN IMPLEMENTATION of using Vue watchers to sync
  //   shared variables across partViews, parts, and the store.
  // It seems like a lot of work, but the variables behave just
  //   like local component variables because they ARE local.

  getStoreItemId({ flightInstanceId, partOrPartViewId, varName }) {
    const partId = this.partsDB.getAssociatedPartId(partOrPartViewId);
    return `${flightInstanceId}--${partId}--${varName}`
  }

  parseStoreItemId(itemId) {
    const [ flightInstanceId, partId, varName ] = itemId.split('--');
    return {
      flightInstanceId, 
      partId, 
      varName
    }
  }

  // Given an store item ID and value, update
  //  all associated Parts and PartViews (with an option to skip one)
  // (@todo: this may be defunct)

  distributeUpdateToPartsAndViews({itemId, itemVal, doNotUpdate = null}) {

    const partId = this.parseStoreItemId(itemId).partId,
          part = partId ? this.partsDB.getPartOrPartView(partId) : undefined;

    if (part) {

      // Update PartViews and/or Part instance that is
      //  NOT the Part/PartView that is doing the updating

      const partViews = this.partsDB.getPartViewsFromPart(part),
            partsAndPartViews = [part].concat(partViews);

      partsAndPartViews.filter(p => p !== doNotUpdate)
                      .forEach(p => p[varName] = itemVal);
    }  
  }

  // This is called when an update originates from the 
  //  store (i.e. via storeSync)

  updatePartVarFromStore(itemId, itemVal) {

    const { partId, varName } = this.parseStoreItemId(itemId),
          partComponent = this.partsDB.getPartOrPartView(partId),
          partViewComponents = this.partsDB.getPartViewsFromPart(partId),
          partAndPartViewComponents = [partComponent].concat(partViewComponents);

    // Temporarily suspend watchers to avoid updating 
    //  the store (again!)

    partAndPartViewComponents.forEach(p => {
      p.setWithoutWatch(varName, itemVal);
    });
  }

  getPartTypeWatchers({ sharedVariableNames, partTypeName }) {

    // In this context, 'this' is App

    const app = this;

    // Generate a watcher function for varName
    // Watcher: store.setItemLocally(storeItemId, val);
    //          update associated Parts / PartViews

    function getWatcherForVarName(varName) {

      // Watcher function def

      return function(val) {

        // In this context, 'this' is the Part/PartView

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
          //        API in partsDB?
          //        OR by sharing state via renderless components?

          const partId = app.partsDB.getAssociatedPartId(this.id),
                part = app.partsDB.getPartOrPartView(partId),
                partViews = app.partsDB.getPartViewsFromPart(partId),
                partViewsExceptThisOne = partViews.filter(pv => pv !== this),
                partAndPartViewsToUpdate = partViewsExceptThisOne.concat(part);

          partAndPartViewsToUpdate.forEach(p => {
            p.setWithoutWatch(varName, val);
          });
        }
      }  
    }

    function watcherReducer(watcherAccumulator, varName) {
      watcherAccumulator[varName] = getWatcherForVarName(varName);
      return watcherAccumulator;
    }

    const watchersByVarName = sharedVariableNames.reduce(watcherReducer, {});
    return watchersByVarName;
  }

  // PartViews and Place methods

  assignPartsToPlaces(parts, places) {

    const partAndPartViewIds = Object.keys(parts);

    // @todo: it would be better just to get partView IDs,
    //        instead of mixing in Part IDs as well

    // BETTER: iterate through parts (objects), then
    //  extract ID to get the placeId

    partAndPartViewIds.forEach(partId => {

      const placeId = this.partsDB.getPlaceIdFromPartViewId(partId);
          
      if (placeId) {
        const placeRoleId = this.placeData[placeId].role,
              placeRegionId = this.placeData[placeId].region,
              regionInstance = places[placeRoleId].assignPartViewToRegion(placeRegionId, parts[partId]);
    
        parts[partId].setPlace({ placeCssClasses: regionInstance.classNames });
      }
    });
  }

  placesPartviews() {}
}

export { GliderApp };
