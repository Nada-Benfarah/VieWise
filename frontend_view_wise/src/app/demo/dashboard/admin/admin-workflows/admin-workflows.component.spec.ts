import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWorkflowsComponent } from './admin-workflows.component';

describe('AdminWorkflowsComponent', () => {
  let component: AdminWorkflowsComponent;
  let fixture: ComponentFixture<AdminWorkflowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWorkflowsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWorkflowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
