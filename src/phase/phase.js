
import { clock } from './phase-clock.js';
import { TimeGraph } from './timeGraph.js';

/*

  TODO's

  Make sure new App scheme is working
  Need to notify App of begin/end times (for sharing)
  Has "FROZEN" state been implemented? (I think so)

  -----

  Phase creation: phases[phaseId] = phaseFactory(phaseData) -- where PhaseData is idrectly from the parser
  Then associate children w parents: parentPhase.addChild(childPhase)

  -----

  For time containers, freezing extends the state of all children that are active or frozen 
  at the end of the last instance of the time container simple duration. 
  
  The children are frozen as they appear at the end of the last instance of the time container 
  simple duration. 
  
  If a child element ends its active duration coincident to the end of the last instance of 
  its parent time container simple duration, the child element fill value determines whether 
  the child will be frozen after the end of the parent time container's last simple duration.

*/


// PHASE OBJECTS

class Phase {

  constructor(options) {

    this.id = options.id || `phase_${Math.floor(Math.random() * 10000)}`; // @todo: Isn't this set during the parsing?
    this.initOptions = options; // Store original instance settings
    this.time = {}; // Holds the TimeGraph nodes
    this.parentPhase;
    this.childPhases = [];

    this.freezeSetting = options.hold || false; // the original setting from the markup
                                                // @todo - move this to initOptions.canFreeze?
    this.canFreeze = this.freezeSetting;        // the actual behaviour 
                                                //  (may be overridden -- see Phase_seq)

    this.currentState = undefined;
  }

  // Pass TimeGraph initialization request up to Phase_controller
  
  requestTimeGraphInit() {
    if (this.parentPhase) {
      this.parentPhase.requestTimeGraphInit();
    } else {
      this.initializeTimeGraph();
    }
  }

  // Initialize TimeGraph
  //  Load up begin, dur, etc. with new TimeGraph node instances;
  //  Apply duration constraint
  // NOTE that all the subclasses (and subsubclasses) of Phase also have initializeTimeGraph()
  //  that call their respective super.initializeTimeGraph()
  //  While kind of cool, it's also a bit confusing.
  // @todo should Phase.initializeTimeGraph be renamed to avoid confusion?
  //  e.g. Phase.initializeTimeGraph_Phase(), Phase_nochildren.initializeTimeGraph_noChildren(), etc.?
  //  Only the bottom of the class hierachy has initializeTimeGraph()

  initializeTimeGraph() {

    const options = this.initOptions;

    // Initialize graph nodes

    this.time = {
      origin: TimeGraph.getNode(),
      beginDelay: TimeGraph.getNode(options.begin || 0),
      dur: TimeGraph.getNode(options.dur),
      beginTime: TimeGraph.getNode(),
      endTimeNoCrop: TimeGraph.getNode(),
      endTime: TimeGraph.getNode(),
      parentEndTime: this.hasParent ? this.parentPhase.endTime : TimeGraph.getIndefiniteNode()
    };

    // Constrain: origin, delay, beginTime, dur, endTimeNoCrop
    
    let time = this.time;

    TimeGraph.separatedByDuration(time.origin, time.beginDelay, time.beginTime);
    TimeGraph.separatedByDuration(time.beginTime, time.dur, time.endTimeNoCrop);

    // Set up callbacks to notify App 
    //  if begin/end times change
    // DEFUNCT: replaced by saveTimeGraphToStore()

    // this.beginTime.onResolve = () => this.app.phaseBeginTimeChange(this, this.beginTime.val);
    // this.endTime.onResolve   = () => this.app.phaseEndTimeChange(this, this.endTime.val);
  }

  // Set this node to be starting NOW

  start() {
    this.requestTimeGraphInit();
    this.origin = TimeGraph.getNowNode();
    this.saveTimeGraphToStore();
  }

  // Get app - recurse up to Phase_controller instance

  get app() {
    return (this.hasParent) ? this.parentPhase.app : undefined;
  }

  // Get Phase_controller

  get root() {
    return (this.hasParent) ? this.parentPhase.root : this;
  }

  // TimeGraph getters / setters

  get origin() {
    return this.time.origin;
  }

