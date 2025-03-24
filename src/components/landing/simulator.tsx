"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tipos de equipos
const equipmentTypes = [
  { value: "dental", label: "Equipo Dental" },
  { value: "medical", label: "Equipo Médico" },
  { value: "imaging", label: "Equipo de Imagen" },
  { value: "aesthetic", label: "Equipo Estético" },
];

// Plazos disponibles
const termOptions = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "48", label: "48 meses" },
];

export function Simulator() {
  // Estados iniciales
  let equipmentType = "dental";
  let amount = 500000;
  let term = "24";
  
  let setEquipmentType: any;
  let setAmount: any; 
  let setTerm: any;
  
  // Si estamos en el navegador, usamos React.useState
  if (typeof window !== 'undefined') {
    // @ts-ignore - ignora el error de tipado
    const state1 = React.useState("dental");
    equipmentType = state1[0];
    setEquipmentType = state1[1];
    
    // @ts-ignore
    const state2 = React.useState(500000);
    amount = state2[0];
    setAmount = state2[1];
    
    // @ts-ignore
    const state3 = React.useState("24");
    term = state3[0];
    setTerm = state3[1];
  }

  // Cálculos del simulador
  const interestRate = calculateInterestRate(equipmentType, amount, parseInt(term));
  const monthlyPayment = calculateMonthlyPayment(amount, interestRate, parseInt(term));
  const totalPayment = monthlyPayment * parseInt(term);

  // Función para calcular la tasa de interés basada en los parámetros
  function calculateInterestRate(type: string, amount: number, term: number) {
    // Tasas base según el tipo de equipo
    const baseRates: Record<string, number> = {
      dental: 0.14,
      medical: 0.15,
      imaging: 0.16,
      aesthetic: 0.17,
    };

    let rate = baseRates[type] || 0.15;

    // Ajustes según el monto (montos más altos, tasas menores)
    if (amount > 1000000) rate -= 0.01;
    if (amount > 1500000) rate -= 0.005;

    // Ajustes según el plazo (plazos más largos, tasas mayores)
    if (term > 24) rate += 0.005;
    if (term > 36) rate += 0.005;

    return rate;
  }

  // Función para calcular el pago mensual
  function calculateMonthlyPayment(principal: number, rate: number, term: number) {
    const monthlyRate = rate / 12;
    return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  }

  // Para corregir el error de tipado en onValueChange
  const handleValueChange = (value: any) => {
    if (setAmount) setAmount(value[0]);
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
          <CardContent className="p-8 md:p-10 space-y-8">
            {/* Selector de tipo de equipo */}
            <div className="space-y-3">
              <label className="text-base font-medium leading-none">
                Tipo de equipo
              </label>
              <Select
                value={equipmentType}
                onValueChange={setEquipmentType}
              >
                <SelectTrigger className="w-full h-12 rounded-lg border-gray-200">
                  <SelectValue placeholder="Selecciona el tipo de equipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Slider para el monto */}
            <div className="space-y-5 pt-2">
              <div className="flex justify-between">
                <label className="text-base font-medium leading-none">
                  Monto del equipo
                </label>
                <span className="text-base font-bold text-blue-600">
                  ${amount.toLocaleString('es-MX')} MXN
                </span>
              </div>
              <Slider
                value={[amount]}
                min={50000}
                max={2000000}
                step={50000}
                onValueChange={handleValueChange}
                className="py-6"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>$50,000</span>
                <span>$2,000,000</span>
              </div>
            </div>

            {/* Botones para el plazo */}
            <div className="space-y-3 pt-2">
              <label className="text-base font-medium leading-none">
                Plazo del arrendamiento
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {termOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={term === option.value ? "default" : "outline"}
                    onClick={() => setTerm && setTerm(option.value)}
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
            <div className="bg-blue-50 rounded-xl p-6 md:p-8 mt-8 space-y-5 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pago mensual</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ${Math.round(monthlyPayment).toLocaleString('es-MX')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Tasa anual</p>
                  <p className="text-3xl font-bold">{(interestRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total a pagar</p>
                  <p className="text-3xl font-bold">
                    ${Math.round(totalPayment).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <Link href="/register" className="w-full">
                  <Button className="w-full h-14 text-base font-medium rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-blue-500/25 text-white">
                    Solicitar arrendamiento ahora
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
} 