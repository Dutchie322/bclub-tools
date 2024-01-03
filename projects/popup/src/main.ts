/// <reference types="chrome"/>

import { bootstrapApplication } from '@angular/platform-browser';
import { PopupComponent } from './popup/popup.component';

bootstrapApplication(PopupComponent)
  .catch((err) => console.error(err));
