
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Commission, 
  Installment, 
  InstallmentStatus 
} from './types';
import { 
  formatCurrency, 
  formatDate, 
  getMonthYear 
} from './utils/formatters';
import { SummaryCard } from './components/SummaryCard';
import { CommissionForm } from './components/CommissionForm';
import { getFinancialInsights } from './services/geminiService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const App: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>(() => {
    const saved = localStorage.getItem('comissio_commissions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [installments, setInstallments] = useState<Installment[]>(() => {
    const saved = localStorage.getItem('comissio_installments');
    return saved ? JSON.parse(saved) : [];
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    localStorage.setItem('comissio_commissions', JSON.stringify(commissions));
  }, [commissions]);

  useEffect(() => {
    localStorage.setItem('comissio_installments', JSON.stringify(installments));
  }, [installments]);

  const handleAddCommission = (data: Omit<Commission, 'id'>) => {
    const newCommissionId = crypto.randomUUID();
    const newCommission: Commission = { ...data, id: newCommissionId };
    
    const newInstallments: Installment[] = [];
    const installmentValue = data.totalValue / data.installmentCount;
    const baseDate = new Date(data.date);

    for (let i = 1; i <= data.installmentCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + (i - 1));
      
      newInstallments.push({
        id: crypto.randomUUID(),
        commissionId: newCommissionId,
        number: i,
        totalInstallments: data.installmentCount,
        value: installmentValue,
        dueDate: dueDate.toISOString(),
        status: InstallmentStatus.PENDING
      });
    }

    setCommissions(prev => [newCommission, ...prev]);
    setInstallments(prev => [...prev, ...newInstallments]);
  };

  const toggleInstallmentStatus = (id: string) => {
    setInstallments(prev => prev.map(inst => {
      if (inst.id === id) {
        return {
          ...inst,
          status: inst.status === InstallmentStatus.PAID ? InstallmentStatus.PENDING : InstallmentStatus.PAID
        };
      }
      return inst;
    }));
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalExpected = installments.reduce((acc, curr) => acc + curr.value, 0);
    const totalReceived = installments
      .filter(i => i.status === InstallmentStatus.PAID)
      .reduce((acc, curr) => acc + curr.value, 0);
    
    const monthlyData = installments.filter(inst => {
      const d = new Date(inst.dueDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthRevenue = monthlyData.reduce((acc, curr) => acc + curr.value, 0);
    const monthPending = monthlyData
      .filter(i => i.status === InstallmentStatus.PENDING)
      .reduce((acc, curr) => acc + curr.value, 0);

    return {
      totalExpected,
      totalReceived,
      monthRevenue,
      monthPending
    };
  }, [installments]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, { month: string; value: number }> = {};
    
    // Last 6 months and next 6 months projection
    const today = new Date();
    for (let i = -3; i <= 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      dataMap[key] = { month: getMonthYear(d.toISOString()), value: 0 };
    }

    installments.forEach(inst => {
      const d = new Date(inst.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap[key]) {
        dataMap[key].value += inst.value;
      }
    });

    return Object.values(dataMap);
  }, [installments]);

  const groupedInstallments = useMemo(() => {
    const groups: Record<string, Installment[]> = {};
    
    // Only future and current month installments
    const today = new Date();
    today.setDate(1); // Start of month

    installments
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .forEach(inst => {
        const monthKey = getMonthYear(inst.dueDate);
        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(inst);
      });
    
    return groups;
  }, [installments]);

  const fetchInsights = async () => {
    setLoadingInsight(true);
    const insight = await getFinancialInsights(commissions, installments);
    setAiInsight(insight);
    setLoadingInsight(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Comissio
            </h1>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nova Comissão
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard 
            title="Total em Carteira" 
            value={stats.totalExpected} 
            color="bg-indigo-100 text-indigo-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 8V7m0 1v1m0 0v1m0-1H11m1 0h1m-7 8a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>}
          />
          <SummaryCard 
            title="Recebido Total" 
            value={stats.totalReceived} 
            color="bg-emerald-100 text-emerald-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 01-18 0z" /></svg>}
          />
          <SummaryCard 
            title="Projeção do Mês" 
            value={stats.monthRevenue} 
            color="bg-purple-100 text-purple-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <SummaryCard 
            title="Pendente no Mês" 
            value={stats.monthPending} 
            color="bg-amber-100 text-amber-600"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 01-18 0z" /></svg>}
          />
        </section>

        {/* Chart & AI Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo de Caixa (Realizado + Projetado)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10}}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(val: number) => [formatCurrency(val), 'Comissão']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Insights da IA
              </h3>
              {loadingInsight ? (
                <div className="flex items-center gap-2 animate-pulse text-indigo-300">
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-200"></div>
                  <span className="text-sm">Analisando suas vendas...</span>
                </div>
              ) : aiInsight ? (
                <p className="text-indigo-100 text-sm leading-relaxed whitespace-pre-line">{aiInsight}</p>
              ) : (
                <p className="text-indigo-200 text-sm">Pronto para analisar sua performance e dar dicas personalizadas.</p>
              )}
            </div>
            <button 
              onClick={fetchInsights}
              disabled={loadingInsight || commissions.length === 0}
              className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all font-medium text-sm backdrop-blur-sm disabled:opacity-50"
            >
              {aiInsight ? 'Recalcular Insights' : 'Gerar Análise'}
            </button>
          </div>
        </section>

        {/* Statement (Extrato) style list */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Extrato de Comissões</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.entries(groupedInstallments).length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p>Nenhuma comissão lançada ainda.</p>
              </div>
            ) : (
              // Added type assertion to Object.entries to fix 'unknown' type inference on insts
              (Object.entries(groupedInstallments) as [string, Installment[]][]).map(([month, insts]) => (
                <div key={month} className="group">
                  <div className="bg-slate-50 px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    <span>{month}</span>
                    <span className="text-slate-400">{insts.length} lançamentos</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {/* Fixed: insts is now correctly typed via the cast above */}
                    {insts.map((inst) => {
                      const commission = commissions.find(c => c.id === inst.commissionId);
                      return (
                        <div key={inst.id} className="p-4 sm:px-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center ${inst.status === InstallmentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM12 8V7m0 1v1m0 0v1m0-1H11m1 0h1m-7 8a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{commission?.description}</p>
                              <p className="text-xs text-slate-400">
                                {commission?.clientName} • Parcela {inst.number}/{inst.totalInstallments} • {formatDate(inst.dueDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className={`text-sm font-bold ${inst.status === InstallmentStatus.PAID ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {formatCurrency(inst.value)}
                            </span>
                            <button 
                              onClick={() => toggleInstallmentStatus(inst.id)}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-all ${
                                inst.status === InstallmentStatus.PAID 
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                : 'bg-slate-200 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600'
                              }`}
                            >
                              {inst.status === InstallmentStatus.PAID ? 'Pago' : 'Marcar Pago'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Mobile Sticky Add Button */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <button 
          onClick={() => setIsFormOpen(true)}
          className="w-14 h-14 bg-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isFormOpen && (
        <CommissionForm 
          onAdd={handleAddCommission} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
