import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';

interface LoanSimulatorProps {
  amount: number;
  selectedTerm: number;
  onTermChange: (term: number) => void;
}

export function LoanSimulator({ amount, selectedTerm, onTermChange }: LoanSimulatorProps) {
  const terms = [24, 36, 48]; // Términos disponibles
  const annualRate = 0.15; // 15% anual
  const monthlyRate = annualRate / 12;

  // Calcular pago mensual
  const calculateMonthlyPayment = (principal: number, termMonths: number, rate: number) => {
    const monthlyRate = rate / 12;
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths);
    const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
    return numerator / denominator;
  };

  const monthlyPayment = calculateMonthlyPayment(amount, selectedTerm, annualRate);
  const totalAmount = monthlyPayment * selectedTerm;
  const totalInterest = totalAmount - amount;

  return (
    <Card className="p-6 bg-white shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900">Simulador de financiamiento</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Monto a financiar</p>
            <p className="text-2xl font-bold text-purple-700">
              ${amount.toLocaleString('es-MX')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Plazo de financiamiento
            </label>
            <Select
              value={selectedTerm.toString()}
              onValueChange={(value) => onTermChange(parseInt(value))}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Selecciona un plazo" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {terms.map((term) => (
                  <SelectItem key={term} value={term.toString()}>
                    {term} meses
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg space-y-4">
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">Pago mensual estimado</p>
            <p className="text-2xl font-bold text-purple-700">
              ${monthlyPayment.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tasa anual:</span>
              <span className="font-medium text-gray-900">
                {(annualRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plazo:</span>
              <span className="font-medium text-gray-900">
                {selectedTerm} meses
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monto total a pagar:</span>
              <span className="font-medium text-gray-900">
                ${totalAmount.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Intereses totales:</span>
              <span className="font-medium text-gray-900">
                ${totalInterest.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <p className="text-xs text-purple-600 mt-2">
            *Los montos son aproximados y pueden variar según evaluación crediticia
          </p>
        </div>
      </div>
    </Card>
  );
} 