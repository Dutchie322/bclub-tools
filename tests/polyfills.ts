// sinon (used by sinon-chrome) expects Node's `global` to exist.
(globalThis as any).global ??= globalThis;
