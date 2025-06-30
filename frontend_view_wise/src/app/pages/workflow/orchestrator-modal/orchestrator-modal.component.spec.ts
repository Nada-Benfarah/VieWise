import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrchestratorModalComponent } from './orchestrator-modal.component';

describe('OrchestratorModalComponent', () => {
  let component: OrchestratorModalComponent;
  let fixture: ComponentFixture<OrchestratorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrchestratorModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrchestratorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
