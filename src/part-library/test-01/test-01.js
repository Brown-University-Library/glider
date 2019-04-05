
// A test Part
// Just display some values in different views



// MAIN PART

let part = {
  data() {
    return {
      testData: 'This is the value of testData'
    }
  }
}

// PART VIEWS

let partView_A = {
  partviewName: 'Test Part View A',
  template: `<p>Part View A</p>`,
  data() {
    return {
      testData_A: 'This is a value in PartView A'
    }
  }
}

let partView_B = {
  partviewName: 'Test Part View B',
  template: `<p>Part View B</p>`,
  data() {
    return {
      testData_A: 'This is a value in PartView B'
    }
  }
}


// WRAP IT ALL UP AND EXPORT

let views = [partView_A, partView_B];

export { part, views }
