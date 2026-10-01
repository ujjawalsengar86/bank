import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, ToastComponent],
  template: `
    <div class="app-shell">
      <app-toast></app-toast>
      <app-navbar (toggleSidebar)="sidebarOpen = !sidebarOpen"></app-navbar>

      <div class="app-body">
        <app-sidebar [isOpen]="sidebarOpen" (closeSidebar)="sidebarOpen = false"></app-sidebar>

        <main class="app-main-content">
          <div class="content-container">
            <router-outlet></router-outlet>
          </div>

          <footer class="app-footer">
            <div class="footer-content">
              <div class="security-note">
                <span class="material-symbols-outlined icon">verified_user</span>
                <span>256-bit TLS Encrypted &bull; ISO/IEC 27001 Certified Banking Infrastructure</span>
              </div>
              <p class="copyright">&copy; 2026 BankEase Corporation. All rights reserved.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-main);
    }

    .app-body {
      display: flex;
      flex: 1;
      min-height: calc(100vh - 64px);
    }

    .app-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background-color: var(--bg-main);
    }

    .content-container {
      flex: 1;
      padding: 30px;
      max-width: 1380px;
      width: 100%;
      margin: 0 auto;
    }

    .app-footer {
      border-top: 1px solid var(--border);
      background: var(--bg-card);
      padding: 20px 30px;
      margin-top: auto;

      .footer-content {
        max-width: 1380px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;

        .security-note {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: var(--emerald-dark);
          font-weight: 600;

          .icon {
            font-size: 18px;
            color: var(--emerald);
          }
        }

        .copyright {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    @media (max-width: 768px) {
      .content-container {
        padding: 16px;
      }
      .app-footer .footer-content {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class LayoutComponent {
  sidebarOpen = false;
}
