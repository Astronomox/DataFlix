import { Component, ChangeDetectionStrategy, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  currentUser = this.authService.currentUser;
  
  sidebarToggle = output<void>();

  userAvatarUrl = computed(() => {
    const user = this.currentUser();
    if (user?.photourl) {
      return user.photourl;
    }
    const name = user?.name.replace(' ', '+') || 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff&bold=true`;
  });
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
  }
}