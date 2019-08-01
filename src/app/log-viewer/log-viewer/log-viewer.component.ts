import { Component } from '@angular/core';
import { IChatLog } from 'models';
import { DatabaseService } from '../database.service';

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss']
})
export class LogViewerComponent {
  public logs: IChatLog[];
  public sessionMemberNumbers: number[];

  constructor(private database: DatabaseService) {
    const set = new Set<number>();
    this.database.transaction('chatRoomLogs').then(transaction => {
      transaction.objectStore('chatRoomLogs')
        .index('sessionMemberNumber_idx')
        .openKeyCursor()
        .addEventListener('success', event => {
          const cursor = (event.target as IDBRequest<IDBCursor>).result;
          if (cursor) {
            set.add(cursor.key as number);
            cursor.continue();
          } else {
            this.sessionMemberNumbers = Array.from(set);
          }
        });
    });
  }

}
