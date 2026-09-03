import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiResearchComponent } from './ai-research.component';

describe('AiResearchComponent', () => {
  let component: AiResearchComponent;
  let fixture: ComponentFixture<AiResearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiResearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiResearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
