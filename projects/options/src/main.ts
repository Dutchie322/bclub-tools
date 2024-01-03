/// <reference types="chrome"/>

import { bootstrapApplication } from '@angular/platform-browser';
import { OptionsComponent } from './options/options.component';

bootstrapApplication(OptionsComponent)
  .catch((err) => console.error(err));
