
import { PARSING_CONSTANTS } from '../system-settings.js';

/*

  DATA-FROM-DOM FUNCTIONS

  These functions extract the information from the markup and
  return a data structure for further parsing.
  The idea is that if it ain't in the markup, it's not dealt with
  here.

  (Routines that look at the DOM and pull out the data as
  it relates to P4v definitions. This data is passed back to 
  the high-level parsing functions)

  OUTLINE

  - getPhaseDataFromDomElem()
  - getPartDataFromDomElem()
  - getPlaceDataFromDomElem()

  - getDataFromDomElem()

*/

// DATA-FROM-DOM FUNCTIONS: Phase

function getPhaseDataFromDomElem(domElem) {

  function getPhaseIdFromDomElem(domElem) {
    return domElem.getAttribute(PARSING_CONSTANTS.PHASE.ID_ATT_NAME);
  }

  function getPhaseTypeFromDomElem(domElem) {
    return domElem.getAttribute(PARSING_CONSTANTS.PHASE.TYPE_ATT_NAME);
  }

  function getDelayFromDomElem(domElem) {
    let delayAttValue = domElem.getAttribute(PARSING_CONSTANTS.PHASE.DELAY_ATT_NAME);
    return (delayAttValue !== null) ? normalizeTimeToMS(delayAttValue) : null;
  }

  function getDurationFromDomElem(domElem) {
    let durationAttValue = domElem.getAttribute(PARSING_CONSTANTS.PHASE.DURATION_ATT_NAME);
    return (durationAttValue !== null) ? normalizeTimeToMS(durationAttValue) : null;
  }

  // Given a duration as string, return a float normalized to milliseconds
  //  (currently only handles ms and s)

  function normalizeTimeToMS(timeString) {

    let msMatch = timeString.match(/^\s*([\d\.]+)\s*ms\s*$/i);
    if (msMatch !== null) 
      return parseFloat(msMatch[1]);

    let sMatch = timeString.match(/^\s*([\d\.]+)\s*s\s*$/i);
    if (sMatch !== null) 
      return parseFloat(sMatch[1]) * 1000;

    return parseFloat(timeString);
  }

  // Does this domElem have any ancestors that defined Phases?

  function elemHasNoPhaseDescendents(domElem) {
    let descendantPhases = domElem.querySelectorAll(
      PARSING_CONSTANTS.PHASE.PHASE_DESCENDANT_SELECTOR
    );
    
    return (descendantPhases.length === 0);
  }

  // Get Phase data from DOM

  let dur = getDurationFromDomElem(domElem),
      delay = getDelayFromDomElem(domElem),
      specifiedId = getPhaseIdFromDomElem(domElem),
      id = (specifiedId !== null) 
            ? specifiedId 
            : 'ph' + getIdFromDomPosition(domElem),
      phaseType = getPhaseTypeFromDomElem(domElem);

  // Compile data object

  let phaseData = { 
    id: id,
    hasId: (id !== null),
    duration: dur,
    hasDuration: (dur !== null),
    delay: delay,
    hasDelay: (delay !== null),
    hasNoPhaseDescendents: elemHasNoPhaseDescendents(domElem),
    type: phaseType,
    hasType: (phaseType !== null),
    isContainer: (phaseType === 'par' || phaseType === 'seq')
  };

  phaseData.definesNewPhase = (phaseData.hasDuration || phaseData.hasDelay || phaseData.hasType);

  console.log(`PHASE ${domElem.id}`, phaseData);

  return phaseData;
}

// DATA-FROM-DOM FUNCTIONS: Parts

