"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, Target, FileText, Plus, Calendar, PieChart as PieIcon, 
  ArrowUpRight, ArrowDownRight, Tag, Settings, X, Moon, Sun, Filter, 
  LogOut, Lock, Mail, Bot, Sparkles, Search, Download, Loader2,
  Edit2, Trash2, AlertTriangle, Lightbulb, Zap, CheckCircle2, ArrowUpDown, 
  Activity, Eye, EyeOff, Receipt, ShieldAlert, RefreshCw, Gem, Briefcase,
  AlertOctagon, CreditCard, MessageSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const CATEGORY_COLORS: any = {
  'Makanan': '#F59E0B', 'Transportasi': '#3B82F6', 'Tagihan': '#EF4444', 
  'Belanja': '#EC4899', 'Hiburan': '#8B5CF6', 'Investasi': '#14B8A6', 'Lainnya': '#64748B'
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

  // SETTINGS
  const [initialBalance, setInitialBalance] = useState<number | string>(0);
  const [targetSaving, setTargetSaving] = useState<number | string>(25000000);
  
  // BUDGET PER KATEGORI (MICRO-BUDGETING)
  const [catBudgets, setCatBudgets] = useState<any>({
    Makanan: '', Transportasi: '', Tagihan: '', Belanja: '', Hiburan: '', Lainnya: ''
  });
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filterMonth, setFilterMonth] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); 
  
  const [showBalance, setShowBalance] = useState(true);
  const [aiPersonality, setAiPersonality] = useState('motivator'); 
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null); 

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
      if (event === 'SIGNED_IN') { setSession(session); fetchData(); } 
      else if (event === 'SIGNED_OUT') { setSession(null); setTransactions([]); }
    });

    // Load Settings
    const savedBalance = localStorage.getItem('fin_initialBalance');
    const savedTarget = localStorage.getItem('fin_targetSaving');
    const savedBudgets = localStorage.getItem('fin_catBudgets');
    const savedTheme = localStorage.getItem('fin_theme'); 
    const savedPrivacy = localStorage.getItem('fin_privacy'); 
    const savedPersonality = localStorage.getItem('fin_ai_personality'); 
    
    if (savedBalance) setInitialBalance(Number(savedBalance));
    if (savedTarget) setTargetSaving(Number(savedTarget));
    if (savedBudgets) setCatBudgets(JSON.parse(savedBudgets));
    
    if (savedTheme === 'dark') setIsDarkMode(true);
    if (savedPrivacy === 'hidden') setShowBalance(false);
    if (savedPersonality) setAiPersonality(savedPersonality);

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isMounted) return; 
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('fin_theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('fin_theme', 'light'); }
  }, [isDarkMode, isMounted]);

  const togglePrivacy = () => {
    const newVal = !showBalance;
    setShowBalance(newVal);
    localStorage.setItem('fin_privacy', newVal ? 'visible' : 'hidden');
  };

  const toggleAIPersonality = () => {
    const newVal = aiPersonality === 'motivator' ? 'roasting' : 'motivator';
    setAiPersonality(newVal);
    localStorage.setItem('fin_ai_personality', newVal);
  };

  const displayMoney = (amount: number) => showBalance ? formatIDR(amount) : 'Rp ••••••••';

  const username = session?.user?.email ? session.user.email.split('@')[0] : '';
  const displayUsername = username.charAt(0).toUpperCase() + username.slice(1);

  // AI Auto-Kategori
  useEffect(() => {
    if (editingId) return; 
    if (formData.type === 'pengeluaran' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('emas') || t.includes('saham') || t.includes('reksadana') || t.includes('crypto') || t.includes('bibit') || t.includes('deposito')) {
        setFormData(prev => ({...prev, category: 'Investasi'}));
      } else if (t.includes('makan') || t.includes('minum') || t.includes('kopi') || t.includes('kfc') || t.includes('mcd') || t.includes('gofood') || t.includes('bakso') || t.includes('sate') || t.includes('warteg') || t.includes('indomaret') || t.includes('alfamart') || t.includes('snack')) {
        setFormData(prev => ({...prev, category: 'Makanan'}));
      } else if (t.includes('bensin') || t.includes('parkir') || t.includes('gojek') || t.includes('grab') || t.includes('tol') || t.includes('kereta') || t.includes('pesawat') || t.includes('travel') || t.includes('ojol')) {
        setFormData(prev => ({...prev, category: 'Transportasi'}));
      } else if (t.includes('listrik') || t.includes('air') || t.includes('wifi') || t.includes('pulsa') || t.includes('indihome') || t.includes('kos') || t.includes('pajak') || t.includes('pdam') || t.includes('bpjs') || t.includes('token') || t.includes('cicilan') || t.includes('utang') || t.includes('paylater') || t.includes('netflix') || t.includes('spotify')) {
        setFormData(prev => ({...prev, category: 'Tagihan'}));
      } else if (t.includes('shopee') || t.includes('tokopedia') || t.includes('baju') || t.includes('sepatu') || t.includes('skincare') || t.includes('tiktok') || t.includes('belanja')) {
        setFormData(prev => ({...prev, category: 'Belanja'}));
      } else if (t.includes('nonton') || t.includes('game') || t.includes('bioskop') || t.includes('jalan') || t.includes('liburan') || t.includes('topup')) {
        setFormData(prev => ({...prev, category: 'Hiburan'}));
      }
    } else if (formData.type === 'pemasukan' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('gaji') || t.includes('upah') || t.includes('fee')) setFormData(prev => ({...prev, category: 'Gaji'}));
      else if (t.includes('bonus') || t.includes('thr') || t.includes('hadiah') || t.includes('cashback')) setFormData(prev => ({...prev, category: 'Bonus'}));
      else if (t.includes('jual') || t.includes('profit') || t.includes('dividen') || t.includes('cair')) setFormData(prev => ({...prev, category: 'Investasi'}));
    }
  }, [formData.title, formData.type, editingId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true);
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) alert(error.message); else { alert('Registrasi berhasil! Silakan masuk.'); setIsRegistering(false); }
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
    setIsCheckingAuth(true); const { error } = await supabase.auth.signOut();
    if (error) alert("Gagal keluar: " + error.message); setIsCheckingAuth(false);
  };

  const saveSettings = () => {
    localStorage.setItem('fin_initialBalance', (initialBalance || 0).toString());
    localStorage.setItem('fin_targetSaving', (targetSaving || 0).toString());
    localStorage.setItem('fin_catBudgets', JSON.stringify(catBudgets));
    setIsEditingSettings(false);
  };

  const handleResetData = async () => {
    if (window.confirm("⚠️ PERINGATAN: Yakin ingin MENGHAPUS SEMUA riwayat transaksi milikmu?")) {
      setIsSubmitting(true);
      const { error } = await supabase.from('transactions').delete().not('id', 'is', null);
      if (!error) {
        localStorage.clear(); window.location.reload();
      } else alert("Gagal mereset data.");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!formData.title || !formData.amount) return; setIsSubmitting(true);
    if (editingId) {
      const { error } = await supabase.from('transactions').update({ title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category }).eq('id', editingId);
      setIsSubmitting(false);
      if (!error) { setEditingId(null); setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan' }); fetchData(); } else alert("Gagal update data: " + error.message);
    } else {
      const { error } = await supabase.from('transactions').insert([{ title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category }]);
      setIsSubmitting(false);
      if (!error) { setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan' }); fetchData(); }
    }
  };

  const applyQuickAction = (title: string, amount: string, category: string) => setFormData({ title, amount, type: 'pengeluaran', category });

  const handleEditClick = (t: any) => {
    setEditingId(t.id); setFormData({ title: t.title, amount: t.amount.toString(), type: t.type, category: t.category });
    document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm("🗑️ Apakah kamu yakin ingin menghapus transaksi ini?")) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) fetchData(); else alert("Gagal menghapus: " + error.message);
    }
  };

  const handleCancelEdit = () => { setEditingId(null); setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan' }); };

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => `${new Date(t.created_at).getFullYear()}-${String(new Date(t.created_at).getMonth() + 1).padStart(2, '0')}`));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (filterMonth !== 'all') result = result.filter(t => `${new Date(t.created_at).getFullYear()}-${String(new Date(t.created_at).getMonth() + 1).padStart(2, '0')}` === filterMonth);
    if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'highest') result.sort((a, b) => Number(b.amount) - Number(a.amount));
    else if (sortBy === 'lowest') result.sort((a, b) => Number(a.amount) - Number(b.amount));
    return result;
  }, [transactions, filterMonth, searchQuery, sortBy]);

  // STATISTIK KEKAYAAN, CASHFLOW & LANGGANAN
  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'pemasukan' && t.category !== 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const investmentBought = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const investmentSold = filteredTransactions.filter(t => t.type === 'pemasukan' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalAssets = investmentBought - investmentSold; 

    const totalAllIncome = filteredTransactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const balance = (filterMonth === 'all' ? Number(initialBalance || 0) : 0) + totalAllIncome - expense;
    const netWorth = balance + Math.max(0, totalAssets); 

    const recurringKeywords = ['netflix', 'spotify', 'wifi', 'indihome', 'bpjs', 'listrik', 'air', 'utang', 'cicilan', 'paylater', 'langganan', 'kredit', 'pinjaman', 'kos'];
    const billsTransactions = filteredTransactions.filter(t => 
      t.type === 'pengeluaran' && (t.category === 'Tagihan' || recurringKeywords.some(kw => t.title.toLowerCase().includes(kw)))
    );
    const totalBills = billsTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const globalTotalIncome = transactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalTotalExpense = transactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalBalance = Number(initialBalance || 0) + globalTotalIncome - globalTotalExpense;
    const globalInvBought = transactions.filter(t => t.type === 'pengeluaran' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalInvSold = transactions.filter(t => t.type === 'pemasukan' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalAssets = Math.max(0, globalInvBought - globalInvSold);
    const globalNetWorth = globalBalance + globalAssets;

    return { income, expense, balance, totalAssets, netWorth, totalBills, globalNetWorth, billsTransactions };
  }, [filteredTransactions, transactions, initialBalance, filterMonth]);

  const userLevel = useMemo(() => {
    const nw = stats.globalNetWorth;
    if (nw >= 50000000) return { title: 'Sultan', icon: '👑', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200' };
    if (nw >= 10000000) return { title: 'Master Hemat', icon: '💎', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200' };
    if (nw >= 2000000) return { title: 'Prajurit', icon: '🛡️', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200' };
    return { title: 'Pemula', icon: '🌱', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200' };
  }, [stats.globalNetWorth]);

  const categoryChartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category !== 'Investasi'); 
    const grouped = expenses.reduce((acc: any, curr) => { acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount); return acc; }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key], color: CATEGORY_COLORS[key] || '#64748B' })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const smartInsights = useMemo(() => {
    if (filteredTransactions.length === 0) return [{ type: 'tip', text: aiPersonality === 'motivator' ? "Belum ada aktivitas. Yuk, mulai catat pengeluaran pertamamu!" : "Masih sepi nih. Dompet kosong atau emang malas nyatat?" }];
    let insights = [];
    
    const expensesOnly = filteredTransactions.filter(t => t.type === 'pengeluaran');
    Object.keys(catBudgets).forEach(cat => {
      const budget = Number(catBudgets[cat]);
      if (budget > 0) {
        const spent = expensesOnly.filter(t => t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0);
        if (spent > budget) {
          insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? `Peringatan: Kategori ${cat} sudah melebihi batas. Kamu menghabiskan ${formatIDR(spent)} dari jatah ${formatIDR(budget)}.` : `Woy! Jatah ${cat} udah jebol! Limit cuma ${formatIDR(budget)} tapi lu abisin ${formatIDR(spent)}. Gak bisa nahan nafsu ya?` });
        } else if (spent > budget * 0.8) {
          insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Hati-hati, anggaran ${cat} sudah terpakai ${Math.round((spent/budget)*100)}%. Sisa: ${formatIDR(budget - spent)}.` : `Rem woy! Jatah ${cat} sisa ${formatIDR(budget - spent)} doang. Mau makan batu di akhir bulan?` });
        }
      }
    });

    if (stats.income > 0) {
      const wants = expensesOnly.filter(t => t.category === 'Hiburan' || t.category === 'Belanja').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const wantsPercentage = (wants / stats.income) * 100;
      if (wantsPercentage > 30) insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Pengeluaran Hiburan/Belanja mencapai ${Math.round(wantsPercentage)}%. Coba pelan-pelan ditekan di bawah 30% ya.` : `Gaya elit ekonomi sulit! Masa ${Math.round(wantsPercentage)}% dari pendapatan habis cuma buat foya-foya. Nabung!` });
    }

    const pureExpense = stats.expense - stats.totalAssets;
    if (pureExpense > stats.income && stats.income > 0) {
      insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? "Perhatian: Pengeluaran konsumsimu bulan ini sudah lebih besar dari pemasukan yang ada." : "Minus bang? Uang masuk dikit, gaya selangit. Kurang-kurangin jajan!" });
    }
    
    if(insights.length === 0) insights.push({ type: 'success', text: "Semua indikator keuanganmu sangat sehat bulan ini. Terus pertahankan prestasimu!" });
    
    return insights;
  }, [stats, catBudgets, filteredTransactions, aiPersonality]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("Laporan Bulanan", 14, 22);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const periodText = filterMonth === 'all' ? 'Semua Waktu' : new Date(`${filterMonth}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    doc.text(`Periode: ${periodText}  |  Dibuat pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 32);

    doc.setTextColor(51, 65, 85); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("RINGKASAN KEKAYAAN & CASHFLOW:", 14, 52);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Total Pemasukan`, 14, 60); doc.text(`:  ${formatIDR(stats.income)}`, 50, 60);
    doc.text(`Total Pengeluaran`, 14, 66); doc.text(`:  ${formatIDR(stats.expense)}`, 50, 66);
    doc.setFont("helvetica", "bold"); doc.setTextColor(20, 184, 166); 
    doc.text(`Total Aset (Investasi)`, 14, 74); doc.text(`:  ${formatIDR(stats.totalAssets)}`, 50, 74);
    
    doc.setTextColor(stats.netWorth >= 0 ? 16 : 225, stats.netWorth >= 0 ? 185 : 29, stats.netWorth >= 0 ? 129 : 72); 
    doc.text(`TOTAL KEKAYAAN`, 14, 82); doc.text(`:  ${formatIDR(stats.netWorth)}`, 50, 82);

    autoTable(doc, {
      startY: 90, head: [['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah (Rp)']],
      body: filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title, t.category, t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran', new Intl.NumberFormat('id-ID').format(Number(t.amount))]),
      theme: 'grid', headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 4: { halign: 'right', cellWidth: 40 } }, styles: { fontSize: 9, cellPadding: 3 }, alternateRowStyles: { fillColor: [248, 250, 252] } 
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(`Halaman ${i} dari ${pageCount} - DompetPintar`, 105, 285, { align: 'center' }); }
    doc.save(`Laporan_Keuangan_${filterMonth}_${Date.now()}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah (Rp)'];
    const rows = filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title.replace(/,/g, ''), t.category, t.type, t.amount]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a");
    link.setAttribute("href", encodedUri); link.setAttribute("download", `Data_Keuangan_${new Date().toLocaleDateString('id-ID')}.csv`);
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

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 relative z-10">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Sun size={18} className="text-amber-500"/></button>
          
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
            <button disabled={authLoading} type="submit" className="w-full flex items-center justify-center bg-blue-600 text-white font-bold p-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 min-h-[56px] shadow-lg">
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? 'Daftar Sekarang' : 'Masuk Dashboard'}
            </button>
          </form>

          {!isRegistering && (
            <>
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-slate-900 text-slate-400 font-medium">ATAU</span></div></div>
              <button onClick={handleDemoLogin} disabled={authLoading} className="w-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold p-4 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95 min-h-[56px] border border-emerald-200">
                🚀 Coba Akun Demo
              </button>
            </>
          )}
          <div className="mt-8 text-center"><button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{isRegistering ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar gratis!'}</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 lg:p-10 font-sans selection:bg-blue-200 relative transition-colors duration-300 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 md:gap-6 w-full">
          <div className="w-full md:w-auto flex justify-between items-start md:items-center shrink-0">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Dompet Digital</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">Halo, <span className="text-blue-600 dark:text-blue-400 font-bold">{displayUsername}</span> 👋</p>
                <span className={`flex items-center gap-1 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border ${userLevel.color}`}>
                  {userLevel.icon} {userLevel.title}
                </span>
              </div>
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
                <FileText size={18} /> <span>PDF Bulanan</span>
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

        {/* 1. HERO: KEKAYAAN & KAS TUNAI SEPARATED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 mb-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 rounded-[2rem] shadow-lg shadow-blue-200 dark:shadow-none text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Total Kekayaan (Tunai + Aset)</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">{displayMoney(stats.netWorth)}</h2>
                  <button onClick={togglePrivacy} className="text-blue-300 hover:text-white transition-colors">{showBalance ? <Eye size={20} /> : <EyeOff size={20} />}</button>
                </div>
              </div>
              <Briefcase size={40} className="text-white opacity-20 hidden sm:block" />
            </div>
            
            <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-blue-200 font-bold mb-1 flex items-center gap-1"><Wallet size={12}/> Tabungan Kas</p>
                <p className="font-black text-sm md:text-lg">{displayMoney(stats.balance)}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-teal-400/30">
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-teal-200 font-bold mb-1 flex items-center gap-1"><Gem size={12}/> Aset Investasi</p>
                <p className="font-black text-sm md:text-lg text-teal-100">{displayMoney(stats.totalAssets)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 dark:text-white text-base md:text-lg flex items-center gap-2"><Target className="text-amber-500"/> Target Tabungan</h3>
              <p className="text-sm font-black text-amber-500">{Math.min(100, Math.round((stats.netWorth/Number(targetSaving || 1))*100))}%</p>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mb-4">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, Math.min(100, (stats.netWorth/Number(targetSaving || 1))*100))}%` }} />
            </div>
            <div className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex justify-between"><span>Terkumpul (Kekayaan):</span> <span className="font-bold text-slate-800 dark:text-slate-200">{displayMoney(stats.netWorth)}</span></div>
              <div className="flex justify-between"><span>Target Impian:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{displayMoney(Number(targetSaving))}</span></div>
            </div>
          </div>
        </div>


        {/* ======================================================== */}
        {/* 2. BAGIAN AI (PINDAH KE ATAS AGAR MUDAH DIBACA VIA HP)   */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
          
          {/* RADAR TAGIHAN */}
          <div className="bg-slate-900 border border-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-xl text-white relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-rose-500 rounded-full blur-[40px] opacity-20"></div>
            <div className="flex items-center gap-2 text-rose-400 mb-4 relative z-10">
              <CreditCard size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">Radar Tagihan Tetap</h3>
            </div>
            <div className="mb-4 relative z-10">
              <p className="text-[10px] text-slate-400 mb-1">Total Biaya & Cicilan Bulan Ini</p>
              <p className="text-3xl font-black text-white">{displayMoney(stats.totalBills)}</p>
            </div>
            
            <div className="space-y-2 relative z-10 flex-grow">
              {stats.billsTransactions.length === 0 ? (
                 <p className="text-xs text-slate-500 italic mt-2">Aman! Tidak ada tagihan terdeteksi.</p>
              ) : (
                stats.billsTransactions.slice(0, 4).map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center text-xs bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="font-medium text-slate-300 truncate max-w-[120px]">{t.title}</span>
                    <span className="font-bold text-rose-400">{formatIDR(Number(t.amount))}</span>
                  </div>
                ))
              )}
              {stats.billsTransactions.length > 4 && <p className="text-[10px] text-center text-slate-500 mt-2 pt-2">Dan {stats.billsTransactions.length - 4} tagihan lainnya...</p>}
            </div>
          </div>

          {/* AI KEPRIBADIAN (MOTIVATOR/ROASTING) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden">
            {/* Latar Belakang Ornamen */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none ${aiPersonality === 'roasting' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl text-white shadow-md ${aiPersonality === 'roasting' ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                  {aiPersonality === 'roasting' ? <ShieldAlert size={24} /> : <Bot size={24} />}
                </div>
                <div>
                  <h2 className={`font-black text-base md:text-lg flex items-center gap-2 ${aiPersonality === 'roasting' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    Asisten AI Pintar <Sparkles size={14}/>
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium">Mendeteksi anomali & memberi masukan</p>
                </div>
              </div>
              <button onClick={toggleAIPersonality} className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border ${aiPersonality === 'roasting' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50'}`}>
                <RefreshCw size={12} /> Mode: {aiPersonality}
              </button>
            </div>
            
            {/* Tampilan Chat AI */}
            <div className="space-y-3 relative z-10 custom-scrollbar overflow-y-auto max-h-[200px] md:max-h-none pr-2">
              {smartInsights.map((insight, idx) => {
                let boxStyle = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/50";
                if (insight.type === 'danger') boxStyle = "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800/50";
                else if (insight.type === 'success') boxStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800/50";
                else if (insight.type === 'info') boxStyle = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800/50";
                
                return (
                  <div key={idx} className="flex items-start gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                      <MessageSquare size={14} className="text-slate-500" />
                    </div>
                    <div className={`p-3 md:p-4 rounded-2xl rounded-tl-sm border ${boxStyle} shadow-sm w-full`}>
                      <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* ======================================================== */}


        {/* MAIN LAYOUT: KIRI (INPUT & RIWAYAT), KANAN (CHART & BUDGETING) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* KOLOM KIRI (KONTEN UTAMA) */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* FORM INPUT PENCATATAN */}
            <section id="formCatat" className={`bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border transition-all relative overflow-hidden ${editingId ? 'border-amber-300 dark:border-amber-500/50 shadow-amber-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-800'}`}>
              {!editingId && <div className="absolute -top-10 -right-10 text-slate-50 dark:text-slate-800/20 rotate-12"><Sparkles size={150} /></div>}
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 md:mb-6 relative z-10">
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  {editingId ? <><Edit2 className="text-amber-500"/> Edit Aktivitas</> : <><Plus className="text-blue-500"/> Catat Aktivitas</>}
                </h2>
                {!editingId && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => applyQuickAction('Beli Emas Antam', '1500000', 'Investasi')} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center gap-1">💎 Invest</button>
                    <button onClick={() => applyQuickAction('Bayar WiFi', '350000', 'Tagihan')} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">🧾 Tagihan</button>
                    <button onClick={() => applyQuickAction('Makan Siang', '25000', 'Makanan')} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">🍛 Makan</button>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
                <div>
                  <input required placeholder="Ketik (misal: Beli Emas, Netflix...)" className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl sm:rounded-2xl outline-none focus:ring-2 ring-indigo-500/30 border border-slate-100 dark:border-slate-800 w-full transition-all text-sm sm:text-base" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <input required type="number" placeholder="Jumlah Nominal Angka" className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl sm:rounded-2xl outline-none focus:ring-2 ring-blue-500/20 border border-slate-100 dark:border-slate-800 w-full transition-all text-sm sm:text-base h-fit font-bold text-slate-800 dark:text-white" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  {formData.amount && <p className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-bold mt-1.5 ml-1">Terbaca: {formatIDR(Number(formData.amount))}</p>}
                </div>
                <div className="flex gap-3 md:gap-4 col-span-1 md:col-span-2 flex-col sm:flex-row">
                  <select className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl sm:rounded-2xl outline-none border border-slate-100 dark:border-slate-800 flex-1 font-medium text-slate-700 dark:text-slate-300 transition-all focus:ring-2 ring-blue-500/20 text-sm sm:text-base" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="pengeluaran">💸 Pengeluaran / Beli Aset</option>
                    <option value="pemasukan">💰 Pemasukan Kas</option>
                  </select>
                  <div className="relative flex-1">
                    <select className={`${editingId ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300' : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300'} p-4 rounded-xl sm:rounded-2xl outline-none border w-full font-medium transition-all focus:ring-2 ring-indigo-500/30 text-sm sm:text-base appearance-none cursor-pointer`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {formData.type === 'pengeluaran' ? <><option value="Makanan">🍜 Makanan</option><option value="Transportasi">🚗 Transportasi</option><option value="Tagihan">🧾 Tagihan (Bills)</option><option value="Belanja">🛍️ Belanja</option><option value="Hiburan">🎮 Hiburan</option><option value="Investasi" className="font-bold text-teal-600">📈 Investasi (Aset)</option><option value="Lainnya">📦 Lainnya</option></> : <><option value="Gaji">💼 Gaji</option><option value="Bonus">✨ Bonus</option><option value="Investasi" className="font-bold text-teal-600">📉 Jual Investasi</option><option value="Lainnya">📦 Lainnya</option></>}
                    </select>
                    {!editingId && <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400"><Bot size={18}/></div>}
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex gap-2 md:gap-3 mt-1 md:mt-2">
                  <button disabled={isSubmitting} className={`flex-1 text-white font-bold p-4 rounded-xl sm:rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm sm:text-base shadow-md ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none' : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 shadow-slate-300 dark:shadow-none'}`}>
                    {isSubmitting ? 'Memproses...' : editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
                  </button>
                  {editingId && <button type="button" onClick={handleCancelEdit} className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl sm:rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base">Batal</button>}
                </div>
              </form>
            </section>

            {/* HISTORY (RIWAYAT) */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
              <div className="p-5 md:p-8 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Calendar className="text-blue-500"/> Riwayat Aktivitas</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <div className="flex flex-1 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all shadow-sm">
                    <Search size={18} className="text-slate-400 mr-2 shrink-0" />
                    <input type="text" placeholder="Cari transaksi..." className="bg-transparent outline-none w-full text-sm md:text-base text-slate-700 dark:text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="flex items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all shadow-sm">
                    <ArrowUpDown size={18} className="text-slate-400 mr-2 shrink-0" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent outline-none w-full text-sm md:text-base text-slate-700 dark:text-slate-200 cursor-pointer">
                      <option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="highest">Terbesar</option><option value="lowest">Terkecil</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                {filteredTransactions.length === 0 ? (
                  <div className="p-10 text-center text-slate-400"><p className="font-medium italic">Belum ada transaksi.</p></div>
                ) : (
                  filteredTransactions.map((t) => ( 
                    <div key={t.id} className={`m-2 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all ${editingId === t.id ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200' : 'bg-white dark:bg-slate-900'}`}>
                      
                      <div className="flex items-center gap-3 md:gap-4 mb-3 sm:mb-0">
                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${t.type === 'pemasukan' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : t.category === 'Investasi' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                          {t.type === 'pemasukan' ? <ArrowUpRight size={18}/> : t.category === 'Investasi' ? <Gem size={18}/> : <ArrowDownRight size={18}/>}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm md:text-base truncate max-w-[200px]">{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 md:mt-1 flex-wrap">
                            <span className="text-[10px] md:text-xs text-slate-400 font-medium">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="text-[10px] md:text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{t.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 w-full sm:w-auto">
                        <p className={`text-sm md:text-lg font-black tracking-tight ${t.type === 'pemasukan' ? 'text-emerald-500' : t.category === 'Investasi' ? 'text-teal-500' : 'text-rose-500'}`}>
                          {t.type === 'pemasukan' ? '+' : '-'} {displayMoney(Number(t.amount))}
                        </p>
                        
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedReceipt(t)} className="px-2 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg flex items-center gap-1 transition-colors border border-blue-100 dark:border-blue-800/50" title="Lihat Struk Digital">
                            <Receipt size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Struk</span>
                          </button>
                          
                          <button onClick={() => handleEditClick(t)} className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg transition-colors border border-amber-100 dark:border-amber-800/50" title="Edit Transaksi"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg transition-colors border border-rose-100 dark:border-rose-800/50" title="Hapus Transaksi"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN (CHART & MICRO-BUDGETING) */}
          <div className="space-y-6 md:space-y-8">
            
            {/* VISUAL TRACKER MICRO-BUDGETING */}
            <section className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base md:text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white"><AlertOctagon className="text-rose-500"/> Batas Anggaran</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1">Peringatan limit kategori (Micro-budgeting)</p>
                </div>
                <button onClick={() => setIsEditingSettings(true)} className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-colors">Ubah Batas</button>
              </div>

              <div className="space-y-4">
                {Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-800">
                    Belum ada batas anggaran yang diatur. Klik <b>Ubah Batas</b>.
                  </div>
                ) : (
                  Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).map(cat => {
                    const limit = Number(catBudgets[cat]);
                    const spent = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0);
                    const percent = Math.min(100, Math.round((spent / limit) * 100));
                    const isDanger = spent > limit;
                    const isWarning = spent > limit * 0.8 && !isDanger;
                    
                    return (
                      <div key={cat} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">{cat} {isDanger && <AlertTriangle size={14} className="text-rose-500 animate-pulse"/>}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{formatIDR(spent)} / {formatIDR(limit)}</p>
                          </div>
                          <span className={`text-xs font-black ${isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }} />
                        </div>
                        {isDanger && <p className="text-[10px] text-rose-500 mt-2 font-bold bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded inline-block">⚠️ Batas terlewati {formatIDR(spent - limit)}!</p>}
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            {/* CATEGORY CHART (KONSUMSI ONLY) */}
            <section className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-base md:text-lg font-bold mb-1 flex items-center gap-2 text-slate-800 dark:text-white"><Tag size={20} className="text-blue-500"/> Alokasi Konsumsi</h2>
              <p className="text-[10px] text-slate-400 mb-4">*Di luar Aset Investasi</p>
              
              <div className="h-40 md:h-48 w-full relative">
                {categoryChartData.length === 0 ? (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">Belum ada pengeluaran</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                    <PieChart>
                      <Pie data={categoryChartData} innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                        {categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '12px'}} />
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
                    <span className="font-bold text-slate-800 dark:text-white">{displayMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

      </div>

      {/* POPUP STRUK DIGITAL E-RECEIPT */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-[#1e293b] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className={`p-6 text-center ${selectedReceipt.type === 'pemasukan' ? 'bg-emerald-500' : selectedReceipt.category === 'Investasi' ? 'bg-teal-500' : 'bg-rose-500'} text-white`}>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                {selectedReceipt.type === 'pemasukan' ? <ArrowUpRight size={24}/> : selectedReceipt.category === 'Investasi' ? <Gem size={24}/> : <ArrowDownRight size={24}/>}
              </div>
              <h3 className="font-black text-xl tracking-wide uppercase">Transaksi Berhasil</h3>
              <p className="text-white/80 text-xs mt-1 font-medium">{new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 relative">
              <div className="absolute top-0 left-0 right-0 h-3 flex justify-between px-2 -mt-1.5 z-10">{[...Array(15)].map((_, i) => <div key={i} className="w-3 h-3 bg-white dark:bg-slate-900 rounded-full" />)}</div>
              <div className="text-center mb-6 mt-2">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total {selectedReceipt.type}</p>
                <p className={`text-3xl font-black ${selectedReceipt.type === 'pemasukan' ? 'text-emerald-500' : selectedReceipt.category === 'Investasi' ? 'text-teal-500' : 'text-rose-500'}`}>
                  {formatIDR(Number(selectedReceipt.amount))}
                </p>
              </div>
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 py-4 space-y-4">
                <div className="flex justify-between items-start"><span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Keterangan</span><span className="text-slate-800 dark:text-slate-200 text-sm font-bold text-right max-w-[60%]">{selectedReceipt.title}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Kategori</span><span className="text-slate-800 dark:text-slate-200 text-sm font-bold">{selectedReceipt.category}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ref ID</span><span className="text-slate-800 dark:text-slate-200 text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{selectedReceipt.id.split('-')[0].toUpperCase()}</span></div>
              </div>
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-6 pb-2 text-center">
                <div className="h-10 w-full flex justify-center gap-1 opacity-50 dark:opacity-30">{[...Array(30)].map((_, i) => <div key={i} className="bg-black dark:bg-white h-full" style={{ width: `${Math.random() * 4 + 1}px` }} />)}</div>
                <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-widest uppercase">DompetPintar By Dewasinarsurya</p>
              </div>
            </div>
            <button onClick={() => setSelectedReceipt(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-sm transition-all"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* MODAL SETTINGS PENGATURAN (PURE NUMBER) */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-white dark:bg-slate-900 pt-2 pb-2 z-10 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Pengaturan Lanjutan</h3>
              <button onClick={() => setIsEditingSettings(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* KOLOM KIRI: PENGATURAN UMUM */}
              <div className="space-y-5">
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Wallet size={18} className="text-blue-500"/> Data Dasar</h4>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Saldo Kas Tunai Awal</label>
                  <input type="number" placeholder="Contoh: 1000000" className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 font-bold text-slate-800 dark:text-white" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
                  {initialBalance && <p className="text-[10px] text-blue-500 mt-1 font-bold">Terbaca: {formatIDR(Number(initialBalance))}</p>}
                </div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Target Kekayaan Impian</label>
                  <input type="number" placeholder="Contoh: 50000000" className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 font-bold text-slate-800 dark:text-white" value={targetSaving} onChange={e => setTargetSaving(e.target.value)} />
                  {targetSaving && <p className="text-[10px] text-blue-500 mt-1 font-bold">Terbaca: {formatIDR(Number(targetSaving))}</p>}
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={handleResetData} disabled={isSubmitting} className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold py-3 rounded-xl hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50 text-sm">Hapus Semua Data (Reset)</button>
                </div>
              </div>

              {/* KOLOM KANAN: MICRO BUDGETING */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1"><AlertOctagon size={18} className="text-rose-500"/> Batas Anggaran Kategori</h4>
                  <p className="text-[10px] text-slate-400 mb-4">Isi dengan angka saja. Kosongkan jika tidak dibatasi.</p>
                </div>
                
                {['Makanan', 'Tagihan', 'Transportasi', 'Belanja', 'Hiburan'].map((cat) => (
                  <div key={cat} className="flex flex-col bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-24 shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</div>
                      <input type="number" placeholder="Tanpa batas" className="w-full bg-transparent p-2 outline-none font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 transition-colors" value={catBudgets[cat]} onChange={e => setCatBudgets({...catBudgets, [cat]: e.target.value})} />
                    </div>
                    {catBudgets[cat] && <p className="text-[10px] text-blue-500 text-right mt-1 font-bold">Batas: {formatIDR(Number(catBudgets[cat]))}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={saveSettings} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">Simpan Pengaturan</button>
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
        <p className="text-sm sm:text-base md:text-xl font-black text-slate-800 dark:text-white tracking-tight truncate">{val}</p>
      </div>
    </div>
  );
}