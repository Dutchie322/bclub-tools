import { Component, OnInit } from '@angular/core';
import { IChatLog } from 'models';

@Component({
  selector: 'app-log-viewer',
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss']
})
export class LogViewerComponent implements OnInit {
  public logs: IChatLog[];

  constructor() {
    let db: IDBDatabase;
    indexedDB
      .open('bclub-tools', 1)
      .addEventListener('success', event => {
        db = (event.target as IDBOpenDBRequest).result;
        db.transaction('chatRoomLogs')
          .objectStore('chatRoomLogs')
          .getAll()
          .addEventListener('success', event => {
            this.logs = (event.target as IDBRequest<IChatLog[]>).result;
          });
      });
  }

  ngOnInit() {
  }

}
