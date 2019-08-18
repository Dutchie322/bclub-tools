import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, reduce, switchMap, startWith, tap } from 'rxjs/operators';

import { ChatLogsService } from '../../shared/chat-logs.service';
import { IChatLog } from 'models';

@Component({
  selector: 'app-chat-replay',
  templateUrl: './chat-replay.component.html',
  styleUrls: ['./chat-replay.component.scss']
})
export class ChatReplayComponent {
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public loading$: Observable<boolean>;
  public showWhispers = new FormControl(true);
  public chatReplay$: Observable<IChatLog[]>;

  constructor(
    private route: ActivatedRoute,
    private chatLogsService: ChatLogsService
  ) {
    this.loading$ = this.loadingSubject.asObservable();
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
      tap(() => this.loadingSubject.next(true)),
      switchMap(([showWhispers, params]) =>
        this.chatLogsService.findChatReplay(params.memberNumber, params.sessionId, params.chatRoom).pipe(
          reduce<IChatLog>((acc, value) => {
            if (value.type === 'Whisper' && !showWhispers) {
              return acc;
            }

            acc.push(value);
            return acc;
          }, []),
          tap(() => console.log('reduce done'))
        )
      ),
      tap(() => this.loadingSubject.next(false))
    );
  }
}
