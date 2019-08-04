import { Component, OnInit, Input } from '@angular/core';
import { IChatLog } from 'models';

@Component({
  selector: 'app-chat-line',
  templateUrl: './chat-line.component.html',
  styleUrls: ['./chat-line.component.scss']
})
export class ChatLineComponent implements OnInit {
  @Input()
  public chatLog: IChatLog;

  constructor() { }

  ngOnInit() {
  }

}
