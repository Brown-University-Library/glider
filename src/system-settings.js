
let PARSING_CONSTANTS = {

  FLIGHT_PLAN_ROOT_CLASSNAME: 'glider-root',
  FLIGHT_PLAN_SELECTOR: '.glider-root', // Is this used?
  DEFAULT_FLIGHT_ID: 'f0000',
  DISPLAY_ROOT_CLASSNAME: 'glider-display',
  DISPLAY_ROOT_ELEM: 'div',

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
    VIEW_UNDEF: 'no-view-defined',
    VIEW_HERE_CLASSNAME: 'place-here',
    VIEW_NOT_HERE_CLASSNAME: 'place-not-here'
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
    ROLE_REGION_DELIMITER: '-', // @todo: We define this but don't use it!
    DEFAULT_PLACE_NAME: 'defaultPlace',
    DEFAULT_PLACE_TYPE: 'bootstrapplace', // @todo: more generic?
    DEFAULT_PLACE_OPTIONS: { asetting: true },
    DEFAULT_REGION_NAME: 'defaultRegion',
    BODY_ELEM_HERE_CLASSNAME_PREFIX: 'place-here-',
    TYPE_MARKUP_NAMES: { // keys are the name in the markup; values are the class name
      bootstrapplace: 'BootstrapPlace',
      fixedgridplace: 'FixedGridPlace' // @todo: add a default place here (instead of above)?
    }
  },

  STYLE: {
    ELEM_ID: 'glider-style',
    HREF: '/src/style/glider.css'
  }
};

// ID and Classname generators

PARSING_CONSTANTS.PART.GET_CSS_CLASS = (partName, partViewName) => {
  return `${PARSING_CONSTANTS.PART.CLASSNAME_PREFIX}${partName}` 
    + (partViewName 
       ? `${PARSING_CONSTANTS.PART.TYPE_VIEW_DELIMITER}${partViewName}` 
       : '');
};

// Vue component name generator

PARSING_CONSTANTS.PART.GET_VUE_COMPONENT_NAME = (partName, partViewName) => {

  let vueComponentName;

  if (partViewName) {
    vueComponentName = `${partName}-${partViewName}`;
  } else {
    vueComponentName = partName;
  }

  return vueComponentName;
};

export { PARSING_CONSTANTS };