import { supabase } from '../utils/supabase'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: perangkatReadyRaw } = await supabase
    .from('devices')
    .select(`
      id, kategori, nama_barang, imei_sn,
      capitals (harga_beli, biaya_perbaikan, biaya_lainnya, keterangan_biaya)
    `)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  const { data: perangkatSoldRaw } = await supabase
    .from('devices')
    .select(`
      id, kategori, nama_barang, imei_sn,
      capitals (harga_beli, biaya_perbaikan, biaya_lainnya, keterangan_biaya),
      transactions (harga_jual, tanggal_terjual)
    `)
    .eq('status', 'sold')
    .order('created_at', { ascending: false })

  const perangkatReady = perangkatReadyRaw || []
  const perangkatSold = perangkatSoldRaw || []

  // Kalkulasi Dashboard
  let totalModalTertahan = 0
  perangkatReady.forEach((item: any) => {
    const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
    totalModalTertahan += (m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya)
  })

  let totalProfitKotor = 0
  perangkatSold.forEach((item: any) => {
    const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
    const t = item.transactions?.[0] || { harga_jual: 0 }
    const modal = m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya
    totalProfitKotor += (t.harga_jual - modal)
  })

  return (
    <DashboardClient 
      perangkatReady={perangkatReady} 
      perangkatSold={perangkatSold} 
      totalModalTertahan={totalModalTertahan}
      totalProfitKotor={totalProfitKotor}
    />
  )
}