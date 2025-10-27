import { Component, ElementRef, HostListener, Inject, inject, NgProbeToken, OnInit, PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { SharedMaterialModules } from '../../shared-material.module';
import { LoginComponent } from '../../../../features/auth/login.component';
import { LoginResponse, UserResponse } from '../../../../../model/loginRequest.model';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../auth/auth.service';
import { BrowserStorageService } from '../../../auth/BrowserStorageService.service';
import { isPlatformBrowser } from '@angular/common';



@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SharedMaterialModules,MatToolbarModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements  OnInit {

  constructor(private dialog: MatDialog,
    private storage: BrowserStorageService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,

  ) {}
  ngOnInit(): void {
    // if (!isPlatformBrowser(this.platformId)) {
    //   return;
    // }
    const userStr= this.storage.get('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.userDetails ={
        ...this.userDetails,
        firstName: user.name,
        lastName: '',
        userName: user.email,
        token: 'wertyuioasdfghjk'
      };
    }
  }

   authService = inject(AuthService);
    elementRef = inject(ElementRef);


  // logout() {
  //   this.authService.logout();
  //   window.location.reload(); // optional: refresh to reset state
  // }
  
  isExpanded = false;
  userDetails: UserResponse | null = null;
  showUserDetails: boolean = false;

  toggleMenu() {
    this.isExpanded = !this.isExpanded;
  }

  toggleUserDetails() {
    this.showUserDetails = !this.showUserDetails;
  }
  
  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
        width: '400px',
        height: '520px',
        disableClose: false
      });
      dialogRef.afterClosed().subscribe((userRes: UserResponse) => {
        if (userRes) {
          this.userDetails = userRes;
          console.log('User details from dialog:', this.userDetails);
        }
      });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    // If click target is NOT inside this component's element
    if (this.showUserDetails && !this.elementRef.nativeElement.contains(event.target)) {
      this.showUserDetails = false;
    }
  }
  
  onMenuSelect(event: MatSelectChange) {
    const option = event.value;
  switch (option) {
    case 'home':
      this.router.navigate(['/home']);
      break;
    case 'docs':
      this.router.navigate(['/docs']);
      break;
    case 'shortcut':
      this.router.navigate(['/shortcut']);
      break;
    case 'about':
      this.router.navigate(['/about']);
      break;
  }
}
}
