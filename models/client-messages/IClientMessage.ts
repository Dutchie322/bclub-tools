export interface IClientMessage<T> {
  data: T;
  event: string;
  handshake: string;
  type: 'client';
}
