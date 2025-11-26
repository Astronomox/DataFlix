import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <router-outlet></router-outlet>
    <app-notification></app-notification>
  `,
  imports: [RouterOutlet, NotificationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}