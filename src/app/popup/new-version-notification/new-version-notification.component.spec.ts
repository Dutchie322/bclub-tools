import { ComponentFixture } from '@angular/core/testing';
import { MockBuilder, MockRender } from 'ng-mocks';
import * as chrome from 'sinon-chrome';

import { NewVersionNotificationComponent } from './new-version-notification.component';
import { PopupModule } from '../popup.module';
import { MatSnackBarRef } from '@angular/material';

Object.assign(window.chrome, chrome);

describe('NewVersionNotificationComponent', () => {
  let component: NewVersionNotificationComponent;
  let fixture: ComponentFixture<NewVersionNotificationComponent>;

  beforeEach(() => MockBuilder(NewVersionNotificationComponent, PopupModule)
    .mock(MatSnackBarRef));

  beforeEach(() => {
    chrome.runtime.getManifest.returns({
      version: 'test'
    });

    fixture = MockRender(NewVersionNotificationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set extension version', () => {
    expect(component.extensionVersion).toBe('test');
  });

  it('should create tab to changelog', () => {
    component.showChangelog();
    expect(chrome.tabs.create.calledWith({
      url: 'https://github.com/Dutchie322/bclub-tools/releases/tag/vtest'
    })).toBeTruthy();
  });
});
