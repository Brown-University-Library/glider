
let PARSING_CONSTANTS = {

  FLIGHT_PLAN_SELECTOR: '.glider-root',

  PART: {
    ID_ATT_NAME: 'id',
    PART_ID_ATT_NAME: 'part-id',
    PART_REF_ATT_NAME: 'part-ref',
    PART_ATT_NAME: 'part',
    TYPE_ATT_NAME: 'part-type',
    VIEW_ATT_NAME: 'part-view',
    OPTIONS_ATT_NAME: 'part-options',
    SELECTOR_PREFIX: 'part-',
    CLASSNAME_PREFIX: 'part-',
    TYPE_VIEW_DELIMITER: '-',
    TYPE_CSS_CLASS_PATTERN: /^part-([^\-\s]+)$/,
    VIEW_CSS_CLASS_PATTERN: /^part-[^\-\s]+-([^\-\s]+)$/,
    DEFAULT_PART_NAME: 'identity',
    DEFAULT_VIEW_NAME: 'defaultView',
    VIEW_UNDEF: 'no-view-defined'
  },

  PHASE: {
    ID_ATT_NAME: 'id',
    TYPE_ATT_NAME: 'phase-type',
    TYPES: { PAR: 'par', SEQ: 'seq', LEAF: 'leaf' },
    DELAY_ATT_NAME: 'phase-begin',
    DURATION_ATT_NAME: 'phase-duration',
    PHASE_DESCENDANT_SELECTOR: '*[phase-type],*[phase-duration],*[phase-begin]'
  },

  PLACE: {
    ID_ATT_NAME: 'place',
    PLACE_ATT_NAME: 'place',
    ROLE_ATT_NAME: 'place-role',
    REGION_ATT_NAME: 'place-region',
    SELECTOR_PREFIX: 'place-',
    CLASSNAME_PREFIX: 'place-',
    ROLE_REGION_DELIMITER: '-', // We define this but don't use it!
    DEFAULT_REGION_NAME: 'defaultRegion'
  }
};

// ID and Classname generators

PARSING_CONSTANTS.PART.GET_CSS_CLASS = (partName, partViewName) => {
  return `${PARSING_CONSTANTS.PART.CLASSNAME_PREFIX}${partName}` 
    + (partViewName 
       ? `${PARSING_CONSTANTS.PART.TYPE_VIEW_DELIMITER}${partViewName}` 
       : '');
};

PARSING_CONSTANTS.PART.GET_VUE_COMPONENT_NAME = (partName, partViewName) => {
  return `${partName}-${partViewName}`;
};

export { PARSING_CONSTANTS };
