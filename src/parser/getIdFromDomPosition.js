

// Simple hash function adapted from 
//  https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
// NOTE: Can return negative numbers; e.g. hash for 'strign' is -891986113

function getHash(string) {
  
  let hash = 0;
  
  string.split('').forEach(char => {
    hash = ((hash << 5) - hash) + char.charCodeAt();
    hash = hash & hash; // Convert to 32bit integer
  });
  
  return Math.abs(hash);
}

// Get a unique identifier based on the position of the element in the DOM tree.
// Good for auto-generating IDs for elements that will be the same across Clients
// (Currently not used)

function getIdFromDomPosition(domElement) {
  
  function makeId(domElement) {

    if (domElement === document.body) return ''; // boundary condition

    let previousSiblingCount = 0,
        currSibling = domElement;

    while (currSibling = currSibling.previousSibling) {
      previousSiblingCount++;
    }

    return previousSiblingCount + '.' + makeId(domElement.parentNode);
  }
  
  return getHash(makeId(domElement));
}

export { getIdFromDomPosition }