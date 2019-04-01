
/*

  For now, there are 2 hard-coded Place definitions: DSL-wall and DSL-table
  
  (Eventually, these should be user-defined rather than hard-coded)

  The Place registry is what's exported -- with the P4V data, these Places can be used to create Regions

*/


// Place base class
// The machanism for hiding / unhiding would go here

class Place {
  
  constructor (options) {
    this.id = options.id || (new Date()) + Math.floor(Math.random() * 10000);
    this.isHere = undefined;
  }
  
  // Get the ID for this Place -- e.g. "place-dslwall"
  
  getCssPlaceId() {
    return `place-${this.id}`; // TODO: No magic!
  }
  
  // UTILITY: Add a CSS stylesheet reference to the head as a <link>
  //  IFF it hasn't already been added, and the client is "here"
  //   (no point in loading it if it isn't here!)
  
  addCssStylesheet(options) {
    
    // options = { id, url, integrity, crossorigin }
    
    let elementId = options.id,
        styleSheetUrl = options.url,
        integrity = options.integrity,
        crossOrigin = options.crossorigin;
    
    if (document.getElementById(elementId) === null && this.isHere) {
      
      let styleElement = document.createElement('link');
      
      styleElement.setAttribute('id', elementId);
      styleElement.setAttribute('rel', 'stylesheet');
      styleElement.setAttribute('href', styleSheetUrl);
      
      if (integrity !== undefined) {
        styleElement.setAttribute('integrity', integrity);  
      }
      
      if (crossOrigin !== undefined) {
        styleElement.setAttribute('crossorigin', crossOrigin);
      }
      
      document.head.appendChild(styleElement);
    }
  }
  
  // UTILITY: Add CSS code to the head as a <style>
  // Give the style element an ID
  
  addCss(options) {
    // Check if style w that ID already exists
    if (document.getElementById(options.id) === null) {
      let styleElement = document.createElement('style');
      styleElement.setAttribute('id', options.id);
      styleElement.appendChild(document.createTextNode(options.css));
      document.head.appendChild(styleElement);
    }
  }
  
  set clientPlace(clientPlace) {
    this.isHere = (this.id === clientPlace);
  }
  
  assignPartViewToRegion(selector, partView) {
    partView.container.classList.add(this.isHere ? 'place-here' : 'place-not-here');
    this.assignPartViewToRegion2(selector, partView);
  }
}

// FixedGridPlace

/*

  Global CSS is only loaded when a Region is created

*/

class FixedGridPlace extends Place {
  
  constructor(options) {
    
    super(options);
    
    this.options = {
      rows: parseInt(options.rows) || 1,
      columns: parseInt(options.columns) || 1, 
      rowHeight: parseInt(options.rowHeight) || 1080, 
      columnWidth: parseInt(options.columnWidth) || 1920
    };
    
    this.loadGlobalCSS();
  }
  
  loadGlobalCSS() {
    
    let defaultRegionSelector = 'defaultRegion'; // TODO: NO MAGIC - This should be from the settings

    super.addCss({
      id: 'place-fixedgrid-global',
      css: `
        .placetype-fixedgrid, .placetype-fixedgrid-${defaultRegionSelector} {
          width: ${this.options.columnWidth * this.options.columns}px;
          height: ${this.options.rowHeight * this.options.rows}px;
        }`
    });
  }
  
  loadCSS(regionCSS) {
    this.loadGlobalCSS();
    super.loadCSS(regionCSS);
  }
  
  assignPartViewToRegion2(selector, partView) {
    console.log(`FixedGridPlace region ${selector} being assigned to Part`);
    return new FixedGridPlaceRegion(selector, partView, this);
  }
}

class FixedGridPlaceRegion { // Q: Is there any reason to make this a subclass of Place?
  
