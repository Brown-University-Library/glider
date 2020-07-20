
import { PARSING_CONSTANTS } from '../system-settings.js';


function changeRootElem(domNode, newRootElemName) {

  let newDomNode = document.createElement(newRootElemName);

  // Copy the children

  while (domNode.firstChild) {
    newDomNode.appendChild(domNode.firstChild);
  }

  // Copy the attributes

  for(let attr of domNode.attributes) {
    newDomNode.setAttribute(attr.name, attr.value);
  }

  return newDomNode;
}

// Get shadow DOM node for display

function initDisplayDom(initParameters, flightDisplayMarkup, gliderStylesheetLink) {

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
  
  // Append markup copy and global CSS stylesheet to shadow DOM

  displayDomRoot.appendChild(flightDisplayMarkup);

  if (gliderStylesheetLink) {
    displayDomRoot.appendChild(gliderStylesheetLink);
  }

  return displayDomRoot;
}

// This initializes the DOM upon startup

function initDom(initParameters) {

  // Add default stylesheet unless overridden
  //  (user can override by providing a link with the reserved Glider ID)

  let gliderStylesheetLink;

  if (! document.querySelector(`#${PARSING_CONSTANTS.STYLE.ELEM_ID}`)) {
    gliderStylesheetLink = document.createElement('link');
    gliderStylesheetLink.setAttribute('id', PARSING_CONSTANTS.STYLE.ELEM_ID);
    gliderStylesheetLink.rel = 'stylesheet';
    gliderStylesheetLink.href = PARSING_CONSTANTS.STYLE.HREF;
  }

  // Add classname to body tag for this place

  document.body.classList.add(
    `${PARSING_CONSTANTS.PLACE.BODY_ELEM_HERE_CLASSNAME_PREFIX}${initParameters.herePlace}`
  );

  // @todo: allow for a callback for user-defined Markup DOM processing
  // @todo: allow for a callback for user-defined Display DOM processing

  // Create a shodow DOM node and copy the Flight markup over

  const flightMarkupCopy = initParameters.markupRoot.cloneNode(true),
        displayDomRoot = initDisplayDom(initParameters, flightMarkupCopy, gliderStylesheetLink);

  return displayDomRoot;
}

export { initDom }