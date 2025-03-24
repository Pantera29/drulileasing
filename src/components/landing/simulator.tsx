"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Plazos disponibles
const termOptions = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "48", label: "48 meses" },
];

export function Simulator() {
  // Estados con hooks (siempre al inicio, nunca condicionales)
  const [amount, setAmount] = useState(500000);
  const [term, setTerm] = useState("24");

  // Cálculos del simulador
  const interestRate = calculateInterestRate(amount, parseInt(term));
  const monthlyPayment = calculateMonthlyPayment(amount, interestRate, parseInt(term));

  // Función para calcular la tasa de interés basada en los parámetros
  function calculateInterestRate(amount: number, term: number): number {
    // Tasa base
    let rate = 0.15;

    // Ajustes según el monto (montos más altos, tasas menores)
    if (amount > 1000000) rate -= 0.01;
    if (amount > 1500000) rate -= 0.005;

    // Ajustes según el plazo (plazos más largos, tasas mayores)
    if (term > 24) rate += 0.005;
    if (term > 36) rate += 0.005;

    return rate;
  }

  // Función para calcular el pago mensual
  function calculateMonthlyPayment(principal: number, rate: number, term: number): number {
    const monthlyRate = rate / 12;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  }

  // Para manejar los cambios en el slider
  const handleValueChange = (value: number[]): void => {
    setAmount(value[0]);
  };

  return (
    <section id="simulator" className="py-24 bg-white relative">
      <div className="container relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
            Precios transparentes
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Calcula tu <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">arrendamiento</span></h2>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg">
            Simula el costo mensual de tu equipo médico o dental en segundos.
          </p>
        </div>

        <Card className="max-w-3xl mx-auto shadow-2xl border border-gray-100 overflow-hidden">
          <CardContent className="p-8 md:p-10">
            <div className="space-y-8">
              {/* Monto del equipo */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-2xl font-medium">Monto del equipo</Label>
                  <span className="text-xl font-semibold text-blue-600">${amount.toLocaleString()}</span>
                </div>
                <div className="px-1">
                  <Slider
                    className="slider"
                    min={10000}
                    max={1000000}
                    step={10000}
                    value={[amount]}
                    onValueChange={([value]) => setAmount(value)}
                  >
                    <div className="slider-track">
                      <div 
                        className="slider-range" 
                        style={{ 
                          width: `${((amount - 10000) / (990000)) * 100}%` 
                        }} 
                      />
                    </div>
                    <div className="slider-thumb" />
                  </Slider>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>$10,000</span>
                    <span>$1,000,000</span>
                  </div>
                </div>
              </div>

              {/* Botones para el plazo */}
              <div className="space-y-4 pt-2">
                <label className="text-2xl font-medium leading-none block mb-4">
                  Plazo del arrendamiento
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {termOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={term === option.value ? "default" : "outline"}
                      onClick={() => setTerm(option.value)}
                      className={`w-full h-12 rounded-lg ${
                        term === option.value 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-300/50' 
                          : 'border-gray-200 text-gray-700 hover:border-blue-200 hover:text-blue-600'
                      }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Resultados */}
              <div className="bg-blue-50 rounded-xl p-6 md:p-8 mt-8 space-y-6 border border-blue-200">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-1">Tu pago mensual sería de</p>
                  <p className="text-5xl font-bold text-blue-600 mb-1">
                    ${Math.round(monthlyPayment).toLocaleString('es-MX')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tasa anual: {(interestRate * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="pt-4">
                  <Link href="/register" className="w-full">
                    <Button className="w-full h-14 text-base font-medium rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-blue-500/25 text-white">
                      Solicitar arrendamiento ahora
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
} 