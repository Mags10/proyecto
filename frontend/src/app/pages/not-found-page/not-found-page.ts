import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ZardButtonComponent } from '../../shared/components/button';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, ZardButtonComponent],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.css'
})
export class NotFoundPage {}
