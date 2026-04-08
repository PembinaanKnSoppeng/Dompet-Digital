/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, Target, FileText, Plus, Calendar, PieChart as PieIcon, 
  ArrowUpRight, ArrowDownRight, Tag, Settings, X, Moon, Sun, Filter, 
  LogOut, Lock, Mail, Bot, Sparkles, Search, Download, Loader2,
  Edit2, Trash2, AlertTriangle, Lightbulb, Zap, CheckCircle2, ArrowUpDown, 
  Activity, Eye, EyeOff, Receipt, ShieldAlert, RefreshCw, Gem, Briefcase,
  AlertOctagon, CreditCard, MessageSquare, Landmark, Copy, CalendarSearch
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// UPDATE: Penambahan warna untuk kategori baru agar tidak error di Chart
const CATEGORY_COLORS: any = {
  'Makanan': '#F59E0B', 'Transportasi': '#3B82F6', 'Tagihan': '#EF4444', 
  'Belanja': '#EC4899', 'Hiburan': '#8B5CF6', 'Investasi': '#14B8A6', 
  'SPPD': '#F97316', 'Beri Hutang': '#64748B', 'Bayar Pinjaman': '#64748B', 
  'Gaji Pokok': '#10B981', 'Tukin': '#3B82F6', 'Uang Makan': '#F59E0B',
  'Bonus': '#8B5CF6', 'Dibayar Hutang': '#64748B', 'Terima Pinjaman': '#64748B',
  'Lainnya': '#94A3B8'
};

const WALLET_OPTIONS = ['Kas Tunai', 'Mandiri', 'BRI', 'BCA', 'BNI', 'BSI', 'GoPay', 'OVO', 'DANA', 'Lainnya'];

