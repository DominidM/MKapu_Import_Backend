import { ValueTransformer } from 'typeorm';

export const BitToBooleanTransformer: ValueTransformer = {
  from: (value: Buffer | number | boolean): boolean => {
    if (value === null || value === undefined) return false;

    if (Buffer.isBuffer(value)) {
      return value[0] === 1;
    }
    return value === 1 || value === true;
  },
  to: (value: boolean): Buffer => {
    // Corregir: MySQL bit(1) necesita Buffer, no número
    return Buffer.from([value ? 1 : 0]);
  },
};