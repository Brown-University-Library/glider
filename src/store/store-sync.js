
import { getConnection } from './store-sync-conx_pusher.js';
import { LOG } from '../misc/logger.js';

/*

  This is the glue between the websocket service and the store.
  
  It registers with the local store and gets notified when there's a change, then
    asks the WS to send a message.
  It asks the WS to let it know when a message comes in and then makes sense of that message and 
    asks the store to update accordingly.
    
  QUESTION: if Part remote function calls ever happen, would that happen here, 
            or in another module?
*/

/*

  Function names:

  sendStoreSyncRequest
  onReceiveStoreSyncRequest
  sendStoreSync
  onReceiveStoreSync

  Message names:

  STORE_SYNC_REQUEST_MESSAGE_NAME
  STORE_SYNC_MESSAGE_NAME

*/

const STORE_SYNC_REQUEST_MESSAGE_NAME = 'getStoreState',
      STORE_SYNC_MESSAGE_NAME = 'setStoreState';

let connection, store;

// Generate an ID for messages

function getRequestId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000);
}

// This is called when a request comes in for a store sync

function onReceiveStoreSyncRequest(messageContent) {
  const { requestId } = messageContent,
        replyMessageContent = getStoreSyncMessageContent(requestId);
  connection.send(STORE_SYNC_MESSAGE_NAME, replyMessageContent);
  // @todo: remember the requestor
}

// This is called when a store state is received

function onReceiveStoreSync(messageContent) {
  
  const { state, timestamp, setBy, responseId } = messageContent;

  // @todo: could check for global permissions if the
  //        setBy is set.
  // Set each item in store

  LOG(['STATE: ', state]);

  for (let [itemId, itemData] of Object.entries(state)) {
    store.setItemFromSync(itemId, itemData);
  }
}

// Call this when the client wants to sync with the other clients
//  (e.g. during initialization)

function sendStoreSyncRequest() {

  const storeSyncRequestId = getRequestId(),
        messageContent = {
          requestId: storeSyncRequestId,
          sentBy: store.clientId,
          senderRole: 'FILL_THIS_IN'
        };

  connection.send(  STORE_SYNC_REQUEST_MESSAGE_NAME, 
                    messageContent);
}

// Get the content for sending a store sync message

function getStoreSyncMessageContent() {
  return {
    state: store.getState(),
    requestId: getRequestId(),
    sentBy: store.clientId
  };
}

// Call this when the client wants to push a sync

function sendStoreSync() {
  const messageContent = getStoreSyncMessageContent();
  LOG(['SEND MESSAGE', messageContent]);
  connection.send(STORE_SYNC_MESSAGE_NAME, messageContent);
}

// Store calls this when there's something to synchronize.
//   Gets called by store.setItemLocally(itemId, itemVal)
// @todo: why is this different from sendStoreSync()?

function localStore_sendStoreSync() {
  // @todo: there could be throttling here ...
  sendStoreSync();
}

// Main setup routine for synchronized stores between clients

function initConnection(initParameters, connectionConfig, localStore) {

  // Register callbacks with the store

  store = localStore;

  /* IS ALL THIS DEFUNCT?

  let onVarChangeFunc = ({itemId, itemVal, timestamp, setBy, store}) => {
    console.log('CHANGE!!!!!!');
    console.log(store);
    localStore_sendStoreSync({itemId, itemVal, timestamp, setBy, store});
  }; // @todo - fill this in
  store.onVarChange(onVarChangeFunc); */

  store.sync = localStore_sendStoreSync; // gets called by store.setItemLocally(itemId, itemVal)

  // Define message handlers

  const connectionHandlers = {
    onReceiveHandlers: {
      [STORE_SYNC_REQUEST_MESSAGE_NAME]: onReceiveStoreSyncRequest,
      [STORE_SYNC_MESSAGE_NAME]: onReceiveStoreSync
    },
    onConnectHandler: sendStoreSyncRequest
  }

  const connectionOptions = Object.assign(connectionHandlers, 
                                          connectionConfig,
                                          { flightId: initParameters.flightInstanceId });

  // Initialize a connection

  connection = getConnection(connectionOptions);

  return connection; // @todo: is a return value necessary?
}

export { initConnection }
