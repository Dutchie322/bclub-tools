import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { map, reduce, switchMap, startWith } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';
import { IChatLog } from 'models';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-chat-replay',
  templateUrl: './chat-replay.component.html',
  styleUrls: ['./chat-replay.component.scss']
})
export class ChatReplayComponent {
  public showWhispers = new FormControl(true);
  public chatReplay$: Observable<IChatLog[]>;

  constructor(
    private route: ActivatedRoute,
    private chatLogsService: ChatLogsService
  ) {
    this.chatReplay$ = combineLatest(
      (this.showWhispers.valueChanges as Observable<boolean>).pipe(
        startWith(this.showWhispers.value as boolean)
      ),
      this.route.paramMap.pipe(
        map(params => ({
          memberNumber: +params.get('memberNumber'),
          sessionId: params.get('sessionId'),
          chatRoom: params.get('chatRoom')
        }))
      )
    ).pipe(
      switchMap(([showWhispers, params]) =>
        this.chatLogsService.findChatReplay(params.memberNumber, params.sessionId, params.chatRoom).pipe(
          reduce<IChatLog>((acc, value) => {
            if (value.type === 'Whisper' && !showWhispers) {
              return acc;
            }

            acc.push(value);
            return acc;
          }, [])
        ))
    );
  }
}
