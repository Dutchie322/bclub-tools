export function importAndHook(path: string, handshake: string, searchInterval: number) {
  import(/* webpackIgnore: true */ path).then(hooks => {
    hooks.registerHooks(handshake, searchInterval);
  }, reason => {
    console.error('[Bondage Club Tools] Hooks registration injection function failed:', reason);
  });
}
