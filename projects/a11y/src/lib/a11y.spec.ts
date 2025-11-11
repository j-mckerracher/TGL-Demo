import { ComponentFixture, TestBed } from '@angular/core/testing';

import { A11y } from './a11y';

describe('A11y', () => {
  let component: A11y;
  let fixture: ComponentFixture<A11y>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [A11y]
    })
    .compileComponents();

    fixture = TestBed.createComponent(A11y);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
