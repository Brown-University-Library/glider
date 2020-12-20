import { LOG } from '../misc/logger.js';
import { phaseFactory } from './phase.js';

// Go through each Phase described in initParameters.phases
//  and create a corresponding object, then use the
//  parent/child information in initParameters.phaseChildren
//  to associate those Phase objects
// Return a hash of phases by ID

function initPhases(gliderApp, initParameters) {
  // Create Phase objects and collect in a hash by ID

  const phases = Object.keys(initParameters.phases).reduce((acc, phaseId) => {
    const phaseInitParams = Object.assign(
      { app: gliderApp },
      initParameters.phases[phaseId]
    );
    acc[phaseId] = phaseFactory(phaseInitParams);
    return acc;
  }, {});

  // The Phase Controller is the parent of the root Phase
  //  defined by the markup

  const phaseController = phaseFactory({
    type: 'controller',
    app: gliderApp,
  });

  // Associate child Phases with parents (within the Phase objects)

  for (let parentPhaseId in initParameters.phaseChildren) {
    const parentPhase = phases[parentPhaseId],
      phaseChildren = initParameters.phaseChildren[parentPhaseId].map(
        (childId) => phases[childId]
      );

    phaseChildren.forEach((childPhase) => parentPhase.addChild(childPhase));
    // or: phaseChildren.forEach(parentPhase.addChild);
  }

  // Associate PhaseController as parent of root Phase

  phaseController.addChild(phases[initParameters.rootPhaseId]);
  // phases.push(phaseController);

  LOG('CREATED PHASES', 4);
  LOG(phases, 4);

  return { phaseController, phases };
}

export { initPhases };
