/**
 * Chain of Responsibility for validators.
 *
 * Each validator is a pure function (canonical) -> { errors?, warnings? }.
 * The chain runs them in order, concatenating error/warning arrays.
 *
 * Validators never throw — they always return a result object.
 */
export class ValidatorChain {
  #validators = [];

  add(validator) {
    if (typeof validator !== 'function') {
      throw new Error('ValidatorChain.add: validator must be a function');
    }
    this.#validators.push(validator);
    return this;
  }

  get size() { return this.#validators.length; }

  run(canonical) {
    const errors = [];
    const warnings = [];
    for (const v of this.#validators) {
      const result = v(canonical) ?? {};
      if (Array.isArray(result.errors)) errors.push(...result.errors);
      if (Array.isArray(result.warnings)) warnings.push(...result.warnings);
    }
    return { errors, warnings };
  }
}
