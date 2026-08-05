import { ValidatorChain } from './chain.mjs';
import { nameValidator } from './individual/name.mjs';
import { descriptionValidator } from './individual/description.mjs';
import { capabilityValidator } from './individual/capability.mjs';
import { modeValidator } from './individual/mode.mjs';
import { modelValidator } from './individual/model.mjs';
import { arrayFieldsValidator } from './individual/arrays.mjs';
import { taskAgentsValidator } from './individual/task-agents.mjs';

export const validatorChain = new ValidatorChain()
  .add(nameValidator)
  .add(descriptionValidator)
  .add(capabilityValidator)
  .add(modeValidator)
  .add(modelValidator)
  .add(arrayFieldsValidator)
  .add(taskAgentsValidator);

export { ValidatorChain };
