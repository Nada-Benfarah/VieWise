import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatgptPageComponent } from './chatgpt-page.component';

describe('ChatgptPageComponent', () => {
  let component: ChatgptPageComponent;
  let fixture: ComponentFixture<ChatgptPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatgptPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatgptPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
