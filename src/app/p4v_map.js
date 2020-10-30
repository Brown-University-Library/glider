
import { LOG } from "../misc/logger.js";

/*

  METHODS USED (by app.js): 

  initPartComponentsByIdMap
  getAssociatedPartId
  getPartOrPartView
  getPartViewsFromPart
  getPlaceIdFromPartViewId
  
*/


class p4vDB {

  constructor(initParameters) {
    this.partViewToPartMap = {};
    this.partToPartViewMap = {};
    this.partViewToPlaceMap = this.getPartViewsByPlaceMap(initParameters);
    this.initPartViewsToPartMap(initParameters.partViews);
  }

  initPartComponentsByIdMap(vueObject) {
    this.parts = vueObject.$refs;
  }

  // Get a map between PartView IDs and Place IDs
  // placesPartviews:
  //   pl-mobile-defaultRegion: ["pv-nn-1-controller"]
  //   pl-wall-defaultRegion: ["pv-nn-1-display"]
  // this.placeToPartViewMap = initParameters.placesPartviews;
  // @todo can this be moved to the parsing phase?

  getPartViewsByPlaceMap(initParameters) {

    let partViewsToPlaceMap = {},
        placeToPartViewMap = initParameters.placesPartviews,
        placeIds = Object.keys(initParameters.places);

    placeIds.forEach(placeId => {
      LOG([`XCVXCV: ${placeId}`, placeToPartViewMap[placeId]]);
      placeToPartViewMap[placeId].forEach(
        partViewId => partViewsToPlaceMap[partViewId] = placeId
      );
    });
    console.log('RRRRRRRRRRRRRR');
    console.log(partViewsToPlaceMap);
    return partViewsToPlaceMap;
  }

  // Given a PartView ID, return the Place ID

  getPlaceIdFromPartViewId(partViewId) {
    return this.partViewToPlaceMap[partViewId];
  }

  /*

  @todo Does p4vDB need all these methods? (which ones are actually being used?)
        Is there a way to get off the dependence on Part/PartView IDs
          and just map using the component objects themselves?

  */

  // Generate a map between PartViews ID and their containing Part ID

  initPartViewsToPartMap(initParametersPartViewsData) {

    Object.values(initParametersPartViewsData).forEach(partViewData => {

      this.partViewToPartMap[partViewData.id] = partViewData.partId;

      if (this.partToPartViewMap[partViewData.partId] === undefined) {
        this.partToPartViewMap[partViewData.partId] = [];
      }

      this.partToPartViewMap[partViewData.partId].push(partViewData.id);
    });
  }

  getPartIdFromPartViewId(partViewId) {
    return this.partViewToPartMap[partViewId];
  }

  getPartViewIdsFromPartId(partId) {
    return this.partToPartViewMap[partId];
  }

  // Given an ID or a Part/PartView object,
  //  resolve to the object (as Vue component)

  getPartOrPartView(idOrVueComponent) {

    let vueComponent;

    if (typeof idOrVueComponent === 'string') {
      vueComponent = this.getPartOrPartViewById(idOrVueComponent);
    } else if (typeof idOrVueComponent === 'object'
               && idOrVueComponent._isVue) {
      vueComponent = idOrVueComponent;
    } else {
      vueComponent = undefined;
    }

    return vueComponent;
  }

  getPartOrPartViewById(id) {
    return this.parts[id];
  }

  getPartFromPartView(partViewComponentOrId) {
    const partView = this.getPartOrPartView(partViewComponentOrId),
          partId = this.getPartIdFromPartViewId(partView.id),
          part = this.getPartOrPartViewById(partId);
    return part;
  }

  getPartViewsFromPart(partComponentOrId) {

    const part = this.getPartOrPartView(partComponentOrId);
    let partViews;

    if (part && part.id) {
      const partViewIds = this.getPartViewIdsFromPartId(part.id);
      partViews = partViewIds.map(partViewId => this.getPartOrPartView(partViewId));
    } else {
      partViews = [];
    }

    return partViews;
  }

  // If given a Part ID, returns the Part ID
  // If given a PartView ID, returns the associated Part ID
  
  getAssociatedPartId(partOrPartViewId) {
    if (this.partToPartViewMap[partOrPartViewId]) {
      return partOrPartViewId;
    } else if (this.partViewToPartMap[partOrPartViewId]) {
      return this.partViewToPartMap[partOrPartViewId]
    } else {
      return undefined;
    }
  }
}

export { p4vDB };