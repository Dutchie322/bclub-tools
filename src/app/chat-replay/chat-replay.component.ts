import { Component } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, reduce, switchMap, startWith, tap } from 'rxjs/operators';

import { ChatLogsService } from '../shared/chat-logs.service';
import { IChatLog } from 'models';
import { ChatLineComponent } from './chat-line/chat-line.component';
import { CommonModule } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-chat-replay',
    standalone: true,
    imports: [
      CommonModule,
      ChatLineComponent,
      ReactiveFormsModule,
      MatCheckbox,
      MatProgressBar,
      MatToolbar
    ],
    templateUrl: './chat-replay.component.html',
    styleUrls: ['./chat-replay.component.scss']
})
export class ChatReplayComponent {
  private loadingSubject = new BehaviorSubject<boolean>(true);

  public loading$: Observable<boolean>;
  public showWhispers = new UntypedFormControl(true);
  public chatReplay$: Observable<IChatLog[]>;

  constructor(
    private route: ActivatedRoute,
    private chatLogsService: ChatLogsService,
    title: Title
  ) {
    this.loading$ = this.loadingSubject.asObservable();
    this.chatReplay$ = combineLatest([
      (this.showWhispers.valueChanges as Observable<boolean>).pipe(
        startWith(this.showWhispers.value as boolean)
      ),
      this.route.paramMap.pipe(
        map(params => ({
          memberNumber: +params.get('memberNumber'),
          sessionId: params.get('sessionId'),
          chatRoom: params.get('chatRoom')
        })),
        tap(params => title.setTitle(`${params.chatRoom} (${params.memberNumber}) - Bondage Club Tools`))
      )
    ]).pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(([showWhispers, params]) =>
        this.chatLogsService.findChatReplay(params.memberNumber, params.sessionId, params.chatRoom).pipe(
          reduce((acc, value) => {
            if (value.type === 'Whisper' && !showWhispers) {
              return acc;
            }

            acc.push(value);
            return acc;
          }, [] as IChatLog[])
        )
      ),
      tap(() => this.loadingSubject.next(false))
    );
  }
}
