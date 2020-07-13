
import { LOG }           from '../misc/logger.js';
import { phaseFactory }  from './phase.js';

// Go through each Phase described in initParameters.phases
//  and create a corresponding object, then use the
//  parent/child information in initParameters.phaseChildren
//  to associate those Phase objects
// Return a hash of phases by ID

function initPhases(gliderApp, initParameters) {

  // Create Phase objects and collect in a hash by ID

  let phases = {};
  
  for (let phaseId in initParameters.phases) {
    let phaseData = Object.assign({ app: gliderApp }, initParameters.phases[phaseId]);
    phases[phaseId] = phaseFactory(phaseData);
  }
  
  // Associate child Phases with parents (within the Phase objects)
  
  for (let parentPhaseId in initParameters.phaseChildren) {
    
    let parentPhase = phases[parentPhaseId],
        phaseChildren = initParameters.phaseChildren[parentPhaseId].map(
          childId => phases[childId]
        );
    
    phaseChildren.forEach(childPhase => parentPhase.addChild(childPhase));
  }
  
  LOG("CREATED PHASES", 4);
  LOG(phases, 4);
  
  return phases;
}

export { initPhases }
