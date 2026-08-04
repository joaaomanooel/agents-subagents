/**
 * Platform Strategy contract.
 *
 * Each concrete platform (opencode, claude) implements this contract
 * and registers itself in the registry. The sync script iterates over
 * registered platforms without knowing concrete types.
 */
export class Platform {
  /**
   * @returns {string} short identifier (e.g. 'opencode', 'claude').
   */
  get name() {
    throw new Error('Platform.name must be implemented');
  }

  /**
   * @returns {string} relative directory where generated files land
   *   (e.g. '.opencode/agents'). Used as `<root>/<outputDir>/<name>.md`.
   */
  get outputDir() {
    throw new Error('Platform.outputDir must be implemented');
  }

  /**
   * Optional capability description for human-readable error messages.
   * @returns {string}
   */
  describe() {
    return this.name;
  }

  /**
   * Emit the platform-specific file content for one canonical agent.
   * Implementations MUST produce deterministic, idempotent output.
   * @param {object} canonical — already validated, defaults applied.
   * @param {string} body — markdown body to preserve verbatim.
   * @returns {string} full file content including frontmatter.
   */
  emit(canonical, body) {
    throw new Error('Platform.emit must be implemented');
  }

  /**
   * Hook called once after the platform is registered. Default no-op.
   * Override when the platform needs to read config at startup.
   */
  init() {}
}
