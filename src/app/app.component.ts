/// <reference types="chrome"/>
import { Component } from '@angular/core';
import { MaintenanceService } from './shared/maintenance.service';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    imports: [
      RouterOutlet
    ],
    template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  public constructor(maintenanceService: MaintenanceService) {
    maintenanceService.runWithCheck();
  }
}
