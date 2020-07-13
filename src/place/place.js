
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';

// Place base class
// The mechanism for hiding / unhiding would go here

class Place {
  
  constructor (options) {
    this.id = options.id || `place-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this.isHere = options.isHere;
    this.displayDomRoot = options.displayDomRoot;
  }
  
  // Get the ID for this Place -- e.g. "place-dslwall"
  // THIS IS NOT USED -- erase?
  
  getCssPlaceId() {
    return PARSING_CONSTANTS.PLACE.CLASSNAME_PREFIX + this.id;
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
    
    if (this.doesNotExistInDom(elementId) && this.isHere) {
      
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
      
      this.appendStyleElementToDom(styleElement);
    }
  }
  
  // UTILITY: Add CSS code to the head as a <style>
  // Give the style element an ID
  
  addCss({ id, css }) {
    // Check if style w that ID already exists
    if (this.doesNotExistInDom(id)) {
      let styleElement = document.createElement('style');
      styleElement.setAttribute('id', id);
      styleElement.appendChild(document.createTextNode(css));
      this.appendStyleElementToDom(styleElement);
    }
  }

  appendStyleElementToDom(styleElement) {
    this.displayDomRoot.appendChild(styleElement);
  }

  doesNotExistInDom(elementId) {
    return (this.displayDomRoot.getElementById(elementId) === null)
  }
  // places[placeId].assignPartViewToRegion(placeRegionId, parts[partId]);
  assignPartViewToRegion(selector, partView) {

    // Add 'here' classname

    partView.$el.classList.add(
      this.isHere ? PARSING_CONSTANTS.PART.VIEW_HERE_CLASSNAME 
                  : PARSING_CONSTANTS.PART.VIEW_NOT_HERE_CLASSNAME );

    // Create new region

    return this.assignPartViewToRegion2(selector, partView);
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
      rowHeight: parseInt(options.rowheight) || 1080, 
      columnWidth: parseInt(options.columnwidth) || 1920
    };
    
    this.loadGlobalCSS();
  }
  
  loadGlobalCSS() {
    
    let defaultRegionSelector = PARSING_CONSTANTS.PLACE.DEFAULT_REGION_NAME;

    super.addCss({
      id: 'place-fixedgrid-global',
      css: `
        .placetype-fixedgrid, .placetype-fixedgrid-${defaultRegionSelector} {
          width: ${this.options.columnWidth * this.options.columns}px;
          height: ${this.options.rowHeight * this.options.rows}px;
          position: absolute;
          top: 0;
          left: 0;
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

class FixedGridPlaceRegion {
  
  constructor(selector, partView, parentPlace) {
    
    // super(); // @todo: Is there any reason to make this a subclass of Place?
    
    this.parentPlace = parentPlace;
    
    if (selector !== undefined) { // @todo Resolve 'default'

      // Extract Region properties out of rcwh selector
      // @todo: this should extract rcwh, crwh, rc, etc.

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
              position: fixed;
              box-sizing: border-box;
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
    
    // @todo: rather than accessing $el directly, there should be a 
    //        method partView.addClass

    partView.$el.classList.add(`place-fixedgrid-${selector}`);
    partView.$el.classList.add(`placetype-fixedgrid`); // TODO: this should be default behavior for all Places
    partView.$el.classList.add(`place-${parentPlace.id}`);
    
    // @todo: let Part know that it's in a Place, in case it needs to do something with 
    //  that information (maybe via VuEx)
    // @todo: let Part know if it's inRole or not (maybe via VuEx)
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
  }
}

class BootstrapPlaceRegion {
  constructor(selector, partView, parentPlace) {
    // @todo: selector currently unused -- mapped to Bootstrap columns?
    parentPlace.loadBootstrap();
    this.classNames = [`place-${parentPlace.id}`, `place-${parentPlace.id}-${selector}`];
  }
}

// @todo: add a completely generic Place (which can be used as a DefaultPlace)
//        also a Place that is user-defined (e.g. add CSS file X). This may be the
//        same as the generic place above

export { BootstrapPlace, FixedGridPlace }
