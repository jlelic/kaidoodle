import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  constructor(private auth: AuthService, private router: Router) { }

  get name(): string {
    return this.auth.loginName;
  }

  ngOnInit() {
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['']);
  }
}
