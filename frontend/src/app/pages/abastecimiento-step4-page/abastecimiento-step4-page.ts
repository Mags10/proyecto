import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WizardStepper } from '../../components/wizard-stepper/wizard-stepper';
import { MockFormCard } from '../../components/mock-form-card/mock-form-card';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardBadgeComponent } from '../../shared/components/badge';

@Component({
  selector: 'app-abastecimiento-step4-page',
  standalone: true,
  imports: [RouterLink, WizardStepper, MockFormCard, ZardButtonComponent, ZardBadgeComponent],
  templateUrl: './abastecimiento-step4-page.html',
  styleUrl: './abastecimiento-step4-page.css'
})
export class AbastecimientoStep4Page {}
