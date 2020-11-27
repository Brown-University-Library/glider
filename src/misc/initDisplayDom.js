
import { PARSING_CONSTANTS } from '../system-settings.js';

/*

  The initDisplayDom routine defined here creates an element
  and sticks a shadow DOM inside of it, adds a global stylesheet,
  and copies over the markup

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

// Get shadow DOM node for display

function initShadowDom(initParameters, flightDisplayMarkup) {

  // Create and append display root element and add global Glider classname

  const displayDomHostElement = document.createElement(PARSING_CONSTANTS.DISPLAY_ROOT_ELEM);

  displayDomHostElement.classList.add(PARSING_CONSTANTS.DISPLAY_ROOT_CLASSNAME);

  initParameters.markupRoot.parentNode.insertBefore(
    displayDomHostElement, initParameters.markupRoot
  );

  // Create shadow DOM inside of root element

  const displayDomRoot = displayDomHostElement.attachShadow({ mode: 'open' });

  // Make sure that the markup copy doesn't have a <template> elem as root
  // (Vue doesn't like that)

  if (flightDisplayMarkup.tagName.toLowerCase() === 'template') {
    flightDisplayMarkup = changeRootElem(flightDisplayMarkup, 'div');
  }
  

  displayDomRoot.appendChild(flightDisplayMarkup);

  return displayDomRoot;
}

// This initializes the DOM upon startup


  // Add classname to body tag for this place

  document.body.classList.add(
    `${PARSING_CONSTANTS.PLACE.BODY_ELEM_HERE_CLASSNAME_PREFIX}${initParameters.herePlace}`
  );

  // @todo: allow for a callback for user-defined Markup DOM processing
  // @todo: allow for a callback for user-defined Display DOM processing

  // Create a shodow DOM node and copy the Flight markup over

  const flightMarkupCopy = initParameters.markupRoot.cloneNode(true),
  // Create a shodow DOM node and copy the display markup over

  const displayDomRoot = initShadowDom(initParameters, displayMarkup);
  return displayDomRoot;
}

export { initDisplayDom }