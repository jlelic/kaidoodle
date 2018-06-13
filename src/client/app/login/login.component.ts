import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms'

import { AuthService } from '../core/auth/auth.service';
import { CookiesService } from '../core/cookies.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: FormGroup;
  error: string;

  constructor(private auth: AuthService,
              private cookies: CookiesService,
              private fb: FormBuilder,
              private router: Router) {
  }

  ngOnInit() {
    this.buildForm();
  }

  buildForm() {
    this.error = '';
    this.form = this.fb.group(
      {
        login: '',
        password: '',
        newAccount: false
      }
    );
  }


  onSubmit() {
    this.auth.login(this.form.value)
      .subscribe(
        () => {
          this.router.navigate(['/'])
        },
        data => this.error = data.error.message
      );
  }
}
