
import { PARSING_CONSTANTS } from '../system-settings.js';

/*

  The initDisplayDom routine defined here creates an element
  and sticks a shadow DOM inside of it, adds a global stylesheet,
  and copies over the markup

*/

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
  
  // Append markup copy to shadow DOM

  displayDomRoot.appendChild(flightDisplayMarkup);

  return displayDomRoot;
}

// This initializes the DOM upon startup

function initDisplayDom(initParameters, displayMarkup) {

  // Add classname to body tag for this place
  // @todo Is this necessary?

  document.body.classList.add(
    `${PARSING_CONSTANTS.PLACE.BODY_ELEM_HERE_CLASSNAME_PREFIX}${initParameters.herePlace}`
  );

  // Create a shodow DOM node and copy the display markup over

  const displayDomRoot = initShadowDom(initParameters, displayMarkup);
  return displayDomRoot;
}

export { initDisplayDom }