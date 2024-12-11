/// <reference types="chrome"/>

import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PopupComponent } from './popup/popup.component';

bootstrapApplication(PopupComponent, {
  providers: [
    provideAnimationsAsync()
  ]
})
  .catch((err) => console.error(err));
