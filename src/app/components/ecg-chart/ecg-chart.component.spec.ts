import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EcgChartComponent } from './ecg-chart.component';

describe('EcgChartComponent', () => {
  let component: EcgChartComponent;
  let fixture: ComponentFixture<EcgChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EcgChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EcgChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
