type DegisterFn = () => void;

class DeregistrationRegistry {
  private callbacks: DegisterFn[] = [];

  public add(callback: DegisterFn) {
    this.callbacks.push(callback);
  }

  public deregisterAll() {
    this.callbacks.forEach(fn => fn());
    this.callbacks = [];
  }
}

const registry = new DeregistrationRegistry();

export default registry;
