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
  Calendar, 
  Coins, 
  FileSpreadsheet,
  Download,
  BarChart3,
  Info,
  ChevronRight
} from 'lucide-react'
import * as XLSX from 'xlsx'

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

  // Track category selected in form to dynamically update input labels (IMEI -> Kode HP)
  const [formCategory, setFormCategory] = useState('iPhone')

  // Report Center State
  const [reportType, setReportType] = useState('bulanan') // 'harian', 'bulanan', 'semua'
  const [selectedReportDate, setSelectedReportDate] = useState(() => {
    return new Date().toISOString().substring(0, 10)
  })
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7)
  })

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
      item.imei_sn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kategori?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = 
      selectedCategory === 'Semua' || 
      item.kategori === selectedCategory

    return matchesSearch && matchesCategory
  }

  const filteredReady = perangkatReady.filter(filterDevice)
  const filteredSold = perangkatSold.filter(filterDevice)

  // 1. Calculate Average Margin per unit sold
  const averageMargin = perangkatSold.length > 0 ? totalProfitKotor / perangkatSold.length : 0

  // 2. Calculate Top-performing Category by Total Profit
  const categoryProfits: { [key: string]: number } = {}
  perangkatSold.forEach(item => {
    const cat = item.kategori || 'Lainnya'
    const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
    const validTx = item.transactions?.filter((t: any) => t.harga_jual > 0) || []
    const t = validTx[validTx.length - 1] || item.transactions?.[0] || { harga_jual: 0 }
    const hpp = m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya
    const profit = t.harga_jual - hpp
    categoryProfits[cat] = (categoryProfits[cat] || 0) + profit
  })

  let topCategory = 'Tidak ada'
  let maxCatProfit = 0
  Object.entries(categoryProfits).forEach(([cat, profit]) => {
    if (profit > maxCatProfit) {
      maxCatProfit = profit
      topCategory = cat
    }
  })

  // Reset form inputs after submission
  const handleFormSubmit = () => {
    setTimeout(() => {
      setHargaBeli('')
      setBiayaPerbaikan('')
      setBiayaLainnya('')
    }, 500)
  }

  // Generate Excel Report Function
  const handleExportExcel = () => {
    let listSold = [...perangkatSold]
    let listReady = [...perangkatReady]

    let titlePeriod = ''
    if (reportType === 'harian') {
      if (!selectedReportDate) {
        alert('Silakan pilih tanggal laporan terlebih dahulu!')
        return
      }
      listSold = listSold.filter(item => {
        const txDate = item.transactions?.[0]?.tanggal_terjual
        return txDate && txDate.substring(0, 10) === selectedReportDate
      })
      listReady = listReady.filter(item => {
        return item.created_at && item.created_at.substring(0, 10) === selectedReportDate
      })
      
      const formattedDate = new Date(selectedReportDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      titlePeriod = `HARIAN (${formattedDate})`
    } else if (reportType === 'bulanan') {
      if (!selectedReportMonth) {
        alert('Silakan pilih bulan laporan terlebih dahulu!')
        return
      }
      listSold = listSold.filter(item => {
        const txDate = item.transactions?.[0]?.tanggal_terjual
        return txDate && txDate.substring(0, 7) === selectedReportMonth
      })
      listReady = listReady.filter(item => {
        return item.created_at && item.created_at.substring(0, 7) === selectedReportMonth
      })

      const [year, month] = selectedReportMonth.split('-')
      const formattedMonth = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
      })
      titlePeriod = `BULANAN (${formattedMonth.toUpperCase()})`
    } else {
      titlePeriod = 'SEMUA PERIODE DATA'
    }

    // Calculate report statistics
    let totalRevenue = 0
    let totalHppSold = 0
    let totalMarginSold = 0
    listSold.forEach(item => {
      const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
      const validTx = item.transactions?.filter((t: any) => t.harga_jual > 0) || []
      const t = validTx[validTx.length - 1] || item.transactions?.[0] || { harga_jual: 0 }
      const hpp = m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya
      totalRevenue += t.harga_jual
      totalHppSold += hpp
      totalMarginSold += (t.harga_jual - hpp)
    })

    let totalAssetValueReady = 0
    listReady.forEach(item => {
      const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
      totalAssetValueReady += (m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya)
    })

    // Sheet 1: Ringkasan Finansial
    const summaryData = [
      ['LAPORAN KINERJA FINANSIAL AR COD'],
      [`Periode Laporan: ${titlePeriod}`],
      [`Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}`],
      [],
      ['RINGKASAN EKSEKUSI PENJUALAN (UNIT SOLD)', ''],
      ['Total Unit Terjual', listSold.length + ' Unit'],
      ['Total Omzet Penjualan (Revenue)', totalRevenue],
      ['Total Modal Terjual (HPP)', totalHppSold],
      ['Total Keuntungan Bersih (Margin)', totalMarginSold],
      ['Persentase Profitabilitas', totalHppSold > 0 ? `${((totalMarginSold / totalHppSold) * 100).toFixed(2)}%` : '0.00%'],
      [],
      ['RINGKASAN INVENTARIS AKTIF (UNIT READY)', ''],
      ['Total Unit Ready di Stok', listReady.length + ' Unit'],
      ['Total Likuiditas Modal Tertahan (HPP)', totalAssetValueReady],
      [],
      ['* Catatan: Laporan ini digenerate secara otomatis oleh Sistem Margin AR COD.']
    ]

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)

    // Apply basic number format for rupiah cells in Summary Sheet
    const rupiahRows = [6, 7, 8, 13] // 0-indexed rows
    rupiahRows.forEach(row => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 })
      if (wsSummary[cellRef] && typeof wsSummary[cellRef].v === 'number') {
        wsSummary[cellRef].t = 'n'
        wsSummary[cellRef].z = '"Rp "#,##0'
      }
    })

    // Sheet 2: Detail Penjualan (Sold)
    const soldHeader = [
      ['LAPORAN DETAIL UNIT TERJUAL'],
      [`Periode: ${titlePeriod}`],
      [],
      [
        'No', 
        'Kategori', 
        'Nama Perangkat', 
        'Kode HP / Serial Number', 
        'Tanggal Masuk',
        'Tanggal Terjual', 
        'Harga Beli (Rp)', 
        'Biaya Servis (Rp)', 
        'Biaya Lainnya (Rp)', 
        'Total HPP (Rp)', 
        'Harga Jual (Rp)', 
        'Margin Bersih (Rp)',
        'Catatan Akuisisi'
      ]
    ]

    const soldRows = listSold.map((item, index) => {
      const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0, keterangan_biaya: '' }
      const t = item.transactions?.[0] || { harga_jual: 0, tanggal_terjual: '' }
      const totalHpp = m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya
      const margin = t.harga_jual - totalHpp

      const formatLocalDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID')
      }

      return [
        index + 1,
        item.kategori,
        item.nama_barang,
        item.imei_sn || '-',
        formatLocalDate(item.created_at),
        formatLocalDate(t.tanggal_terjual),
        m.harga_beli,
        m.biaya_perbaikan,
        m.biaya_lainnya,
        totalHpp,
        t.harga_jual,
        margin,
        m.keterangan_biaya || '-'
      ]
    })

    const wsSold = XLSX.utils.aoa_to_sheet([...soldHeader, ...soldRows])

    // Format currency columns in Sold Sheet
    const soldCurrencyCols = [6, 7, 8, 9, 10, 11] // Harga Beli, Servis, Lainnya, HPP, Jual, Margin
    for (let r = 4; r < 4 + listSold.length; r++) {
      soldCurrencyCols.forEach(col => {
        const cellRef = XLSX.utils.encode_cell({ r, c: col })
        if (wsSold[cellRef] && typeof wsSold[cellRef].v === 'number') {
          wsSold[cellRef].t = 'n'
          wsSold[cellRef].z = '"Rp "#,##0'
        }
      })
    }

    // Sheet 3: Stok Ready
    const readyHeader = [
      ['LAPORAN DETAIL STOK READY (AKTIF)'],
      [`Periode Registrasi: ${titlePeriod}`],
      [],
      [
        'No', 
        'Kategori', 
        'Nama Perangkat', 
        'Kode HP / Serial Number', 
        'Tanggal Masuk',
        'Harga Beli (Rp)', 
        'Biaya Servis (Rp)', 
        'Biaya Lainnya (Rp)', 
        'Total Modal HPP (Rp)', 
        'Catatan Akuisisi'
      ]
    ]

    const readyRows = listReady.map((item, index) => {
      const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0, keterangan_biaya: '' }
      const totalHpp = m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya

      const formatLocalDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('id-ID')
      }

      return [
        index + 1,
        item.kategori,
        item.nama_barang,
        item.imei_sn || '-',
        formatLocalDate(item.created_at),
        m.harga_beli,
        m.biaya_perbaikan,
        m.biaya_lainnya,
        totalHpp,
        m.keterangan_biaya || '-'
      ]
    })

    const wsReady = XLSX.utils.aoa_to_sheet([...readyHeader, ...readyRows])

    // Format currency columns in Ready Sheet
    const readyCurrencyCols = [5, 6, 7, 8]
    for (let r = 4; r < 4 + listReady.length; r++) {
      readyCurrencyCols.forEach(col => {
        const cellRef = XLSX.utils.encode_cell({ r, c: col })
        if (wsReady[cellRef] && typeof wsReady[cellRef].v === 'number') {
          wsReady[cellRef].t = 'n'
          wsReady[cellRef].z = '"Rp "#,##0'
        }
      })
    }

    // Create Excel Workbook and append sheets
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Finansial')
    XLSX.utils.book_append_sheet(wb, wsSold, 'Unit Terjual (Sold)')
    XLSX.utils.book_append_sheet(wb, wsReady, 'Stok Ready')

    // Save/Download Excel file
    const safeTitle = titlePeriod.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const fileName = `Laporan_AR_COD_${safeTitle}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // Get Monthly Trend for SVG Chart representation
  const getTrendData = () => {
    // We group profits of sold devices by month/year
    const monthlyMap: { [key: string]: { profit: number; revenue: number; count: number } } = {}
    
    // Sort sold devices by tanggal_terjual
    const sortedSold = [...perangkatSold].sort((a, b) => {
      const validTxA = a.transactions?.filter((t: any) => t.harga_jual > 0) || []
      const validTxB = b.transactions?.filter((t: any) => t.harga_jual > 0) || []
      const dateA = validTxA[validTxA.length - 1]?.tanggal_terjual || a.transactions?.[0]?.tanggal_terjual || ''
      const dateB = validTxB[validTxB.length - 1]?.tanggal_terjual || b.transactions?.[0]?.tanggal_terjual || ''
      return dateA.localeCompare(dateB)
    })

    sortedSold.forEach(item => {
      const validTx = item.transactions?.filter((t: any) => t.harga_jual > 0) || []
      const t = validTx[validTx.length - 1] || item.transactions?.[0] || { harga_jual: 0 }
      const txDateStr = t.tanggal_terjual
      if (!txDateStr) return
      
      const date = new Date(txDateStr)
      // Month format like "Jan 26"
      const label = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      
      const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
      const hpp = m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya
      const profit = t.harga_jual - hpp

      if (!monthlyMap[label]) {
        monthlyMap[label] = { profit: 0, revenue: 0, count: 0 }
      }
      monthlyMap[label].profit += profit
      monthlyMap[label].revenue += t.harga_jual
      monthlyMap[label].count += 1
    })

    const chartPoints = Object.entries(monthlyMap).map(([label, stats]) => ({
      label,
      profit: stats.profit,
      revenue: stats.revenue,
      count: stats.count
    }))

    // If empty or only 1 month, provide professional mockup stats for beautiful preview
    if (chartPoints.length < 2) {
      return [
        { label: 'Jan', profit: 1200000, revenue: 5000000, count: 2 },
        { label: 'Feb', profit: 2400000, revenue: 8500000, count: 3 },
        { label: 'Mar', profit: 1800000, revenue: 6200000, count: 2 },
        { label: 'Apr', profit: 3500000, revenue: 12000000, count: 5 },
        { label: 'Mei', profit: 4800000, revenue: 16000000, count: 6 },
        { label: 'Jun', profit: totalProfitKotor > 0 ? totalProfitKotor : 5200000, revenue: 18000000, count: 7 }
      ]
    }

    return chartPoints.slice(-6) // Show last 6 data points
  }

  const trendData = getTrendData()
  
  // SVG coordinates generation logic for Profit Trend Chart
  const svgWidth = 500
  const svgHeight = 120
  const padX = 40
  const padY = 20

  const maxVal = Math.max(...trendData.map(d => d.profit), 1000000)
  const minVal = Math.min(...trendData.map(d => d.profit), 0)
  const valRange = maxVal - minVal || 1

  const points = trendData.map((d, i) => {
    const x = padX + (i * (svgWidth - padX * 2)) / (trendData.length - 1)
    const y = svgHeight - padY - ((d.profit - minVal) * (svgHeight - padY * 2)) / valRange
    return { x, y, ...d }
  })

  // SVG Line path string
  const linePathD = points.length > 0 
    ? points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')
    : ''

  // SVG Area path string
  const areaPathD = points.length > 0
    ? `${linePathD} L ${points[points.length - 1].x} ${svgHeight - padY} L ${points[0].x} ${svgHeight - padY} Z`
    : ''

  // Dynamic Kode HP label helper based on device category
  const getIdentityLabel = (kategori: string) => {
    if (kategori === 'iPhone' || kategori === 'Android') {
      return 'Kode HP'
    }
    return 'Serial Number (SN)'
  }

  const getIdentityPlaceholder = (kategori: string) => {
    if (kategori === 'iPhone' || kategori === 'Android') {
      return 'Masukkan Kode HP'
    }
    return 'Masukkan Serial Number Laptop'
  }

  // Get dynamic icon badge for devices
  const getCategoryBadge = (kategori: string) => {
    switch (kategori) {
      case 'iPhone':
        return (
          <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <Smartphone className="w-3 h-3 text-purple-400" />
            iPhone
          </span>
        )
      case 'Android':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <Smartphone className="w-3 h-3 text-emerald-400" />
            Android
          </span>
        )
      case 'Laptop':
        return (
          <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <Laptop className="w-3 h-3 text-sky-400" />
            Laptop
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            {kategori}
          </span>
        )
    }
  }

  // Group ready devices by category
  const readyCategoryCount = { iPhone: 0, Android: 0, Laptop: 0, Lainnya: 0 }
  perangkatReady.forEach(item => {
    if (item.kategori === 'iPhone') readyCategoryCount.iPhone++
    else if (item.kategori === 'Android') readyCategoryCount.Android++
    else if (item.kategori === 'Laptop') readyCategoryCount.Laptop++
    else readyCategoryCount.Lainnya++
  })
  const totalReadyCount = perangkatReady.length || 1
  const pctReady = {
    iPhone: (readyCategoryCount.iPhone / totalReadyCount) * 100,
    Android: (readyCategoryCount.Android / totalReadyCount) * 100,
    Laptop: (readyCategoryCount.Laptop / totalReadyCount) * 100,
    Lainnya: (readyCategoryCount.Lainnya / totalReadyCount) * 100,
  }

  // Parse input values for live HPP calculation
  const parseVal = (str: string) => parseInt(str.replace(/[^0-9]/g, '')) || 0
  const currentHargaBeli = parseVal(hargaBeli)
  const currentBiayaPerbaikan = parseVal(biayaPerbaikan)
  const currentBiayaLainnya = parseVal(biayaLainnya)
  const currentTotalHpp = currentHargaBeli + currentBiayaPerbaikan + currentBiayaLainnya

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-indigo-600 selection:text-white relative">
      {/* Floating Animated Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-indigo-500/5 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-emerald-500/5 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[40%] right-[30%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full bg-purple-500/5 blur-[90px] animate-pulse" style={{ animationDuration: '12s' }}></div>
      </div>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER BAR WITH PROMINENT LOGO SPACE */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between glass-panel p-6 rounded-2xl border border-slate-800/80 gap-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-emerald-500/5 opacity-70"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            {/* LOGO SLOT: Tries to load /logo-arcod.png. Falls back gracefully with glowing visual indicator. */}
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden glass-panel border border-indigo-500/30 flex items-center justify-center bg-slate-950 shadow-inner group/logo transition-all duration-300 hover:border-indigo-400">
              <img 
                src="/logo-arcod.png" 
                alt="AR COD Logo" 
                className="w-11 h-11 object-contain transition-transform duration-500 group-hover/logo:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = document.getElementById('logo-fallback-nav')
                  if (fallback) fallback.classList.remove('hidden')
                }}
              />
              {/* Fallback styling - Glowing cyber-neon badge */}
              <div 
                id="logo-fallback-nav" 
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 text-white font-extrabold text-xs tracking-tighter select-none"
              >
                <span className="text-[15px] font-black leading-none">AR</span>
                <span className="text-[9px] font-bold text-emerald-300 leading-none tracking-wider mt-0.5">COD</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                AR <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">COD</span>
                <span className="text-[10px] tracking-widest font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">SYSTEM v2.0</span>
              </h1>
              <p className="text-slate-400 text-xs font-semibold">
                Sistem Pengendali Margin Pintar & Inventarisasi Gadget Pemilik Toko
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 bg-slate-900/60 border border-slate-800/90 px-3.5 py-2 rounded-xl shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Active
            </div>
          </div>
        </header>

        {/* METRICS & TREND VISUALIZATION GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card Aset Aktif */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Aset Aktif (Stok Ready)</p>
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">
                Rp {totalModalTertahan.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                {perangkatReady.length} Perangkat
              </span>
              <p className="text-[11px] text-slate-500 font-semibold">nilai likuiditas modal yang tertahan.</p>
            </div>
            
            {perangkatReady.length > 0 && (
              <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-850">
                <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>Distribusi Kategori</span>
                  <span className="flex gap-2">
                    {readyCategoryCount.iPhone > 0 && <span className="text-purple-400 font-extrabold">iP ({readyCategoryCount.iPhone})</span>}
                    {readyCategoryCount.Android > 0 && <span className="text-emerald-400 font-extrabold">An ({readyCategoryCount.Android})</span>}
                    {readyCategoryCount.Laptop > 0 && <span className="text-sky-400 font-extrabold">Lp ({readyCategoryCount.Laptop})</span>}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden flex">
                  {pctReady.iPhone > 0 && <div className="h-full bg-purple-550" style={{ width: `${pctReady.iPhone}%` }} title={`iPhone: ${readyCategoryCount.iPhone} unit`}></div>}
                  {pctReady.Android > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pctReady.Android}%` }} title={`Android: ${readyCategoryCount.Android} unit`}></div>}
                  {pctReady.Laptop > 0 && <div className="h-full bg-sky-500" style={{ width: `${pctReady.Laptop}%` }} title={`Laptop: ${readyCategoryCount.Laptop} unit`}></div>}
                  {pctReady.Lainnya > 0 && <div className="h-full bg-slate-500" style={{ width: `${pctReady.Lainnya}%` }} title={`Lainnya: ${readyCategoryCount.Lainnya} unit`}></div>}
                </div>
              </div>
            )}
          </div>

          {/* Card Margin Realisasi */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Margin Bersih (Terjual)</p>
                <div className={`p-2.5 rounded-xl border ${totalProfitKotor >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/10'}`}>
                  {totalProfitKotor >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
              </div>
              <h3 className={`text-3xl font-black tracking-tight ${totalProfitKotor >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rp {totalProfitKotor.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${totalProfitKotor >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                {perangkatSold.length} Unit Terjual
              </span>
              <p className="text-[11px] text-slate-500 font-semibold">rekap laba bersih terkunci.</p>
            </div>
          </div>

          {/* Card Insight Bisnis */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Insight Analisis Bisnis</p>
                <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/10">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rata-rata Margin / Unit</p>
                  <h4 className="text-base font-extrabold text-slate-200">
                    Rp {Math.round(averageMargin).toLocaleString('id-ID')}
                  </h4>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Kategori Top Profit</p>
                  <h4 className="text-base font-extrabold text-emerald-400 flex items-center gap-1">
                    {topCategory === 'Tidak ada' ? '-' : topCategory}
                    {topCategory !== 'Tidak ada' && (
                      <span className="text-[9px] text-slate-550 font-bold">
                        (Rp {maxCatProfit.toLocaleString('id-ID')})
                      </span>
                    )}
                  </h4>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-850">
              <p className="text-[10px] text-slate-550 font-bold">Rasio margin tertinggi per kategori.</p>
            </div>
          </div>

          {/* SVG Profit Trend Chart Card */}
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between col-span-1">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                  Tren Profit Bulanan
                </p>
                {perangkatSold.length < 2 && (
                  <p className="text-[10px] text-amber-400/90 font-medium">
                    (Menampilkan Contoh Data / Lakukan Penjualan)
                  </p>
                )}
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">6 Periode</span>
            </div>

            {/* SVG Plotting */}
            <div className="relative w-full h-[120px] flex items-center justify-center mt-1">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1={padX} y1={padY} x2={svgWidth - padX} y2={padY} stroke="#1e293b" strokeDasharray="3 3" />
                <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="#1e293b" />

                {/* Filled Area */}
                {areaPathD && (
                  <path d={areaPathD} fill="url(#chart-area-grad)" className="transition-all duration-700" />
                )}

                {/* Trend Line */}
                {linePathD && (
                  <path 
                    d={linePathD} 
                    fill="none" 
                    stroke="url(#chart-line-grad)" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                )}

                {/* Coordinate Dots & Text */}
                {points.map((p, i) => (
                  <g key={i} className="group/dot">
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="4" 
                      fill="#a855f7" 
                      stroke="#090b11" 
                      strokeWidth="2" 
                      className="cursor-pointer transition-transform duration-200 group-hover/dot:scale-150" 
                    />
                    <text 
                      x={p.x} 
                      y={p.y - 8} 
                      textAnchor="middle" 
                      className="text-[9px] fill-slate-300 font-bold opacity-0 group-hover/dot:opacity-100 transition-opacity bg-slate-950 duration-150 pointer-events-none"
                    >
                      Rp {(p.profit / 1000).toFixed(0)}k
                    </text>
                    {/* Month Label */}
                    <text 
                      x={p.x} 
                      y={svgHeight - 4} 
                      textAnchor="middle" 
                      className="text-[9px] fill-slate-500 font-semibold"
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </section>

        {/* MAIN BODY LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1: FORM INPUTS & REPORTS (LEFT SIDE) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* REGISTER FORM CARD */}
            <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-t-2xl"></div>
              
              <div className="mb-6 pb-4 border-b border-slate-850">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  Registrasi Perangkat Baru
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Masukkan data unit dan rincian modal awal. Label unik otomatis menyesuaikan kategori.
                </p>
              </div>
              
              <form action={tambahBarang} onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Kategori Perangkat
                  </label>
                  <select 
                    name="kategori" 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="iPhone">iPhone</option>
                    <option value="Android">Android</option>
                    <option value="Laptop">Laptop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Nama Barang & Spesifikasi
                  </label>
                  <input 
                    type="text" 
                    name="nama_barang" 
                    placeholder="Contoh: iPhone 14 Pro Max 128GB Gold" 
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                    required 
                  />
                </div>

                {/* DYNAMIC IMEI -> KODE HP / SERIAL NUMBER INPUT */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {getIdentityLabel(formCategory)}
                  </label>
                  <input 
                    type="text" 
                    name="imei_sn" 
                    placeholder={getIdentityPlaceholder(formCategory)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono font-bold text-slate-200 placeholder-slate-655 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                    required 
                  />
                </div>

                {/* FINANCIAL DETAILS SUB-SECTION */}
                <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-850 space-y-3.5">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-800/80 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    Struktur Pembiayaan Modal
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nilai Akuisisi / Beli (Rp)</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        name="harga_beli" 
                        value={hargaBeli}
                        onChange={(e) => handleRupiahChange(e.target.value, setHargaBeli)}
                        placeholder="0" 
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right" 
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Restorasi & Perbaikan (Rp)</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        name="biaya_perbaikan" 
                        value={biayaPerbaikan}
                        onChange={(e) => handleRupiahChange(e.target.value, setBiayaPerbaikan)}
                        placeholder="0" 
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right" 
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Biaya Operasional / Lainnya (Rp)</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        name="biaya_lainnya" 
                        value={biayaLainnya}
                        onChange={(e) => handleRupiahChange(e.target.value, setBiayaLainnya)}
                        placeholder="0" 
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs font-bold text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right" 
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Keterangan / Rincian Servis</label>
                    <input 
                      type="text" 
                      name="keterangan_biaya" 
                      placeholder="Contoh: Ganti LCD OEM, Baterai, Transport COD" 
                      className="w-full rounded-lg border border-slate-850 bg-slate-900 p-2 py-2 text-[11px] font-semibold text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" 
                    />
                  </div>
                </div>
                
                {currentTotalHpp > 0 && (
                  <div className="p-3 bg-indigo-950/50 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      Total HPP (Modal):
                    </span>
                    <span className="text-indigo-400 font-extrabold text-sm">
                      Rp {currentTotalHpp.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-150 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  Registrasi Aset
                </button>
              </form>
            </section>

            {/* PROFESSIONAL EXCEL REPORTING & EXPORT CENTER */}
            <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 shadow-lg relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl"></div>
              
              <div className="mb-5 pb-4 border-b border-slate-850">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Pusat Laporan Excel
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Unduh laporan berkala profesional dalam format Excel (.xlsx) dengan ringkasan profit otomatis.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Jenis Laporan
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                    {[
                      { val: 'harian', label: 'Harian' },
                      { val: 'bulanan', label: 'Bulanan' },
                      { val: 'semua', label: 'Semua' }
                    ].map(type => (
                      <button
                        key={type.val}
                        type="button"
                        onClick={() => setReportType(type.val)}
                        className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          reportType === type.val
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional filter inputs */}
                {reportType === 'harian' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Pilih Hari</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedReportDate}
                        onChange={(e) => setSelectedReportDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs font-bold text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {reportType === 'bulanan' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Pilih Bulan & Tahun</label>
                    <input
                      type="month"
                      value={selectedReportMonth}
                      onChange={(e) => setSelectedReportMonth(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs font-bold text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}

                {reportType === 'semua' && (
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                      Akan mengekspor seluruh basis data perangkat, mencakup rincian stok berjalan dan seluruh histori penjualan.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Ekspor File Excel
                </button>
              </div>
            </section>
          </div>

          {/* COLUMN 2 & 3: FILTER, STOCK LISTS, & TRANSACTIONS (RIGHT SIDE) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SEARCH & CATEGORY CONTROLS */}
            <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              {/* Search input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Cari nama perangkat, Kode HP, Serial Number..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-850 overflow-x-auto">
                {['Semua', 'iPhone', 'Android', 'Laptop'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* TABEL STOK ACTIVE (READY) */}
            <section className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl">
              <div className="p-5 border-b border-slate-800/80 bg-slate-900/30 flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Inventaris Aktif (Stok Ready)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Aset berjalan yang siap dipasarkan atau sedang dalam restorasi.
                  </p>
                </div>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                  {filteredReady.length} Unit
                </span>
              </div>
              
              {filteredReady.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900/10">
                  <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tidak ada unit ready yang ditemukan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-800">
                        <th className="p-4 pl-6">Detail Perangkat</th>
                        <th className="p-4">Identitas (Kode HP / SN)</th>
                        <th className="p-4">Total HPP (Modal)</th>
                        <th className="p-4 text-right pr-6">Aksi Penjualan</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-850 bg-transparent">
                      {filteredReady.map((item: any) => {
                        const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                        const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                        const hasRepair = modal.biaya_perbaikan > 0 || modal.biaya_lainnya > 0
                        const isMobile = item.kategori === 'iPhone' || item.kategori === 'Android'
                        
                        const cleanHargaJual = parseInt((hargaJualMap[item.id] || '').replace(/[^0-9]/g, '')) || 0
                        const estMargin = cleanHargaJual > 0 ? cleanHargaJual - totalHpp : 0
                        const estRoi = totalHpp > 0 ? (estMargin / totalHpp) * 100 : 0
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-900/20 transition-colors group">
                            <td className="p-4 pl-6">
                              <div className="flex flex-col gap-1.5">
                                  <div>{getCategoryBadge(item.kategori)}</div>
                                <span className="font-bold text-slate-100 text-xs">{item.nama_barang}</span>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-300">
                              <span className="text-[10px] text-slate-500 uppercase mr-1 block">
                                {isMobile ? 'KODE HP' : 'SN'}
                              </span>
                              {item.imei_sn || '-'}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-slate-200">Rp {totalHpp.toLocaleString('id-ID')}</span>
                                {hasRepair && (
                                  <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
                                    Beli: Rp {modal.harga_beli.toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex items-center justify-end gap-3">
                                {/* Delete Action */}
                                <form action={hapusBarang}>
                                  <input type="hidden" name="device_id" value={item.id} />
                                  <DeleteButton />
                                </form>
                                
                                {/* Sell Action */}
                                <div className="flex flex-col items-end gap-1">
                                  <form action={jualBarang} className="flex items-center gap-1.5">
                                    <input type="hidden" name="device_id" value={item.id} />
                                    
                                    {cleanHargaJual > 0 && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-slate-500">Tgl Jual:</span>
                                        <input 
                                          type="date" 
                                          name="tanggal_terjual" 
                                          defaultValue={new Date().toISOString().substring(0, 10)} 
                                          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[9px] font-bold text-slate-300 focus:border-emerald-500 outline-none w-24"
                                        />
                                      </div>
                                    )}

                                    <div className="relative">
                                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-[9px] font-bold text-slate-500">Rp</span>
                                      <input 
                                        type="text" 
                                        inputMode="numeric" 
                                        name="harga_jual" 
                                        value={hargaJualMap[item.id] || ''}
                                        onChange={(e) => handleHargaJualChange(item.id, e.target.value)}
                                        placeholder="Harga Jual" 
                                        className="rounded-lg border border-slate-800 bg-slate-950 pl-6 pr-2 py-1 w-24 text-[10px] text-slate-200 font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-right" 
                                        required 
                                      />
                                    </div>
                                    <button 
                                      type="submit" 
                                      className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-0.5"
                                    >
                                      Jual
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </form>

                                  {/* Live Margin & ROI Estimator */}
                                  {cleanHargaJual > 0 && (
                                    <div className="text-[9px] font-bold">
                                      <span className="text-slate-500 mr-1">Est. Margin:</span>
                                      <span className={estMargin >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
                                        {estMargin >= 0 ? '+' : ''}Rp {estMargin.toLocaleString('id-ID')} ({estRoi.toFixed(0)}% ROI)
                                      </span>
                                    </div>
                                  )}
                                </div>
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
            <section className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
              
              <div className="p-5 border-b border-slate-800/80 bg-slate-900/30 flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Buku Besar Konversi (Perangkat Sold)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Daftar unit terjual, rekap margin bersih, dan pelunasan piutang modal.
                  </p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-xl font-mono">
                  {filteredSold.length} Unit
                </span>
              </div>
              
              {filteredSold.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-900/10">
                  <Coins className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Belum ada riwayat unit terjual</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-800">
                        <th className="p-4 pl-6">Detail Perangkat</th>
                        <th className="p-4">Identitas (Kode HP / SN)</th>
                        <th className="p-4">Total HPP</th>
                        <th className="p-4">Harga Jual</th>
                        <th className="p-4">Margin Bersih</th>
                        <th className="p-4 text-right pr-6">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-850 bg-transparent">
                      {filteredSold.map((item: any) => {
                        const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                        const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                        const validTx = item.transactions?.filter((t: any) => t.harga_jual > 0) || []
                        const transaksi = validTx[validTx.length - 1] || item.transactions?.[0] || { harga_jual: 0, tanggal_terjual: '' }
                        const profitBersih = transaksi.harga_jual - totalHpp
                        const isProfit = profitBersih >= 0
                        const isMobile = item.kategori === 'iPhone' || item.kategori === 'Android'
                        
                        const totalValue = Math.max(transaksi.harga_jual, totalHpp, 1)
                        const hppPercentage = (totalHpp / totalValue) * 100
                        const marginPercentage = (Math.max(0, profitBersih) / totalValue) * 100
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-900/20 transition-colors group">
                            <td className="p-4 pl-6">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-bold text-slate-100 text-xs">{item.nama_barang}</span>
                                <div className="flex items-center gap-2">
                                  {getCategoryBadge(item.kategori)}
                                  {transaksi.tanggal_terjual && (
                                    <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-655" />
                                      Jual: {new Date(transaksi.tanggal_terjual).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-400">
                              <span className="text-[9px] text-slate-500 uppercase block mb-0.5">
                                {isMobile ? 'KODE HP' : 'SN'}
                              </span>
                              {item.imei_sn || '-'}
                            </td>
                            <td className="p-4 text-slate-400 font-semibold">Rp {totalHpp.toLocaleString('id-ID')}</td>
                            <td className="p-4 text-slate-200 font-bold">Rp {transaksi.harga_jual.toLocaleString('id-ID')}</td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border w-fit ${
                                  isProfit 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {isProfit ? '+' : ''} Rp {profitBersih.toLocaleString('id-ID')}
                                </span>
                                
                                {isProfit && transaksi.harga_jual > 0 && (
                                  <div className="w-28 space-y-0.5">
                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                      <div className="h-full bg-slate-600" style={{ width: `${hppPercentage}%` }} title={`Modal HPP: ${hppPercentage.toFixed(0)}%`}></div>
                                      <div className="h-full bg-emerald-500" style={{ width: `${marginPercentage}%` }} title={`Margin Laba: ${marginPercentage.toFixed(0)}%`}></div>
                                    </div>
                                    <div className="flex justify-between text-[8px] font-bold text-slate-500">
                                      <span>HPP: {hppPercentage.toFixed(0)}%</span>
                                      <span className="text-emerald-500">Laba: {marginPercentage.toFixed(0)}%</span>
                                    </div>
                                  </div>
                                )}
                              </div>
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