  set origin(timeGraphNode) {
    TimeGraph.areSimultaneous(timeGraphNode, this.time.origin);
  }

  get beginTime() {
    return this.time.beginTime;
  }

  // @todo - is there ever a time when a value (not a node) 
  //         is passed? This may be unnecessarily complicated

  set beginTime(timeGraphNodeOrValue) {
    if (typeof timeGraphNodeOrValue === 'number') {
      this.time.beginTime.val = timeGraphNodeOrValue;
    } else if (timeGraphNodeOrValue.constructor.name === 'TimeGraphNode') {
      TimeGraph.areSimultaneous(timeGraphNodeOrValue, this.time.beginTime);
    } else {
      console.error('NO WAY');
    }
  }

  set dur(timeGraphNode) {
    TimeGraph.areSimultaneous(timeGraphNode, this.time.dur);
  }

  get dur() {
    return this.time.dur;
  }

  get endTime() {
    return this.time.endTime;
  }

  set endTime(timeGraphNodeOrValue) {
    if (typeof timeGraphNodeOrValue === 'number') {
      this.time.endTime.val = timeGraphNodeOrValue;
    } else if (timeGraphNodeOrValue.constructor.name === 'TimeGraphNode') {
      TimeGraph.areSimultaneous(timeGraphNodeOrValue, this.time.endTime);
    } else {
      console.error('NO WAY');
    }
  }

  get endTimeNoCrop() {
    return this.time.endTimeNoCrop;
  }

  get parentEndTime() {
    return this.time.parentEndTime;
  }

  get hasChildPhases() {
    return (this.childPhases && this.childPhases.length > 0);
  }

  get hasParent() {
    return (this.parentPhase !== undefined);
  }

  // Load timeGraph data - clear and update the timeGraph
  //  Uses the same format as generated by saveTimeGraphToStore()

  loadTimeGraph(boundaryData) {
    this.requestTimeGraphInit();
    this.root.loadTimeGraphBoundaries(boundaryData);
    this.saveTimeGraphToStore(); // TODO: Is this necessary?
  }

  loadTimeGraphBoundaries(boundaryData) {

    if (boundaryData[this.id] !== undefined) {
      this.beginTime = boundaryData[this.id].beginTime;
      this.endTime   = boundaryData[this.id].endTime;
    }

    if (this.hasChildPhases) {
      this.childPhases.forEach(
        child => child.loadTimeGraphBoundaries(boundaryData)
      );
    }
  }

  // Broadcast the timegraph's begin/time to the App as a whole

  saveTimeGraphToStore() {
    this.app.updatePhaseBoundaries(this.root.getBoundaries());
  }

  // Dump the begin/end times of this and all children
  //   as a data structure (for notifying App)

  getBoundaries() {
    return this.childPhases.reduce(
      (timePointsHash, childPhase) => Object.assign(childPhase.getBoundaries(), timePointsHash), 
      { [this.id]: { beginTime: this.beginTime.val, endTime: this.endTime.val } }
    );
  }

  // Time graph export (for debugging)

  get timeGraphAsString() {
    return JSON.stringify(this.timeGraphDump)
  }

  get timeGraphDump() {
    return {
      id: this.id,
      type: this.constructor.name,
      origin: this.time.origin.prettyVal,
      beginDelay: this.time.beginDelay.prettyVal,
      beginTime: this.time.beginTime.prettyVal,
      dur: this.time.dur.prettyVal,
      endTimeNoCrop: this.time.endTimeNoCrop.prettyVal,
      endTime: this.time.endTime.prettyVal,
      parentEndTime: this.time.parentEndTime.prettyVal,
      children: this.hasChildPhases ? this.childPhases.map(childPhase => childPhase.timeGraphDump) : null
    }
  }

  // State management

  // Given an integer-timestamp, check what state this
  //  Phase should be in

  checkStateOfThisPhase(time) {

    if (this.isWaiting(time)) {  // If waiting
      this.waitElement();
    } else if (this.isActive(time)) {  // If active ...
      this.beginElement();
    } else { // If not active ... check parent
      if (this.parentIsActive(time) && this.canFreeze) {
        this.freezeElement();
      } else {
        this.endElement();
      }
    }
  }

