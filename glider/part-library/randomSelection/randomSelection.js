
// A test Part
// Just display some values in different views



// MAIN PART

let part = {
  template: '<div class="generatedByRandomSelection"><slot></slot></div>',
  data() {
    return {
      testData: 'This is the value of testData'
    }
  }
}

// PART VIEWS

let randomSelectionDisplay = {
  partviewName: 'display',
  template: `<p>Random Selection Display content</p>`,
  data() {
    return {
      testData_A: 'This is a value in PartView A'
    }
  }
}

let randomSelectionController = {
  partviewName: 'controller',
  template: `<p>Random Selection Controller content</p>`,
  data() {
    return {
      testData_A: 'This is a value in PartView B'
    }
  }
}


// WRAP IT ALL UP AND EXPORT

let views = [randomSelectionDisplay, randomSelectionController];

export { part, views }
