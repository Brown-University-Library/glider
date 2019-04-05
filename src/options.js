

// This gets the Glider options from the URL and from parameters passed
// Specifically, it gets the flight instanceId, herePlace and the Phase target

function getGliderOptions() {
  
  let hash = window.location.hash,
      initialize, jumpTarget;
  
  let [flightInstanceId, clientPlace, target] = hash.slice(2).split('/');

  if (target === 'main') {
    initialize = true;
    jumpTarget = null;
  } else {
    initialize = false;
    jumpTarget = target;
  }
  
  return {
    flightInstanceId: flightInstanceId || '0000', // NO MAGIC
    herePlace: clientPlace,
    nowPhase: jumpTarget,
    initialize: initialize
  }
}

export { getGliderOptions };
