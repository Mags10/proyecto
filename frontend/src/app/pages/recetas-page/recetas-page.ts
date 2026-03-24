import { Component } from '@angular/core';
import { ZardCardComponent } from '../../shared/components/card';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { ZardInputDirective } from '../../shared/components/input';

@Component({
  selector: 'app-recetas-page',
  standalone: true,
  imports: [ZardCardComponent, ZardButtonComponent, ZardBadgeComponent, ZardInputDirective],
  templateUrl: './recetas-page.html',
  styleUrl: './recetas-page.css'
})
export class RecetasPage {}
