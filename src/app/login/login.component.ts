import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Login } from './login';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
})
export class LoginComponent implements OnInit {
  credentials: any
  showPassword = false;

  constructor(private router: Router, private loginService: Login) { }
  ngOnInit() {
    this.credentials = new FormGroup({
      email: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  login() {
    this.loginService.auth(this.credentials.value).subscribe((res: any) => {
      if (res.response == true && res.token) {
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('currentUser', JSON.stringify(res.currentUser));
        this.credentials.reset();
        this.router.navigate(['/dashboard', {
          replaceUrl: true,
          skipLocationChange: true
        }]);
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword
  }

}