  constructor(selector, partView, parentPlace) {
    
    // super();
    
    this.parentPlace = parentPlace;
    
    if (selector !== undefined) {

      // Extract Region properties out of rcwh selector
      // TODO: this should extract rcwh, crwh, rc, etc.

      const parseSelectorRegEx = /^c(\d+)r(\d+)w(\d+)h(\d+)$/i;
      let parsedSelector = {};

      let matches = selector.match(parseSelectorRegEx);
      
      if (matches !== null) {
        
        [parsedSelector.column, parsedSelector.row, parsedSelector.width, parsedSelector.height] 
          = matches.slice(1,6).map(x => parseInt(x));

        // Add CSS as style tag in head

        parentPlace.addCss({
          id: `place-fixedgrid-${selector}`,
          css: `
            .place-fixedgrid-${selector} {
              position: absolute;
              width: ${parentPlace.options.columnWidth * parsedSelector.width}px;
              height: ${parentPlace.options.rowHeight * parsedSelector.height}px;
              left: ${parentPlace.options.columnWidth * (parsedSelector.column - 1)}px;
              top: ${parentPlace.options.rowHeight * (parsedSelector.row - 1)}px;
            }
          `
        });
      }
    } else {
      console.log('REGION UNDEFINED');
      // What happens if region is undefined? 
    }
    
    // Get the element associated with a Part
    //  and assign the Place class to it (both generic and specific)
    
    partView.container.classList.add(`place-fixedgrid-${selector}`);
    partView.container.classList.add(`placetype-fixedgrid`); // TODO: this should be default behavior for all Places
    partView.container.classList.add(`place-${parentPlace.id}`);
    
    // TODO: let Part know that it's in a Place, in case it needs to do something with 
    //  that information (maybe via VuEx)
    
    // TODO: let Part know if it's inRole or not (maybe via VuEx)
  }
}

// Bootstrap Place

class BootstrapPlace extends Place {
  
  constructor (options) {
    super(options);
  }
  
  loadBootstrap() {
    
    this.addCssStylesheet({
      id: 'place-bootstrap-global',
      url: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
      integrity: 'sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u',
      crossorigin: 'anonymous'
    });
    
    this.addCss({
      id: `place-bootstrap`,
      css: `
        body {
          padding: 5% 15%;
        }
      `
    });
  }
  
  assignPartViewToRegion2(selector, partView) {
    
    console.log(`Bootstrap region ${selector} being assigned to PartView`);
    console.log(partView);
    
    return new BootstrapPlaceRegion(selector, partView, this);    
    
    // TODO: Notify PartView that it's in a place 
    // (this probably will be via the VuEx store)
  }
}

class BootstrapPlaceRegion {
  
  constructor(selector, partView, parentPlace) {
    partView.container.classList.add(`placetype-bootstrap-${selector}`);
    // TODO: There must be a standard bootstrap class name??
    partView.container.classList.add(`place-${parentPlace.id}`);
    parentPlace.loadBootstrap();
  }
}

// This keeps track of all the place type constructors
// The keys are are lower case versions of the @type value
//  in the markup

const placeTypeConstructor = {
  bootstrapplace: BootstrapPlace,
  fixedgridplace: FixedGridPlace
}


function getPlaceRegistry(p4vData) {
  
  let placeRegistry = {};
  
  p4vData.placeDefs.forEach(placeDef => {
    placeRegistry[placeDef.id] = new placeTypeConstructor[placeDef.type.toLowerCase()](placeDef);
  });
  
  return placeRegistry;
}


// Place registry - this should be defined elsewhere, but is hard-coded for now
// TODO: maybe this should be an array -- the id and key are redundant
//  we need the ID as part of the constructor so that the instance knows about it
/*
export let placeRegistry = {
  'dslWall': new FixedGridPlace({ 
    id: 'dslWall',
    rows: 3, columns: 4, rowHeight: 1080, columnWidth: 1920 
  }),
  'wall': new FixedGridPlace({ 
    id: 'wall',
    rows: 3, columns: 4, rowHeight: 108, columnWidth: 192 
  }),
  'dslTable': new BootstrapPlace({ id: 'dslTable' }),
  'main': new BootstrapPlace({ id: 'main' }),
  'phone': new BootstrapPlace({ id: 'phone' }),
  'instructor': new BootstrapPlace({ id: 'instructor' }),
  'participant': new BootstrapPlace({ id: 'participant' })
};
*/

export { getPlaceRegistry }