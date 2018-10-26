import { Component, OnInit } from '@angular/core';

import * as config from '../../../../shared/config';
import { PowerUpsService } from './power-ups.service';


@Component({
  selector: 'power-ups',
  templateUrl: './power-ups.component.html',
  styleUrls: ['./power-ups.component.css']
})
export class PowerUpsComponent implements OnInit {

  get powerUps() {
    return this.service.powerUps;
  }

  constructor(public service: PowerUpsService) { }

  ngOnInit() {
  }

  use(powerUp: string) {
    this.service.use(powerUp);
  }

}
