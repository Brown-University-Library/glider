

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
      <div v-bind:style="'background-color:' + this.color 
        + '; transition: background-color 1s; font-size: 300%; padding: 10px; border: 1px solid white'">
        <span v-on:click="setColor('red')" style="color: red">
          █
        </span>
        <span v-on:click="setColor('blue')" style="color: blue">
          █
        </span>
        <span v-on:click="setColor('green')" style="color: green">
          █
        </span>
        <span v-on:click="setColor('orange')" style="color: orange">
          █
        </span>
      </div>
    </div>
  `,
  
  methods: {
    setColor(c) {
      this.color = c;
    }
  }
}

let partView_colorDisplay = {
  partviewName: 'display',
  template: `
    <h1 class="display-1" 
        v-bind:style="'background-color:' + this.color 
          + '; transition: background-color 1s'">
      {{ color }}
    </h1>`
};

// WRAP IT ALL UP AND EXPORT

let views = [partView_colorPicker, partView_colorDisplay];

export { part, views }
