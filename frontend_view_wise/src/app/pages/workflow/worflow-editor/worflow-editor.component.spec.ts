import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorflowEditorComponent } from './worflow-editor.component';

describe('WorflowEditorComponent', () => {
  let component: WorflowEditorComponent;
  let fixture: ComponentFixture<WorflowEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorflowEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorflowEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
