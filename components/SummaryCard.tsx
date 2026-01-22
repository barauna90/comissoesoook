
import React from 'react';
import { formatCurrency } from '../utils/formatters';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, description }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(value)}</h3>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
    </div>
  );
};
