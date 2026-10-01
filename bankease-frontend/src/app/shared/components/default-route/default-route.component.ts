import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-default-route',
  standalone: true,
  template: ''
})
export class DefaultRouteComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.router.navigate([this.authService.getDefaultRoute()], { replaceUrl: true });
  }
}