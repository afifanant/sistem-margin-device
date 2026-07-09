'use client'

import React, { useState } from 'react'
import { 
  tambahBarang, 
  jualBarang, 
  hapusBarang 
} from './actions'
import DeleteButton from './DeleteButton'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  PlusCircle, 
  Smartphone, 
  Laptop, 
  DollarSign, 
  Layers, 
  Activity, 
  Calendar, 
  Coins, 
  RefreshCw 
} from 'lucide-react'

interface DashboardClientProps {
  perangkatReady: any[]
  perangkatSold: any[]
  totalModalTertahan: number
  totalProfitKotor: number
}

export default function DashboardClient({
  perangkatReady = [],
  perangkatSold = [],
  totalModalTertahan,
  totalProfitKotor
}: DashboardClientProps) {
  // Search & Category Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Controlled form inputs for client-side auto-formatting (Rupiah)
  const [hargaBeli, setHargaBeli] = useState('')
  const [biayaPerbaikan, setBiayaPerbaikan] = useState('')
  const [biayaLainnya, setBiayaLainnya] = useState('')

  // Map to hold temporary inputs for "Harga Jual" per device in the Ready table
  const [hargaJualMap, setHargaJualMap] = useState<{ [key: string]: string }>({})

  const handleRupiahChange = (value: string, setter: (val: string) => void) => {
    const clean = value.replace(/[^0-9]/g, '')
    if (!clean) {
      setter('')
      return
    }
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(clean))
    setter(formatted)
  }

  const handleHargaJualChange = (deviceId: string, value: string) => {
    const clean = value.replace(/[^0-9]/g, '')
    let formatted = ''
    if (clean) {
      formatted = new Intl.NumberFormat('id-ID').format(parseInt(clean))
    }
    setHargaJualMap(prev => ({
      ...prev,
      [deviceId]: formatted
    }))
  }

  // Filter Helper
  const filterDevice = (item: any) => {
    const matchesSearch = 
      item.nama_barang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.imei_sn?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = 
      selectedCategory === 'Semua' || 
      item.kategori === selectedCategory

    return matchesSearch && matchesCategory
  }

  const filteredReady = perangkatReady.filter(filterDevice)
  const filteredSold = perangkatSold.filter(filterDevice)

  // Reset form inputs after submission (we can intercept submit or let it refresh)
  const handleFormSubmit = () => {
    // Delay to let the action execute, then clear state
    setTimeout(() => {
      setHargaBeli('')
      setBiayaPerbaikan('')
      setBiayaLainnya('')
    }, 500)
  }

  // Helper for category badge styling
  const getCategoryBadge = (kategori: string) => {
    switch (kategori) {
      case 'iPhone':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/25 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <Smartphone className="w-3 h-3" />
            iPhone
          </span>
        )
      case 'Android':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <Smartphone className="w-3 h-3" />
            Android
          </span>
        )
      case 'Laptop':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/25 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <Laptop className="w-3 h-3" />
            Laptop
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 border border-slate-500/25 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {kategori}
          </span>
        )
    }
  }

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-8 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
                AR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">COD</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Sistem Manajemen Inventaris Pintar & Real-Time Margin Controller
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-2 bg-slate-900/50 border border-slate-800/80 px-3 py-1.5 rounded-lg w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Terhubung ke Database Live
          </div>
        </header>

        {/* DASHBOARD SUMMARY CARD */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Aset */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/50 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Aset Aktif (Ready)</p>
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Rp {totalModalTertahan.toLocaleString('id-ID')}
            </h3>
            <div className="flex items-center gap-1.5 mt-4">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {perangkatReady.length} Unit
              </span>
              <p className="text-[11px] text-slate-500">likuiditas modal saat ini.</p>
            </div>
          </div>

          {/* Card Margin */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/50 transition-all duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Realisasi Margin (Sold)</p>
              <div className={`p-2 rounded-xl ${totalProfitKotor >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {totalProfitKotor >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
            <h3 className={`text-3xl font-bold tracking-tight ${totalProfitKotor >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rp {totalProfitKotor.toLocaleString('id-ID')}
            </h3>
            <div className="flex items-center gap-1.5 mt-4">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${totalProfitKotor >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                {perangkatSold.length} Terjual
              </span>
              <p className="text-[11px] text-slate-500">hasil akumulasi penjualan.</p>
            </div>
          </div>

          {/* Card Stats Tambahan */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700/50 transition-all duration-300 md:col-span-1">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rasio Perputaran Unit</p>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              {perangkatReady.length + perangkatSold.length > 0 
                ? Math.round((perangkatSold.length / (perangkatReady.length + perangkatSold.length)) * 100) 
                : 0}%
            </h3>
            <div className="flex items-center gap-1.5 mt-4">
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                Rasio Terkonversi
              </span>
              <p className="text-[11px] text-slate-500">dari total {perangkatReady.length + perangkatSold.length} akuisisi.</p>
            </div>
          </div>
        </section>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: FORM INPUT */}
          <div className="lg:col-span-1 space-y-6">
            <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/20">
              <div className="mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  Registrasi Perangkat Baru
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan data akuisisi unit. Nilai uang otomatis diformat.
                </p>
              </div>
              
              <form action={tambahBarang} onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kategori Perangkat</label>
                  <select name="kategori" className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                    <option value="iPhone">iPhone</option>
                    <option value="Android">Android</option>
                    <option value="Laptop">Laptop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Spesifikasi & Nama Unit</label>
                  <input 
                    type="text" 
                    name="nama_barang" 
                    placeholder="Contoh: iPhone 13 Pro Max 256GB" 
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Identitas Unik (IMEI / SN)</label>
                  <input 
                    type="text" 
                    name="imei_sn" 
                    placeholder="Masukkan IMEI atau Serial Number" 
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                    required 
                  />
                </div>

                {/* FINANCIAL STRUCTURING */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800/60 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    Struktur Modal Awal
                  </h3>
                  
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nilai Beli (Rp)</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        name="harga_beli" 
                        value={hargaBeli}
                        onChange={(e) => handleRupiahChange(e.target.value, setHargaBeli)}
                        placeholder="0" 
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Restorasi / Perbaikan (Rp)</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        name="biaya_perbaikan" 
                        value={biayaPerbaikan}
                        onChange={(e) => handleRupiahChange(e.target.value, setBiayaPerbaikan)}
                        placeholder="0" 
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Biaya Operasional (Rp)</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        name="biaya_lainnya" 
                        value={biayaLainnya}
                        onChange={(e) => handleRupiahChange(e.target.value, setBiayaLainnya)}
                        placeholder="0" 
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/40">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Catatan Akuisisi</label>
                    <input 
                      type="text" 
                      name="keterangan_biaya" 
                      placeholder="Detail servis layar, ganti baterai, dll..." 
                      className="w-full rounded-lg border border-slate-850 bg-slate-900 p-2.5 text-xs font-medium text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm uppercase tracking-wider py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  Registrasi Aset
                </button>
              </form>
            </section>
          </div>

          {/* COLUMN 2 & 3: MAIN LISTS & FILTER CENTER */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SEARCH & FILTER CONTROLS */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search bar */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Cari nama perangkat, IMEI, atau serial number..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-850 overflow-x-auto">
                {['Semua', 'iPhone', 'Android', 'Laptop'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* TABEL STOK ACTIVE (READY) */}
            <section className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
              <div className="p-5 border-b border-slate-800/80 bg-slate-900/30 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Inventaris Aktif (Stok Ready)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aset yang sedang berjalan dan siap dilepas ke pasar.
                  </p>
                </div>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                  {filteredReady.length} Unit
                </span>
              </div>
              
              {filteredReady.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900/10">
                  <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-medium uppercase tracking-wide">Tidak ada unit ready yang cocok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                        <th className="p-4 pl-6">Detail Perangkat</th>
                        <th className="p-4">Identitas (IMEI/SN)</th>
                        <th className="p-4">Total HPP</th>
                        <th className="p-4 text-right pr-6">Eksekusi Penjualan / Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800/60 bg-transparent">
                      {filteredReady.map((item: any) => {
                        const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                        const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                        const hasRepair = modal.biaya_perbaikan > 0 || modal.biaya_lainnya > 0
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-900/20 transition-colors group">
                            <td className="p-4 pl-6">
                              <div className="flex flex-col gap-1.5">
                                <div>{getCategoryBadge(item.kategori)}</div>
                                <span className="font-semibold text-slate-100 text-[13px]">{item.nama_barang}</span>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-400 font-semibold">{item.imei_sn}</td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-200">Rp {totalHpp.toLocaleString('id-ID')}</span>
                                {hasRepair && (
                                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    Beli: Rp {modal.harga_beli.toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex items-center justify-end gap-3.5">
                                {/* Hapus Form */}
                                <form action={hapusBarang}>
                                  <input type="hidden" name="device_id" value={item.id} />
                                  <DeleteButton />
                                </form>
                                
                                {/* Jual Form */}
                                <form action={jualBarang} className="flex items-center gap-2">
                                  <input type="hidden" name="device_id" value={item.id} />
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[10px] font-bold text-slate-500">Rp</span>
                                    <input 
                                      type="text" 
                                      inputMode="numeric" 
                                      name="harga_jual" 
                                      value={hargaJualMap[item.id] || ''}
                                      onChange={(e) => handleHargaJualChange(item.id, e.target.value)}
                                      placeholder="Harga Jual" 
                                      className="rounded-lg border border-slate-800 bg-slate-950 pl-7 pr-2 py-1.5 w-28 text-xs text-slate-200 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" 
                                      required 
                                    />
                                  </div>
                                  <button 
                                    type="submit" 
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Jual
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* TABEL REALISASI (SOLD) */}
            <section className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
              
              <div className="p-5 border-b border-slate-800/80 bg-slate-900/30 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Buku Besar Konversi (Perangkat Sold)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Histori penjualan, perhitungan margin bersih, dan pelepasan aset.
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                  {filteredSold.length} Unit
                </span>
              </div>
              
              {filteredSold.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900/10">
                  <Coins className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-medium uppercase tracking-wide">Belum ada riwayat penjualan yang cocok.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                        <th className="p-4 pl-6">Detail Perangkat</th>
                        <th className="p-4">Total HPP</th>
                        <th className="p-4">Harga Jual</th>
                        <th className="p-4">Margin Bersih</th>
                        <th className="p-4 text-right pr-6">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800/60 bg-transparent">
                      {filteredSold.map((item: any) => {
                        const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                        const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                        const transaksi = item.transactions?.[0] || { harga_jual: 0, tanggal_terjual: '' }
                        const profitBersih = transaksi.harga_jual - totalHpp
                        const isProfit = profitBersih >= 0
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-900/20 transition-colors group">
                            <td className="p-4 pl-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold text-slate-100 text-[13px]">{item.nama_barang}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{item.imei_sn}</span>
                                  {transaksi.tanggal_terjual && (
                                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-600" />
                                      {new Date(transaksi.tanggal_terjual).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-slate-400 font-medium">Rp {totalHpp.toLocaleString('id-ID')}</td>
                            <td className="p-4 text-slate-200 font-semibold">Rp {transaksi.harga_jual.toLocaleString('id-ID')}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                isProfit 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {isProfit ? '+' : ''} Rp {profitBersih.toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <div className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                <form action={hapusBarang}>
                                  <input type="hidden" name="device_id" value={item.id} />
                                  <DeleteButton />
                                </form>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        </div>

      </div>
    </main>
  )
}
