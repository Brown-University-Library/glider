
// A simple demonstration poll

// PART

let part = {
  template: `<div><slot></slot></div>`,
  sharedData: function() {
    return {
      count: 0,
      count2: 0,
      count3: 0
    }
  }
}

// PART VIEWS

// Poll form

const partView_counterButton = {
  partviewName: 'controller',
  template: `
    <div>
      <h1>Choose:</h1>
      <button type="button" class="btn btn-light btn-block" style="background: #f2e3c9" v-on:click="inc">Yellow</button>
      <button type="button" class="btn btn-light btn-block" style="background: #ec8f6a" v-on:click="inc2">Orange</button>
      <button type="button" class="btn btn-light btn-block" style="background: #ef4b4b" v-on:click="inc3">Red</button>
    </div>
  `,
  
  methods: {
    inc: function() { this.count++ },
    inc2: function() { this.count2++ },
    inc3: function() { this.count3++ }
  }
}

// Results

const partView_countDisplay = {
  partviewName: 'display',
  template: `
    <div>
      <h1>Poll Results</h1>
      <p style="color: #f2e3c9">{{ '■'.repeat(count) }} Yellow</p>
      <p style="color: #ec8f6a">{{ '■'.repeat(count2) }} Orange</p>
      <p style="color: #ef4b4b">{{ '■'.repeat(count3) }} Red</p>
    </div>`
};

// Poll reset button

const partView_reset = {
  partviewName: 'reset',
  template: `
    <div>
      <h1>Reset Poll</h1>
      <button type="button" class="btn btn-light btn-block" v-on:click="reset">
        Reset
      </button>
    </div>`,
  methods: {
    reset: function() {
      this.count = 0;
      this.count2 = 0;
      this.count3 = 0;
    }
  }
};

const views = [partView_counterButton, partView_reset, partView_countDisplay];

export { part, views }
