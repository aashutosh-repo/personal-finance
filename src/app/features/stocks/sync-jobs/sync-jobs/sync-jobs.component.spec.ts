import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncJobsComponent } from './sync-jobs.component';

describe('SyncJobsComponent', () => {
  let component: SyncJobsComponent;
  let fixture: ComponentFixture<SyncJobsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SyncJobsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SyncJobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