  // STATUS CHECKS

  isActive(time) {
    // return TimeGraph.test_isBetween(this.beginTime, time, this.endTime);
    if (this.id === 'root' && false) {
      console.log(this.beginTime.val, time, this.endTime.val, this.id);
      console.log("IS BEFORE", TimeGraph.test_isBefore(this.endTime, time));
      // console.log("IS AFTER", TimeGraph.test_isAfter(this.beginTime, time));
    }
    return (  TimeGraph.test_isBefore(this.endTime, time) && 
              TimeGraph.test_isAfter(this.beginTime, time) )
  }

  isWaiting(time) {
    return (TimeGraph.test_isBefore(this.beginTime, time));
    // return (time < this.beginTime);
  }
  
  parentIsActive(_) {
    return (this.hasParent && this.parentPhase.state === Phase.STATE.ACTIVE);
  }

  // State management

  setState(state) {
    if (this.state !== state) {
      this.currState = state;
      this.app.phaseChange(this.id, state);
    }
  }

  get state() {
    return this.currState;
  }

  waitElement() {
    this.setState(Phase.STATE.WAITING);
  }

  beginElement() {
    this.setState(Phase.STATE.ACTIVE);
  }

  freezeElement() {
    this.setState(Phase.STATE.FROZEN);
  }
  
  endElement() {
    this.setState(Phase.STATE.ENDED);
  }
}

Phase.STATE = { 
  'WAITING': 'WAITING', 
  'ACTIVE': 'ACTIVE', 
  'FROZEN': 'FROZEN',
  'ENDED': 'ENDED'
}


class Phase_noChildren extends Phase {

  constructor(options) {
    super(options);
  }

  // Crop this to the parent's endTime (if necessary)

  initializeTimeGraph() {
    super.initializeTimeGraph();
    TimeGraph.isTheEarlier(this.parentEndTime, this.endTimeNoCrop, this.endTime);

    // If dur not defined, make it 0
    // TODO: IS THIS A GOOD IDEA?

    if (this.initOptions.dur === undefined) {
      this.dur = TimeGraph.getNode(0);
    }
  }

  // Called every Clock tick

  checkState(time) {
    this.checkStateOfThisPhase(time);
  }
}

class Phase_withChildren extends Phase {

  constructor(options) {
    super(options);
    // this.childPhases = []; // MOVED TO Phase

    // In Phase_withChildren, checkState() is defined
    // in the constructor in order to make 
    // "this" bind properly when checkState is passed
    // as an argument.

    this.checkState = (time) => { 
      this.checkStateOfThisPhase(time);
      this.childPhases.forEach(
        childPhase => childPhase.checkState(time)
      );
    }
  }

  addChild(childPhase) {
    childPhase.parentPhase = this;
    this.childPhases.push(childPhase);
  }

  initializeTimeGraph() {
    super.initializeTimeGraph();
    this.childPhases.forEach(childPhase => childPhase.initializeTimeGraph());
  }

  // Resolve given Phase reference to index in childPhases
  //  Reference can be an ID, a Phase instance, or 
  //  an index (as a number)
  // Returns -1 if no match

  getChildIndex(childPhaseReference) {
    //console.log(`FIND ${childPhaseReference}`);
    //window.cref = childPhaseReference;
    //window.carr = this.childPhases;
    return this.childPhases.findIndex( 
      (childPhase, childIndex) => (
          childPhase.id === childPhaseReference ||
          childPhase === childPhaseReference || 
          childIndex === childPhaseReference 
      )
    );
  }

  // Called every Clock tick.
  // Check the state of this Phase and
  //   recurse to children
/*
  checkState(time) {
    // super.checkState(time);
    console.log('THIS IS');
    console.log(this);
    this.checkStateOfThisPhase(time);
    this.childPhases.forEach(
      childPhase => childPhase.checkState(time)
    );
  } */
}

class Phase_par extends Phase_withChildren {
  constructor(options) {
    super(options); 
  }

