import { Component, Input } from '@angular/core';
import { IChatLog, renderContent } from 'models';

@Component({
  selector: 'app-chat-line',
  templateUrl: './chat-line.component.html',
  styleUrls: ['./chat-line.component.scss']
})
export class ChatLineComponent {
  private renderedContent: Promise<string>;
  private cleanChatLog: IChatLog;

  @Input()
  public get chatLog(): IChatLog {
    return this.cleanChatLog;
  }
  public set chatLog(chatLog: IChatLog) {
    this.cleanChatLog = this.copyChatLog(chatLog);
  }

  public renderContent(chatLog: IChatLog) {
    if (!this.renderedContent) {
      this.renderedContent = renderContent(chatLog);
    }

    return this.renderedContent;
  }

  public getColor(color: string) {
    return color || 'gray';
  }

  public getLighterColor(color: string) {
    if (!color) {
      return '#f0f0f0';
    }
    const r = color.substring(1, 3);
    const g = color.substring(3, 5);
    const b = color.substring(5, 7);
    return '#' +
      (255 - Math.floor((255 - parseInt(r, 16)) * 0.1)).toString(16) +
      (255 - Math.floor((255 - parseInt(g, 16)) * 0.1)).toString(16) +
      (255 - Math.floor((255 - parseInt(b, 16)) * 0.1)).toString(16);
  }

  public isGeneralAction(message: string) {
    return message.charAt(0) === '*';
  }

  private copyChatLog(chatLog: IChatLog): IChatLog {
    const cleanChatLog = {
      ...chatLog,
      content: this.sanitizeMessage(chatLog.content)
    };

    if (chatLog.type === 'Whisper' && !chatLog.target) {
      // Fill in the target so that we can display whispers more clearly
      cleanChatLog.target = {
        name: chatLog.session.name,
        memberNumber: chatLog.session.memberNumber
      };
    }

    return cleanChatLog;
  }

  private sanitizeMessage(message: string): string {
    message = message.replace(/&lt;/g, '<');
    message = message.replace(/&gt;/g, '>');
    return message;
  }
}
