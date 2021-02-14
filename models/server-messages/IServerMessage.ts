export interface IServerMessage<T> {
  data: T;
  event: string;
  handshake: string;
  inFocus: boolean;
  type: 'server';
}
