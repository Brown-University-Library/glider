

  /* 

  CONTENTS

  - Class definitions:
    - Phase
    - Phase_noChildren
    - Phase_withChildren
      - Phase_par
      - Phase_seq
  - Phase_manager (TODO -- will handle next/pause/play/etc)

  STILL LEFT TODO:

  - RepeatCount implementation
  - Goto/next/prev implementation
  - Play/Pause

  PHASE CONSTRUCTOR OPTIONS OBJECT PROPERTIES:

  - id
  - app
  - delay
  - duration
  - ... more to come? RepeatCount, etc. ...


  */

  // Classes


/* 
  Phase.states = { 
    idle: 1,      // Unactivated and waiting (possible due to a delayed start)
    running: 2,   // Active and running
    complete: 3   // Completed being active
  }; */

class Phase {

  constructor(options) {

    const MILLISECONDS_PER_SECOND = 1000;
    
    this.id       = (options.id === undefined) ? this.generateId() : options.id;
    this.app      = options.app;
    this.delay    = (typeof options.delay === 'number') ? options.delay  * MILLISECONDS_PER_SECOND : 0;
    this.duration = (typeof options.duration === 'number') ? options.duration * MILLISECONDS_PER_SECOND : Infinity;

    this.currentState = 'idle';
    this.timer = null;
    
    this.xxxComplete = function () {} // TODO: trying this out
  }

  generateId() {
    return '_rand_' + Math.floor(Math.random() * 1000);
  }

  // Given state s, if the Phase isn't already 
  //  in that state, change state to s
  //  (note: does not check for allowed/disallowed transitions)

  set state(s) {
    if (this.currentState !== s) this.currentState = s;
  }

  get isComplete() {
    return (this.currentState === 'complete')
  }
  
  get isRunning() {
    return (this.currentState === 'running') 
  }

  // Change state to complete and notify App

  complete(onComplete) {
    this.state = 'complete';
    this.notifyInactive();
    this.clearTimer();
    
    // TODO: revisit this -- should onComplete be part of 
    //  object state?
    
    if (typeof onComplete === 'function') {
      onComplete()
    } else {
      this.xxxComplete(); 
    }
  }

  // Change state to running and notify App

  startRunning() {
    this.state = 'running';
    this.notifyActive();
  }

  // Notifications to App
  // Note that active/inactive are messages to App,
  //  but are not the same as the Phase states
  //  of idle/running/complete

  notifyActive() {
    this.app.phaseActive(this);
  }

  notifyInactive() {
    this.app.phaseInactive(this);
  }

  // Schedule a full run -- 
  //  delay, then afterDelay(), then duration, then afterDuration()

  scheduleRun(stuffToDo) {

    stuffToDo = Object.assign({
      afterDelay: () => {},
      afterDuration: () => {} 
    }, stuffToDo);

    const thisPhase = this;

    // TODO: No change of state?
    
    const afterDuration = function() {
      thisPhase.forceComplete();
      if (stuffToDo.afterDuration !== undefined) {
        stuffToDo.afterDuration();
      }
    }

    // After the delay: do stuff; schedule what to do after the duration
    // TODO: no change of state?
    
    const afterDelay = function () {
      stuffToDo.afterDelay();
      if (thisPhase.duration < Number.POSITIVE_INFINITY) {
        thisPhase.waitAndCall(thisPhase.duration, afterDuration);
      }
    };

    this.state = 'idle';
    this.waitAndCall(this.delay, afterDelay);
  }

  // Schedule a future function call

  waitAndCall(timeInMillieconds, aFunction) {
    this.timer = window.setTimeout(aFunction, timeInMillieconds);
  }

  // Clears currently running timer

  clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // TEMP - this is for diagnostics only

  get json() {
    return {
      id: this.id,
      type: this.constructor.name,
      delay: this.delay,
      duration: this.duration,
      children: this.childPhases !== undefined ? this.childPhases.map(child => child.json) : null
    }
  }
}

// This is the "leaf" object -- does not contain
//  any children (it may not be necessary)

class Phase_noChildren extends Phase {

  constructor(options) {
    super(options);
  }

  forceComplete() {
    this.complete();
  }

  get isContainer() { return false }

  // Main run routine
  // Schedule to run after delay and call
  //  onComplete after duration

  run(onComplete) {

    let thisPhase = this;

    // KLUDGE
    
    this.xxxComplete = onComplete;
    
    let callAfterDelay = function () {
      thisPhase.startRunning();
    }

    this.scheduleRun({
      afterDelay: callAfterDelay,
      afterDuration: onComplete
    });
  }
}

// TimeContainer abstract class

class Phase_withChildren extends Phase {

  constructor(options) {
    super(options);
    this.childPhases = [];
  }

