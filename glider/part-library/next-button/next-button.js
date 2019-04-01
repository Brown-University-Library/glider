/*

  This Part presents a play/advance button that starts the presentation 
  and advances the seq Phase specified in @phaseId.

*/

let part = {
  template: `<div><slot></slot></div>`,
  // props: ['phase_id'],
  sharedData: function() {
    return {
      currSlide: -1
    }
  },
  data: function() {
    return {
      playing: false 
    }
  }
}

// PART VIEWS

let partView_button = {
  partviewName: 'defaultView',
  props: ['phase_id'],
  template: `
    <button v-on:click="advance">
      next ▶
    </button>`,
  methods: {
    
    // THIS WILL ONLY BE RUN BY INITIALIZOR
    // WHEN HITTING THE 'RUN' BUTTON
    
    makeGliderRun: function() {
      this.currSlide = -1;
      let thisPartView = this;
      window.setTimeout(function() { 
        // alert('yes: ' + thisPartView.currSlide);
        // thisPartView.currSlide = 0 
      }, 1000);
    },
    
    advance: function() { 
      console.log('HIT');
      this.currSlide++
    }
  },
  watch: {
    currSlide: function (newVal, oldVal) {
      
      console.log(`currSlide changed from ${oldVal} to ${newVal}`);

      if (newVal !== -1) {
        
        console.log('RUN **********************');
        
        // Some information for debugging
        
        if (! this.$root.app.isInitializingInstance) {
          if (window.glider.isRunning) { 
            console.log('not initiator - already running');
          } else {
            console.log('not initiator - not running');
          }
        } else {
          if (window.glider.isRunning) { 
            console.log('initiator - already running');
          } else {
            console.log('initiator - not running');
          }
        }
        
        if (window.glider.isRunning) {
          console.log('ADVANCING -- BLAH BLAH BLAH');
          window.glider.phases[this.phase_id].forceNext();
        }
      }
      
      
      /*
      if (newVal === -1 && this.$root.app.isInitializingInstance) {
        console.log('GO');
      } else {
        console.log('MAKE ME GO');
        this.currSlide++;
        // this.currSlide = -1; 
      } */
      
      /*
      if (newVal === -1) {
        alert('STARTING');
        this.currSlide = -1;
      } else {
        //alert('ADVANCING TO ' + newVal);
        window.glider.phases[this.phase_id].forceNext();
      } */
    }
  }
}

// WRAP IT ALL UP AND EXPORT

let views = [partView_button];

export { part, views }
