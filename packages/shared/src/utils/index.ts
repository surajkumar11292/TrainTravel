export function generatePNR(): string {
  const digits = Math.floor(1000000000 + Math.random() * 9000000000);
  return digits.toString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}
