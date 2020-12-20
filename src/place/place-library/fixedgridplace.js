
export const fixedgridplace = {

  id: 'fixedgridplace',

  stylesheet: {
    href: 'http://example.com/fixedgrid-style.css'
  },

  css: `
    /* Styles for fixedGridPlace */
    yes: no; 
    maybe: so;
  `,

  // Some default values

  columnWidth: 1920,
  rowHeight: 1080,
  rowCount: 3,
  columnCount: 4,

  // Region selectors are in the form r#c#h#w#
  //  (# = number, in any order)

  addRegion: ({ role, region, settings }) => {

    let css;

    if (region) {

      const geometry = Array.from(region.matchAll(/[crwh]\d+/ig))
      .reduce(
        (geoDims, x) => { 
          geoDims[x[0][0]] = parseInt(x[0][1]); 
          return geoDims; 
        }, 
        { r: 1, c: 1, w: 1, h: 1 } // Default values
      );

      css = `

        /* Some CSS for a fixedgridplace instance, region ${regionName} */

        .${roleName}.${regionName} {
          position: fixed;
          box-sizing: border-box;
          width: ${settings.columnWidth * geometry.w}px;
          height: ${settings.rowHeight * geometry.h}px;
          left: ${settings.columnWidth * (geometry.c - 1)}px;
          top: ${settings.rowHeight * (geometry.r - 1)}px;
        }
      `;
    } else {
      css = `/* Styles for FixedGridPlace defaultRegion */`;
    }

    return { css }
  }
}

