import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ZardButtonComponent } from '../../shared/components/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ZardButtonComponent],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {}
