
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

let partView_counterButton = {
  partviewName: 'controller',
  template: `
    <div style="color: black">
      <h1>I know how to code:</h1>
      <button type="button" class="btn btn-light btn-block" v-on:click="inc">HTML</button>
      <button type="button" class="btn btn-light btn-block" v-on:click="inc2">CSS</button>
      <button type="button" class="btn btn-light btn-block" v-on:click="inc3">Javascript</button>
    </div>
  `,
  
  methods: {
    inc: function() { 
      console.log('INCREMENT 1!');
      this.count++;
    },
    inc2: function() { this.count2++ },
    inc3: function() { this.count3++ }
  }
}

let partView_countDisplay = {
  partviewName: 'display',
  template: `
    <div>
      <p style="color: red">{{ '■'.repeat(count) }} HTML</p>
      <p style="color: yellow">{{ '■'.repeat(count2) }} CSS</p>
      <p style="color: blue">{{ '■'.repeat(count3) }} Javascript</p>
    </div>`
}

// WRAP IT ALL UP AND EXPORT

let views = [partView_counterButton, partView_countDisplay];

export { part, views }
