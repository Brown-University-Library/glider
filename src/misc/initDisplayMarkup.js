
import { PARSING_CONSTANTS } from '../system-settings.js';

/*

  Given the Flight markup, make it ready for compilation by Vue
  into display markup & return.

*/

// Create a new node of type newRootElemName and
//   move the children and attributes of domNode over to it
//   and return the new node

function changeRootElem(domNode, newRootElemName) {

  let newDomNode = document.createElement(newRootElemName);

  while (domNode.firstChild) {
    newDomNode.appendChild(domNode.firstChild);
  }

  for(let attr of domNode.attributes) {
    newDomNode.setAttribute(attr.name, attr.value);
  }

  return newDomNode;
}

// getElementById - since DOM elements don't
//  have it ...

function getElementById(startNode, id) {
  if (startNode.id === id) {
    return startNode;
  } else {
    return startNode.querySelectorAll(`#${id}`)[0] || null;
  }
}

// Preprocess - base

function prepareDisplayMarkup(initParameters, flightMarkup) {

  // Make sure that the markup copy doesn't have a <template> elem as root
  // (Vue doesn't like that)

  if (flightMarkup.tagName.toLowerCase() === 'template') {
    flightMarkup = changeRootElem(flightMarkup, 'div');
  }

  // Wrap whole thing in an element
  // (root element needs a parent for some DOM functions)

  const newFlightMarkup = document.createElement('div');
  newFlightMarkup.appendChild(flightMarkup);

  return newFlightMarkup;
}

// Preprocess for Places

function prepareDisplayMarkupForPlaces(initParameters, flightMarkup) {

  Object.values(initParameters.partViews).forEach(pv => {

    const markupDomNode = getElementById(flightMarkup, pv.id),
          { role, region } = initParameters.places[pv.place];

    if (role && region && markupDomNode !== null) {
      markupDomNode.removeAttribute(
        PARSING_CONSTANTS.PLACE.PLACE_ATT_NAME
      );
      markupDomNode.setAttribute(
        PARSING_CONSTANTS.PLACE.ROLE_ATT_NAME, role
      );
      markupDomNode.setAttribute(
        PARSING_CONSTANTS.PLACE.REGION_ATT_NAME, region
      );
      markupDomNode.classList.add(
        PARSING_CONSTANTS.PLACE.CREATE_ROLE_CSS_CLASSNAME(role)
      );
      markupDomNode.classList.add(
        PARSING_CONSTANTS.PLACE.CREATE_REGION_CSS_CLASSNAME(region)
      );
      markupDomNode.classList.add(
        PARSING_CONSTANTS.PLACE.CREATE_CSS_CLASSNAME({role, region})
      );
    }
  });

  return flightMarkup;
}

// Preprocess for Parts

// Given the root of the display markup, prepare that markup 
//  for compilation into Vue components

function prepareDisplayMarkupForParts(initParameters, flightMarkup) {

  // For each Part and PartView in the initParameters,
  //  add an @is attribute to the element to
  //  signal to Vue that it is a component
  // Also, add a @ref and set it to ID
  // Also, add a class name to indicate Part Type
  
  for (let partId in initParameters.parts) {
    const partDef = initParameters.parts[partId],
          partContainer = getElementById(flightMarkup, partId);
    console.log('id?', partId);
    console.log(flightMarkup);
    partContainer.setAttribute('is', partDef.type);
    partContainer.classList.add(
      PARSING_CONSTANTS.PART.GET_CSS_CLASS(partDef.type)
    );
    partContainer.setAttribute('ref', partId);
  }
  
  // Part Views - add @is and @ref and add classname

  for (let partViewId in initParameters.partViews) {
    
    const partViewDef = initParameters.partViews[partViewId],
          parentPartId = partViewDef.partId,
          parentPartType = initParameters.parts[parentPartId].type,
          // partViewContainerId = partViewDef.container.id,
          partViewContainerId = partViewDef.markupNode.id,
          partViewContainer = getElementById(flightMarkup, partViewContainerId);
    
    // Copy over id in data structure to DOM node
    // (PVs need to have their own ID since the markup ID may be
    //  used by multiple entities - e.g. Parts or Phases)

    partViewContainer.setAttribute('id', partViewId);
    
    // If this PartView is also a Part, then create a 
    //  parent element and make THAT the Part
    //  and register this PartView in a Place
    
    if (partViewContainer.getAttribute('is') !== null) {

      const newPartMarkup = document.createElement('div'); // @todo no magic
      newPartMarkup.setAttribute('is', partViewContainer.getAttribute('is'));
      newPartMarkup.setAttribute('ref', parentPartId);
      partViewContainer.parentNode.insertBefore(newPartMarkup, partViewContainer);
      newPartMarkup.appendChild(partViewContainer);
      
      partViewContainer.setAttribute(PARSING_CONSTANTS.PART.PART_ID_ATT_NAME, parentPartId);
    }
    
    partViewContainer.setAttribute('is', `${parentPartType}-${partViewDef.name}`); // @todo no magic
    partViewContainer.classList.add(
      PARSING_CONSTANTS.PART.GET_CSS_CLASS(parentPartType, partViewDef.name)
    );
    partViewContainer.setAttribute('ref', partViewId);
  }

  return flightMarkup;
}

// Main

// @todo: allow for a callback for user-defined Markup DOM processing
// @todo: allow for a callback for user-defined Display DOM processing

function initDisplayMarkup(initParameters, flightMarkup) {

  const preprocessingFunctions = [
    prepareDisplayMarkup,
    prepareDisplayMarkupForParts,
    prepareDisplayMarkupForPlaces
  ];

  return preprocessingFunctions.reduce(
    (displayMarkup, preprocessingFunction) => preprocessingFunction(initParameters, displayMarkup),
    flightMarkup
  );
}

export { initDisplayMarkup }