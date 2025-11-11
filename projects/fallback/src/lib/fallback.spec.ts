import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fallback } from './fallback';

describe('Fallback', () => {
  let component: Fallback;
  let fixture: ComponentFixture<Fallback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fallback]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fallback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
