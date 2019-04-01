
// _SUPER PART
// This is the base functionality that all parts share

/* TODO: NOT SURE if the Part needs to know its ID / PartID */

let part = {
  
  data: function () {
    return {
      _isActive: false
    }
  },
  
  props: ['id'],
  
  created: function() {
    // this.$root.parts[this.id] = this; // TODO: this may not be necessary
    this.$root.app.addPartInstanceToRegistry(this);
    this.makeInactive();
  },
  
  methods: {
    makeActive: function() { 
      console.log(`PART ${this.id} IS TURNING ON`);
      this._isActive = true;
    },
    makeInactive: function() { 
      console.log(`PART ${this.id} IS TURNING OFF`);
      this._isActive = false;
    }
  }
}

// _SUPER PART VIEW

let partView = {

  data() {
    return {
      _isActive: false,
      // id: undefined, // Needs to know ID for PartView-Part lookup
      red: 'This is from _Super PV edition'
    }
  },
  
  props: ['id', 'is_also', 'part_id'],
  
  // Create the Part if there is @isAlso
  // (if PartView and Part are on the same element)
  
  mounted: function() {
    
    let isAlso = this.is_also;
    
    this.$root.partviews[this.id] = this;
    
    this.$root.app.addPartInstanceToRegistry(this);
    this.makeInactive();
    
    if (isAlso) {

      console.log('PART AND PART VIEW ON SAME ELEMENT:');
      console.log(`Is also value: ${isAlso}`);
      console.log('AND APP IS');
      console.log(this.$root.app);
      
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
      
      console.log(`PROPS DATA FOR ${this.id}`);
      console.log(propsData2);
      
      let partComponent = new PartComponentClass({
        propsData: { id: partId }
      });
      
      partComponent.$mount(); // manually start the mounting of an unmounted Vue instance.
      partComponent.makeInactive();
      
      console.log(`And the new Part is:`);
      console.log(partComponent);
      
      //this.$root.parts[partId] = partComponent;
      this.$root.app.addPartInstanceToRegistry(partComponent);
    }
  },
  
  methods: {
    makeActive: function() { 
      console.log(`PART VIEW ${this.id} IS TURNING ON`);
      this._isActive = true;
      this.$el.classList.add('part-active');
      this.$el.classList.remove('part-inactive');
    },
    makeInactive: function() { 
      console.log(`PART VIEW ${this.id} IS TURNING OFF`);
      this._isActive = false;
      this.$el.classList.remove('part-active');
      this.$el.classList.add('part-inactive');
    }
  }
}

// WRAP IT ALL UP AND EXPORT

let views = [partView];

export { part, views }
