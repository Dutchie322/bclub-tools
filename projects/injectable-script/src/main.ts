import { Bootstrapper } from './Bootstrapper';

const bootstrapper = new Bootstrapper();

export function connect(extensionId: string, handshake: string) {
  bootstrapper.connect(extensionId, handshake);
}
