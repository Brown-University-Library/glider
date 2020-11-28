
import { PARSING_CONSTANTS } from '../../../system-settings.js';
import { LOG } from '../../../misc/logger.js';

// _SUPER PART
// This is the base functionality that all parts share

// @todo: NOT SURE if the Part needs to know its ID / PartID

let part = {
  
  data: function () {
    return {
      _isActive: false,
      suspendWatch: {} // If set, disables the watcher once
                       //  Used to avoid update feedback loops with store
    }
  },
  
  props: ['id'],
  
  created: function() {
    // this.$root.parts[this.id] = this; // @todo this may not be necessary
    this.$root.app.addPartInstanceToRegistry(this);
    this.makeInactive();
  },
  
  methods: {

    // Methods for making a Part active/inactive
    //  (from Phases)

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
    this.makeInactive();
  },
  
  // Default behaviour for making PartView active/inactive:
  //   Adding/removing classname

  methods: {
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
