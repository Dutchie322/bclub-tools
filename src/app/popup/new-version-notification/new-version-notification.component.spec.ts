import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewVersionNotificationComponent } from './new-version-notification.component';

describe('NewVersionNotificationComponent', () => {
  let component: NewVersionNotificationComponent;
  let fixture: ComponentFixture<NewVersionNotificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewVersionNotificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewVersionNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