export default function DompetPintarPro() {
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 

  const [transactions, setTransactions] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai' });
  const [editingId, setEditingId] = useState<string | null>(null); 

  const [initialBalance, setInitialBalance] = useState<number | string>(0);
  const [targetSaving, setTargetSaving] = useState<number | string>(25000000);
  const [catBudgets, setCatBudgets] = useState<any>({ Makanan: '', Transportasi: '', Tagihan: '', Belanja: '', Hiburan: '', Lainnya: '' });
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [filterMode, setFilterMode] = useState('month');
  const [filterMonth, setFilterMonth] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
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
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchData(); setIsCheckingAuth(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') { setSession(session); fetchData(); } else if (event === 'SIGNED_OUT') { setSession(null); setTransactions([]); }
    });

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

    const now = new Date();
    setCustomStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    setCustomEndDate(now.toISOString().split('T')[0]);

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isMounted) return; 
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('fin_theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('fin_theme', 'light'); }
  }, [isDarkMode, isMounted]);

  const togglePrivacy = () => { const newVal = !showBalance; setShowBalance(newVal); localStorage.setItem('fin_privacy', newVal ? 'visible' : 'hidden'); };
  const toggleAIPersonality = () => { const newVal = aiPersonality === 'motivator' ? 'roasting' : 'motivator'; setAiPersonality(newVal); localStorage.setItem('fin_ai_personality', newVal); };
  const displayMoney = (amount: number) => showBalance ? formatIDR(amount) : 'Rp ••••••••';

  const username = session?.user?.email ? session.user.email.split('@')[0] : '';
  const displayUsername = username.charAt(0).toUpperCase() + username.slice(1);

  // UPDATE: AI Lanjutan (Mendeteksi Tukin, GAPOK, SPPD, dll dengan lebih pintar)
  useEffect(() => {
    if (editingId) return; 
    if (formData.type === 'pengeluaran' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('emas') || t.includes('saham') || t.includes('reksadana') || t.includes('crypto') || t.includes('bibit') || t.includes('deposito')) setFormData(prev => ({...prev, category: 'Investasi'}));
      else if (t.includes('makan') || t.includes('minum') || t.includes('kopi') || t.includes('kfc') || t.includes('mcd') || t.includes('gofood') || t.includes('bakso') || t.includes('warteg')) setFormData(prev => ({...prev, category: 'Makanan'}));
      else if (t.includes('bensin') || t.includes('parkir') || t.includes('gojek') || t.includes('grab') || t.includes('tol') || t.includes('kereta') || t.includes('ojol')) setFormData(prev => ({...prev, category: 'Transportasi'}));
      else if (t.includes('listrik') || t.includes('air') || t.includes('wifi') || t.includes('pulsa') || t.includes('bpjs') || t.includes('cicilan') || t.includes('netflix') || t.includes('spotify') || t.includes('kos')) setFormData(prev => ({...prev, category: 'Tagihan'}));
      else if (t.includes('shopee') || t.includes('tokopedia') || t.includes('baju') || t.includes('skincare') || t.includes('belanja')) setFormData(prev => ({...prev, category: 'Belanja'}));
      else if (t.includes('nonton') || t.includes('game') || t.includes('bioskop') || t.includes('liburan')) setFormData(prev => ({...prev, category: 'Hiburan'}));
      else if (t.includes('sppd') || t.includes('dinas') || t.includes('tugas luar') || t.includes('hotel')) setFormData(prev => ({...prev, category: 'SPPD'}));
      else if (t.includes('pinjemin') || t.includes('kasih utang') || t.includes('talangin')) setFormData(prev => ({...prev, category: 'Beri Hutang'}));
      else if (t.includes('bayar utang') || t.includes('lunasin pinjaman') || t.includes('bayar pinjaman')) setFormData(prev => ({...prev, category: 'Bayar Pinjaman'}));
    } else if (formData.type === 'pemasukan' && formData.title) {
      const t = formData.title.toLowerCase();
      // UPDATE: Tambahan 'gapok' ke dalam deteksi Gaji Pokok
      if (t.includes('gaji') || t.includes('upah') || t.includes('gapok')) setFormData(prev => ({...prev, category: 'Gaji Pokok'}));
      else if (t.includes('tukin') || t.includes('tunjangan') || t.includes('remunerasi')) setFormData(prev => ({...prev, category: 'Tukin'}));
      else if (t.includes('uang makan') || t.includes('uang lauk')) setFormData(prev => ({...prev, category: 'Uang Makan'}));
      else if (t.includes('sppd') || t.includes('uang dinas')) setFormData(prev => ({...prev, category: 'SPPD'}));
      else if (t.includes('bonus') || t.includes('thr') || t.includes('hadiah')) setFormData(prev => ({...prev, category: 'Bonus'}));
      else if (t.includes('jual') || t.includes('profit') || t.includes('cair')) setFormData(prev => ({...prev, category: 'Investasi'}));
      else if (t.includes('dibayar utang') || t.includes('kembalian utang')) setFormData(prev => ({...prev, category: 'Dibayar Hutang'}));
      else if (t.includes('dapat pinjaman') || t.includes('pinjam uang') || t.includes('ngutang')) setFormData(prev => ({...prev, category: 'Terima Pinjaman'}));
    }
  }, [formData.title, formData.type, editingId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true);
    if (isRegistering) { const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword }); if (error) alert(error.message); else { alert('Registrasi berhasil! Silakan masuk.'); setIsRegistering(false); } } 
    else { const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }); if (error) alert('Login Gagal: ' + error.message); }
    setAuthLoading(false);
  };

  const handleDemoLogin = async () => { setAuthLoading(true); const { error } = await supabase.auth.signInWithPassword({ email: 'demo@dompet.com', password: 'password123' }); if (error) alert('Gagal masuk.'); setAuthLoading(false); };
  const handleLogout = async () => { setIsCheckingAuth(true); const { error } = await supabase.auth.signOut(); if (error) alert("Gagal keluar: " + error.message); setIsCheckingAuth(false); };
  const saveSettings = () => { localStorage.setItem('fin_initialBalance', (initialBalance || 0).toString()); localStorage.setItem('fin_targetSaving', (targetSaving || 0).toString()); localStorage.setItem('fin_catBudgets', JSON.stringify(catBudgets)); setIsEditingSettings(false); };

  const handleResetData = async () => {
    if (window.confirm("⚠️ PERINGATAN: Yakin ingin MENGHAPUS SEMUA riwayat transaksi milikmu?")) {
      setIsSubmitting(true); const { error } = await supabase.from('transactions').delete().not('id', 'is', null);
      if (!error) { localStorage.clear(); window.location.reload(); } else alert("Gagal mereset data."); setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!formData.title || !formData.amount) return; setIsSubmitting(true);
    
    const payload = { title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category, wallet: formData.wallet };
    
    if (editingId) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editingId); setIsSubmitting(false);
      if (!error) { setEditingId(null); setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai' }); fetchData(); } 
      else alert(`Gagal update data: ${error.message}\n(Pastikan kamu sudah jalankan perintah ALTER TABLE di Supabase!)`);
    } else {
      const { error } = await supabase.from('transactions').insert([payload]); setIsSubmitting(false);
      if (!error) { setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai' }); fetchData(); }
      else alert(`Gagal simpan data: ${error.message}\n(Jika error 'wallet column not found', pastikan jalankan ALTER TABLE di Supabase!)`);
    }
  };

  const applyQuickAction = (title: string, amount: string, category: string) => setFormData(prev => ({ ...prev, title, amount, type: 'pengeluaran', category }));
  const handleEditClick = (t: any) => { setEditingId(t.id); setFormData({ title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai' }); document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' }); };
  const handleDeleteTransaction = async (id: string) => { if (window.confirm("🗑️ Apakah kamu yakin ingin menghapus transaksi ini?")) { const { error } = await supabase.from('transactions').delete().eq('id', id); if (!error) fetchData(); else alert("Gagal menghapus: " + error.message); } };
  const handleCancelEdit = () => { setEditingId(null); setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai' }); };
  
  const handleDuplicate = (t: any) => {
    if(window.confirm(`Gunakan transaksi "${t.title}" ini sebagai template pencatatan baru?`)) {
      setFormData({ title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai' });
      setEditingId(null);
      document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const availableMonths = useMemo(() => { const months = new Set(transactions.map(t => `${new Date(t.created_at).getFullYear()}-${String(new Date(t.created_at).getMonth() + 1).padStart(2, '0')}`)); return Array.from(months).sort().reverse(); }, [transactions]);
  
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    if (filterMode === 'month') {
      if (filterMonth !== 'all') result = result.filter(t => `${new Date(t.created_at).getFullYear()}-${String(new Date(t.created_at).getMonth() + 1).padStart(2, '0')}` === filterMonth);
    } else if (filterMode === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate); start.setHours(0,0,0,0);
      const end = new Date(customEndDate); end.setHours(23,59,59,999);
      result = result.filter(t => { const tDate = new Date(t.created_at); return tDate >= start && tDate <= end; });
    }

    if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()) || (t.wallet && t.wallet.toLowerCase().includes(searchQuery.toLowerCase())));
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'oldest') result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'highest') result.sort((a, b) => Number(b.amount) - Number(a.amount));
    else if (sortBy === 'lowest') result.sort((a, b) => Number(a.amount) - Number(b.amount));
    return result;
  }, [transactions, filterMode, filterMonth, customStartDate, customEndDate, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'pemasukan' && !['Investasi', 'Terima Pinjaman', 'Dibayar Hutang'].includes(t.category)).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'pengeluaran' && !['Investasi', 'Beri Hutang', 'Bayar Pinjaman'].includes(t.category)).reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const investmentBought = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const investmentSold = filteredTransactions.filter(t => t.type === 'pemasukan' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalAssets = investmentBought - investmentSold; 
    
    const totalAllIncome = filteredTransactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalAllExpense = filteredTransactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const balance = (filterMode === 'month' && filterMonth === 'all' ? Number(initialBalance || 0) : 0) + totalAllIncome - totalAllExpense;
    const netWorth = balance + Math.max(0, totalAssets); 

    const recurringKeywords = ['netflix', 'spotify', 'wifi', 'indihome', 'bpjs', 'listrik', 'air', 'utang', 'cicilan', 'paylater', 'langganan', 'kredit', 'pinjaman', 'kos'];
    const billsTransactions = filteredTransactions.filter(t => t.type === 'pengeluaran' && (t.category === 'Tagihan' || recurringKeywords.some(kw => t.title.toLowerCase().includes(kw))));
    const totalBills = billsTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

    const globalTotalIncome = transactions.filter(t => t.type === 'pemasukan').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalTotalExpense = transactions.filter(t => t.type === 'pengeluaran').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalBalance = Number(initialBalance || 0) + globalTotalIncome - globalTotalExpense;
    const globalInvBought = transactions.filter(t => t.type === 'pengeluaran' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalInvSold = transactions.filter(t => t.type === 'pemasukan' && t.category === 'Investasi').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const globalNetWorth = globalBalance + Math.max(0, globalInvBought - globalInvSold);

    return { income, expense, balance, totalAssets, netWorth, totalBills, globalNetWorth, billsTransactions };
  }, [filteredTransactions, transactions, initialBalance, filterMonth, filterMode]);

  const userLevel = useMemo(() => {
    const nw = stats.globalNetWorth;
    if (nw >= 50000000) return { title: 'Sultan', icon: '👑', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200' };
    if (nw >= 10000000) return { title: 'Master Hemat', icon: '💎', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200' };
    if (nw >= 2000000) return { title: 'Prajurit', icon: '🛡️', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200' };
    return { title: 'Pemula', icon: '🌱', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200' };
  }, [stats.globalNetWorth]);

  const categoryChartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'pengeluaran' && !['Investasi', 'Beri Hutang', 'Bayar Pinjaman'].includes(t.category)); 
    const grouped = expenses.reduce((acc: any, curr) => { acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount); return acc; }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key], color: CATEGORY_COLORS[key] || '#64748B' })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const smartInsights = useMemo(() => {
    if (filteredTransactions.length === 0) return [{ type: 'tip', text: aiPersonality === 'motivator' ? "Belum ada aktivitas. Yuk, mulai catat pengeluaran pertamamu!" : "Masih sepi nih. Dompet kosong atau emang malas nyatat?" }];
    let insights: any[] = [];
    const expensesOnly = filteredTransactions.filter(t => t.type === 'pengeluaran' && !['Investasi'].includes(t.category));
    Object.keys(catBudgets).forEach(cat => {
      const budget = Number(catBudgets[cat]);
      if (budget > 0) {
        const spent = expensesOnly.filter(t => t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0);
        if (spent > budget) insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? `Peringatan: Kategori ${cat} melebihi batas. Terpakai ${formatIDR(spent)} dari jatah ${formatIDR(budget)}.` : `Woy! Jatah ${cat} jebol! Limit cuma ${formatIDR(budget)} tapi lu abisin ${formatIDR(spent)}. Nahan nafsu dikit ngapa?` });
        else if (spent > budget * 0.8) insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Hati-hati, anggaran ${cat} sudah terpakai ${Math.round((spent/budget)*100)}%. Sisa: ${formatIDR(budget - spent)}.` : `Rem woy! Jatah ${cat} sisa ${formatIDR(budget - spent)} doang. Mau makan batu di akhir bulan?` });
      }
    });
    if (stats.income > 0) {
      const wants = expensesOnly.filter(t => t.category === 'Hiburan' || t.category === 'Belanja').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const wantsPercentage = (wants / stats.income) * 100;
      if (wantsPercentage > 30) insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Pengeluaran Hiburan/Belanja mencapai ${Math.round(wantsPercentage)}%. Coba pelan-pelan ditekan di bawah 30% ya.` : `Gaya elit ekonomi sulit! Masa ${Math.round(wantsPercentage)}% pendapatan habis buat foya-foya. Nabung!` });
    }
    const pureExpense = stats.expense;
    if (pureExpense > stats.income && stats.income > 0) insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? "Perhatian: Pengeluaran konsumsimu bulan ini sudah lebih besar dari pemasukan yang ada." : "Minus bang? Uang masuk dikit, gaya selangit. Kurang-kurangin jajan!" });
    if(insights.length === 0) insights.push({ type: 'success', text: "Semua indikator keuanganmu sangat sehat bulan ini. Terus pertahankan prestasimu!" });
    return insights;
  }, [stats, catBudgets, filteredTransactions, aiPersonality]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("Laporan Bulanan", 14, 22);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const periodText = filterMode === 'month' ? (filterMonth === 'all' ? 'Semua Waktu' : new Date(`${filterMonth}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })) : `${customStartDate} s/d ${customEndDate}`;
    doc.text(`Periode: ${periodText}  |  Dibuat pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 32);

    doc.setTextColor(51, 65, 85); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("RINGKASAN KEKAYAAN & CASHFLOW:", 14, 52);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Total Pemasukan (Bersih)`, 14, 60); doc.text(`:  ${formatIDR(stats.income)}`, 60, 60);
    doc.text(`Total Pengeluaran (Konsumsi)`, 14, 66); doc.text(`:  ${formatIDR(stats.expense)}`, 60, 66);
    doc.setFont("helvetica", "bold"); doc.setTextColor(20, 184, 166); 
    doc.text(`Total Aset (Investasi)`, 14, 74); doc.text(`:  ${formatIDR(stats.totalAssets)}`, 60, 74);
    
    doc.setTextColor(stats.netWorth >= 0 ? 16 : 225, stats.netWorth >= 0 ? 185 : 29, stats.netWorth >= 0 ? 129 : 72); 
    doc.text(`TOTAL KEKAYAAN`, 14, 82); doc.text(`:  ${formatIDR(stats.netWorth)}`, 60, 82);

    autoTable(doc, {
      startY: 90, head: [['Tanggal', 'Keterangan', 'Sumber Dana', 'Kategori', 'Tipe', 'Jumlah (Rp)']],
      body: filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title, t.wallet || 'Tunai', t.category, t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran', new Intl.NumberFormat('id-ID').format(Number(t.amount))]),
      theme: 'grid', headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 5: { halign: 'right' } }, styles: { fontSize: 9, cellPadding: 3 }, alternateRowStyles: { fillColor: [248, 250, 252] } 
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(`Halaman ${i} dari ${pageCount} - Dompet Digital`, 105, 285, { align: 'center' }); }
    doc.save(`Laporan_Keuangan_${Date.now()}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Sumber Dana', 'Kategori', 'Tipe', 'Jumlah (Rp)'];
    const rows = filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title.replace(/,/g, ''), t.wallet || 'Tunai', t.category, t.type, t.amount]);
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
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Menyiapkan Dompet Digital...</p>
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dompet Digital</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{isRegistering ? 'Buat akun baru' : 'Masuk untuk mengelola keuanganmu'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all">
              <Mail size={20} className="text-slate-400 mr-3 shrink-0" />
              <input required type="email" placeholder="Alamat Email" className="bg-transparent outline-none w-full text-slate-700 dark:text-slate-200" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} disabled={authLoading}/>
            </div>
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all">
              <Lock size={20} className="text-slate-400 mr-3 shrink-0" />
              <input required type="password" placeholder="Password (min 6 kar)" className="bg-transparent outline-none w-full text-slate-700 dark:text-slate-200" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} disabled={authLoading}/>
            </div>
            <button disabled={authLoading} type="submit" className="w-full flex items-center justify-center bg-blue-600 text-white font-bold p-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 min-h-[56px] shadow-lg">
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? 'Daftar Sekarang' : 'Masuk Dashboard'}
            </button>
          </form>
          {!isRegistering && (
            <>
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-slate-900 text-slate-400 font-medium">ATAU</span></div></div>
              <button onClick={handleDemoLogin} disabled={authLoading} className="w-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold p-4 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95 min-h-[56px] border border-emerald-200">🚀 Coba Akun Demo</button>
            </>
          )}
          <div className="mt-8 text-center"><button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">{isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis!'}</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 sm:p-6 md:p-8 font-sans selection:bg-blue-200 relative transition-colors duration-300 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-grow">
        
        {/* HEADER & MENU RESPONSIVE */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 md:mb-8 gap-4 w-full">
          <div className="w-full xl:w-auto flex justify-between items-center shrink-0">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Dompet Digital</h1>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm">Halo, <span className="text-blue-600 dark:text-blue-400 font-bold">{displayUsername}</span> 👋</p>
                <span className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${userLevel.color}`}>{userLevel.icon} {userLevel.title}</span>
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="xl:hidden p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0">
              {isDarkMode ? <Sun size={18} className="text-amber-500"/> : <Moon size={18} className="text-slate-500"/>}
            </button>
          </div>

          <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-sm w-full sm:w-auto overflow-hidden">
              <button onClick={() => setFilterMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-none ${filterMode === 'month' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Bulan</button>
              <button onClick={() => setFilterMode('custom')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex-1 sm:flex-none ${filterMode === 'custom' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Rentang Tgl</button>
            </div>

            {filterMode === 'month' ? (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 sm:py-2.5 rounded-xl shadow-sm w-full sm:w-auto">
                <Filter size={16} className="text-slate-400 shrink-0" />
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent outline-none font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 cursor-pointer w-full appearance-none">
                  <option value="all">Semua Waktu</option>
                  {availableMonths.map(m => <option key={m} value={m}>{new Date(m).toLocaleDateString('id-ID', {month: 'short', year: 'numeric'})}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-sm w-full sm:w-auto">
                <CalendarSearch size={16} className="text-slate-400 shrink-0" />
                <input type="date" value={customStartDate} onChange={e=>setCustomStartDate(e.target.value)} className="bg-transparent outline-none text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200" />
                <span className="text-slate-400 text-xs">-</span>
                <input type="date" value={customEndDate} onChange={e=>setCustomEndDate(e.target.value)} className="bg-transparent outline-none text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200" />
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="hidden xl:flex p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0">
                {isDarkMode ? <Sun size={18} className="text-amber-500"/> : <Moon size={18} className="text-slate-500"/>}
              </button>
              <button onClick={() => setIsEditingSettings(true)} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-800 shrink-0 text-xs sm:text-sm whitespace-nowrap">
                <Settings size={16} /> <span>Atur</span>
              </button>
              <button onClick={exportPDF} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:text-blue-600 transition-all shrink-0 text-xs sm:text-sm whitespace-nowrap">
                <FileText size={16} /> <span className="hidden sm:inline">PDF Bulanan</span><span className="sm:hidden">PDF</span>
              </button>
              <button onClick={exportCSV} className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all shrink-0 text-xs sm:text-sm whitespace-nowrap">
                <Download size={16} /> <span className="hidden sm:inline">Excel</span>
              </button>
              <button onClick={handleLogout} className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 transition-all shrink-0 text-xs sm:text-sm whitespace-nowrap">
                <LogOut size={16} /> <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* 1. HERO CARD: KEKAYAAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg shadow-blue-200 dark:shadow-none text-white relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex justify-between items-start mb-4 sm:mb-6">
              <div>
                <p className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Total Kekayaan Bersih</p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter truncate max-w-[220px] sm:max-w-full">{displayMoney(stats.netWorth)}</h2>
                  <button onClick={togglePrivacy} className="text-blue-300 hover:text-white transition-colors shrink-0 p-1">{showBalance ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                </div>
              </div>
              <Briefcase size={36} className="text-white opacity-20 hidden sm:block shrink-0" />
            </div>
            
            <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-white/20">
              <div className="bg-white/10 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <p className="text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest text-blue-200 font-bold mb-0.5 sm:mb-1 flex items-center gap-1"><Wallet size={10} className="sm:w-3 sm:h-3"/> Seluruh Saldo</p>
                <p className="font-black text-xs sm:text-sm md:text-lg truncate">{displayMoney(stats.balance)}</p>
              </div>
              <div className="bg-white/10 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm border border-teal-400/30">
                <p className="text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest text-teal-200 font-bold mb-0.5 sm:mb-1 flex items-center gap-1"><Gem size={10} className="sm:w-3 sm:h-3"/> Aset (Investasi)</p>
                <p className="font-black text-xs sm:text-sm md:text-lg text-teal-100 truncate">{displayMoney(stats.totalAssets)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base md:text-lg flex items-center gap-2"><Target className="text-amber-500 w-4 h-4 sm:w-5 sm:h-5"/> Target Tabungan</h3>
              <p className="text-xs sm:text-sm font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">{Math.min(100, Math.round((stats.netWorth/Number(targetSaving || 1))*100))}%</p>
            </div>
            <div className="h-3 sm:h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mb-3 sm:mb-4">
              <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${Math.max(0, Math.min(100, (stats.netWorth/Number(targetSaving || 1))*100))}%` }} />
            </div>
            <div className="flex flex-col gap-1 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex justify-between"><span>Terkumpul:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{displayMoney(stats.netWorth)}</span></div>
              <div className="flex justify-between"><span>Target:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{displayMoney(Number(targetSaving))}</span></div>
            </div>
          </div>
        </div>

        {/* KARTU RINGKASAN PEMASUKAN & PENGELUARAN */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-10">
          <StatCard 
            title={filterMode === 'month' && filterMonth === 'all' ? "Total Semua Pemasukan" : "Pemasukan Periode Ini"}
            val={displayMoney(stats.income)} 
            icon={<ArrowUpRight size={20} className="sm:w-6 sm:h-6" />} 
            color="text-emerald-600 dark:text-emerald-400" 
            bg="bg-emerald-50 dark:bg-emerald-900/20" 
          />
          <StatCard 
            title={filterMode === 'month' && filterMonth === 'all' ? "Total Semua Pengeluaran" : "Pengeluaran Periode Ini"}
            val={displayMoney(stats.expense)} 
            icon={<ArrowDownRight size={20} className="sm:w-6 sm:h-6" />} 
            color="text-rose-600 dark:text-rose-400" 
            bg="bg-rose-50 dark:bg-rose-900/20" 
          />
        </div>

        {/* 2. BAGIAN AI & RADAR TAGIHAN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-10">
          
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl text-white relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 sm:w-24 sm:h-24 bg-rose-500 rounded-full blur-[40px] opacity-20 pointer-events-none"></div>
            <div className="flex items-center gap-2 text-rose-400 mb-3 sm:mb-4 relative z-10">
              <CreditCard size={18} className="sm:w-5 sm:h-5"/>
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-widest">Radar Tagihan Tetap</h3>
            </div>
            <div className="mb-3 sm:mb-4 relative z-10">
              <p className="text-[9px] sm:text-[10px] text-slate-400 mb-0.5 sm:mb-1">Total Biaya & Cicilan Periode Ini</p>
              <p className="text-2xl sm:text-3xl font-black text-white">{displayMoney(stats.totalBills)}</p>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2 relative z-10 flex-grow">
              {stats.billsTransactions.length === 0 ? (
                 <p className="text-[10px] sm:text-xs text-slate-500 italic mt-2">Aman! Tidak ada tagihan terdeteksi.</p>
              ) : (
                stats.billsTransactions.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center text-[10px] sm:text-xs bg-slate-800/50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-700/50">
                    <span className="font-medium text-slate-300 truncate max-w-[120px]">{t.title}</span>
                    <span className="font-bold text-rose-400">{formatIDR(Number(t.amount))}</span>
                  </div>
                ))
              )}
              {stats.billsTransactions.length > 3 && <p className="text-[9px] sm:text-[10px] text-center text-slate-500 mt-1 sm:mt-2">Dan {stats.billsTransactions.length - 3} lainnya...</p>}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-[60px] sm:blur-[80px] opacity-20 pointer-events-none ${aiPersonality === 'roasting' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
            
            <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-md ${aiPersonality === 'roasting' ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                  {aiPersonality === 'roasting' ? <ShieldAlert size={20} className="sm:w-6 sm:h-6"/> : <Bot size={20} className="sm:w-6 sm:h-6"/>}
                </div>
                <div>
                  <h2 className={`font-black text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2 ${aiPersonality === 'roasting' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    Asisten AI <Sparkles size={12} className="sm:w-3.5 sm:h-3.5"/>
                  </h2>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 font-medium">Mendeteksi anomali anggaran</p>
                </div>
              </div>
              <button onClick={toggleAIPersonality} className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg sm:rounded-xl transition-colors border ${aiPersonality === 'roasting' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50'}`}>
                <RefreshCw size={10} className="sm:w-3 sm:h-3"/> Mode {aiPersonality}
              </button>
            </div>
            
            <div className="space-y-2.5 sm:space-y-3 relative z-10 custom-scrollbar overflow-y-auto max-h-[180px] sm:max-h-[220px] md:max-h-none pr-1">
              {smartInsights.map((insight, idx) => {
                let boxStyle = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800/50";
                if (insight.type === 'danger') boxStyle = "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800/50";
                else if (insight.type === 'success') boxStyle = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800/50";
                else if (insight.type === 'info') boxStyle = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800/50";
                
                return (
                  <div key={idx} className="flex items-start gap-2 sm:gap-3 w-full">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0 mt-0.5 sm:mt-1 border border-slate-200 dark:border-slate-700">
                      <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5 text-slate-500" />
                    </div>
                    <div className={`p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl rounded-tl-sm border ${boxStyle} shadow-sm w-full`}>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">{insight.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT: KIRI (INPUT & RIWAYAT), KANAN (CHART & BUDGETING) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* FORM INPUT PENCATATAN */}
            <section id="formCatat" className={`bg-white dark:bg-slate-900 p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-3xl md:rounded-[2.5rem] shadow-sm border transition-all relative overflow-hidden ${editingId ? 'border-amber-300 dark:border-amber-500/50 shadow-amber-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-800'}`}>
              {!editingId && <div className="absolute -top-10 -right-10 text-slate-50 dark:text-slate-800/20 rotate-12 pointer-events-none"><Sparkles size={120} className="sm:w-[150px] sm:h-[150px]" /></div>}
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-4 md:mb-6 relative z-10">
                <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  {editingId ? <><Edit2 className="text-amber-500 w-4 h-4 sm:w-5 sm:h-5"/> Edit Aktivitas</> : <><Plus className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5"/> Catat Aktivitas</>}
                </h2>
                {!editingId && (
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 w-full sm:w-auto">
                    <button type="button" onClick={() => applyQuickAction('Dana SPPD Jakarta', '2500000', 'SPPD')} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 flex items-center gap-1 shrink-0">✈️ SPPD</button>
                    <button type="button" onClick={() => applyQuickAction('Bayar WiFi', '350000', 'Tagihan')} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1 shrink-0">🧾 Tagihan</button>
                    <button type="button" onClick={() => applyQuickAction('Makan Siang', '25000', 'Makanan')} className="text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 shrink-0">🍛 Makan</button>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
                {/* Judul Transaksi */}
                <div className="col-span-1 md:col-span-2">
                  <input required placeholder="Ketik deskripsi (misal: Beli Emas, Terima Tukin...)" className="bg-slate-50 dark:bg-slate-950 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:ring-2 ring-indigo-500/30 border border-slate-100 dark:border-slate-800 w-full transition-all text-xs sm:text-sm md:text-base" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                {/* Nominal & Tipe */}
                <div className="flex flex-col gap-1">
                  <input required type="number" placeholder="Nominal Angka (Rp)" className="bg-slate-50 dark:bg-slate-950 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:ring-2 ring-blue-500/20 border border-slate-100 dark:border-slate-800 w-full transition-all text-xs sm:text-sm md:text-base h-fit font-bold text-slate-800 dark:text-white" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                  {formData.amount && <p className="text-[9px] sm:text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5 ml-1">Terbaca: {formatIDR(Number(formData.amount))}</p>}
                </div>
                <div>
                  {/* UPDATE: Ketika tipe diubah, reset juga kategorinya agar tidak error/nyangkut! */}
                  <select 
                    className="bg-slate-50 dark:bg-slate-950 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl outline-none border border-slate-100 dark:border-slate-800 w-full font-medium text-slate-700 dark:text-slate-300 transition-all focus:ring-2 ring-blue-500/20 text-xs sm:text-sm md:text-base" 
                    value={formData.type} 
                    onChange={e => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData, 
                        type: newType,
                        category: newType === 'pemasukan' ? 'Gaji Pokok' : 'Makanan'
                      });
                    }}
                  >
                    <option value="pengeluaran">💸 Keluar / Beli Aset</option>
                    <option value="pemasukan">💰 Pemasukan Kas</option>
                  </select>
                </div>

                {/* Kategori & Wallet */}
                <div className="relative">
                  <select className={`${editingId ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300' : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300'} p-3.5 sm:p-4 rounded-xl sm:rounded-2xl outline-none border w-full font-medium transition-all focus:ring-2 ring-indigo-500/30 text-xs sm:text-sm md:text-base appearance-none cursor-pointer`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {formData.type === 'pengeluaran' ? (
                      <>
                        <option value="Makanan">🍜 Makanan / Minuman</option>
                        <option value="Transportasi">🚗 Transportasi</option>
                        <option value="Tagihan">🧾 Tagihan (Bills)</option>
                        <option value="Belanja">🛍️ Belanja</option>
                        <option value="Hiburan">🎮 Hiburan</option>
                        <option value="Investasi" className="font-bold text-teal-600">📈 Beli Investasi (Aset)</option>
                        <option value="SPPD" className="font-bold text-orange-600">✈️ SPPD / Dinas</option>
                        <option value="Beri Hutang" className="font-bold text-slate-500">🤝 Beri Hutang/Pinjaman</option>
                        <option value="Bayar Pinjaman" className="font-bold text-slate-500">💳 Bayar/Lunasin Pinjaman</option>
                        <option value="Lainnya">📦 Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="Gaji Pokok">💼 Gaji Pokok</option>
                        <option value="Tukin" className="font-bold text-blue-600">🏆 Tukin / Tunjangan</option>
                        <option value="Uang Makan">🍽️ Uang Makan</option>
                        <option value="SPPD" className="font-bold text-orange-600">✈️ Terima SPPD</option>
                        <option value="Bonus">✨ Bonus / THR</option>
                        <option value="Investasi" className="font-bold text-teal-600">📉 Jual Investasi</option>
                        <option value="Dibayar Hutang" className="font-bold text-slate-500">🤝 Dibayar Hutang (Piutang)</option>
                        <option value="Terima Pinjaman" className="font-bold text-slate-500">🏦 Terima Dana Pinjaman</option>
                        <option value="Lainnya">📦 Lainnya</option>
                      </>
                    )}
                  </select>
                  {!editingId && <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400"><Bot size={16} className="sm:w-4 sm:h-4"/></div>}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Landmark size={16} className="sm:w-4 sm:h-4"/></div>
                  <select className="bg-slate-50 dark:bg-slate-950 pl-11 pr-4 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl outline-none border border-slate-100 dark:border-slate-800 w-full font-bold text-slate-700 dark:text-slate-300 transition-all focus:ring-2 ring-blue-500/20 text-xs sm:text-sm md:text-base cursor-pointer appearance-none" value={formData.wallet} onChange={e => setFormData({...formData, wallet: e.target.value})}>
                    {WALLET_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex gap-2 md:gap-3 mt-1 sm:mt-2">
                  <button disabled={isSubmitting} className={`flex-1 text-white font-bold p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm md:text-base shadow-md ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none' : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 shadow-slate-300 dark:shadow-none'}`}>
                    {isSubmitting ? 'Memproses...' : editingId ? 'Update Transaksi' : 'Simpan Transaksi'}
                  </button>
                  {editingId && <button type="button" onClick={handleCancelEdit} className="px-5 sm:px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl sm:rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm md:text-base">Batal</button>}
                </div>
              </form>
            </section>

            {/* HISTORY (RIWAYAT) */}
            <section className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 md:p-8 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950 z-10 flex flex-col gap-3 sm:gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Calendar className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5"/> Riwayat Aktivitas</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <div className="flex flex-1 items-center bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all shadow-sm">
                    <Search size={16} className="text-slate-400 mr-2 shrink-0" />
                    <input type="text" placeholder="Cari transaksi atau rekening..." className="bg-transparent outline-none w-full text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="flex items-center bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all shadow-sm w-full sm:w-auto">
                    <ArrowUpDown size={16} className="text-slate-400 mr-2 shrink-0" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent outline-none w-full text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-200 cursor-pointer appearance-none">
                      <option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="highest">Terbesar</option><option value="lowest">Terkecil</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto custom-scrollbar p-2 sm:p-3 bg-slate-50/50 dark:bg-slate-950/50">
                {filteredTransactions.length === 0 ? (
                  <div className="p-10 text-center text-slate-400"><p className="font-medium italic text-sm">Belum ada transaksi di periode ini.</p></div>
                ) : (
                  filteredTransactions.map((t) => {
                    const isIncome = t.type === 'pemasukan';
                    const isInvest = t.category === 'Investasi';
                    const isSPPD = t.category === 'SPPD';
                    const isDebt = t.category === 'Beri Hutang' || t.category === 'Bayar Pinjaman' || t.category === 'Dibayar Hutang' || t.category === 'Terima Pinjaman';
                    
                    let iconBg = isIncome ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600';
                    if (isInvest) iconBg = 'bg-teal-50 dark:bg-teal-900/20 text-teal-600';
                    if (isSPPD) iconBg = 'bg-orange-50 dark:bg-orange-900/20 text-orange-600';
                    if (isDebt) iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-500';

                    return ( 
                    <div key={t.id} className={`mb-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-center ${editingId === t.id ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300' : 'bg-white dark:bg-slate-900'}`}>
                      
                      <div className="flex justify-between items-start lg:items-center w-full lg:w-auto gap-3">
                        <div className="flex items-start lg:items-center gap-3">
                          <div className={`p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shrink-0 ${iconBg}`}>
                            {isIncome && !isInvest ? <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]"/> : isInvest ? <Gem size={16} className="sm:w-[18px] sm:h-[18px]"/> : <ArrowDownRight size={16} className="sm:w-[18px] sm:h-[18px]"/>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm sm:text-base line-clamp-1 break-all pr-2">{t.title}</p>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                              <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-medium whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:block"></span>
                              <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">{t.category}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:block"></span>
                              <span className="text-[9px] sm:text-[10px] md:text-xs text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/20 px-1.5 sm:px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800 whitespace-nowrap flex items-center gap-1"><Landmark size={8}/> {t.wallet || 'Tunai'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="lg:hidden text-right mt-1 shrink-0">
                          <p className={`text-sm font-black tracking-tight whitespace-nowrap ${isIncome ? 'text-emerald-500' : isInvest ? 'text-teal-500' : isDebt ? 'text-slate-500' : 'text-rose-500'}`}>
                            {isIncome ? '+' : '-'} {displayMoney(Number(t.amount))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-3 mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100 dark:border-slate-800/50 lg:border-0 w-full lg:w-auto">
                        <p className={`hidden lg:block text-base md:text-lg font-black tracking-tight mr-2 ${isIncome ? 'text-emerald-500' : isInvest ? 'text-teal-500' : isDebt ? 'text-slate-500' : 'text-rose-500'}`}>
                          {isIncome ? '+' : '-'} {displayMoney(Number(t.amount))}
                        </p>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button onClick={() => setSelectedReceipt(t)} className="p-1.5 sm:p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg flex items-center justify-center transition-colors border border-blue-200 dark:border-blue-800/50" title="Lihat Struk">
                            <Receipt size={14} className="sm:w-[14px] sm:h-[14px]"/>
                          </button>
                          <button onClick={() => handleDuplicate(t)} className="p-1.5 sm:p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg flex items-center justify-center transition-colors border border-indigo-200 dark:border-indigo-800/50" title="Duplikat Transaksi Bulanan">
                            <Copy size={14} className="sm:w-[14px] sm:h-[14px]"/>
                          </button>
                          <button onClick={() => handleEditClick(t)} className="p-1.5 sm:p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg transition-colors border border-amber-200 dark:border-amber-800/50"><Edit2 size={14} className="sm:w-[14px] sm:h-[14px]"/></button>
                          <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 sm:p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg transition-colors border border-rose-200 dark:border-rose-800/50"><Trash2 size={14} className="sm:w-[14px] sm:h-[14px]"/></button>
                        </div>
                      </div>
                      
                    </div>
                  )})
                )}
              </div>
            </section>
          </div>

          {/* KOLOM KANAN (CHART & MICRO-BUDGETING) */}
          <div className="space-y-6 md:space-y-8 mt-2 sm:mt-0">
            
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white"><AlertOctagon className="text-rose-500 w-4 h-4 sm:w-5 sm:h-5"/> Batas Anggaran</h2>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 mt-0.5 sm:mt-1">Peringatan limit (Micro-budgeting)</p>
                </div>
                <button onClick={() => setIsEditingSettings(true)} className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition-colors whitespace-nowrap">Ubah Batas</button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).length === 0 ? (
                  <div className="text-center p-5 sm:p-6 bg-slate-50 dark:bg-slate-950 rounded-xl sm:rounded-2xl text-slate-400 text-xs sm:text-sm border border-dashed border-slate-200 dark:border-slate-800">
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
                      <div key={cat} className="bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-end mb-1.5 sm:mb-2">
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 sm:gap-2">{cat} {isDanger && <AlertTriangle size={12} className="text-rose-500 animate-pulse sm:w-[14px] sm:h-[14px]"/>}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest">{formatIDR(spent)} / {formatIDR(limit)}</p>
                          </div>
                          <span className={`text-[10px] sm:text-xs font-black ${isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{percent}%</span>
                        </div>
                        <div className="h-1.5 sm:h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }} />
                        </div>
                        {isDanger && <p className="text-[9px] sm:text-[10px] text-rose-500 mt-1.5 sm:mt-2 font-bold bg-rose-50 dark:bg-rose-900/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block">⚠️ Terlewati {formatIDR(spent - limit)}</p>}
                      </div>
                    )
                  })
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h2 className="text-sm sm:text-base md:text-lg font-bold mb-1 flex items-center gap-2 text-slate-800 dark:text-white"><Tag size={18} className="text-blue-500 sm:w-5 sm:h-5"/> Alokasi Konsumsi</h2>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mb-4">*Di luar Aset Investasi & Hutang</p>
              
              <div className="h-36 sm:h-40 md:h-48 w-full relative">
                {categoryChartData.length === 0 ? (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs sm:text-sm font-medium">Belum ada pengeluaran</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                    <PieChart>
                      <Pie data={categoryChartData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value" stroke="none">
                        {categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: 'none', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '10px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 space-y-1.5 sm:space-y-2">
                {categoryChartData.map((item: any, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] sm:text-xs md:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{backgroundColor: item.color}}></div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[90px] sm:max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{displayMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-[#1e293b] w-full max-w-xs sm:max-w-sm rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className={`p-5 sm:p-6 text-center ${selectedReceipt.type === 'pemasukan' ? 'bg-emerald-500' : selectedReceipt.category === 'Investasi' ? 'bg-teal-500' : 'bg-rose-500'} text-white`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 backdrop-blur-md">
                {selectedReceipt.type === 'pemasukan' ? <ArrowUpRight size={20} className="sm:w-[24px] sm:h-[24px]"/> : selectedReceipt.category === 'Investasi' ? <Gem size={20} className="sm:w-[24px] sm:h-[24px]"/> : <ArrowDownRight size={20} className="sm:w-[24px] sm:h-[24px]"/>}
              </div>
              <h3 className="font-black text-lg sm:text-xl tracking-wide uppercase">Transaksi Berhasil</h3>
              <p className="text-white/80 text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium">{new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
            </div>
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 relative">
              <div className="absolute top-0 left-0 right-0 h-3 flex justify-between px-2 -mt-1.5 z-10">{[...Array(15)].map((_, i) => <div key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white dark:bg-slate-900 rounded-full" />)}</div>
              <div className="text-center mb-5 sm:mb-6 mt-2">
                <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Total {selectedReceipt.type}</p>
                <p className={`text-2xl sm:text-3xl font-black ${selectedReceipt.type === 'pemasukan' ? 'text-emerald-500' : selectedReceipt.category === 'Investasi' ? 'text-teal-500' : 'text-rose-500'}`}>
                  {formatIDR(Number(selectedReceipt.amount))}
                </p>
              </div>
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 py-3 sm:py-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-start"><span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Keterangan</span><span className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold text-right max-w-[60%]">{selectedReceipt.title}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Kategori</span><span className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold">{selectedReceipt.category}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Sumber Dana</span><span className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold">{selectedReceipt.wallet || 'Tunai'}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Ref ID</span><span className="text-slate-800 dark:text-slate-200 text-[9px] sm:text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{selectedReceipt.id.split('-')[0].toUpperCase()}</span></div>
              </div>
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-4 sm:pt-6 pb-1 sm:pb-2 text-center">
                <div className="h-8 sm:h-10 w-full flex justify-center gap-1 opacity-50 dark:opacity-30">{[...Array(25)].map((_, i) => <div key={i} className="bg-black dark:bg-white h-full" style={{ width: `${Math.random() * 3 + 1}px` }} />)}</div>
                <p className="text-[8px] sm:text-[9px] text-slate-400 mt-1.5 sm:mt-2 font-bold tracking-widest uppercase">Dompet Digital</p>
              </div>
            </div>
            <button onClick={() => setSelectedReceipt(null)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all"><X size={14} className="sm:w-4 sm:h-4"/></button>
          </div>
        </div>
      )}

      {isEditingSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 md:p-8 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <div className="flex justify-between items-center mb-5 sm:mb-8 sticky top-0 bg-white dark:bg-slate-900 py-2 sm:pt-2 sm:pb-2 z-10 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Pengaturan Lanjutan</h3>
              <button onClick={() => setIsEditingSettings(false)} className="bg-slate-100 dark:bg-slate-800 p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-rose-500 transition-all"><X size={18} className="sm:w-5 sm:h-5"/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
              <div className="space-y-4 sm:space-y-5">
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm sm:text-base"><Wallet size={16} className="text-blue-500 sm:w-[18px] sm:h-[18px]"/> Data Dasar</h4>
                <div>
                  <label className="text-[9px] sm:text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Saldo Kas Tunai Awal</label>
                  <input type="number" placeholder="Contoh: 1000000" className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 font-bold text-slate-800 dark:text-white text-xs sm:text-sm" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
                  {initialBalance && <p className="text-[9px] sm:text-[10px] text-blue-500 mt-1 font-bold">Terbaca: {formatIDR(Number(initialBalance))}</p>}
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Target Kekayaan Impian</label>
                  <input type="number" placeholder="Contoh: 50000000" className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 font-bold text-slate-800 dark:text-white text-xs sm:text-sm" value={targetSaving} onChange={e => setTargetSaving(e.target.value)} />
                  {targetSaving && <p className="text-[9px] sm:text-[10px] text-blue-500 mt-1 font-bold">Terbaca: {formatIDR(Number(targetSaving))}</p>}
                </div>
                <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={handleResetData} disabled={isSubmitting} className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold py-2.5 sm:py-3 rounded-xl hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50 text-xs sm:text-sm">Hapus Semua Data (Reset)</button>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-0.5 sm:mb-1 text-sm sm:text-base"><AlertOctagon size={16} className="text-rose-500 sm:w-[18px] sm:h-[18px]"/> Batas Kategori (Angka)</h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 mb-2 sm:mb-4">Kosongkan jika tidak dibatasi.</p>
                </div>
                
                {['Makanan', 'Tagihan', 'Transportasi', 'Belanja', 'Hiburan'].map((cat) => (
                  <div key={cat} className="flex flex-col bg-slate-50 dark:bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-20 sm:w-24 shrink-0 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</div>
                      <input type="number" placeholder="Tanpa batas" className="w-full bg-transparent p-1.5 sm:p-2 outline-none font-bold text-slate-800 dark:text-white text-xs sm:text-sm border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 transition-colors" value={catBudgets[cat]} onChange={e => setCatBudgets({...catBudgets, [cat]: e.target.value})} />
                    </div>
                    {catBudgets[cat] && <p className="text-[9px] sm:text-[10px] text-blue-500 text-right mt-1 font-bold">Batas: {formatIDR(Number(catBudgets[cat]))}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={saveSettings} className="w-full bg-blue-600 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm sm:text-base">Simpan Pengaturan</button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } }
        @media (min-width: 768px) { .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: 0.2s; }
        input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
        .dark input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
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