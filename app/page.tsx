"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, TrendingUp, TrendingDown, Target, FileText, 
  Plus, Calendar, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Tag, Settings, X,
  Moon, Sun, Filter, LogOut, Lock, Mail, Bot, Sparkles, Search, Download, Loader2,
  Edit2, Trash2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const CATEGORY_COLORS: any = {
  'Makanan': '#F59E0B', 'Transportasi': '#3B82F6', 'Tagihan': '#EF4444', 
  'Hiburan': '#8B5CF6', 'Lainnya': '#64748B'
};

export default function DompetPintarPro() {
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 

  const [transactions, setTransactions] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan' });
  const [editingId, setEditingId] = useState<string | null>(null); 

  const [initialBalance, setInitialBalance] = useState(0);
  const [targetSaving, setTargetSaving] = useState(25000000);
  const [budgetLimit, setBudgetLimit] = useState(5000000); 
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filterMonth, setFilterMonth] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (!error && data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => { 
    setIsMounted(true);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData();
      setIsCheckingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setSession(session);
        fetchData();
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setTransactions([]);
      }
    });

    const savedBalance = localStorage.getItem('fin_initialBalance');
    const savedTarget = localStorage.getItem('fin_targetSaving');
    const savedBudget = localStorage.getItem('fin_budgetLimit');
    const savedTheme = localStorage.getItem('fin_theme'); 
    
    if (savedBalance) setInitialBalance(Number(savedBalance));
    if (savedTarget) setTargetSaving(Number(savedTarget));
    if (savedBudget) setBudgetLimit(Number(savedBudget));
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isMounted) return; 
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fin_theme', 'light');
    }
  }, [isDarkMode, isMounted]);

  const username = session?.user?.email ? session.user.email.split('@')[0] : '';
  const displayUsername = username.charAt(0).toUpperCase() + username.slice(1);

  // AI Auto-Kategori
  useEffect(() => {
    if (editingId) return; 

    if (formData.type === 'pengeluaran' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('makan') || t.includes('minum') || t.includes('kopi') || t.includes('kfc') || t.includes('mcd') || t.includes('gofood') || t.includes('bakso')) {
        setFormData(prev => ({...prev, category: 'Makanan'}));
      } else if (t.includes('bensin') || t.includes('parkir') || t.includes('gojek') || t.includes('grab') || t.includes('tol') || t.includes('kereta')) {
        setFormData(prev => ({...prev, category: 'Transportasi'}));
      } else if (t.includes('listrik') || t.includes('air') || t.includes('wifi') || t.includes('pulsa') || t.includes('indihome') || t.includes('kos') || t.includes('pajak')) {
        setFormData(prev => ({...prev, category: 'Tagihan'}));
      } else if (t.includes('nonton') || t.includes('netflix') || t.includes('spotify') || t.includes('game') || t.includes('bioskop') || t.includes('jalan')) {
        setFormData(prev => ({...prev, category: 'Hiburan'}));
      }
    } else if (formData.type === 'pemasukan' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('gaji')) setFormData(prev => ({...prev, category: 'Gaji'}));
      else if (t.includes('bonus') || t.includes('thr')) setFormData(prev => ({...prev, category: 'Bonus'}));
      else if (t.includes('investasi') || t.includes('saham') || t.includes('bunga')) setFormData(prev => ({...prev, category: 'Investasi'}));
    }
  }, [formData.title, formData.type, editingId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) alert(error.message);
      else { alert('Registrasi berhasil! Silakan masuk.'); setIsRegistering(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) alert('Login Gagal: ' + error.message);
    }
    setAuthLoading(false);
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: 'demo@dompet.com', password: '123456' });
    if (error) alert('Gagal masuk. Pastikan akun demo sudah terdaftar.');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    setIsCheckingAuth(true); 
    const { error } = await supabase.auth.signOut();
    if (error) alert("Gagal keluar: " + error.message);
    setIsCheckingAuth(false);
  };

  const saveSettings = () => {
    localStorage.setItem('fin_initialBalance', initialBalance.toString());
    localStorage.setItem('fin_targetSaving', targetSaving.toString());
    localStorage.setItem('fin_budgetLimit', budgetLimit.toString());
    setIsEditingSettings(false);
  };

  const handleResetData = async () => {
    if (window.confirm("⚠️ PERINGATAN: Yakin ingin MENGHAPUS SEMUA riwayat transaksi milikmu?")) {
      setIsSubmitting(true);
      const { error } = await supabase.from('transactions').delete().not('id', 'is', null);
      if (!error) {
        localStorage.removeItem('fin_initialBalance');
        localStorage.removeItem('fin_targetSaving');
        localStorage.removeItem('fin_budgetLimit');
        setTransactions([]); setInitialBalance(0); setTargetSaving(25000000); setBudgetLimit(5000000); setIsEditingSettings(false);
      } else alert("Gagal mereset data.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    setIsSubmitting(true);

    if (editingId) {
      const { error } = await supabase.from('transactions').update({
        title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category
      }).eq('id', editingId);
      setIsSubmitting(false);
      if (!error) { setEditingId(null); setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan' }); fetchData(); } 
      else alert("Gagal update data: " + error.message);
    } else {
      const { error } = await supabase.from('transactions').insert([{ 
        title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category
      }]);
      setIsSubmitting(false);
      if (!error) { setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan' }); fetchData(); }
    }
  };

  const handleEditClick = (t: any) => {
    setEditingId(t.id);
    setFormData({ title: t.title, amount: t.amount.toString(), type: t.type, category: t.category });
    document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm("🗑️ Apakah kamu yakin ingin menghapus transaksi ini?")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) fetchData();
      else alert("Gagal menghapus: " + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan' });
  };

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => `${new Date(t.created_at).getFullYear()}-${String(new Date(t.created_at).getMonth() + 1).padStart(2, '0')}`));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterMonth !== 'all') {
      result = result.filter(t => `${new Date(t.created_at).getFullYear()}-${String(new Date(t.created_at).getMonth() + 1).padStart(2, '0')}` === filterMonth);
    }
    if (searchQuery) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [transactions, filterMonth, searchQuery]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const balance = (filterMonth === 'all' ? initialBalance : 0) + income - expense;
    const totalGlobalIncome = transactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalGlobalExpense = transactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalBalance = initialBalance + totalGlobalIncome - totalGlobalExpense;
    const remaining = Math.max(0, targetSaving - globalBalance);
    const sisaBulanan = income - expense;
    const days = (sisaBulanan > 0 && remaining > 0) ? Math.ceil((remaining / (sisaBulanan / 30))) : 0;
    const dailyRec = days > 0 ? Math.floor(remaining / days) : 0;

    return { income, expense, balance, remaining, days, dailyRec };
  }, [filteredTransactions, transactions, targetSaving, initialBalance, filterMonth]);

  const chartData = [
    { name: 'Pemasukan', value: stats.income > 0 ? stats.income : 1, color: '#10B981' },
    { name: 'Pengeluaran', value: stats.expense > 0 ? stats.expense : 1, color: '#F43F5E' },
  ];

  const categoryChartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'pengeluaran');
    const grouped = expenses.reduce((acc: any, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({
      name: key, value: grouped[key], color: CATEGORY_COLORS[key] || '#64748B'
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const aiInsights = useMemo(() => {
    if (filteredTransactions.length === 0) return ["Belum ada aktivitas. Yuk, mulai catat transaksimu!"];
    let insights = [];
    if (budgetLimit > 0) {
      const budgetPercentage = (stats.expense / budgetLimit) * 100;
      if (budgetPercentage >= 100) {
        insights.push("🛑 GAWAT! Pengeluaranmu bulan ini sudah MELEBIHI batas anggaran yang kamu buat!");
      } else if (budgetPercentage > 80) {
        insights.push(`⚠️ Awas! Pengeluaranmu sudah mencapai ${Math.round(budgetPercentage)}% dari batas anggaran bulan ini.`);
      } else {
        insights.push(`👍 Anggaran aman. Sisa jatah pengeluaranmu: ${formatIDR(budgetLimit - stats.expense)}.`);
      }
    }
    if (stats.expense > stats.income && stats.income > 0) {
      insights.push("💸 Pengeluaranmu lebih besar dari pemasukan bulan ini. Rem dulu belanjanya.");
    }
    if (categoryChartData.length > 0) {
      const topCat = categoryChartData[0];
      const percentage = Math.round((topCat.value / stats.expense) * 100);
      if (percentage > 50) {
        insights.push(`💡 Mayoritas uangmu (${percentage}%) habis untuk ${topCat.name}. Coba evaluasi sektor ini.`);
      }
    }
    return insights;
  }, [stats, categoryChartData, budgetLimit, filteredTransactions.length]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("REKAPITULASI DOMPETPINTAR", 14, 20);
    doc.setFontSize(10); doc.text(`Status: ${stats.balance >= 0 ? 'Surplus' : 'Defisit'} | Estimasi Target: ${stats.days} Hari`, 14, 30);
    autoTable(doc, {
      startY: 40, head: [['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah']],
      body: filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title, t.category, t.type.toUpperCase(), formatIDR(Number(t.amount))]),
      theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
    });
    doc.save(`Laporan_Keuangan_${new Date().toLocaleDateString('id-ID')}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah (Rp)'];
    const rows = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleDateString('id-ID'),
      t.title.replace(/,/g, ''), 
      t.category,
      t.type,
      t.amount
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Keuangan_${new Date().toLocaleDateString('id-ID')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!isMounted) return null;

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Menyiapkan DompetPintar...</p>
      </div>
    );
  }

  // --- HALAMAN LOGIN ---
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {isDarkMode ? <Sun size={18} className="text-amber-500"/> : <Moon size={18} className="text-slate-500"/>}
          </button>
          
          <div className="text-center mb-6 sm:mb-8 pt-4">
            <div className={`bg-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 dark:shadow-none transition-all duration-500 ${authLoading ? 'scale-110 shadow-blue-400 animate-pulse' : ''}`}>
              <Wallet size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dompet Pintar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{isRegistering ? 'Buat akun baru untuk mulai menabung' : 'Masuk untuk mengelola keuanganmu'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all">
              <Mail size={20} className="text-slate-400 mr-3 shrink-0" />
              <input required type="email" placeholder="Alamat Email" className="bg-transparent outline-none w-full text-slate-700 dark:text-slate-200" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} disabled={authLoading}/>
            </div>
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all">
              <Lock size={20} className="text-slate-400 mr-3 shrink-0" />
              <input required type="password" placeholder="Password (min 6 karakter)" className="bg-transparent outline-none w-full text-slate-700 dark:text-slate-200" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} disabled={authLoading}/>
            </div>
            
            <button disabled={authLoading} type="submit" className="w-full flex items-center justify-center bg-blue-600 text-white font-bold p-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 mt-4 shadow-lg shadow-blue-200 dark:shadow-none min-h-[56px]">
              {authLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Memproses...</span>
                </div>
              ) : isRegistering ? 'Daftar Sekarang' : 'Masuk Dashboard'}
            </button>
          </form>

          {!isRegistering && (
            <>
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-slate-900 text-slate-400 font-medium">ATAU</span></div></div>
              
              <button onClick={handleDemoLogin} disabled={authLoading} className="w-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold p-4 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95 disabled:opacity-70 border border-emerald-200 dark:border-emerald-800/50 min-h-[56px]">
                {authLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Menghubungkan...</span>
                  </div>
                ) : (
                  <span>🚀 Coba Akun Demo</span>
                )}
              </button>
            </>
          )}
          <div className="mt-8 text-center"><button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{isRegistering ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar gratis!'}</button></div>
        </div>

        {/* FOOTER LOGIN */}
        <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-8 font-medium">
          &copy; {new Date().getFullYear()} Dompet Pintar. By Dewasinarsurya.
        </p>
      </div>
    );
  }

  // --- DASHBOARD UTAMA ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 lg:p-10 font-sans selection:bg-blue-200 relative transition-colors duration-300 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 md:gap-6 w-full">
          <div className="w-full md:w-auto flex justify-between items-start md:items-center shrink-0">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm md:text-base">
                Halo, <span className="text-blue-600 dark:text-blue-400 font-bold">{displayUsername}</span> 👋
              </p>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="md:hidden p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0">
              {isDarkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20} className="text-slate-500"/>}
            </button>
          </div>

          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 md:gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 md:px-4 py-2.5 md:py-3 rounded-xl sm:rounded-2xl shadow-sm w-full md:w-auto">
              <Filter size={18} className="text-slate-400 shrink-0" />
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent outline-none font-bold text-sm text-slate-700 dark:text-slate-200 cursor-pointer w-full">
                <option value="all">Semua Waktu</option>
                {availableMonths.map(m => <option key={m} value={m}>{new Date(m).toLocaleDateString('id-ID', {month: 'short', year: 'numeric'})}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="hidden md:block p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                {isDarkMode ? <Sun size={20} className="text-amber-500"/> : <Moon size={20} className="text-slate-500"/>}
              </button>
              
              <button onClick={() => setIsEditingSettings(true)} className="flex justify-center items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 md:py-3 rounded-xl sm:rounded-2xl shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-800 active:scale-95 text-sm md:text-base w-full sm:w-auto">
                <Settings size={18} /> <span>Atur</span>
              </button>
              
              <button onClick={exportPDF} className="flex justify-center items-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 md:py-3 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:text-blue-600 transition-all active:scale-95 text-sm md:text-base w-full sm:w-auto">
                <FileText size={18} /> <span>PDF</span>
              </button>

              <button onClick={exportCSV} className="flex justify-center items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold px-4 py-2.5 md:py-3 rounded-xl sm:rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all active:scale-95 text-sm md:text-base w-full sm:w-auto">
                <Download size={18} /> <span>Excel</span>
              </button>
              
              <button onClick={handleLogout} className="flex justify-center items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold px-4 py-2.5 md:py-3 rounded-xl sm:rounded-2xl shadow-sm border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all active:scale-95 text-sm md:text-base w-full sm:w-auto">
                <LogOut size={18} /> <span>Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <StatCard title="Saldo Saat Ini" val={stats.balance} icon={<Wallet />} color="text-blue-600 dark:text-blue-400" bg="bg-blue-100 dark:bg-blue-900/40" />
          <StatCard title="Pemasukan" val={stats.income} icon={<ArrowUpRight />} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-100 dark:bg-emerald-900/40" />
          <StatCard title="Pengeluaran" val={stats.expense} icon={<ArrowDownRight />} color="text-rose-600 dark:text-rose-400" bg="bg-rose-100 dark:bg-rose-900/40" />
          <StatCard title="Target Tabungan" val={targetSaving} icon={<Target />} color="text-amber-600 dark:text-amber-400" bg="bg-amber-100 dark:bg-amber-900/40" />
        </div>

        {/* AI INSIGHT CARD */}
        <div className="mb-6 md:mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-200 dark:shadow-none"><Sparkles size={18} /></div>
            <h2 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm md:text-base flex items-center gap-2">Analisis Asisten AI <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Beta</span></h2>
          </div>
          <div className="space-y-2">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Bot size={16} className={`mt-0.5 shrink-0 ${insight.includes('🛑') || insight.includes('⚠️') ? 'text-rose-500' : 'text-indigo-400'}`} />
                <p className={`${insight.includes('🛑') ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-indigo-800/80 dark:text-indigo-200/80'} text-sm md:text-base font-medium leading-snug`}>{insight}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* FORM INPUT (BERUBAH JIKA MODE EDIT) */}
            <section id="formCatat" className={`bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border transition-all relative overflow-hidden ${editingId ? 'border-amber-300 dark:border-amber-500/50 shadow-amber-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-800'}`}>
              {!editingId && <div className="absolute -top-10 -right-10 text-slate-50 dark:text-slate-800/20 rotate-12"><Sparkles size={150} /></div>}
              
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2 text-slate-800 dark:text-white relative z-10">
                {editingId ? <><Edit2 className="text-amber-500"/> Edit Aktivitas</> : <><Plus className="text-blue-500"/> Catat Aktivitas Baru</>}
              </h2>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
                <div>
                  <input required placeholder="Ketik nama transaksi..." className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl sm:rounded-2xl outline-none focus:ring-2 ring-indigo-500/30 border border-slate-100 dark:border-slate-800 w-full transition-all text-sm sm:text-base" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                  {!editingId && <p className="text-[10px] text-indigo-500/70 dark:text-indigo-400/50 mt-1.5 ml-1 flex items-center gap-1"><Sparkles size={10}/> Kategori akan menebak otomatis</p>}
                </div>
                <input required type="number" min="1" placeholder="Jumlah Nominal (Rp)" className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl sm:rounded-2xl outline-none focus:ring-2 ring-blue-500/20 border border-slate-100 dark:border-slate-800 w-full transition-all text-sm sm:text-base h-fit" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                <div className="flex gap-3 md:gap-4 col-span-1 md:col-span-2 flex-col sm:flex-row">
                  <select className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl sm:rounded-2xl outline-none border border-slate-100 dark:border-slate-800 flex-1 font-medium text-slate-700 dark:text-slate-300 transition-all focus:ring-2 ring-blue-500/20 text-sm sm:text-base" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="pengeluaran">💸 Pengeluaran</option>
                    <option value="pemasukan">💰 Pemasukan</option>
                  </select>
                  <div className="relative flex-1">
                    <select className={`${editingId ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300' : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300'} p-4 rounded-xl sm:rounded-2xl outline-none border w-full font-medium transition-all focus:ring-2 ring-indigo-500/30 text-sm sm:text-base appearance-none cursor-pointer`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {formData.type === 'pengeluaran' ? (
                        <><option value="Makanan">🍜 Makanan</option><option value="Transportasi">🚗 Transportasi</option><option value="Tagihan">🧾 Tagihan</option><option value="Hiburan">🎮 Hiburan</option><option value="Lainnya">📦 Lainnya</option></>
                      ) : (
                        <><option value="Gaji">💼 Gaji</option><option value="Bonus">✨ Bonus</option><option value="Investasi">📈 Investasi</option><option value="Lainnya">📦 Lainnya</option></>
                      )}
                    </select>
                    {!editingId && <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400"><Bot size={18}/></div>}
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex gap-2 md:gap-3 mt-1 md:mt-2">
                  <button disabled={isSubmitting} className={`flex-1 text-white font-bold p-4 rounded-xl sm:rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm sm:text-base ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700'}`}>
                    {isSubmitting ? 'Memproses...' : editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl sm:rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base">
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* HISTORY & PENCARIAN */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
              <div className="p-5 md:p-8 border-b border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Calendar className="text-blue-500"/> Riwayat Aktivitas</h2>
                  {loading && <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" />}
                </div>
                <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all">
                  <Search size={18} className="text-slate-400 mr-2 shrink-0" />
                  <input type="text" placeholder="Cari transaksi atau kategori..." className="bg-transparent outline-none w-full text-sm md:text-base text-slate-700 dark:text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="max-h-[350px] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredTransactions.length === 0 && !loading ? (
                  <div className="p-10 md:p-16 text-center text-slate-400 flex flex-col items-center">
                    <Tag size={48} className="mb-4 opacity-20" />
                    <p className="font-medium italic text-sm md:text-base">{searchQuery ? 'Data tidak ditemukan.' : 'Belum ada transaksi.'}</p>
                  </div>
                ) : (
                  filteredTransactions.map((t) => ( 
                    <div key={t.id} className={`p-4 md:p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0 group ${editingId === t.id ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all group-hover:scale-110 ${t.type === 'pemasukan' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                          {t.type === 'pemasukan' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm md:text-base truncate max-w-[120px] sm:max-w-[180px] md:max-w-xs">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 md:mt-1 flex-wrap">
                            <span className="text-[10px] md:text-xs text-slate-400 font-medium">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:block"></span>
                            <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{t.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <p className={`text-sm md:text-lg font-black tracking-tight ${t.type === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'pemasukan' ? '+' : '-'} {formatIDR(Number(t.amount))}
                        </p>
                        <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                          <button onClick={() => handleEditClick(t)} className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 rounded-lg transition-colors" title="Edit Transaksi">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-lg transition-colors" title="Hapus Transaksi">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* CASHFLOW CHART */}
            <section className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-base md:text-lg font-bold mb-4 md:mb-6 flex items-center gap-2 text-slate-800 dark:text-white"><PieIcon size={20} className="text-blue-500"/> Analisis Cashflow</h2>
              <div className="h-48 md:h-56 w-full relative">
                {stats.income === 0 && stats.expense === 0 ? (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">Data belum cukup</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatIDR(value)} contentStyle={{backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 md:mt-6 flex justify-around p-3 md:p-4 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl">
                <div className="text-center">
                  <p className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Pemasukan</p>
                  <p className="text-emerald-500 font-black text-base md:text-lg">{(stats.income/(stats.income+stats.expense || 1) * 100).toFixed(0)}%</p>
                </div>
                <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="text-center">
                  <p className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Pengeluaran</p>
                  <p className="text-rose-500 font-black text-base md:text-lg">{(stats.expense/(stats.income+stats.expense || 1) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </section>

            {/* CATEGORY CHART */}
            <section className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-base md:text-lg font-bold mb-4 md:mb-6 flex items-center gap-2 text-slate-800 dark:text-white"><Tag size={20} className="text-blue-500"/> Alokasi Kategori</h2>
              <div className="h-40 md:h-48 w-full relative">
                {categoryChartData.length === 0 ? (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada pengeluaran</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryChartData} innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                        {categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatIDR(value)} contentStyle={{backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '12px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {categoryChartData.map((item: any, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0" style={{backgroundColor: item.color}}></div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{formatIDR(item.value)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* SMART TRACKER */}
            <section className="relative overflow-hidden bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] text-white shadow-xl shadow-slate-300 dark:shadow-none">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 md:w-32 md:h-32 bg-blue-500 rounded-full blur-[40px] md:blur-[60px] opacity-40"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 md:w-32 md:h-32 bg-emerald-500 rounded-full blur-[40px] md:blur-[60px] opacity-30"></div>

              <div className="relative z-10">
                <h2 className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-2">Estimasi Pengumpulan</h2>
                <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                  <span className="text-4xl md:text-6xl font-black tracking-tighter">{stats.days > 0 ? stats.days : '∞'}</span>
                  <span className="text-slate-400 font-bold text-sm md:text-lg italic">Hari Lagi</span>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <div className="bg-white/10 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm">
                    <p className="text-[9px] md:text-[10px] text-slate-300 font-bold uppercase mb-1 md:mb-2 tracking-widest">Rekomendasi Menabung</p>
                    <p className="text-xl md:text-2xl font-black text-emerald-400 tracking-tight">
                      {stats.days > 0 ? formatIDR(stats.dailyRec) : 'Rp 0'}
                      <span className="text-xs md:text-sm font-medium text-slate-400 ml-1">/ hari</span>
                    </p>
                  </div>

                  <div className="space-y-2 md:space-y-3 pt-1 md:pt-2">
                    <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase tracking-widest">
                      <span className="text-slate-400">Progres Target</span>
                      <span className="text-emerald-400">{Math.min(100, Math.round((stats.balance/targetSaving)*100))}%</span>
                    </div>
                    <div className="h-2.5 md:h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-400 transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, Math.min(100, (stats.balance/targetSaving)*100))}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER DASHBOARD */}
        <footer className="mt-10 md:mt-16 text-center pb-4 md:pb-6">
          <p className="text-slate-400 dark:text-slate-500 text-xs md:text-sm font-medium">
            &copy; {new Date().getFullYear()} Dompet Pintar. By Dewasinarsurya.
          </p>
        </footer>

      </div>

      {/* MODAL SETTINGS */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-white dark:bg-slate-900 pt-2 pb-2 z-10">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Atur Dompet</h3>
              <button onClick={() => setIsEditingSettings(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-5 md:space-y-6">
              <div>
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2 block">Saldo Awal (Rp)</label>
                <p className="text-[10px] md:text-xs text-slate-400 mb-2 md:mb-3">Uang yang sudah kamu miliki saat ini.</p>
                <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 text-base md:text-lg font-bold text-slate-800 dark:text-white" value={initialBalance} onChange={e => setInitialBalance(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 md:mb-2 block">Target Tabungan (Rp)</label>
                <p className="text-[10px] md:text-xs text-slate-400 mb-2 md:mb-3">Goal finansial yang ingin kamu capai.</p>
                <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 text-base md:text-lg font-bold text-slate-800 dark:text-white" value={targetSaving} onChange={e => setTargetSaving(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-bold text-rose-500 uppercase tracking-widest mb-1 md:mb-2 block">Batas Pengeluaran (Rp)</label>
                <p className="text-[10px] md:text-xs text-slate-400 mb-2 md:mb-3">AI akan memperingatkanmu jika pengeluaran bulanan melewati batas ini.</p>
                <input type="number" className="w-full bg-rose-50 dark:bg-rose-950/20 p-3 md:p-4 rounded-xl md:rounded-2xl border border-rose-200 dark:border-rose-800 outline-none focus:ring-2 ring-rose-500/20 text-base md:text-lg font-bold text-rose-800 dark:text-rose-200" value={budgetLimit} onChange={e => setBudgetLimit(Number(e.target.value))} />
              </div>

              <div className="pt-2 space-y-2 md:space-y-3">
                <button onClick={saveSettings} className="w-full bg-blue-600 text-white font-bold py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm md:text-base">Simpan Perubahan</button>
                <button onClick={handleResetData} disabled={isSubmitting} className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50 text-sm md:text-base">{isSubmitting ? 'Menghapus Data...' : 'Hapus Semua Data (Reset)'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        @media (min-width: 768px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}

function StatCard({ title, val, icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-5 hover:-translate-y-1 transition-transform duration-300">
      <div className={`${bg} ${color} p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0`}>{icon}</div>
      <div className="overflow-hidden w-full">
        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1 truncate">{title}</p>
        <p className="text-sm sm:text-base md:text-xl font-black text-slate-800 dark:text-white tracking-tight truncate">{formatIDR(val)}</p>
      </div>
    </div>
  );
}