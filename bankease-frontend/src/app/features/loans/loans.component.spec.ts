import { TestBed } from '@angular/core/testing';
import { LoansComponent } from './loans.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockInterceptor } from '../../core/interceptors/mock.interceptor';
import { environment } from '../../../environments/environment';

describe('LoansComponent', () => {
  beforeEach(async () => {
    environment.demoMode = true;

    await TestBed.configureTestingModule({
      imports: [LoansComponent],
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor]))
      ]
    }).compileComponents();
  });

  it('should create and initialize loans component without errors', async () => {
    const fixture = TestBed.createComponent(LoansComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.products.length).toBeGreaterThan(0);
    expect(component.calcEmi).toBeGreaterThan(0);
  });
});
