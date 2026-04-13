/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, Target, FileText, Plus, Calendar, PieChart as PieIcon, 
  ArrowUpRight, ArrowDownRight, Tag, Settings, X, Moon, Sun, Filter, 
  LogOut, Lock, Mail, Bot, Sparkles, Search, Download, Loader2,
  Edit2, Trash2, AlertTriangle, CheckCircle2, ArrowUpDown, 
  Eye, EyeOff, Receipt, ShieldAlert, RefreshCw, Gem, Briefcase,
  AlertOctagon, CreditCard, MessageSquare, Landmark, Copy, CalendarSearch,
  TrendingUp, TrendingDown, BarChart3, PiggyBank, Check, Percent,
  ChevronRight, Bell, Info, Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const parseMonthSafe = (ym: string) => new Date(`${ym}-15`); // FIX: timezone-safe

const CATEGORY_COLORS: any = {
  'Makanan': '#F59E0B', 'Transportasi': '#3B82F6', 'Tagihan': '#EF4444',
  'Belanja': '#EC4899', 'Hiburan': '#8B5CF6', 'Investasi': '#14B8A6',
  'SPPD': '#F97316', 'Beri Hutang': '#64748B', 'Bayar Pinjaman': '#64748B',
  'Gaji Pokok': '#10B981', 'Tukin': '#3B82F6', 'Uang Makan': '#F59E0B',
  'Bonus': '#8B5CF6', 'Dibayar Hutang': '#64748B', 'Terima Pinjaman': '#64748B',
  'Lainnya': '#94A3B8'
};

const WALLET_OPTIONS = ['Kas Tunai', 'Mandiri', 'BRI', 'BCA', 'BNI', 'BSI', 'GoPay', 'OVO', 'DANA', 'Lainnya'];

