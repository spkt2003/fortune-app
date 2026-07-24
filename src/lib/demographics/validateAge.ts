export function isValidAge(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 120;
}
