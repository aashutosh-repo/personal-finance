import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockAssistantComponent } from './stock-assistant.component';

describe('StockAssistantComponent', () => {
  let component: StockAssistantComponent;
  let fixture: ComponentFixture<StockAssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAssistantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
