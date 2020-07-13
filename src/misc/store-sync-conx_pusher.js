import { LOG } from "../misc/logger.js";

// API FORMAT: http://cds.library.brown.edu/projects/glider/ws/?flight_id=1234&var_id=test&data=789

/*

  This is an interface to a Glider-oriented websocket (or whatever) interface.
  Needs to know about flight ID for namespacing purposes (different WS services
  may implement namespacing differently).
  
  This requires a script tag in the main HTML document to pull in the Pusher library
  and create the Pusher global object.
  
  The channel is named after the FlightID
  
  HOW TO SEND A WS MESSAGE BUT NOT HAVE IT RETURN TO THE SENDER
  https://pusher.com/docs/channels/server_api/excluding-event-recipients
  
  TODO: Update PHP page to add sender info
  
  (this seems like a good idea for the send method)
  
  LOOK INTO Client events at Pusher - doesn't require a server but requires authentication
  https://pusher.com/docs/channels/using_channels/events#triggering-client-events


  MAY WANT TO have two channels, one for state updates and one for Part method calls
    (whenever that gets implemented)

*/


function getConnection(options) {
  
  LOG(['PUSHER CONX OPTIONS', options]);

  const SEND_URL  = options.pusherUrl,
        FLIGHT_ID = options.flightId,
        pusher = new Pusher(options.pusherId),
        channelName = String(FLIGHT_ID),
        channel = pusher.subscribe(channelName),
        queue = []; // @todo implement this

  // Get the socketId, which is used to avoid message bounceback
  //  to the sender
  //  see: https://pusher.com/docs/channels/server_api/excluding-event-recipients
  
  let clientId = null;
  
  pusher.connection.bind('connected', function() {
    clientId = pusher.connection.socket_id;
  });
  
  // Set up logging function
  // @todo Can erase this in production?
  
  Pusher.log = function(message) {
    if (console && console.log) {
      console.log(message);
    }
  };

  // Bind onReceive callbacks

  Object.entries(options.onReceiveHandlers)
        .forEach(([messageName, handler]) => {
          channel.bind( messageName, 
                        dataString => handler(JSON.parse(dataString)));
        });

  // Bind onConnect callback

  channel.bind('pusher:subscription_succeeded', options.onConnectHandler);

  // Return connection API
  // (currently only has a send function)

  return {
    
    // Send to everyone else
    
    send: (messageName, data) => {

      const dataAsJson = encodeURI(JSON.stringify(data)),
            urlWithData = `${SEND_URL}?flight_id=${FLIGHT_ID}&var_id=${messageName}` +
                          `&data=${dataAsJson}&sender=${clientId}`;
      
      // Send data to the PHP file on the CDS server via HTTP
      // Forwards it to WebSockets server
      // "no-cors" because it's on another server, and we don't need a response
      // See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

      fetch(urlWithData, { mode: 'no-cors' }).then(function(response) {
        return response;
      });
    }     /*  ,
  
    // Set up an association with a message name (varId) and a function

    setOnReceive: (messageName, onReceive) => {

      // NOTE: In this case, there is one channel 
      //       named after the FLIGHT_ID (i.e. 1234)
      
      const onReceiveDecodeJSON = dataAsJson => {
        console.log(`DATA RECEIVED: ${dataAsJson}`);
        console.log('DATA RECEIVED AS JSON: ', JSON.parse(dataAsJson));
        
        return onReceive(JSON.parse(dataAsJson));
      };
      
      channel.bind(messageName, onReceiveDecodeJSON);
    },

    // Set onConnect

    setOnConnect: callback => {
      channel.bind('pusher:subscription_succeeded', callback);
      // pusher.connection.bind('connected', callback);
    } */
  }
}

export { getConnection }