function getPartDataFromDomElem(domElem) {
  
  // Routines for extracting PartView names from DOM

  function getPartTypeViewFromString(identifierString) {

    let partTypeViewData = {};

    let parsedTypeViewData = identifierString
      .replace(RegExp(`^${PARSING_CONSTANTS.PART.SELECTOR_PREFIX}`), '')
      .split(PARSING_CONSTANTS.PART.TYPE_VIEW_DELIMITER);

    if (parsedTypeViewData[0] !== undefined) {
      partTypeViewData.type = parsedTypeViewData[0];
    }

    if (parsedTypeViewData[1] !== undefined) {
      partTypeViewData.view = parsedTypeViewData[1];
    }
    
    return partTypeViewData;
  }

  function getPartTypeViewFromPartAttribute(domElem) {
    let attString = domElem.getAttribute(PARSING_CONSTANTS.PART.PART_ATT_NAME);

    return (attString !== null)
      ? getPartTypeViewFromString(attString)
      : {};
  }

  function getPartTypeViewFromPartTypeViewAttributes(domElem) {

    let partTypeViewData = {},
      partTypeAtt = domElem.getAttribute(PARSING_CONSTANTS.PART.TYPE_ATT_NAME),
      partViewAtt = domElem.getAttribute(PARSING_CONSTANTS.PART.VIEW_ATT_NAME);

    if (partTypeAtt !== null) {
      partTypeViewData.type = partTypeAtt;
    }
    
    if (partViewAtt !== null) {
      partTypeViewData.view = partViewAtt;
    }

    return partTypeViewData;
  }

  function getPartTypeViewFromClassname(domElem) {

    let partClassname = Array.from(domElem.classList).find(
      className => className.startsWith(PARSING_CONSTANTS.PART.CLASSNAME_PREFIX)
    );

    let partTypeViewData;

    if (partClassname !== undefined) {
      partTypeViewData = getPartTypeViewFromString(
        partClassname.slice(PARSING_CONSTANTS.PART.CLASSNAME_PREFIX.length)
      )
    } else {
      partTypeViewData = {}
    }

    return partTypeViewData;
  }

  // Returns a data structure { part: <PART TYPE NAME>, view: <VIEW_NAME> }
  
  function getPartTypeView(domElem) {
    return Object.assign({},
      getPartTypeViewFromClassname(domElem),
      getPartTypeViewFromPartAttribute(domElem),
      getPartTypeViewFromPartTypeViewAttributes(domElem)
    );
  }

  function getPartIdFromDomElem(domElem) {

    let id,
      plainId = domElem.getAttribute(PARSING_CONSTANTS.PART.ID_ATT_NAME),
      partId = domElem.getAttribute(PARSING_CONSTANTS.PART.PART_ID_ATT_NAME),
      partRefId = domElem.getAttribute(PARSING_CONSTANTS.PART.PART_REF_ATT_NAME);
    
    if (partId != null) {
      id = partId;
    } else if (plainId != null) {
      id = plainId.replace(/^#/, '');
    } else if (partRefId != null) {
      id = partRefId;
    } else {
      id = undefined;
    }

    return id;
  }

  // @todo: This is an (insecure) kludge -- see 
  //  getPartOptionsFromDomElem_TODO for the proper solution

  function getPartOptionsFromDomElem(domElem) {

    const optionsString = domElem.getAttribute(PARSING_CONSTANTS.PART.OPTIONS_ATT_NAME);

    let optionsData;

    if (optionsString !== null && optionsString !== '') {

      const BRACES = /^\s*\{|\}\s*$/g;

      const evalString = "(function() { return {" 
        + optionsString.replace(BRACES, '')
        + "} })()";

      optionsData = eval(evalString);
      
    } else {
      optionsData = {};
    }

    return optionsData;
  }


  // Attribute format is JSON (without the enclosing {  })
  // Pre-processing: 
  // 1. remove enclosing {  } if present
  // 2. add {  }
  // 3. add quotes around keys (if missing)
  //    (from https://gist.github.com/larruda/967110d74d98c1cd4ee1)


  // KEEP THIS FOR LATER - it's the better way
  // Currently it works EXCEPT that single quotes around values
  // don't parse in JSON -- e.g { a: 'b' } -- the single 
  //  quotes around 'b' have to be converted to "b"
  // It currently already handles single quotes around the key

  function getPartOptionsFromDomElem_TODO(domElem) {

    // Convert single quotes around object values to double quotes

    /* 
    
      The output is called OUT

        1. Look for " or ' -- keep copying to OUT until you find it
        2. IF you find a " then
          Grab all the following text to the next " (skipping over the ones with a preceding \)
          Push this text to OUT
          Go back to 1.
        3. IF you find a ' then
          Grab all the following text to the next ' (skipping the ones with a preceding \)
          Call this X
          Look within X for any " -- replace it with \"
          Wrap X with double quotes
          Push this to OUT
          Go back to 1.

    */

    function transformSingleQuotesToDouble(jsonString) {
      // TODO: code this up
      return jsonString;
    }

    // Remove curly brackets (if exist), then add them

    function wrapJsonInCurlyBrackets(jsonString) {

      let jsonStringNoBrackets = jsonString.replace(/^\s*\{|\}\s*$/g, ''),
        jsonStringWithBrackets = '{' + jsonStringNoBrackets + '}';

      return jsonStringWithBrackets;
    }

    // Make sure that object keys have double quotes around them
    // (required of JSON)

    function ensureQuotesAroundKeyNames(jsonString) {

      const SPACE = '\\s*',
        OPEN_BRACE = SPACE + '\{' + SPACE,
        // CLOSE_CURLY_BRACKET = SPACE + '\}' + SPACE,
        COMMA = SPACE + ',' + SPACE,
        QUOT = `["']`,
        KEY_TEXT = '[a-zA-Z0-9_\\-\\s]+',
        // KEY_TEXT = '[^\\2]+',
        COLON = ':';

      const keysThatNeedQuotesRegEx = new RegExp(
        `(${OPEN_BRACE}|${COMMA})(${QUOT}?)(${KEY_TEXT})(${QUOT}?)${COLON}`,
        'g'
      );

      return jsonString.replace(keysThatNeedQuotesRegEx, '$1"$3":');
    }

    let optionsString = domElem.getAttribute(PARSING_CONSTANTS.PART.OPTIONS_ATT_NAME);

    if (optionsString !== null) {
      
      // optionsString = '{' + optionsString + '}'; // Add {  }

      optionsString = wrapJsonInCurlyBrackets(optionsString);
      optionsString = ensureQuotesAroundKeyNames(optionsString);

      /*
      optionsString = optionsString.replace( // Enclose bare keywords with quotes
        keysThatNeedQuotesRegEx,
        //  /(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9]+)(['"])?:/g,
        '$1"$3":' );
      */
      optionsString = transformSingleQuotesToDouble(optionsString);

        LOG(optionsString);
      return JSON.parse(optionsString);
    } else return null;
  }

  // Get Part data from DOM
  // note: Cannot create a Part and PartView in the same element

  let id = getPartIdFromDomElem(domElem),
    partTypeView = getPartTypeView(domElem),
    options = getPartOptionsFromDomElem(domElem),
    partContainer = domElem,
    definesNewPartView = (partTypeView.view !== undefined),
    definesNewPart = (partTypeView.type !== undefined && ! definesNewPartView);

  return {
    type: partTypeView.type,
    view: partTypeView.view,
    id: id,
    hasId: (id !== undefined),
    options: options,
    container: partContainer,
    definesNewPart: definesNewPart,
    definesNewPartView: definesNewPartView
  }
}

// DATA-FROM-DOM FUNCTIONS: Places

function getPlaceDataFromDomElem(domElem) {

  // Given a string (e.g. place-red-green) return a 
  //  data structure (e.g. { role: 'red', region: 'green' })

  function getRoleRegionFromString(identifierString) {

    let roleRegionData = {};

    let parsedRoleRegion = identifierString
      .replace(RegExp(`^${PARSING_CONSTANTS.PLACE.SELECTOR_PREFIX}`), '')
      .split(PARSING_CONSTANTS.PLACE.ROLE_REGION_DELIMITER);

    if (parsedRoleRegion[0] !== undefined)
      roleRegionData.role = parsedRoleRegion[0];
      
    if (parsedRoleRegion[1] !== undefined)
      roleRegionData.region = parsedRoleRegion[1];

    return roleRegionData;
  }

  function getPlaceFromPlaceAttribute(domElem) {

    let attString = domElem.getAttribute(PARSING_CONSTANTS.PLACE.PLACE_ATT_NAME);

    return (attString !== null) 
      ? getRoleRegionFromString(attString) 
      : {};
  }

  function getPlaceFromRoleRegionAttributes(domElem) {

    let roleRegionData = {},
      roleAtt = domElem.getAttribute(PARSING_CONSTANTS.PLACE.ROLE_ATT_NAME),
      regionAtt = domElem.getAttribute(PARSING_CONSTANTS.PLACE.REGION_ATT_NAME);

    if (roleAtt !== null) 
      roleRegionData.role = roleAtt;
    if (regionAtt !== null) 
      roleRegionData.region = regionAtt;

    return roleRegionData;
  }

  function getPlaceFromClassname(domElem) {

    let placeClassname = Array.from(domElem.classList).find(
      className => className.startsWith(PARSING_CONSTANTS.PLACE.CLASSNAME_PREFIX)
    );

    let roleRegionData = (placeClassname !== undefined)
      ? getRoleRegionFromString(placeClassname)
      : {};

    return roleRegionData;
  }

  // Collect the { role: <str>, region: <str> } data structures
  //  from attributes and/or classnames and merge them in order of 
  //  precedence (from lowest to highest)

  let placeData = Object.assign( {},
    getPlaceFromClassname(domElem),
    getPlaceFromPlaceAttribute(domElem),
    getPlaceFromRoleRegionAttributes(domElem)
  );

  placeData.hasRole = (placeData.role !== undefined);
  placeData.hasRegion = (placeData.region !== undefined);
  placeData.hasPlace = placeData.hasRole || placeData.hasRegion;

  return placeData;
}

// Main interface

function getDataFromDomElem(domElem) {
  return {
    domNode: domElem,
    part:  getPartDataFromDomElem(domElem),
    place: getPlaceDataFromDomElem(domElem),
    phase: getPhaseDataFromDomElem(domElem)
  }
}

export { getDataFromDomElem }
