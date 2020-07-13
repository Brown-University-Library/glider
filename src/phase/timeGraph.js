
class TimeGraphNode {

  constructor(state) {
    this.state = state;
    this.subscribers = [];
  }

  get val() {
    return this.state;
  }

  get prettyVal() {

    if (this.val === undefined) {
      return 'unresolved';
    } else if (this.val === TimeGraphNode.INDEFINITE) {
      return 'indefinite';
    } else {
      return this.val.toString()
      .slice(-6)
      .replace(/(\d\d\d)$/g,'-$1');
    }
  }

  set val(state) {
    if (! this.isResolved) {
      this.state = state;
      this.broadcast(state);
    } else if (this.state == state) {
      this.broadcast(state);
    } else {
      console.error(`Trying to set TGNode to ${state} - already bound to ${this.val}`);
    }
  }

  get isResolved() {
    return (this.val !== undefined)
  }

  subscribe(fn) {

//  if (Array.isArray(fn)) {
//    return this.subscribeMany(fn);
//  }

    this.subscribers.push(fn);

    return () =>
      (this.subscribers = this.subscribers.filter(
        subscriber => subscriber !== fn
      ));
  }

  // Set callback if the timeNode resolves

  // set onResolve(doThis) {
  //  this.subscribe(doThis);
  // }

  broadcast(data) {
    this.subscribers.forEach(subscriber => subscriber(data));
    return data;
  }
}

TimeGraphNode.INDEFINITE = Number.POSITIVE_INFINITY;



// TimeNode factory

function getTimeGraphNode(phaseVarOrNumber) {
  if (phaseVarOrNumber instanceof TimeGraphNode) {
    return phaseVarOrNumber;
  } else if (typeof phaseVarOrNumber === 'number') {
    return new TimeGraphNode(phaseVarOrNumber);
  } else {
    return new TimeGraphNode();
  }
}

// Current time (wrapped in a timeGraph node)

function getNowNode() {
  return getTimeGraphNode((new Date()).valueOf());
}

// Get node representing distant future, or infinite duration

function getIndefiniteNode() {
  return getTimeGraphNode(Number.POSITIVE_INFINITY);
}

// Constraint functions - axiomatic

const Constraint = {};

Constraint.sum = function(a,b,c) {

  function resolveSum() {
    if (a.isResolved && b.isResolved && !c.isResolved) {
      c.val = a.val + b.val
    } else if (a.isResolved && !b.isResolved && c.isResolved) {
      b.val = c.val - a.val
    } else if (!a.isResolved && b.isResolved && c.isResolved) {
      a.val = c.val - b.val
    } else if (a.isResolved && b.isResolved && c.isResolved) {
      if (a.val + b.val !== c.val) {
        console.error(`SUM CONTRAINT ERROR: ${a.val} + ${b.val} != ${c.val}`);
      }
    }
  }

  a.subscribe(resolveSum);
  b.subscribe(resolveSum);
  c.subscribe(resolveSum);
  resolveSum();
}

Constraint.minOrMax = function(minOrMaxFunction,a,b,c) {

  function resolveMinOrMax() {
    if (a.isResolved && b.isResolved && !c.isResolved) {
      c.val = minOrMaxFunction(a.val, b.val);
    } else if (!a.isResolved && b.isResolved && c.isResolved && b.val !== c.val) {
      a.val = c.val;
    } else if (a.isResolved && !b.isResolved && c.isResolved && a.val !== c.val) {
      b.val = c.val;
    } else if (a.isResolved && b.isResolved && c.isResolved) {
      if (minOrMaxFunction(a.val, b.val) !== c.val) {
        console.error(`MIN/MAX CONSTRAINT ERROR: ${c.val} is not MIN/MAX of ${a.val} and ${b.val}`);
      }
    }
  }

  a.subscribe(resolveMinOrMax);
  b.subscribe(resolveMinOrMax);
  resolveMinOrMax();
}

// C is the lesser value of A and B

/*

MIN( zero value, anything) = zero value
MIN( non-zero value, non-zero value) = non-zero value
MIN( non-zero value, indefinite) = non-zero value
MIN( non-zero value, unresolved) = non-zero value
MIN( indefinite, unresolved) = indefinite

*/

Constraint.min = function(a,b,c) {
  Constraint.minOrMax(Math.min,a,b,c);
}

// C is the greater value of A and B

/*

MAX( numeric value A, numeric value B) = B if B > A, otherwise A
MAX( numeric value, indefinite) = indefinite
MAX( numeric value, unresolved) = unresolved
MAX( indefinite, unresolved) = unresolved

*/

Constraint.max = function(a,b,c) {
  Constraint.minOrMax(Math.max,a,b,c);
}

// Unify a with b

Constraint.equals = function(a,b) {

  function resolveEquals() {
    if (a.isResolved && !b.isResolved) {
      b.val = a.val
    } else if (!a.isResolved && b.isResolved) {
      a.val = b.val
    } else if (a.isResolved && b.isResolved) {
      if (a.val !== b.val) {
        console.error(`EQUALS CONSTRAINT ERROR: ${a.val} != ${b.val}`);
      }
    }
  }

  a.subscribe(resolveEquals);
  b.subscribe(resolveEquals);
  resolveEquals();
}

// Constraint functions built on axioms

// Given array of timeNodes, unify with the latest one

Constraint.max_all = function(timeNodes, latestTimeNode) {
  if (timeNodes.length === 1) {
    Constraint.equals(timeNodes[0], latestTimeNode);
  } else if (timeNodes.length === 2) { // Recursion boundary
    Constraint.max(timeNodes[0], timeNodes[1], latestTimeNode);
  } else {
    let currTimeNode = timeNodes[0],
        remainingTimeNodes = timeNodes.slice(1),
        interimMinMax = new TimeGraphNode();
    Constraint.max(interimMinMax, currTimeNode, latestTimeNode);
    Constraint.max_all(remainingTimeNodes, interimMinMax); // Recurse
  }
}

// Constraint tests (don't modify the TimeGraph, return boolean)

// Is the timeStamp later than timeNode1, and earlier than
//  timeNode2?

Constraint.test_isBetween = function(timeNode1, timeStamp, timeNode2) {
  return (timeStamp > timeNode1.val && timeStamp < timeNode2.val);
}

Constraint.test_isBefore = function(timeNode, timeStamp) {
  return (timeStamp < timeNode.val);
}

Constraint.test_isAfter = function(timeNode, timeStamp) {
  return (timeStamp > timeNode.val);
}


let TimeGraph = {
  getNode: getTimeGraphNode,
  getNowNode: getNowNode,
  getIndefiniteNode: getIndefiniteNode,
  areSimultaneous: Constraint.equals,
  isTheLater: Constraint.max,
  isTheLatest: Constraint.max_all,
  isTheEarlier: Constraint.min,
  separatedByDuration: Constraint.sum,
  test_isBetween: Constraint.test_isBetween,
  test_isBefore: Constraint.test_isBefore,
  test_isAfter: Constraint.test_isAfter,
  INDEFINITE: TimeGraphNode.INDEFINITE
}

export { TimeGraph };
