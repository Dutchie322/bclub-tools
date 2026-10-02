export function importAndHook(path: string, handshake: string, searchInterval: number, version: string) {
  import(/* webpackIgnore: true */ path).then(hooks => {
    hooks.registerHooks(handshake, searchInterval, version);
  }, reason => {
    console.error('[Bondage Club Tools] Hooks registration injection function failed:', reason);
  });
}
