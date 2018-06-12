import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms'

import { ApiService } from '../core/api.service';
import { CommunicationService } from '../core/communication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  form: FormGroup;
  error: string;

  constructor(private api: ApiService,
              private communication: CommunicationService,
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
    this.api.login(this.form.value)
      .subscribe(
        ({ token }) => {
          this.communication.token = token;
          this.router.navigate(['/menu'])
        },
        data => this.error = data.error.message
      );
  }
}
