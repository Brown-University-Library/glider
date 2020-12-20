
import { PARSING_CONSTANTS } from '../../../system-settings.js';
import { LOG } from '../../../misc/logger.js';

// _SUPER PART
// This is the base functionality that all parts share
// Only really handles shared store

// @todo: NOT SURE if the Part needs to know its ID / PartID

let part = {
  
  data: function () {
    return {
      gliderState: PARSING_CONSTANTS.PHASE.STATE.WAITING,
      suspendWatch: {} // If set, disables the watcher once
                       //  Used to avoid update feedback loops with store
    }
  },
  
  props: ['id'],
  
  created: function() {
    // this.$root.parts[this.id] = this; // @todo this may not be necessary
    this.$root.app.addPartInstanceToRegistry(this);
    this.setGliderState(PARSING_CONSTANTS.PHASE.STATE.WAITING);
  }, 
  
  methods: {

    // Methods for making a Part active/inactive
    //  (from Phases)

    setGliderState: function(state) {
      if (PARSING_CONSTANTS.PHASE.STATE[state] 
          && this.gliderState !== state) {
        LOG([`AT ${Date.now()} IN PART#${this.id}.setGliderState CHANGING STATE TO #${state}`, this]);
        this.gliderState = state;
        // @todo Change class name? (maybe only on the PV ...)
      }
    }, /*
    makeActive: function() { 
      LOG(`PART ${this.id} IS TURNING ON`);
      this._isActive = true;
    },
    makeInactive: function() { 
      LOG(`PART ${this.id} IS TURNING OFF`);
      this._isActive = false;
    },

    // Data sync methods

    setWithoutWatch: function(varName, val) {
      this.suspendWatch[varName] = true;
      this[varName] = val; // This will trigger the watch callback
    },
    watchNotSuspended: function(varName) {
      if (this.suspendWatch[varName]) {
        this.suspendWatch[varName] = false;
        return false;
      } else {
        return true;
      }
    }
  }
}

// _SUPER PART VIEW

let partView = {

  data() {
    return {
      _isActive: false, // @todo does this conflict with Vue _isActive?
      suspendWatch: {} // suspend variable's watchers for updates from store
    }
  },
  
  // Glider-specific attributes go here

  props: [
    'id', 
    PARSING_CONSTANTS.PART.PART_ID_ATT_NAME, // @todo: is this necessary?
    PARSING_CONSTANTS.PLACE.ROLE_ATT_NAME,
    PARSING_CONSTANTS.PLACE.REGION_ATT_NAME,
    PARSING_CONSTANTS.PLACE.IS_HERE_ATT_NAME
  ],
  
  // Create the Part if there is @isAlso
  // (if PartView and Part are on the same element)
  
  mounted: function() {    
    this.$root.app.addPartInstanceToRegistry(this); // @todo is this necessary?
    this.setGliderState(PARSING_CONSTANTS.PHASE.STATE.WAITING);
    // this.makeInactive();
  },
  
  // Default behaviour for making PartView active/inactive:
  //   Adding/removing classname

  methods: {

    setGliderState: function(state) {
      if (PARSING_CONSTANTS.PHASE.STATE[state] 
          && this.gliderState !== state) {
        LOG(`AT ${Date.now()} IN PARTVIEW#${this.id}.setGliderState CHANGING STATE TO #${state}`);
        const oldState = this.gliderState,
              classList = this.$el.classList;
        this.gliderState = state;
        // @todo Change class name?
        // LOG(['CLASSLIST', this.$el.classList]);
        classList.remove(PARSING_CONSTANTS.PART.STATE_CLASSNAME[oldState]);
        classList.add(PARSING_CONSTANTS.PART.STATE_CLASSNAME[state]);
      }
    }, /*
    makeActive: function() { 
      LOG(`PART VIEW ${this.id} IS TURNING ON`);
      this._isActive = true;
      this.$el.classList.add(PARSING_CONSTANTS.PART.ACTIVE_CLASSNAME);
      this.$el.classList.remove(PARSING_CONSTANTS.PART.INACTIVE_CLASSNAME);
    },
    makeInactive: function() { 
      LOG(`PART VIEW ${this.id} IS TURNING OFF`);
      this._isActive = false;
      this.$el.classList.remove(PARSING_CONSTANTS.PART.ACTIVE_CLASSNAME);
      this.$el.classList.add(PARSING_CONSTANTS.PART.INACTIVE_CLASSNAME);
    },

    // @todo this should probably be moved to the markup (via pre-processing)
    //       rather than be done through a method after. Classes could be
    //       set beforehand

    setPlace: function({ placeCssClasses, isHere }) {

      // Add class for place

      if (placeCssClasses) {
        placeCssClasses.forEach(
          cssClass => this.$el.classList.add(cssClass)
        );
      }

      // Add class for here or not-here

      this.$el.classList.add(
        (isHere === true)
          ? PARSING_CONSTANTS.PART.VIEW_HERE_CLASSNAME
          : PARSING_CONSTANTS.PART.VIEW_NOT_HERE_CLASSNAME
      );

      // Update isHere instance property

      this._isHere = (isHere === true);
    },
    setWithoutWatch: function(varName, val) {
      this.suspendWatch[varName] = true;
      this[varName] = val; // This will trigger the watch callback
    },
    suspendWatchFor: function(varName) { // @todo: defunct?
      this.suspendWatch[varName] = true;
    },
    watchNotSuspended: function(varName) {
      if (this.suspendWatch[varName]) {
        this.suspendWatch[varName] = false;
        return false;
      } else {
        return true;
      }
    }
  }
}

// WRAP IT ALL UP AND EXPORT

let views = [ partView ];

export { part, views }