  get isContainer() { return true }

  addChild(childPhase) {
    childPhase.parentPhase = this;
    childPhase.app = this.app;
    this.childPhases.push(childPhase);
  }

  forceChildrenToComplete() {
    this.childPhases.forEach(childPhase => childPhase.forceComplete());
  }

  forceComplete() {
    this.forceChildrenToComplete();
    this.complete();
  }
}

// Parallel TimeContainer

class Phase_par extends Phase_withChildren {

  constructor(options) {      
    super(options);
  }

  // Check if all the child phases have completed (boolean)
  // TODO: this may not be necessary

  get allChildrenComplete() {
    return this.childPhases.every(childPhase => childPhase.isComplete)
  }

  // Start all child phases running

  runAllChildren(onChildComplete) {
    this.childPhases.forEach(childPhase => childPhase.run(onChildComplete));
  }

  // Generate a function that is called every time a child completes.
  // If all children are complete, transition this phase to complete

  getOnChildCompleteCallback(onThisPhaseComplete) {

    let thisPhase = this;

    let onChildCompleteCallback = function() {
      if (thisPhase.allChildrenComplete) {
        // COMMENTED OUT - when all children complete, then
        //  do nothing (for now)
        // onThisPhaseComplete();
      }
    }
    
    return onChildCompleteCallback;
  }

  // Main run routine

  run(onComplete) { 

    let thisPhase = this;

    // KLUDGE
    
    this.xxxComplete = onComplete;
    
    // Schedule to start running after delay

    let onChildComplete = this.getOnChildCompleteCallback(onComplete);

    let callAfterDelay = function () {
      thisPhase.startRunning();
      thisPhase.runAllChildren(onChildComplete); // Run children
    }

    this.scheduleRun({
      afterDelay: callAfterDelay,
      afterDuration: onComplete
    });
  }
}

// Sequence TimeContainer

class Phase_seq extends Phase_withChildren {

  constructor(options) { 
    super(options);
    this.currChildIndex = -1;
    this.onAllChildrenComplete_KLUDGE = function() {};
  }
  
  // Force advance to the next child
  // TODO: this is a kludge
  
  forceNext() {
    
    console.log('NEXT!!');
    console.log(this.isRunning);

    let nextChild = this.currChildIndex + 1;
    if (nextChild < this.childPhases.length && this.isRunning) {
      console.log(this.currChildIndex);
      this.childPhases[this.currChildIndex].forceComplete();
    }
  }

  // Start all child phases running
  // (recurse through children)

  runAllChildren(onLastChildComplete) {
    let firstChildIndex = 0;
    this.runChild(firstChildIndex, onLastChildComplete);
  }

  // notifyParentCallback is provided by parentPhase to let it 
  //  know when sequence is complete

  runChild(currChildPhaseIndex, onLastChildComplete) {

    let thisPhase = this,
      isLastChild = (this.childPhases.length === currChildPhaseIndex + 1),
      currentChild = this.childPhases[currChildPhaseIndex],
      onChildComplete;

    this.currChildIndex = currChildPhaseIndex;
    
    // If this is the last child Phase, 
    //  complete this Phase when the child is complete

    if (isLastChild) {
      onChildComplete = function () { 
        
        this.currChildIndex = -1;
        
        // COMMENTED OUT -- when children are complete is NOT when the phase completes
        //  (maybe - need to check SMIL)
        // thisPhase.complete();
        // onLastChildComplete();
      }
    } else { 

      // If this is not the last child Phase, 
      //  run the next child when this child Phase is complete

      onChildComplete = function () {
        // thisPhase.currChildIndex = currChildPhaseIndex + 1;
        thisPhase.runChild(currChildPhaseIndex + 1, onLastChildComplete);
      }
    }

    currentChild.run(onChildComplete);
  }

  // Main run routine

  run(onComplete) {

    let thisPhase = this;

    // KLUDGE
    
    this.xxxComplete = onComplete;
    
    // Schedule to start running after delay

    let callAfterDelay = function () {
      thisPhase.startRunning();
      thisPhase.runAllChildren(onComplete); // Run children
    }

    this.scheduleRun({
      afterDelay: callAfterDelay,
      afterDuration: onComplete
    });
  }
}

// Map @phase-type values to Classes

Phase.types = {
  par: Phase_par,
  parallel: Phase_par,
  seq: Phase_seq,
  sequence: Phase_seq,
  leaf: Phase_noChildren
}

// Phase factory

function phaseFactory(options) {
  if (Phase.types[options.type] !== undefined) {
    return new Phase.types[options.type](options);
  } else {
    console.warning(`Unrecognised Phase type ${options.type}!`);
  }
}

export { phaseFactory };
