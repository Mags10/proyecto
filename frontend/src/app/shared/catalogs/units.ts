export interface UnitOption {
  value: string;
  label: string;
  shortLabel: string;
  kind: 'mass' | 'volume' | 'count';
}

export const UNIT_OPTIONS: UnitOption[] = [
  { value: 'gramo', label: 'Gramo', shortLabel: 'g', kind: 'mass' },
  { value: 'kilogramo', label: 'Kilogramo', shortLabel: 'kg', kind: 'mass' },
  { value: 'mililitro', label: 'Mililitro', shortLabel: 'ml', kind: 'volume' },
  { value: 'litro', label: 'Litro', shortLabel: 'L', kind: 'volume' },
  { value: 'pieza', label: 'Pieza', shortLabel: 'pz', kind: 'count' },
  { value: 'paquete', label: 'Paquete', shortLabel: 'paq', kind: 'count' },
  { value: 'caja', label: 'Caja', shortLabel: 'caja', kind: 'count' },
];

export const getUnitLabel = (value: string): string =>
  UNIT_OPTIONS.find((unit) => unit.value === value)?.shortLabel || value;
