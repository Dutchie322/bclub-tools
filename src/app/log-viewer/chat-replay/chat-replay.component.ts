import { Component, OnInit, ViewChild, OnDestroy, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { map, exhaustMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ChatLineComponent } from './chat-line/chat-line.component';

@Component({
  selector: 'app-chat-replay',
  templateUrl: './chat-replay.component.html',
  styleUrls: ['./chat-replay.component.scss']
})
export class ChatReplayComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  @ViewChild('chatReplay', {
    read: ViewContainerRef,
    static: true
  })
  private chatReplayContainer: ViewContainerRef;

  constructor(
    private route: ActivatedRoute,
    private chatLogsService: ChatLogsService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ChatLineComponent);
    this.subscription = this.route.paramMap.pipe(
      map(params => ({
        memberNumber: +params.get('memberNumber'),
        sessionId: params.get('sessionId'),
        chatRoom: params.get('chatRoom')
      })),
      exhaustMap(params => this.chatLogsService.findChatReplay(params.memberNumber, params.sessionId, params.chatRoom)),
      map(chatLog => {
        const componentRef = this.chatReplayContainer.createComponent(componentFactory);
        componentRef.instance.chatLog = chatLog;
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
