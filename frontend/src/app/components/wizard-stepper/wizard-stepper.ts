import { Component, input } from '@angular/core';

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  templateUrl: './wizard-stepper.html',
  styleUrl: './wizard-stepper.css'
})
export class WizardStepper {
  readonly step = input<number>(1);

  isDone(target: number): boolean {
    return this.step() >= target;
  }
}
