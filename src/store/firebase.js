
function init(options) {
  firebase.initializeApp(options); 
}

// Given a Flight ID, delete all the remote state
// NOTE: this is not good, as remove() is async
// This should be done elsewhere

// see https://stackoverflow.com/questions/45054550/firebase-database-how-to-perform-a-prefix-wildcard-query

function deleteFlightEntries(flightInstanceId) {
  console.log(`REMOVING REMOTE FLIGHT INSTANCE VARIABLES FROM _${flightInstanceId}`);
  firebase.database().ref().orderByKey().startAt(`_${flightInstanceId}`)
  .once('value', function(snapshot) {
    // firebase.database().ref().child(snapshot.key).remove();
    console.log(`> REMOVING ${snapshot.key}`); 
  });
}

// Set up listener: if a value changes on the shared store, 
//  then update the local

// Also: set up the variable in FB if doesn't currently exist
// TODO: should this be renamed initRemotePartVariables()?

function listenForChanges(partVarId, localStoreUpdateCallback, initValue) { 

  const remoteVarEntry = firebase.database().ref().child(partVarId);
  
  // If var doesn't exist in FireBase, then initialize
  
  remoteVarEntry.once('value')
    .then(function(remoteVarEntryValue) {
    
      if (! remoteVarEntryValue.exists()) {
        console.log(`> INIT VAL: ${partVarId} = ${initValue}`);
        remoteVarEntry.set(initValue);
      }
    });
  
  // Assign listener for change
  
  remoteVarEntry.on('value', function(snapshot) {
    let remoteVarEntryValue = snapshot.val();
    console.log(`FIREBASE VARIABLE ${partVarId} CHANGED TO ${remoteVarEntryValue} --> updating local`);
    localStoreUpdateCallback(snapshot.val());
  }); 
};

// Get the values on the remote store for this flight instance

function getFlightInstanceStore() {

  var ref = firebase.database().ref();
  /*
  ref.once('value')
    .then(function(snapshot) {
      console.log('REMOTE STORE DUMP');
      console.log(snapshot.exportVal());
    }); */
  
  return ref.once('value'); // Return a Promise
}

// Update the value on the remote store

function setVal(partVarId, value) {
  console.log(`FIREBASE SET VALUE OF ${partVarId} TO ${value}`);
  if (firebase.database().ref().child(partVarId) !== value) {
    firebase.database().ref().child(partVarId).set(value);
  }
}

function getRemoteStore(initOptions) {
  
  init(initOptions);  
  
  /*
  return { // TEMP TURN OFF FB
    listenForChanges: function () {},
    set: function () {}
  } */
  
  return {
    listenForChanges: listenForChanges,
    set: setVal,
    getFlightState: getFlightInstanceStore(),
    deleteFlightEntries: deleteFlightEntries
  }
}

export { getRemoteStore };
