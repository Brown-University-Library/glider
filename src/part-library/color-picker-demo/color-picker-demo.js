

// A simple demonstration color picker.
// The controller can choose a color, which is reflected on the display

// PART

let part = {
  sharedData: function() {
    return {
      color: 'black'
    }
  }
}

// PART VIEWS

let partView_colorPicker = {
  partviewName: 'controller',
  template: `
    <div style="color: white; text-align: center">
      <h1>Choose</h1>
      <div style="font-size: 300%; padding: 10px; border: 1px solid white">
        <span v-on:click="setRed" style="color: red">
          █
        </span>
        <span v-on:click="setBlue" style="color: blue">
          █
        </span>
        <span v-on:click="setGreen" style="color: green">
          █
        </span>
        <span v-on:click="setOrange" style="color: orange">
          █
        </span>
      </div>
    </div>
  `,
  
  methods: {
    setRed: function() { 
      this.color = 'red';
    },
    setBlue: function() { 
      this.color = 'blue';
    },
    setGreen: function() { 
      this.color = 'green';
    },
    setOrange: function() { 
      this.color = 'orange';
    }
  }
}

let partView_colorDisplay = {
  partviewName: 'display',
  template: `
    <h1 class="display-1">
      {{ color }}
    </h1>`,
  watch: {
    color: function (color) {
      document.body.style.backgroundColor = color;
    }
  }
}

// WRAP IT ALL UP AND EXPORT

let views = [partView_colorPicker, partView_colorDisplay];

export { part, views }
