
export const bootstrapplace = {

  id: 'bootstrapplace',

  stylesheet: {
    href: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
    integrity: 'sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u',
    crossorigin: 'anonymous'
  },

  css: `
    /* Styles for bootstrapplace */
  `,

  // No regions currently defined for bootstrapplace
  // (maybe to come ...?)

  addRegion: ({ roleName, regionName, settings }) => {

    const css = `

      /* Some CSS for a bootstrapplace instance, region ${regionName} */

      .${roleName}.${regionName} {
        /* nothing yet */
      }
    `;

    return { css }
  }
}

