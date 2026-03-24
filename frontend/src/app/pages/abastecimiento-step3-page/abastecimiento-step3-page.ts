import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WizardStepper } from '../../components/wizard-stepper/wizard-stepper';
import { MockFormCard } from '../../components/mock-form-card/mock-form-card';
import { ZardButtonComponent } from '../../shared/components/button';

@Component({
  selector: 'app-abastecimiento-step3-page',
  standalone: true,
  imports: [RouterLink, WizardStepper, MockFormCard, ZardButtonComponent],
  templateUrl: './abastecimiento-step3-page.html',
  styleUrl: './abastecimiento-step3-page.css'
})
export class AbastecimientoStep3Page {}
