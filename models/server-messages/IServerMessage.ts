export interface IServerMessage<T> {
  data: T;
  event: string;
}
