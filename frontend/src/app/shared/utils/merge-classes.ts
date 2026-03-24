type ClassPrimitive = string | number | bigint | boolean | null | undefined;
type ClassDictionary = Record<string, boolean | number | string | null | undefined>;
type ClassArray = ClassValue[];
export type ClassValue = ClassPrimitive | ClassDictionary | ClassArray;

const toClassList = (value: ClassValue): string[] => {
  if (!value) {
    return [];
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => toClassList(item));
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, isActive]) => Boolean(isActive))
      .map(([className]) => className);
  }

  return [];
};

export const mergeClasses = (...values: ClassValue[]): string =>
  values
    .flatMap((value) => toClassList(value))
    .filter(Boolean)
    .join(' ')
    .trim();

export const noopFn = () => {
  return;
};
