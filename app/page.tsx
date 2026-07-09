import { tambahBarang, jualBarang, hapusBarang } from './actions'
import { supabase } from '../utils/supabase'
import DeleteButton from './DeleteButton'

export default async function Home() {
  const { data: perangkatReady } = await supabase
    .from('devices')
    .select(`
      id, kategori, nama_barang, imei_sn,
      capitals (harga_beli, biaya_perbaikan, biaya_lainnya)
    `)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  const { data: perangkatSold } = await supabase
    .from('devices')
    .select(`
      id, kategori, nama_barang, imei_sn,
      capitals (harga_beli, biaya_perbaikan, biaya_lainnya),
      transactions (harga_jual, tanggal_terjual)
    `)
    .eq('status', 'sold')
    .order('created_at', { ascending: false })

  // Kalkulasi Dashboard
  let totalModalTertahan = 0;
  perangkatReady?.forEach((item: any) => {
    const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 };
    totalModalTertahan += (m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya);
  });

  let totalProfitKotor = 0;
  perangkatSold?.forEach((item: any) => {
    const m = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 };
    const t = item.transactions?.[0] || { harga_jual: 0 };
    const modal = m.harga_beli + m.biaya_perbaikan + m.biaya_lainnya;
    totalProfitKotor += (t.harga_jual - modal);
  });

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="flex flex-col gap-1 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AR COD</h1>
          <p className="text-slate-500 text-sm">Manajemen Inventaris & Kalkulasi HPP Perangkat</p>
        </header>

        {/* DASHBOARD SUMMARY (FITUR BARU) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Modal Tertahan (Ready)</p>
            <h3 className="text-3xl font-extrabold text-slate-800">Rp {totalModalTertahan.toLocaleString('id-ID')}</h3>
            <p className="text-xs text-slate-400 mt-2">Uang yang sedang berputar di {perangkatReady?.length || 0} unit stok.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Margin Realisasi (Sold)</p>
            <h3 className={`text-3xl font-extrabold ${totalProfitKotor >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Rp {totalProfitKotor.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-slate-400 mt-2">Keuntungan bersih dari {perangkatSold?.length || 0} unit yang terjual.</p>
          </div>
        </section>
        
        {/* 1. FORM INPUT BARANG */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Entri Perangkat Baru</h2>
            <p className="text-xs text-slate-500">Kolom uang bisa diisi titik secara manual (misal: 1.500.000).</p>
          </div>
          
          <form action={tambahBarang} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Kategori</label>
                <select name="kategori" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:ring-2 focus:ring-slate-800 outline-none">
                  <option value="iPhone">📱 iPhone</option>
                  <option value="Android">🤖 Android</option>
                  <option value="Laptop">💻 Laptop</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Spesifikasi Unit</label>
                <input type="text" name="nama_barang" placeholder="Contoh: iPhone 11 Pro 64GB Inter" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:ring-2 focus:ring-slate-800 outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Identitas Unik (IMEI / SN)</label>
              <input type="text" name="imei_sn" placeholder="Masukkan Serial Number atau IMEI1" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:ring-2 focus:ring-slate-800 outline-none font-mono" required />
            </div>

            <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-100 space-y-5">
              <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">Struktur Modal Dasar (HPP)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Harga Akuisisi (Rp)</label>
                  <input type="text" inputMode="numeric" name="harga_beli" placeholder="1.500.000" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Biaya Perbaikan/Part (Rp)</label>
                  <input type="text" inputMode="numeric" name="biaya_perbaikan" placeholder="0" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Biaya Operasional (Rp)</label>
                  <input type="text" inputMode="numeric" name="biaya_lainnya" placeholder="Ongkir/Bensin" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Catatan Pengeluaran Tambahan</label>
                <input type="text" name="keterangan_biaya" placeholder="Misal: Ganti LCD" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl transition duration-200 shadow-md">
              Simpan ke Database Stok
            </button>
          </form>
        </section>

        {/* 2. TABEL STOK READY (DENGAN TOMBOL HAPUS) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Aset Berjalan (Ready)</h2>
              <p className="text-xs text-slate-500">Unit yang belum tereksekusi penjualan.</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">{perangkatReady?.length || 0} Unit</span>
          </div>
          
          {!perangkatReady || perangkatReady.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500 text-sm">Gudang kosong.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4 pl-6">Unit</th>
                    <th className="p-4">Identitas</th>
                    <th className="p-4">Total HPP</th>
                    <th className="p-4 text-right pr-6">Eksekusi Jual / Hapus</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {perangkatReady.map((item: any) => {
                    const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                    const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="inline-block w-max bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{item.kategori}</span>
                            <span className="font-semibold text-slate-800">{item.nama_barang}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-xs">{item.imei_sn}</td>
                        <td className="p-4 font-bold text-slate-700">Rp {totalHpp.toLocaleString('id-ID')}</td>
                        <td className="p-4 pr-6">
                          <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-70 group-hover:opacity-100 transition-opacity">
                         <form action={hapusBarang}>
                          <input type="hidden" name="device_id" value={item.id} />
                           <DeleteButton />
                          </form>
                            
                            <form action={jualBarang} className="flex items-center gap-2">
                              <input type="hidden" name="device_id" value={item.id} />
                              <input type="text" inputMode="numeric" name="harga_jual" placeholder="Harga Jual (Rp)" className="rounded-lg border border-slate-200 p-2 w-32 text-xs text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-emerald-500" required />
                              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors shadow-sm">
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

        {/* 3. TABEL REALISASI PENJUALAN */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Laporan Realisasi Profit (Sold)</h2>
              <p className="text-xs text-slate-500">Rekapitulasi margin bersih dari unit yang terjual.</p>
            </div>
          </div>
          
          {!perangkatSold || perangkatSold.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500 text-sm">Belum ada transaksi penjualan yang terekam.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                    <th className="p-4 pl-6">Unit Perangkat</th>
                    <th className="p-4">Modal (HPP)</th>
                    <th className="p-4">Pendapatan Kotor</th>
                    <th className="p-4">Margin Bersih</th>
                    <th className="p-4 pr-6">% ROI</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {perangkatSold.map((item: any) => {
                    const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                    const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                    const transaksi = item.transactions?.[0] || { harga_jual: 0 }
                    const profitBersih = transaksi.harga_jual - totalHpp
                    const persentase = totalHpp > 0 ? (profitBersih / totalHpp) * 100 : 0
                    const isProfit = profitBersih >= 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-semibold text-slate-800">{item.nama_barang}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{item.imei_sn}</div>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">Rp {totalHpp.toLocaleString('id-ID')}</td>
                        <td className="p-4 text-slate-800 font-bold">Rp {transaksi.harga_jual.toLocaleString('id-ID')}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${isProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {isProfit ? '+' : '-'} Rp {Math.abs(profitBersih).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className={`p-4 pr-6 font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfit ? '▲' : '▼'} {persentase.toFixed(1)}%
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
    </main>
  )
}