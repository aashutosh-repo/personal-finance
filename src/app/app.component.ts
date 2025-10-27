import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'daily-tracker-UI';

  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
    private platformId = inject(PLATFORM_ID);
    selectedPage: string = 'Dashboard'

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.iconRegistry.addSvgIcon(
        'user-icon',
        this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/user-icon.svg')
      );
    }
  }
  onMenuSelect(menu: string) {
    this.selectedPage = menu;
  }
}
