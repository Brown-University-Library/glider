
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';
import * as placeTypeDefinitions from './place-library/_all.js';

// Add a CSS stylesheet reference to the display
// Returns style element if already exists
// Returns undefined if no URL provided

function addCssStylesheet({ id, href, integrity, crossorigin }, displayDomRoot) {

  let styleElement;

  if (href) {

    const ssId = id || PARSING_CONSTANTS.PLACE.CREATE_STYLESHEET_ID(href),
          existingStylesheet = document.getElementById(ssId);
    
    if (existingStylesheet === null) {

      styleElement = document.createElement('link');
    
      styleElement.setAttribute('id', ssId);
      styleElement.setAttribute('rel', 'stylesheet');
      styleElement.setAttribute('href', href);
      
      if (integrity) {
        styleElement.setAttribute('integrity', integrity);  
      }
      
      if (crossorigin) {
        styleElement.setAttribute('crossorigin', crossorigin);
      }
      
      displayDomRoot.appendChild(styleElement);
    } else {
      styleElement = existingStylesheet;
    }
  } else {
    LOG(`No URL provided for stylesheet`, 'warn');
  }

  return styleElement; 
}

// Add CSS code for a role in a <style> element
//  Return that element
  
function addCss(css, displayDomRoot) {

  let styleElement;
  const styleElemId = PARSING_CONSTANTS.PLACE.CREATE_STYLE_ELEM_ID(css),
        existingStyleElem = document.getElementById(styleElemId);

  // Check if style w that ID already exists
  // console.log(`##### ${styleElemId}`, existingStyleElem);
  if (existingStyleElem === null) {
    // console.log(`##### YES`);
    styleElement = document.createElement('style');
    styleElement.setAttribute('id', styleElemId);
    styleElement.appendChild(document.createTextNode(css));
    displayDomRoot.appendChild(styleElement);
  } else {
    styleElement = existingStyleElem;
  }

  return styleElement;
}


function initPlaces(gliderApp, initParameters, displayDomRoot) {

  const currRoleId = initParameters.herePlace;

  // Create array of PlaceType definition data structure -- it merges (in order)
  //  a base definition, then a type, then the user definition from the markup

  const basePlaceTypeDef = placeTypeDefinitions[PARSING_CONSTANTS.PLACE.DEFAULT_PLACE_TYPE],
        placeDef = initParameters.placeDefs[currRoleId] || {},
        placeTypeId = (placeDef && placeDef.type) ? placeDef.type : undefined,
        placeTypeDef = (placeTypeId && placeTypeDefinitions[placeTypeId]) ?
                        placeTypeDefinitions[placeTypeId] : {};

  const mergedLists = {
    stylesheets: [basePlaceTypeDef.stylesheet, placeTypeDef.stylesheet, placeDef.stylesheet]
                  .filter(ss => ss !== undefined),
    css: [basePlaceTypeDef.css, placeTypeDef.css, placeDef.css]
                  .filter(css => css !== undefined)
  }

  const fullPlaceDef = Object.assign(
    {css: [], stylesheets: []}, 
    basePlaceTypeDef, 
    placeTypeDef, 
    placeDef,
    mergedLists
  );

  // Get stylesheets and CSS for this PlaceRole
  // (remove CSS duplicates before calling addCss())

  const placeStyleElems = {
    roleStylesheetLink: fullPlaceDef.stylesheets.map((ss) =>
      addCssStylesheet(ss, displayDomRoot)
    ),
    roleCSS: fullPlaceDef.css
      .filter((css, index, allCss) => allCss.indexOf(css) === index)
      .map((css) => addCss(css, displayDomRoot)),
  };

  // Get all PartViews that are used in this Glider instance (based on herePlace)

  const partViewsThatAreHere = Object.values(initParameters.partViews).filter(
    pv => initParameters.places[pv.place].role === currRoleId
  );

  // Get CSS for all PlaceRegions
  // @todo this is hard to read ...

  const { regionCssElems } = partViewsThatAreHere.reduce(
    (acc, pv) => {
      const region = initParameters.places[pv.place].region,
        { css } = fullPlaceDef.addRegion({ 
          role: currRoleId, 
          region, 
          settings: placeTypeDef 
        }),
        regionStyleElem = (acc.cssRegister[css] === undefined) 
          ? addCss(css, displayDomRoot)
          : acc.cssRegister[css];
  
      acc.regionCssElems[region] = regionStyleElem;
      acc.cssRegister[css] = regionStyleElem;
  
      return acc;
    },
    { regionCssElems: {}, cssRegister: {} }
  );  

  // console.log('+++++++++', regionCssElems);

  return Object.assign(
    {},
    { regions: regionCssElems, thisRole: initParameters.herePlace },
    placeStyleElems
  );  
}

export { initPlaces }
