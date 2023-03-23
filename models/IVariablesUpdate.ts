import { CurrentScreen } from './game';
import { IStoredPlayer } from './internal';

export interface IVariablesUpdate {
  CurrentScreen: CurrentScreen;
  Player: IStoredPlayer;
}
