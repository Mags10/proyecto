import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WizardStepper } from '../../components/wizard-stepper/wizard-stepper';
import { MockFormCard } from '../../components/mock-form-card/mock-form-card';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardInputDirective } from '../../shared/components/input';

@Component({
  selector: 'app-abastecimiento-step2-page',
  standalone: true,
  imports: [RouterLink, WizardStepper, MockFormCard, ZardButtonComponent, ZardInputDirective],
  templateUrl: './abastecimiento-step2-page.html',
  styleUrl: './abastecimiento-step2-page.css'
})
export class AbastecimientoStep2Page {}
