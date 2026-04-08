import React, { useState, useEffect } from 'react';
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { toast } from 'react-toastify';
import './animations.css';

function CrearTienda() {
  const [sub_dominio, setSubDominio] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  const evaluarSeguridad = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score <= 3 ? 'Baja' : score === 4 ? 'Media' : 'Alta';
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">
        <h1>Test</h1>
      </div>
    </div>
  );
}

export default CrearTienda;
