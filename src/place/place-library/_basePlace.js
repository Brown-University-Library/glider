
/* This place underlies all the others; it provides fallback (default) values */

export const baseplace = {

  id: 'baseplace',
  stylesheet: {
    href: '/src/style/glider.css'
  },
  css: `
    /* Global glider styles */
  `,
  addRegion: ({regionName, settings}) => {
    return { 
      css: '/* Some CSS for base place */' 
    }
  }
}

