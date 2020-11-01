
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
      _isActive: false,
      suspendWatch: {},
      // id: undefined, // Needs to know ID for PartView-Part lookup
      red: 'This is from _Super PV edition'
    }
  },
  
  props: ['id', 'part_id'],
  
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
    setPlace: function({ placeCssClasses }) {
      if (placeCssClasses) {
        placeCssClasses.forEach(
          cssClass => this.$el.classList.add(cssClass)
        );
      }
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
