export class CapabilityRegistry {
  private engines: Map<string, any> = new Map();

  /**
   * Registers a core engine (e.g., Measurement Engine, Try-On Engine).
   * Prevents hardcoding dependencies inside the API Gateway.
   */
  public register(name: string, engineInstance: any) {
    this.engines.set(name, engineInstance);
  }

  /**
   * Retrieves an engine for routing.
   */
  public get(name: string): any {
    if (!this.engines.has(name)) {
      throw new Error(`Capability ${name} is not registered.`);
    }
    return this.engines.get(name);
  }
}
