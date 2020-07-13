
import { PARSING_CONSTANTS } from '../../../system-settings.js';
import { LOG } from '../../../misc/logger.js';

// _SUPER PART
// This is the base functionality that all parts share

/* @todo: NOT SURE if the Part needs to know its ID / PartID */

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
    // this.$root.parts[this.id] = this; // TODO: this may not be necessary
    this.$root.app.addPartInstanceToRegistry(this);
    this.makeInactive();
  },
  
  // Default behaviour for making Part active/inactive

  methods: {
    makeActive: function() { 
      LOG(`PART ${this.id} IS TURNING ON`);
      this._isActive = true;
    },
    makeInactive: function() { 
      LOG(`PART ${this.id} IS TURNING OFF`);
      this._isActive = false;
    },
    setWithoutWatch: function(varName, val) {
      this.suspendWatch[varName] = true;
      this[varName] = val;
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
  
  props: ['id', 'is_also', 'part_id'],
  
  // Create the Part if there is @isAlso
  // (if PartView and Part are on the same element)
  
  mounted: function() {
    
    let isAlso = this.is_also;
    
    this.$root.app.addPartInstanceToRegistry(this);
    this.makeInactive();
    
    if (isAlso) {

      LOG('PART AND PART VIEW ON SAME ELEMENT:');
      LOG(`Is also value: ${isAlso}`);
      LOG('AND APP IS');
      LOG(this.$root.app);
      
      let otherComponentName = isAlso;
      let PartComponentClass = Vue.extend(window.wtf.components[otherComponentName]);
      let partId = this.part_id;
      
      // TODO: add association between PartView and (new) Part
      
      let propsData = this.$props;
      
      let partPropKeys = Object.keys(this.$props)
        .filter(
          attributeName => !['id','is_also', 'part_id'].includes(attributeName)
        );
      
      let propsData2 = partPropKeys.reduce((acc, key) => {
        let newPropsData = acc;
        newPropsData[key] = this.$props[key];
        return newPropsData;
      }, {});
      
      LOG(`PROPS DATA FOR ${this.id}`);
      LOG(propsData2);
      
      let partComponent = new PartComponentClass({
        propsData: { id: partId }
      });
      
      partComponent.$mount(); // manually start the mounting of an unmounted Vue instance.
      partComponent.makeInactive();
      
      LOG(`And the new Part is:`);
      LOG(partComponent);
      
      //this.$root.parts[partId] = partComponent;
      this.$root.app.addPartInstanceToRegistry(partComponent);
    }
  },
  
  // Default behaviour for making PartView active/inactive

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
      this[varName] = val;
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

let views = [partView];

export { part, views }
