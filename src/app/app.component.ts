/// <reference types="chrome"/>
import { Component } from '@angular/core';
import { MaintenanceService } from './shared/maintenance.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  public constructor(maintenanceService: MaintenanceService) {
    maintenanceService.runWithCheck();
  }
}
