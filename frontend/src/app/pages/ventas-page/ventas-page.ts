import { Component } from '@angular/core';
import { ProductCard } from '../../components/product-card/product-card';

@Component({
  selector: 'app-ventas-page',
  standalone: true,
  imports: [ProductCard],
  templateUrl: './ventas-page.html',
  styleUrl: './ventas-page.css'
})
export class VentasPage {}
