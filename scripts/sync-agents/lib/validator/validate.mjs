import { ok, err } from '../core/result.mjs';
import { validatorChain } from './composer.mjs';

export function validate(canonical) {
  const { errors, warnings } = validatorChain.run(canonical);
  if (errors.length > 0) {
    return err({ code: 'validation', errors, warnings });
  }
  return ok({ canonical, errors, warnings });
}
