import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurVibesComponent } from './our-vibes.component';

describe('OurVibesComponent', () => {
  let component: OurVibesComponent;
  let fixture: ComponentFixture<OurVibesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurVibesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurVibesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
