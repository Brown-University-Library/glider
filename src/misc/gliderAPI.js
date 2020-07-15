
// This is the global object that the user interacts with

export function getGliderAPI(options) {

  let gliderObject = {
    parts: options.parts,
    phases: options.phases,
    places: options.places,
  };

  // Only set these if in debug mode

  if (options.DEBUG) {
    gliderObject = Object.assign(gliderObject, {
      displayDomRoot: options.displayDomRoot,
      sharedStore: options.sharedStore,
      sharedStoreConn: options.sharedStoreConn
    });
  }

  return gliderObject;
}
