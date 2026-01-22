
import React, { useState } from 'react';
import { Commission } from '../types';

interface CommissionFormProps {
  onAdd: (commission: Omit<Commission, 'id'>) => void;
  onClose: () => void;
}

export const CommissionForm: React.FC<CommissionFormProps> = ({ onAdd, onClose }) => {
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !clientName || !totalValue || !date || !installments) return;

    onAdd({
      description,
      clientName,
      totalValue: parseFloat(totalValue),
      date,
      installmentCount: parseInt(installments)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Nova Comissão</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Serviço</label>
            <input 
              required
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder="Ex: Consultoria de Marketing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente</label>
            <input 
              required
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data da Venda</label>
              <input 
                required
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Parcelas</label>
            <select 
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              {[1, 2, 3, 4, 5, 6, 12, 18, 24].map(n => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Lançar Comissão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
