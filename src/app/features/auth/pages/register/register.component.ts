import { Component } from '@angular/core';
import { SharedMaterialModules } from '../../../../service/common/shared-material.module';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RegistrationRequest } from '../../../../../model/user.model';
import { AuthService } from '../../../../service/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [SharedMaterialModules],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  constructor(private fb : FormBuilder, private authService: AuthService) { }
  form!: FormGroup;
  ngOnInit(): void {
    this.form = this.fb.nonNullable.group({
      userName: ['TestUser'],
      email: ['aashutosh@gmail.com'],
      fullName: ['Aashutosh Kumar'],
      phoneNumber: ['9097606729'],
      password: [''],
      countryCode: ['+91'],
      currency: ['INR'],
      dateOfBirth: ['11-07-1998'],
      bio: ['']
    });
  }
  

  onSubmit() {
    if (this.form.valid) {
      const registrationData: RegistrationRequest = {
        username: this.form.value.userName,
        email: this.form.value.email,
        fullName: this.form.value.fullName,
        password: this.form.value.password,
        countryCode: this.form.value.countryCode,
        phone: this.form.value.phoneNumber,
        currency: this.form.value.currency,
        dateOfBirth: this.form.value.dateOfBirth,
        bio: this.form.value.bio
      };
      console.log('Registration Data:', registrationData);
      this.authService.register(registrationData).subscribe({
        next: (response) => {
          console.log('Registration successful', response); 
        },
        error: (error) => {
          console.error('Registration failed', error); 
        }
      });
    }
  }


}
