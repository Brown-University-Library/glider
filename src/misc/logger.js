
// Logger

/*

  LEVEL DEFINITIONS

  1 = The full monty
  2 = 
  3 = 
  4 = For devs
  5 = The very minimal for final users

*/

const LOG_LEVEL = 0, // USER SETTING
      DEFAULT_LOG_LEVEL = 1;

function logMessage(message, level, type) {
  if (typeof message === 'string') {
    console[type](`[GLIDER L${level}]: ${message}`);
  } else {
    console[type](message);
  }
}

function log(messages, level = DEFAULT_LOG_LEVEL, type = 'log') {

  if (level >= LOG_LEVEL) {
    const messagesArray = (Array.isArray(messages)) ? messages : [ messages ];
    messagesArray.forEach(message => logMessage(message, level, type));
  }
}

export { log as LOG }