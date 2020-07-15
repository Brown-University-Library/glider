
import { PARSING_CONSTANTS } from '../system-settings.js';
import { LOG } from '../misc/logger.js';

let sharedStore;  // Holds the single instance of the Store
const clientId = 'glider-client-' + getNow() + Math.floor(Math.random() * 1000);

// Get the timestamp for the current time

function getNow() {
  return Date.now();
}

// Main Shared Store class

class SharedStore {

  constructor(initParameters) {
    this.app = undefined, // initialized by GliderApp constructor
    this.state = {};
    this.clientId = clientId;
    this.clientRole = initParameters.herePlace,
    this.sync = () => {}; // This gets overridden by the initConnection routine
  }

  // Get an item OR if undefined, initialize it

  getInitItemData() {
    return {
      val: undefined,
      lastModified: -1,
      canBeWritten: true, // @todo: implement write control based on client role
      lastModifiedBy: null
    }
  }

  getOrInitItem(itemId) {
    let item = this.getItem(itemId);
    if (item === undefined) {
      item = this.getInitItemData();
      this.state[itemId] = item;
    }
    return item;
  }

  // Set an item's value
  // Returns true if the store was updated; false if not

  setItem(itemId, newItem) {

    if (!itemId) return false;

    newItem.lastModified = newItem.lastModified || getNow();
    newItem.lastModifiedBy = newItem.lastModifiedBy || this.clientId;

    const oldItem = this.getOrInitItem(itemId),
          hasWritePermission = oldItem.canBeWritten, // @todo: more here?
          updateIsFresher = (oldItem.lastModified < newItem.lastModified),
          valueChanged = (newItem.val !== oldItem.val);

    let storeUpdated;

    if (hasWritePermission && updateIsFresher) {

      // Update store value (if changed)

      if (valueChanged) {
        oldItem.val = newItem.val;
      }

      // Even if value doesn't change, update
      //  lastModified information

      oldItem.lastModified = newItem.lastModified;
      oldItem.lastModifiedBy = newItem.lastModifiedBy;

      storeUpdated = valueChanged;
    } else {
      storeUpdated = false;
    }

    return storeUpdated;
  }

  // Set an item's value from an external sync process
  //  (and therefore do not notify watchers)

  setItemFromSync(itemId, itemData) {

    // update store
    // @todo: check permissions on whether the sender can change val?

    const storeWasUpdated = this.setItem(itemId, itemData);
    
    // Update all Parts & PartViews (via App)

    if (storeWasUpdated || true) {
      this.app.updatePartVarFromStore(itemId, itemData.val);
    }
  }

  // Set an item's value internally (i.e. locally)

  setItemLocally(itemId, itemVal) {

    // Update store

    const storeWasUpdated = this.setItem(itemId, { val: itemVal });

    // Trigger sync

    if (storeWasUpdated) { this.sync() }
  }

  // Get item
  
  getItem(itemId) {
    return this.state[itemId];
  }

  // Do a full store dump

  getState() {
    return this.state;
  }
}

// SharedStore is a singleton

function getSharedStore(initParameters) {

  if (sharedStore === undefined) {
    sharedStore = new SharedStore(initParameters);
  }

  return sharedStore;
}

export { getSharedStore };
