type DegisterFn = () => void;

class DeregistrationRegistry {
  private callbacks: { [key: string]: DegisterFn } = {};

  public add(scriptId: string, callback: DegisterFn) {
    this.callbacks[scriptId] = callback;
  }

  public deregisterAll() {
    const scriptIds = Object.keys(this.callbacks);
    scriptIds.forEach(scriptId => {
      window.dispatchEvent(new CustomEvent('BondagClub.Deregister', { detail: { scriptId } }));
      this.callbacks[scriptId]();
    });
    this.callbacks = {};
  }
}

const registry = new DeregistrationRegistry();

export default registry;
