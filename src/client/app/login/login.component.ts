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

  constructor(private api: ApiService,
              private communication: CommunicationService,
              private fb: FormBuilder,
              private router: Router) {
  }

  ngOnInit() {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.group(
      {
        login: '',
        password: ''
      }
    );
  }


  onSubmit() {
    const { login } = this.form.value;
    this.api.login(login)
      .subscribe(
        ({ token }) => {
          this.communication.init(token);
          this.router.navigate(['/game'])
        },
        error => console.error(error)
      );
  }
}