// ─── TOAST SYSTEM ──────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
type Toast = { id: number; message: string; type: ToastType };

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={16} />,
    error: <AlertTriangle size={16} />,
    warning: <AlertOctagon size={16} />,
    info: <Info size={16} />,
  };
  const styles: Record<ToastType, string> = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-slate-800 text-white dark:bg-slate-700',
  };
  return (
    <div className="fixed bottom-6 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold max-w-xs pointer-events-auto animate-in slide-in-from-right duration-300 ${styles[t.type]}`}>
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="opacity-70 hover:opacity-100 shrink-0"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM DIALOG ─────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          <AlertTriangle size={24} className={danger ? 'text-rose-500' : 'text-amber-500'} />
        </div>
        <h3 className="text-center font-black text-slate-800 dark:text-white text-lg mb-1">{title}</h3>
        <p className="text-center text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
          <button onClick={onConfirm} className={`flex-1 py-3 text-white font-bold rounded-2xl transition-colors ${danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'}`}>Ya, Lanjutkan</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
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

  // ── NEW: Toast & Confirm ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<any>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const confirm = useCallback((title: string, message: string, danger = false): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ title, message, danger, resolve });
    });
  }, []);

  const handleConfirmResult = (result: boolean) => {
    if (confirmState?.resolve) confirmState.resolve(result);
    setConfirmState(null);
  };

  // ── NEW: Wallet breakdown tab ──
  const [activeTab, setActiveTab] = useState<'insights' | 'wallets'>('insights');

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

  const togglePrivacy = () => { const nv = !showBalance; setShowBalance(nv); localStorage.setItem('fin_privacy', nv ? 'visible' : 'hidden'); };
  const toggleAIPersonality = () => { const nv = aiPersonality === 'motivator' ? 'roasting' : 'motivator'; setAiPersonality(nv); localStorage.setItem('fin_ai_personality', nv); };
  const displayMoney = (amount: number) => showBalance ? formatIDR(amount) : 'Rp ••••••';

  const username = session?.user?.email ? session.user.email.split('@')[0] : '';
  const displayUsername = username.charAt(0).toUpperCase() + username.slice(1);

  // ── AI auto-categorization ──
  useEffect(() => {
    if (editingId) return;
    if (formData.type === 'pengeluaran' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('emas') || t.includes('saham') || t.includes('reksadana') || t.includes('crypto') || t.includes('bibit') || t.includes('deposito')) setFormData(prev => ({ ...prev, category: 'Investasi' }));
      else if (t.includes('makan') || t.includes('minum') || t.includes('kopi') || t.includes('kfc') || t.includes('mcd') || t.includes('gofood') || t.includes('bakso') || t.includes('warteg')) setFormData(prev => ({ ...prev, category: 'Makanan' }));
      else if (t.includes('bensin') || t.includes('parkir') || t.includes('gojek') || t.includes('grab') || t.includes('tol') || t.includes('kereta') || t.includes('ojol')) setFormData(prev => ({ ...prev, category: 'Transportasi' }));
      else if (t.includes('listrik') || t.includes('air') || t.includes('wifi') || t.includes('pulsa') || t.includes('bpjs') || t.includes('cicilan') || t.includes('netflix') || t.includes('spotify') || t.includes('kos')) setFormData(prev => ({ ...prev, category: 'Tagihan' }));
      else if (t.includes('shopee') || t.includes('tokopedia') || t.includes('baju') || t.includes('skincare') || t.includes('belanja')) setFormData(prev => ({ ...prev, category: 'Belanja' }));
      else if (t.includes('nonton') || t.includes('game') || t.includes('bioskop') || t.includes('liburan')) setFormData(prev => ({ ...prev, category: 'Hiburan' }));
      else if (t.includes('sppd') || t.includes('dinas') || t.includes('tugas luar') || t.includes('hotel')) setFormData(prev => ({ ...prev, category: 'SPPD' }));
      else if (t.includes('pinjemin') || t.includes('kasih utang') || t.includes('talangin')) setFormData(prev => ({ ...prev, category: 'Beri Hutang' }));
      else if (t.includes('bayar utang') || t.includes('lunasin pinjaman') || t.includes('bayar pinjaman')) setFormData(prev => ({ ...prev, category: 'Bayar Pinjaman' }));
    } else if (formData.type === 'pemasukan' && formData.title) {
      const t = formData.title.toLowerCase();
      if (t.includes('gaji') || t.includes('upah') || t.includes('gapok')) setFormData(prev => ({ ...prev, category: 'Gaji Pokok' }));
      else if (t.includes('tukin') || t.includes('tunjangan') || t.includes('remunerasi')) setFormData(prev => ({ ...prev, category: 'Tukin' }));
      else if (t.includes('uang makan') || t.includes('uang lauk')) setFormData(prev => ({ ...prev, category: 'Uang Makan' }));
      else if (t.includes('sppd') || t.includes('uang dinas')) setFormData(prev => ({ ...prev, category: 'SPPD' }));
      else if (t.includes('bonus') || t.includes('thr') || t.includes('hadiah')) setFormData(prev => ({ ...prev, category: 'Bonus' }));
      else if (t.includes('jual') || t.includes('profit') || t.includes('cair')) setFormData(prev => ({ ...prev, category: 'Investasi' }));
      else if (t.includes('dibayar utang') || t.includes('kembalian utang')) setFormData(prev => ({ ...prev, category: 'Dibayar Hutang' }));
      else if (t.includes('dapat pinjaman') || t.includes('pinjam uang') || t.includes('ngutang')) setFormData(prev => ({ ...prev, category: 'Terima Pinjaman' }));
    }
  }, [formData.title, formData.type, editingId]);

  // ── Auth ──
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthLoading(true);
    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) showToast(error.message, 'error');
      else { showToast('Registrasi berhasil! Silakan masuk.', 'success'); setIsRegistering(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) showToast('Login Gagal: ' + error.message, 'error');
    }
    setAuthLoading(false);
  };

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: 'demo@dompet.com', password: '123456' });
    if (error) showToast('Gagal masuk akun demo.', 'error');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    setIsCheckingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) { showToast('Gagal keluar: ' + error.message, 'error'); setIsCheckingAuth(false); }
  };

  const saveSettings = () => {
    localStorage.setItem('fin_initialBalance', (initialBalance || 0).toString());
    localStorage.setItem('fin_targetSaving', (targetSaving || 0).toString());
    localStorage.setItem('fin_catBudgets', JSON.stringify(catBudgets));
    setIsEditingSettings(false);
    showToast('Pengaturan berhasil disimpan!', 'success');
  };

  const handleResetData = async () => {
    const ok = await confirm('Hapus Semua Data', 'Tindakan ini akan menghapus SELURUH riwayat transaksimu dan tidak bisa dibatalkan.', true);
    if (!ok) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('transactions').delete().not('id', 'is', null);
    if (!error) { localStorage.clear(); window.location.reload(); }
    else { showToast('Gagal mereset data.', 'error'); setIsSubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    setIsSubmitting(true);
    const payload = { title: formData.title, amount: Number(formData.amount), type: formData.type, category: formData.category, wallet: formData.wallet };
    if (editingId) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editingId);
      setIsSubmitting(false);
      if (!error) {
        setEditingId(null);
        setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai' });
        fetchData();
        showToast('Transaksi berhasil diperbarui!', 'success');
      } else showToast(`Gagal update: ${error.message}`, 'error');
    } else {
      const { error } = await supabase.from('transactions').insert([payload]);
      setIsSubmitting(false);
      if (!error) {
        setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai' });
        fetchData();
        showToast('Transaksi berhasil disimpan! 🎉', 'success');
      } else showToast(`Gagal simpan: ${error.message}`, 'error');
    }
  };

  const applyQuickAction = (title: string, amount: string, category: string) =>
    setFormData(prev => ({ ...prev, title, amount, type: 'pengeluaran', category }));

  const handleEditClick = (t: any) => {
    setEditingId(t.id);
    setFormData({ title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai' });
    document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id: string) => {
    const ok = await confirm('Hapus Transaksi', 'Transaksi ini akan dihapus secara permanen.', true);
    if (!ok) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) { fetchData(); showToast('Transaksi dihapus.', 'info'); }
    else showToast('Gagal menghapus: ' + error.message, 'error');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', amount: '', type: 'pengeluaran', category: 'Makanan', wallet: 'Kas Tunai' });
  };

  const handleDuplicate = async (t: any) => {
    const ok = await confirm('Duplikat Transaksi', `Gunakan "${t.title}" sebagai template pencatatan baru?`);
    if (!ok) return;
    setFormData({ title: t.title, amount: t.amount.toString(), type: t.type, category: t.category, wallet: t.wallet || 'Kas Tunai' });
    setEditingId(null);
    document.getElementById('formCatat')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── FIX: timezone-safe month list ──
  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map(t => {
      const d = new Date(t.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (filterMode === 'month') {
      if (filterMonth !== 'all') {
        result = result.filter(t => {
          const d = new Date(t.created_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
        });
      }
    } else if (filterMode === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate); start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate); end.setHours(23, 59, 59, 999);
      result = result.filter(t => { const tDate = new Date(t.created_at); return tDate >= start && tDate <= end; });
    }
    if (searchQuery) result = result.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.wallet && t.wallet.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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

    // NEW: savings rate & cashflow ratio
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    const cashflowRatio = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 0;

    return { income, expense, balance, totalAssets, netWorth, totalBills, globalNetWorth, billsTransactions, savingsRate, cashflowRatio };
  }, [filteredTransactions, transactions, initialBalance, filterMonth, filterMode]);

  // NEW: per-wallet breakdown
  const walletBreakdown = useMemo(() => {
    const walletMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const w = t.wallet || 'Kas Tunai';
      if (!walletMap[w]) walletMap[w] = { income: 0, expense: 0 };
      if (t.type === 'pemasukan') walletMap[w].income += Number(t.amount);
      else walletMap[w].expense += Number(t.amount);
    });
    return Object.entries(walletMap)
      .map(([name, v]) => ({ name, balance: v.income - v.expense, income: v.income, expense: v.expense }))
      .sort((a, b) => b.balance - a.balance);
  }, [transactions]);

  const userLevel = useMemo(() => {
    const nw = stats.globalNetWorth;
    if (nw >= 50000000) return { title: 'Sultan', icon: '👑', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' };
    if (nw >= 10000000) return { title: 'Master Hemat', icon: '💎', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' };
    if (nw >= 2000000) return { title: 'Prajurit', icon: '🛡️', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' };
    return { title: 'Pemula', icon: '🌱', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
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
        if (spent > budget) insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? `Peringatan: Kategori ${cat} melebihi batas. Terpakai ${formatIDR(spent)} dari jatah ${formatIDR(budget)}.` : `Woy! Jatah ${cat} jebol! Limit cuma ${formatIDR(budget)} tapi lu abisin ${formatIDR(spent)}.` });
        else if (spent > budget * 0.8) insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Hati-hati, anggaran ${cat} sudah terpakai ${Math.round((spent / budget) * 100)}%. Sisa: ${formatIDR(budget - spent)}.` : `Rem woy! Jatah ${cat} sisa ${formatIDR(budget - spent)} doang.` });
      }
    });
    if (stats.income > 0) {
      const wants = expensesOnly.filter(t => t.category === 'Hiburan' || t.category === 'Belanja').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const wantsPercentage = (wants / stats.income) * 100;
      if (wantsPercentage > 30) insights.push({ type: 'warning', text: aiPersonality === 'motivator' ? `Pengeluaran Hiburan/Belanja mencapai ${Math.round(wantsPercentage)}%. Coba tekan di bawah 30%.` : `Gaya elit ekonomi sulit! ${Math.round(wantsPercentage)}% buat foya-foya. Nabung dong!` });
    }
    if (stats.expense > stats.income && stats.income > 0) insights.push({ type: 'danger', text: aiPersonality === 'motivator' ? "Perhatian: Pengeluaran konsumsimu melebihi pemasukan periode ini." : "Minus bang? Kurang-kurangin jajan!" });
    if (insights.length === 0) insights.push({ type: 'success', text: aiPersonality === 'motivator' ? "Semua indikator keuanganmu sehat periode ini. Pertahankan! 💪" : "Eh, lumayan juga nih. Keuangan lo gak parah-parah amat bulan ini." });
    return insights;
  }, [stats, catBudgets, filteredTransactions, aiPersonality]);

  // ── Export ──
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.text("Laporan Keuangan", 14, 22);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const periodText = filterMode === 'month' ? (filterMonth === 'all' ? 'Semua Waktu' : parseMonthSafe(filterMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })) : `${customStartDate} s/d ${customEndDate}`;
    doc.text(`Periode: ${periodText}  |  ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 32);
    doc.setTextColor(51, 65, 85); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("RINGKASAN:", 14, 52);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Total Pemasukan Bersih`, 14, 60); doc.text(`:  ${formatIDR(stats.income)}`, 70, 60);
    doc.text(`Total Pengeluaran Konsumsi`, 14, 66); doc.text(`:  ${formatIDR(stats.expense)}`, 70, 66);
    doc.setFont("helvetica", "bold"); doc.setTextColor(20, 184, 166);
    doc.text(`Total Aset (Investasi)`, 14, 74); doc.text(`:  ${formatIDR(stats.totalAssets)}`, 70, 74);
    doc.setTextColor(stats.netWorth >= 0 ? 16 : 225, stats.netWorth >= 0 ? 185 : 29, stats.netWorth >= 0 ? 129 : 72);
    doc.text(`TOTAL KEKAYAAN`, 14, 82); doc.text(`:  ${formatIDR(stats.netWorth)}`, 70, 82);
    autoTable(doc, {
      startY: 90, head: [['Tanggal', 'Keterangan', 'Sumber Dana', 'Kategori', 'Tipe', 'Jumlah (Rp)']],
      body: filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title, t.wallet || 'Tunai', t.category, t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran', new Intl.NumberFormat('id-ID').format(Number(t.amount))]),
      theme: 'grid', headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 5: { halign: 'right' } }, styles: { fontSize: 9, cellPadding: 3 }, alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(`Halaman ${i} dari ${pageCount} — Dompet Digital`, 105, 285, { align: 'center' }); }
    doc.save(`Laporan_Keuangan_${Date.now()}.pdf`);
    showToast('PDF berhasil diunduh!', 'success');
  };

  const exportCSV = () => {
    const headers = ['Tanggal', 'Keterangan', 'Sumber Dana', 'Kategori', 'Tipe', 'Jumlah (Rp)'];
    const rows = filteredTransactions.map(t => [new Date(t.created_at).toLocaleDateString('id-ID'), t.title.replace(/,/g, ''), t.wallet || 'Tunai', t.category, t.type, t.amount]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a");
    link.setAttribute("href", encodedUri); link.setAttribute("download", `Data_Keuangan_${new Date().toLocaleDateString('id-ID')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast('CSV berhasil diunduh!', 'success');
  };

  if (!isMounted) return null;

  // ── Loading Screen ──
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-200 dark:shadow-blue-900">
            <Wallet size={36} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-3xl border-4 border-blue-300 dark:border-blue-700 animate-ping opacity-30"></div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-semibold animate-pulse">Menyiapkan Dompet Digital...</p>
      </div>
    );
  }

  // ── Login / Register Screen ──
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl w-full max-w-md p-7 sm:p-10 rounded-[2rem] shadow-2xl border border-white dark:border-slate-800 relative z-10">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-5 right-5 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-500" />}
          </button>
          <div className="text-center mb-8 pt-2">
            <div className={`w-18 h-18 bg-gradient-to-br from-blue-500 to-indigo-600 w-[72px] h-[72px] rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200 dark:shadow-blue-900 transition-all duration-500 ${authLoading ? 'scale-110 animate-pulse' : ''}`}>
              <Wallet size={34} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dompet Digital</h1>
            <p className="text-slate-400 mt-1.5 text-sm font-medium">{isRegistering ? 'Buat akun baru' : 'Masuk untuk mengelola keuanganmu'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="group flex items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-4 ring-blue-500/10 transition-all">
              <Mail size={20} className="text-slate-400 group-focus-within:text-blue-500 mr-3 shrink-0 transition-colors" />
              <input required type="email" placeholder="Alamat Email" className="bg-transparent outline-none w-full text-slate-700 dark:text-slate-200 font-medium placeholder:font-normal" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} disabled={authLoading} />
            </div>
            <div className="group flex items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-4 ring-blue-500/10 transition-all">
              <Lock size={20} className="text-slate-400 group-focus-within:text-blue-500 mr-3 shrink-0 transition-colors" />
              <input required type="password" placeholder="Password (min 6 karakter)" className="bg-transparent outline-none w-full text-slate-700 dark:text-slate-200 font-medium placeholder:font-normal" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} disabled={authLoading} />
            </div>
            <button disabled={authLoading} type="submit" className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold p-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] min-h-[56px] shadow-lg shadow-blue-200 dark:shadow-blue-900">
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? 'Daftar Sekarang' : 'Masuk Dashboard'}
            </button>
          </form>
          {!isRegistering && (
            <>
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-slate-900 text-slate-400 font-medium">ATAU</span></div></div>
              <button onClick={handleDemoLogin} disabled={authLoading} className="w-full flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold p-4 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-[0.98] min-h-[56px] border border-emerald-200 dark:border-emerald-800">
                <span>🚀</span> Coba Akun Demo
              </button>
            </>
          )}
          <div className="mt-7 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis!'}
            </button>
          </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // ── MAIN DASHBOARD ──
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 transition-colors duration-300">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        danger={confirmState?.danger}
        onConfirm={() => handleConfirmResult(true)}
        onCancel={() => handleConfirmResult(false)}
      />

      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 px-4 sm:px-6 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo + User */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none">
              <Wallet size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] text-slate-400 font-medium leading-none mb-0.5">Halo, <span className="text-blue-600 dark:text-blue-400 font-bold">{displayUsername}</span> 👋</p>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${userLevel.color}`}>{userLevel.icon} {userLevel.title}</span>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button onClick={() => setFilterMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'month' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>Bulan</button>
              <button onClick={() => setFilterMode('custom')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterMode === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>Rentang</button>
            </div>
            {filterMode === 'month' ? (
              <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl gap-2 shadow-sm">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent outline-none font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer appearance-none max-w-[120px]">
                  <option value="all">Semua Waktu</option>
                  {availableMonths.map(m => <option key={m} value={m}>{parseMonthSafe(m).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl gap-1.5 shadow-sm">
                <CalendarSearch size={14} className="text-slate-400 shrink-0" />
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold text-slate-700 dark:text-slate-200 w-28" />
                <span className="text-slate-300 text-xs">—</span>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold text-slate-700 dark:text-slate-200 w-28" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-500" />}
            </button>
            <button onClick={() => setIsEditingSettings(true)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              <Settings size={17} className="text-slate-600 dark:text-slate-400" />
            </button>
            <button onClick={exportPDF} className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:text-blue-600 transition-all text-xs shadow-sm">
              <FileText size={15} /> PDF
            </button>
            <button onClick={exportCSV} className="hidden sm:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all text-xs shadow-sm">
              <Download size={15} /> CSV
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold px-3 py-2.5 rounded-xl border border-rose-100 dark:border-rose-800 hover:bg-rose-100 transition-all text-xs shadow-sm">
              <LogOut size={15} /><span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

        {/* ── HERO SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Net Worth Card */}
          <div className="lg:col-span-2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-blue-300/40 dark:shadow-blue-900/40 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
              <Briefcase size={80} />
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-200 mb-2">Total Kekayaan Bersih</p>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter">{displayMoney(stats.netWorth)}</h2>
                    <button onClick={togglePrivacy} className="text-blue-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                      {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                  {stats.netWorth >= 0
                    ? <p className="text-blue-200 text-xs mt-2 flex items-center gap-1"><TrendingUp size={12} /> Keuangan Sehat</p>
                    : <p className="text-rose-300 text-xs mt-2 flex items-center gap-1"><TrendingDown size={12} /> Perlu Perhatian</p>
                  }
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-blue-200 font-bold mb-1 flex items-center gap-1"><Wallet size={10} /> Saldo Kas</p>
                  <p className="font-black text-sm sm:text-base truncate">{displayMoney(stats.balance)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-teal-400/30">
                  <p className="text-[10px] uppercase tracking-widest text-teal-200 font-bold mb-1 flex items-center gap-1"><Gem size={10} /> Investasi</p>
                  <p className="font-black text-sm sm:text-base text-teal-100 truncate">{displayMoney(stats.totalAssets)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-emerald-400/30">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold mb-1 flex items-center gap-1"><Percent size={10} /> Saving Rate</p>
                  <p className="font-black text-sm sm:text-base text-emerald-100">{stats.savingsRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Target Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <Target size={16} className="text-amber-500" />
                  </div>
                  Target Impian
                </h3>
                <span className="text-sm font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  {Math.min(100, Math.round((stats.netWorth / Number(targetSaving || 1)) * 100))}%
                </span>
              </div>

              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3 shadow-inner">
                <div className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(2, Math.min(100, (stats.netWorth / Number(targetSaving || 1)) * 100))}%` }} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between"><span>Terkumpul</span><span className="font-bold text-slate-800 dark:text-slate-200">{displayMoney(stats.netWorth)}</span></div>
                <div className="flex justify-between"><span>Target</span><span className="font-bold text-slate-800 dark:text-slate-200">{displayMoney(Number(targetSaving))}</span></div>
                <div className="flex justify-between"><span>Kurang</span><span className="font-bold text-amber-600">{displayMoney(Math.max(0, Number(targetSaving) - stats.netWorth))}</span></div>
              </div>
            </div>

            {/* NEW: Cashflow bar */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cashflow Periode Ini</p>
              <div className="flex items-center gap-2 text-xs mb-1.5">
                <span className="text-emerald-600 font-bold">{formatIDR(stats.income)}</span>
                <span className="text-slate-400 flex-1 text-center">vs</span>
                <span className="text-rose-500 font-bold">{formatIDR(stats.expense)}</span>
              </div>
              <div className="h-2 w-full bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.income > 0 ? Math.min(100, (stats.income / (stats.income + stats.expense)) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard title={filterMonth === 'all' && filterMode === 'month' ? "Total Pemasukan" : "Pemasukan Periode"} val={displayMoney(stats.income)} icon={<ArrowUpRight size={20} />} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatCard title={filterMonth === 'all' && filterMode === 'month' ? "Total Pengeluaran" : "Pengeluaran Periode"} val={displayMoney(stats.expense)} icon={<ArrowDownRight size={20} />} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-900/20" />
          <StatCard title="Total Tagihan Tetap" val={displayMoney(stats.totalBills)} icon={<CreditCard size={20} />} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-900/20" />
          <StatCard title="Jumlah Transaksi" val={`${filteredTransactions.length} transaksi`} icon={<BarChart3 size={20} />} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        </div>

        {/* ── AI + TAGIHAN ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Radar Tagihan */}
          <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-[50px] opacity-20 pointer-events-none" />
            <div className="flex items-center gap-2.5 text-rose-400 mb-4 relative z-10">
              <div className="w-8 h-8 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30">
                <CreditCard size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest">Radar Tagihan</h3>
                <p className="text-[10px] text-slate-500">Deteksi biaya berulang</p>
              </div>
            </div>
            <div className="mb-4 relative z-10">
              <p className="text-[10px] text-slate-400 mb-0.5">Total Tagihan Periode Ini</p>
              <p className="text-3xl font-black">{displayMoney(stats.totalBills)}</p>
            </div>
            <div className="space-y-2 relative z-10 flex-grow">
              {stats.billsTransactions.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-2xl border border-emerald-400/20">
                  <CheckCircle2 size={16} /><p className="text-xs font-medium">Tidak ada tagihan terdeteksi!</p>
                </div>
              ) : (
                stats.billsTransactions.slice(0, 4).map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center text-xs bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                    <span className="font-medium text-slate-300 truncate max-w-[130px]">{t.title}</span>
                    <span className="font-bold text-rose-400 shrink-0 ml-2">{formatIDR(Number(t.amount))}</span>
                  </div>
                ))
              )}
              {stats.billsTransactions.length > 4 && <p className="text-[10px] text-center text-slate-600 mt-1">+{stats.billsTransactions.length - 4} tagihan lainnya...</p>}
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none ${aiPersonality === 'roasting' ? 'bg-rose-400' : 'bg-indigo-400'}`} />
            <div className="flex items-center justify-between mb-5 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl text-white shadow-md flex items-center justify-center ${aiPersonality === 'roasting' ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                  {aiPersonality === 'roasting' ? <ShieldAlert size={20} /> : <Bot size={20} />}
                </div>
                <div>
                  <h2 className={`font-black text-base flex items-center gap-1.5 ${aiPersonality === 'roasting' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    Asisten AI <Sparkles size={13} />
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">Analisis anggaran otomatis</p>
                </div>
              </div>
              <button onClick={toggleAIPersonality} className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors border ${aiPersonality === 'roasting' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800'}`}>
                <RefreshCw size={10} /> Mode {aiPersonality}
              </button>
            </div>
            <div className="space-y-3 relative z-10 overflow-y-auto max-h-[240px] custom-scrollbar pr-1">
              {smartInsights.map((insight, idx) => {
                const styles: Record<string, string> = {
                  danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800',
                  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
                  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
                  info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
                  tip: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                };
                const icons: Record<string, React.ReactNode> = {
                  danger: <AlertTriangle size={14} />, warning: <AlertTriangle size={14} />,
                  success: <CheckCircle2 size={14} />, info: <Info size={14} />, tip: <Lightbulb size={14} />,
                };
                return (
                  <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${styles[insight.type] || styles.tip}`}>
                    <span className="mt-0.5 shrink-0">{icons[insight.type] || icons.tip}</span>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">{insight.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* LEFT: Form + History */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">

            {/* FORM INPUT */}
            <section id="formCatat" className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border transition-all relative overflow-hidden ${editingId ? 'border-amber-300 dark:border-amber-600 shadow-amber-100 dark:shadow-none' : 'border-slate-200/70 dark:border-slate-800'}`}>
              {!editingId && <div className="absolute -top-8 -right-8 text-slate-100 dark:text-slate-800 rotate-12 pointer-events-none"><Sparkles size={130} /></div>}
              <div className="p-5 sm:p-7 relative z-10">
                {editingId && (
                  <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 rounded-2xl">
                    <Edit2 size={15} /><span className="text-sm font-bold">Mode Edit Aktif — Perbarui transaksi ini</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                  <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white">
                    {editingId
                      ? <><Edit2 className="text-amber-500" size={20} /> Edit Aktivitas</>
                      : <><Plus className="text-blue-500" size={20} /> Catat Aktivitas</>
                    }
                  </h2>
                  {!editingId && (
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                      <button type="button" onClick={() => applyQuickAction('Dana SPPD Jakarta', '2500000', 'SPPD')} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shrink-0 flex items-center gap-1">✈️ SPPD</button>
                      <button type="button" onClick={() => applyQuickAction('Bayar WiFi', '350000', 'Tagihan')} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0 flex items-center gap-1">🧾 Tagihan</button>
                      <button type="button" onClick={() => applyQuickAction('Makan Siang', '25000', 'Makanan')} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0 flex items-center gap-1">🍛 Makan</button>
                      <button type="button" onClick={() => applyQuickAction('Cicilan', '500000', 'Bayar Pinjaman')} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center gap-1">💳 Cicilan</button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Title */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Deskripsi Transaksi</label>
                    <input required placeholder="Ketik deskripsi (misal: Beli Emas, Terima Tukin...)" className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 border border-slate-200 dark:border-slate-800 w-full transition-all text-sm placeholder:text-slate-400" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Nominal (Rp)</label>
                    <input required type="number" placeholder="0" className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 border border-slate-200 dark:border-slate-800 w-full transition-all font-bold text-slate-800 dark:text-white text-sm" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                    {formData.amount && <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1 ml-1">→ {formatIDR(Number(formData.amount))}</p>}
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Jenis Transaksi</label>
                    <select className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-800 w-full font-medium text-slate-700 dark:text-slate-300 transition-all focus:ring-2 ring-blue-500/20 text-sm"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value, category: e.target.value === 'pemasukan' ? 'Gaji Pokok' : 'Makanan' })}>
                      <option value="pengeluaran">💸 Keluar / Beli Aset</option>
                      <option value="pemasukan">💰 Pemasukan Kas</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="relative">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Kategori {!editingId && <span className="text-blue-500 ml-1">✦ Auto-detect</span>}</label>
                    <select className={`p-4 rounded-2xl outline-none border w-full font-medium transition-all focus:ring-2 ring-indigo-500/30 text-sm appearance-none cursor-pointer pr-10 ${editingId ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300' : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300'}`}
                      value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      {formData.type === 'pengeluaran' ? (
                        <>
                          <option value="Makanan">🍜 Makanan / Minuman</option>
                          <option value="Transportasi">🚗 Transportasi</option>
                          <option value="Tagihan">🧾 Tagihan (Bills)</option>
                          <option value="Belanja">🛍️ Belanja</option>
                          <option value="Hiburan">🎮 Hiburan</option>
                          <option value="Investasi">📈 Beli Investasi (Aset)</option>
                          <option value="SPPD">✈️ SPPD / Dinas</option>
                          <option value="Beri Hutang">🤝 Beri Hutang/Pinjaman</option>
                          <option value="Bayar Pinjaman">💳 Bayar/Lunasin Pinjaman</option>
                          <option value="Lainnya">📦 Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option value="Gaji Pokok">💼 Gaji Pokok</option>
                          <option value="Tukin">🏆 Tukin / Tunjangan</option>
                          <option value="Uang Makan">🍽️ Uang Makan</option>
                          <option value="SPPD">✈️ Terima SPPD</option>
                          <option value="Bonus">✨ Bonus / THR</option>
                          <option value="Investasi">📉 Jual Investasi</option>
                          <option value="Dibayar Hutang">🤝 Dibayar Hutang (Piutang)</option>
                          <option value="Terima Pinjaman">🏦 Terima Dana Pinjaman</option>
                          <option value="Lainnya">📦 Lainnya</option>
                        </>
                      )}
                    </select>
                    {!editingId && <div className="absolute right-4 bottom-4 pointer-events-none text-indigo-400"><Bot size={15} /></div>}
                  </div>

                  {/* Wallet */}
                  <div className="relative">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Sumber Dana</label>
                    <div className="relative">
                      <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select className="bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-4 rounded-2xl outline-none border border-slate-200 dark:border-slate-800 w-full font-bold text-slate-700 dark:text-slate-300 transition-all focus:ring-2 ring-blue-500/20 text-sm cursor-pointer appearance-none" value={formData.wallet} onChange={e => setFormData({ ...formData, wallet: e.target.value })}>
                        {WALLET_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="col-span-1 sm:col-span-2 flex gap-3 mt-1">
                    <button disabled={isSubmitting} className={`flex-1 text-white font-bold p-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm shadow-lg flex items-center justify-center gap-2 ${editingId ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200 dark:shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200 dark:shadow-none'}`}>
                      {isSubmitting ? <><Loader2 className="animate-spin" size={18} />Memproses...</> : editingId ? <><Check size={18} />Update Transaksi</> : <><Plus size={18} />Simpan Transaksi</>}
                    </button>
                    {editingId && <button type="button" onClick={handleCancelEdit} className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm">Batal</button>}
                  </div>
                </form>
              </div>
            </section>

            {/* RIWAYAT TRANSAKSI */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/70 dark:border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black flex items-center gap-2 text-slate-800 dark:text-white">
                    <Calendar className="text-blue-500" size={20} /> Riwayat Aktivitas
                  </h2>
                  {filteredTransactions.length > 0 && (
                    <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      {filteredTransactions.length} transaksi
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex flex-1 items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 shadow-sm transition-all gap-2">
                    <Search size={15} className="text-slate-400 shrink-0" />
                    <input type="text" placeholder="Cari transaksi, kategori, rekening..." className="bg-transparent outline-none w-full text-sm text-slate-700 dark:text-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    {/* NEW: clear search button */}
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={14} /></button>}
                  </div>
                  <div className="flex items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-2 w-full sm:w-auto">
                    <ArrowUpDown size={15} className="text-slate-400 shrink-0" />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer appearance-none">
                      <option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="highest">Terbesar</option><option value="lowest">Terkecil</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-950/30">
                {loading ? (
                  <div className="p-12 text-center">
                    <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Memuat transaksi...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <PiggyBank size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">Belum ada transaksi</p>
                    <p className="text-slate-400 text-xs">{searchQuery ? 'Coba kata kunci lain' : 'Mulai catat aktivitas keuanganmu!'}</p>
                  </div>
                ) : (
                  filteredTransactions.map((t) => {
                    const isIncome = t.type === 'pemasukan';
                    const isInvest = t.category === 'Investasi';
                    const isSPPD = t.category === 'SPPD';
                    const isDebt = ['Beri Hutang', 'Bayar Pinjaman', 'Dibayar Hutang', 'Terima Pinjaman'].includes(t.category);

                    let iconBg = isIncome ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600';
                    if (isInvest) iconBg = 'bg-teal-50 dark:bg-teal-900/20 text-teal-600';
                    if (isSPPD) iconBg = 'bg-orange-50 dark:bg-orange-900/20 text-orange-600';
                    if (isDebt) iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-500';

                    return (
                      <div key={t.id} className={`mb-2 p-3.5 sm:p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${editingId === t.id ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800'}`}>
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${iconBg}`}>
                            {isIncome && !isInvest ? <ArrowUpRight size={17} /> : isInvest ? <Gem size={17} /> : <ArrowDownRight size={17} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm line-clamp-1">{t.title}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium">{t.category}</span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800 font-bold flex items-center gap-0.5"><Landmark size={8} /> {t.wallet || 'Tunai'}</span>
                            </div>
                          </div>
                          {/* Amount on mobile */}
                          <p className={`sm:hidden text-sm font-black shrink-0 ${isIncome ? 'text-emerald-500' : isInvest ? 'text-teal-500' : isDebt ? 'text-slate-500' : 'text-rose-500'}`}>
                            {isIncome ? '+' : '-'}{displayMoney(Number(t.amount))}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <p className={`hidden sm:block text-base font-black tracking-tight mr-1 whitespace-nowrap ${isIncome ? 'text-emerald-500' : isInvest ? 'text-teal-500' : isDebt ? 'text-slate-500' : 'text-rose-500'}`}>
                            {isIncome ? '+' : '-'}{displayMoney(Number(t.amount))}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setSelectedReceipt(t)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors" title="Lihat Struk"><Receipt size={14} /></button>
                            <button onClick={() => handleDuplicate(t)} className="p-2 text-violet-600 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 rounded-xl border border-violet-200 dark:border-violet-800 transition-colors" title="Duplikat"><Copy size={14} /></button>
                            <button onClick={() => handleEditClick(t)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors" title="Edit"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Charts, Budget, Wallet */}
          <div className="space-y-5 sm:space-y-6">

            {/* Wallet & AI Panel with tabs */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/70 dark:border-slate-800 overflow-hidden">
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <button onClick={() => setActiveTab('insights')} className={`flex-1 py-3.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'insights' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-white dark:bg-slate-900' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  <Bot size={14} /> AI Insights
                </button>
                {/* NEW: Wallet Breakdown Tab */}
                <button onClick={() => setActiveTab('wallets')} className={`flex-1 py-3.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'wallets' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-white dark:bg-slate-900' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  <Landmark size={14} /> Saldo Rekening
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'insights' ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Ringkasan Keuangan</p>
                    {[
                      { label: 'Saving Rate', val: `${stats.savingsRate}%`, color: stats.savingsRate >= 20 ? 'text-emerald-600' : 'text-amber-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                      { label: 'Cashflow Ratio', val: `${stats.cashflowRatio}%`, color: stats.cashflowRatio < 80 ? 'text-emerald-600' : 'text-rose-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                      { label: 'Total Transaksi', val: filteredTransactions.length.toString(), color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
                      { label: 'Rata-rata Pengeluaran', val: filteredTransactions.filter(t => t.type === 'pengeluaran').length > 0 ? formatIDR(stats.expense / filteredTransactions.filter(t => t.type === 'pengeluaran').length) : 'N/A', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center justify-between p-3 rounded-xl ${item.bg}`}>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                        <span className={`text-sm font-black ${item.color}`}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Per Sumber Dana</p>
                    {walletBreakdown.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Belum ada data rekening.</p>
                    ) : walletBreakdown.map(w => (
                      <div key={w.name} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Landmark size={12} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{w.name}</span>
                          </div>
                          <span className={`text-sm font-black ${w.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                            {displayMoney(w.balance)}
                          </span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-slate-500 pl-9">
                          <span className="text-emerald-600">+{formatIDR(w.income)}</span>
                          <span className="text-rose-500">-{formatIDR(w.expense)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Budget Section */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white"><AlertOctagon className="text-rose-500" size={18} /> Batas Anggaran</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Peringatan micro-budgeting</p>
                </div>
                <button onClick={() => setIsEditingSettings(true)} className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors">Ubah Batas</button>
              </div>
              <div className="space-y-4">
                {Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800">
                    <AlertOctagon size={24} className="mx-auto mb-2 opacity-40" />
                    Belum ada batas anggaran. Klik <b className="text-blue-600">Ubah Batas</b>.
                  </div>
                ) : (
                  Object.keys(catBudgets).filter(k => Number(catBudgets[k]) > 0).map(cat => {
                    const limit = Number(catBudgets[cat]);
                    const spent = filteredTransactions.filter(t => t.type === 'pengeluaran' && t.category === cat).reduce((acc, curr) => acc + Number(curr.amount), 0);
                    const percent = Math.min(100, Math.round((spent / limit) * 100));
                    const isDanger = spent > limit;
                    const isWarning = spent > limit * 0.8 && !isDanger;
                    return (
                      <div key={cat} className={`p-4 rounded-2xl border ${isDanger ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-900' : isWarning ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800'}`}>
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">{cat} {isDanger && <AlertTriangle size={12} className="text-rose-500 animate-pulse" />}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{formatIDR(spent)} / {formatIDR(limit)}</p>
                          </div>
                          <span className={`text-xs font-black ${isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-700 rounded-full ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${percent}%` }} />
                        </div>
                        {isDanger && <p className="text-[10px] text-rose-600 mt-2 font-bold">⚠️ Lewat {formatIDR(spent - limit)}</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Pie Chart */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6">
              <div className="mb-1">
                <h2 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-white"><Tag size={18} className="text-blue-500" /> Alokasi Konsumsi</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">*Di luar Aset Investasi & Hutang</p>
              </div>
              <div className="h-40 w-full relative mt-3">
                {categoryChartData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <PieIcon size={28} className="opacity-30" />
                    <p className="text-xs font-medium">Belum ada pengeluaran</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryChartData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                        {categoryChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatIDR(Number(value))} contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: isDarkMode ? '#fff' : '#000', fontSize: '11px', fontWeight: '700' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {categoryChartData.map((item: any, idx) => {
                  const total = categoryChartData.reduce((a, c) => a + c.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[100px]">{item.name}</span>
                        <span className="text-slate-400 font-medium">{pct}%</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">{displayMoney(item.value)}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Mobile export buttons */}
            <div className="flex gap-3 sm:hidden">
              <button onClick={exportPDF} className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-sm"><FileText size={15} /> PDF</button>
              <button onClick={exportCSV} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs"><Download size={15} /> CSV</button>
            </div>

          </div>
        </div>
      </div>

      {/* ── RECEIPT MODAL ── */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Receipt Header */}
            <div className={`p-6 text-center text-white ${selectedReceipt.type === 'pemasukan' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : selectedReceipt.category === 'Investasi' ? 'bg-gradient-to-br from-teal-500 to-cyan-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                {selectedReceipt.type === 'pemasukan' ? <ArrowUpRight size={26} /> : selectedReceipt.category === 'Investasi' ? <Gem size={26} /> : <ArrowDownRight size={26} />}
              </div>
              <h3 className="font-black text-xl uppercase tracking-wide">Struk Transaksi</h3>
              <p className="text-white/70 text-xs mt-1">{new Date(selectedReceipt.created_at).toLocaleString('id-ID')}</p>
            </div>

            {/* Ticket perforation */}
            <div className="relative">
              <div className="absolute -top-3 left-0 right-0 flex justify-between px-2">
                {[...Array(14)].map((_, i) => <div key={i} className="w-5 h-6 bg-[#F0F4F8] dark:bg-slate-950 rounded-full" />)}
              </div>
              <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 mx-5 pt-8 pb-5 space-y-4">
                <div className="text-center mb-5">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total {selectedReceipt.type}</p>
                  <p className={`text-4xl font-black ${selectedReceipt.type === 'pemasukan' ? 'text-emerald-500' : selectedReceipt.category === 'Investasi' ? 'text-teal-500' : 'text-rose-500'}`}>
                    {formatIDR(Number(selectedReceipt.amount))}
                  </p>
                </div>
                {[
                  { label: 'Keterangan', val: selectedReceipt.title },
                  { label: 'Kategori', val: selectedReceipt.category },
                  { label: 'Sumber Dana', val: selectedReceipt.wallet || 'Tunai', extra: 'text-blue-600 dark:text-blue-400' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-start">
                    <span className="text-slate-400 text-xs font-medium">{row.label}</span>
                    <span className={`text-xs font-bold text-right max-w-[60%] ${row.extra || 'text-slate-800 dark:text-slate-200'}`}>{row.val}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-medium">Ref ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300">{selectedReceipt.id.split('-')[0].toUpperCase()}</span>
                    {/* NEW: copy ref ID button */}
                    <button
                      onClick={() => { navigator.clipboard.writeText(selectedReceipt.id); showToast('Ref ID disalin!', 'success'); }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title="Salin ID">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
              {/* Barcode decoration */}
              <div className="mx-5 border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-5 pb-5 text-center">
                <div className="h-10 w-full flex justify-center gap-0.5 opacity-30">
                  {[...Array(30)].map((_, i) => <div key={i} className="bg-slate-800 dark:bg-slate-200 h-full rounded-sm" style={{ width: `${Math.random() * 3 + 1}px` }} />)}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-bold tracking-widest uppercase">Dompet Digital • {new Date().getFullYear()}</p>
              </div>
            </div>

            <button onClick={() => setSelectedReceipt(null)} className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-sm transition-all"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ── */}
      {isEditingSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <div className="flex justify-between items-center mb-7 sticky top-0 bg-white dark:bg-slate-900 pb-4 z-10 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Pengaturan Lanjutan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sesuaikan target & batasan keuanganmu</p>
              </div>
              <button onClick={() => setIsEditingSettings(false)} className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500 hover:text-rose-500 transition-all"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              <div className="space-y-5">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm"><Wallet size={16} className="text-blue-500" /> Data Dasar</h4>
                {[
                  { label: 'Saldo Kas Tunai Awal', placeholder: 'Contoh: 1000000', val: initialBalance, setter: setInitialBalance },
                  { label: 'Target Kekayaan Impian', placeholder: 'Contoh: 50000000', val: targetSaving, setter: setTargetSaving },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{field.label}</label>
                    <input type="number" placeholder={field.placeholder} className="w-full bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-blue-500/20 font-bold text-slate-800 dark:text-white text-sm" value={field.val} onChange={e => field.setter(e.target.value as any)} />
                    {field.val ? <p className="text-[10px] text-blue-500 mt-1 font-bold">→ {formatIDR(Number(field.val))}</p> : null}
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={handleResetData} disabled={isSubmitting} className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold py-3 rounded-2xl hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50 text-sm border border-rose-100 dark:border-rose-900">
                    {isSubmitting ? <><Loader2 className="animate-spin inline mr-2" size={14} />Menghapus...</> : '🗑️ Hapus Semua Data (Reset)'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1 text-sm"><AlertOctagon size={16} className="text-rose-500" /> Batas Anggaran per Kategori</h4>
                  <p className="text-[10px] text-slate-400 mb-4">Kosongkan jika tidak dibatasi.</p>
                </div>
                {['Makanan', 'Tagihan', 'Transportasi', 'Belanja', 'Hiburan'].map((cat) => (
                  <div key={cat} className="flex flex-col bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</span>
                      <input type="number" placeholder="Tanpa batas" className="w-full bg-transparent p-2 outline-none font-bold text-slate-800 dark:text-white text-xs border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 transition-colors" value={catBudgets[cat]} onChange={e => setCatBudgets({ ...catBudgets, [cat]: e.target.value })} />
                    </div>
                    {catBudgets[cat] && <p className="text-[10px] text-blue-500 text-right mt-1 font-bold">{formatIDR(Number(catBudgets[cat]))}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
              <button onClick={saveSettings} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] text-sm">
                <Check size={16} className="inline mr-2" />Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; transition: 0.2s; }
        input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
        .dark input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}} />
    </div>
  );
}

// ── STAT CARD COMPONENT ──────────────────────────────────────────────────────
function StatCard({ title, val, icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-md">
      <div className={`${bg} ${color} p-3 rounded-xl shrink-0`}>{icon}</div>
      <div className="overflow-hidden min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{title}</p>
        <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight truncate">{val}</p>
      </div>
    </div>
  );
}

// ── LIGHTBULB (used inline but declared here as fallback) ────────────────────
function Lightbulb(props: any) {
  return <Zap {...props} />;
}