  initializeTimeGraph() {

    super.initializeTimeGraph();

    this.childPhases.forEach(
      childPhase => TimeGraph.areSimultaneous(this.beginTime, childPhase.origin)
    );

    // Make the end of the Par Phase the same as that of 
    //  the latest child OR the end of the parent (whichever comes first)
    // UNLESS the duration is specified in the markup, in which case
    //  the end is either the end as specified OR the end of the parent
    //  (whichever comes first)

    let uncroppedEndTime;

    if (this.initOptions.dur === undefined) {
      uncroppedEndTime = TimeGraph.getNode();
      TimeGraph.isTheLatest(
        this.childPhases.map(childPhase => childPhase.endTimeNoCrop), 
        uncroppedEndTime
      );
    } else {
      uncroppedEndTime = this.endTimeNoCrop;
    }

    TimeGraph.isTheEarlier(this.parentEndTime, uncroppedEndTime, this.endTime);
  }
}

class Phase_seq extends Phase_withChildren {

  constructor(options) {
    super(options);
  }

  initializeTimeGraph() {

    super.initializeTimeGraph();

    if (this.hasChildPhases) {

      const lastChildEnd = this.childPhases.reduce((childOrigin, childPhase) => {
        childPhase.origin = childOrigin;
        // childPhase.endTime = childPhase.endTimeNoCrop;
        return childPhase.endTimeNoCrop;
      }, this.beginTime);

      // Make the end of the Seq Phase the same as that of 
      //  the last child OR the end of the parent (whichever comes first)
      // UNLESS the duration is specified in the markup, in which case
      //  the end is either the end as specified OR the end of the parent
      //  (whichever comes first)

      TimeGraph.isTheEarlier(
        this.parentEndTime,
        (this.initOptions.dur === undefined) ? lastChildEnd : this.endTimeNoCrop,
        this.endTime
      );

      // Only the last child in a SEQ can freeze until 
      //  the end of the simple duration of the seq.
      // So set all the other children to not freeze
      // See https://www.w3.org/TR/SMIL3/smil-timing.html#q12
      // TODO: This needs to be checked

      const lastChild = this.childPhases[this.childPhases.length - 1];
      lastChild.canFreeze = lastChild.freezeSetting;
      this.childPhases.slice(0,-1).forEach(childPhase => childPhase.canFreeze = false);
    }
  }

  // Jump to a childPhase:
  // Initialize TimeGraph, set target's origin to now, update App

  jumpTo(childPhaseReference) {
    this.requestTimeGraphInit();
    const childPhaseIndex = this.getChildIndex(childPhaseReference);
    if (childPhaseIndex !== -1) {
      this.childPhases[childPhaseIndex].origin = TimeGraph.getNowNode();
      this.saveTimeGraphToStore();
    } else {
      console.error(`JUMPTO ERROR: Target not found`);
      console.error(childPhaseReference);
    }
  }
}

// The Phase_controller class is the root of the Phase hierarchy.
// It is the PARENT of the Glider root in the markup. Therefore, it
//   serves as a container for the phases defined in the Flight plan.
// This object is uniquely connected to the Clock and to the App.
// All Clock updates start at the root and get sent down.
// Until the Phases are connected to the Phase_controller instance,
//   they have no connection to the rest of Glider, and do
//   not get driven by the Clock.

class Phase_root extends Phase_par {

  constructor(options) {
    super({ id: 'root', begin: 0, dur: TimeGraph.INDEFINITE });
    this.gliderApp = options.app; // Only the root has a reference to App
    clock.onTick(this.checkState); // Connect Clock to this Phase
    console.log(`ROOT ENDTIME:`, this);
    window.roooot = this;
    this.parentPhase = undefined;
  }

  get app() {
    return this.gliderApp;
  }
}

// Map @phase-type values to Classes

Phase.types = {
  par: Phase_par,
  parallel: Phase_par,
  seq: Phase_seq,
  sequence: Phase_seq,
  leaf: Phase_noChildren,
  root: Phase_root
}

// Phase factory

function phaseFactory(options) {
  if (Phase.types[options.type] !== undefined) {
    return new Phase.types[options.type](options);
  } else {
    console.error(`Unrecognised Phase type ${options.type}!`);
  }
}

export { phaseFactory }

