
// This is the global object that the user interacts with

export function getGliderAPI({
  initParameters,
  gliderApp, displayDomRoot,
  parts, places, phases,
  sharedStore, sharedStoreConn,
  DEBUG = false
}) {

  // Load data from initParameters

  const clientId = initParameters.clientId,
        flightId = initParameters.flightInstanceId,
        role = initParameters.herePlace;

  // Always a part of the API

  let gliderObject = {
    parts, places, phases, displayDomRoot,
    clientId, flightId, role
  };

  // Only set these if in debug mode

  if (DEBUG) {
    gliderObject = Object.assign(gliderObject, {
      sharedStore, sharedStoreConn, 
      app: gliderApp
    });
  }

  return gliderObject;
}
