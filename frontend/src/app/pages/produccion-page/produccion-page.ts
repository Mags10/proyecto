import { Component } from '@angular/core';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardInputDirective } from '../../shared/components/input';

@Component({
  selector: 'app-produccion-page',
  standalone: true,
  imports: [ZardCardComponent, ZardButtonComponent, ZardBadgeComponent, ZardInputDirective],
  templateUrl: './produccion-page.html',
  styleUrl: './produccion-page.css'
})
export class ProduccionPage {}
