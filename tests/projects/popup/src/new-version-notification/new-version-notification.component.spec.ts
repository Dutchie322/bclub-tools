import { ComponentFixture } from '@angular/core/testing';
import { MockBuilder, MockRender } from 'ng-mocks';
import * as chrome from 'sinon-chrome';

import {
  NewVersionNotificationComponent,
  NewVersionNotificationData
} from 'projects/popup/src/new-version-notification/new-version-notification.component';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

describe('NewVersionNotificationComponent', () => {
  let component: NewVersionNotificationComponent;
  let fixture: ComponentFixture<NewVersionNotificationComponent>;

  let data: NewVersionNotificationData;

  beforeEach(() => {
    data = { summary: 'Added a new feature' };
    return MockBuilder(NewVersionNotificationComponent)
      .mock(MatSnackBarRef)
      .provide({ provide: MAT_SNACK_BAR_DATA, useFactory: () => data });
  });

  beforeEach(() => {
    Object.assign(window, { chrome });
    chrome.runtime.getManifest.returns({
      version: 'test'
    });
  });

  function render() {
    fixture = MockRender(NewVersionNotificationComponent);
    component = fixture.componentInstance;
  }

  it('should create', () => {
    render();
    expect(component).toBeTruthy();
  });

  it('should show release notes summary', () => {
    render();
    expect(fixture.nativeElement.textContent).toContain('New release: Added a new feature');
  });

  it('should fall back to a generic message without summary', () => {
    data = { summary: null };
    render();
    expect(fixture.nativeElement.textContent).toContain('Bondage Club Tools was updated to vtest');
  });

  it('should set extension version', () => {
    render();
    expect(component.extensionVersion).toBe('test');
  });

  it('should create tab to changelog', () => {
    render();
    component.showChangelog();
    expect(chrome.tabs.create.calledWith({
      url: 'https://github.com/Dutchie322/bclub-tools/releases/tag/vtest'
    })).toBeTruthy();
  });
});
