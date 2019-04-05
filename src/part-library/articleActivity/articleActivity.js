
// MAIN PART

let part = {
  props: ['ben','sam'],
  template: `<div class="generatedByArticleActivity"><slot></slot></div>`,
  data() {
    return {
      testData: 'This is the value of testData'
    }
  }
}

// PART VIEWS

let partView_A = {
  partviewName: 'display',
  template: `<p>Article activity - display</p>`,
  data() {
    return {
      testData_A: 'This is a value in Article activity - display'
    }
  }
}

let partView_B = {
  partviewName: 'controller',
  template: `<p>Article activity - controller</p>`,
  data() {
    return {
      testData_A: 'This is a value in Article activity - display'
    }
  }
}


// WRAP IT ALL UP AND EXPORT

let views = [partView_A, partView_B];

export { part, views }
