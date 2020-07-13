
// With every Clock tick, the root Phase checks the state
//  of all Phases

class Clock {

  constructor() { 
    this.onTickCallbacks = [];
  }

  // Start the clock
  // this.phasesToNotify.forEach(phase => phase.resolveTime(Clock.getNow()));
  // TODO: Not sure that the clock should ask the Phases to resolve their timeGraph ...

  start() {

    const timer = window.setInterval(() => this.tick(), Clock.INTERVAL);

    this.stop = function() {
      clearTimeout(timer);
      this.stop = function() {};
    }
  }

  // Called with every tick of the Clock

  tick() {
    const timeStamp_now = (new Date()).valueOf();
    this.onTickCallbacks.forEach(onTick => onTick(timeStamp_now));
  }

  // Put all your root Phases here (they will receive the ticks)

  onTick(doThis) {
    this.onTickCallbacks.push(doThis);
  }

  // Get a human-readable version of a time (for debugging)
  // TODO: dependency on Phase module -- get rid of this

  readableTime = function(time) {
    if (time.val === Phase.TIME.END || time.val === Phase.TIME.BEGINNING) {
      return time.val;
    } else {
      return time.val.toString().slice(7).replace(/(\d\d\d)$/, '.$1');
    }
  }
}

// How many ms between ticks

Clock.INTERVAL = 100; 

// Create a clock instance for export

let clock = new Clock();

clock.start(); // Clock is running right away by default

export { clock }
