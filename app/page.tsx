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
    <main className="min-h-screen bg-stone-100 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-700 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col gap-2 border-b border-zinc-300 pb-8">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight uppercase">AR COD</h1>
          <p className="text-zinc-500 text-sm font-medium tracking-wide">Terminal Manajemen Inventaris & Kalkulasi Nilai Aset</p>
        </header>

        {/* DASHBOARD SUMMARY */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-stone-50 p-8 rounded-none border border-zinc-200 shadow-sm border-l-4 border-l-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Aset Berjalan (Ready)</p>
            <h3 className="text-4xl font-black text-zinc-900">Rp {totalModalTertahan.toLocaleString('id-ID')}</h3>
            <p className="text-xs text-zinc-400 mt-3 font-medium">Likuiditas tertahan pada {perangkatReady?.length || 0} unit perangkat.</p>
          </div>
          <div className="bg-stone-50 p-8 rounded-none border border-zinc-200 shadow-sm border-l-4 border-l-amber-600">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Realisasi Margin (Sold)</p>
            <h3 className={`text-4xl font-black ${totalProfitKotor >= 0 ? 'text-amber-700' : 'text-red-800'}`}>
              Rp {totalProfitKotor.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-zinc-400 mt-3 font-medium">Ekstraksi nilai dari {perangkatSold?.length || 0} unit yang terkonversi.</p>
          </div>
        </section>
        
        {/* 1. FORM INPUT BARANG */}
        <section className="bg-stone-50 p-8 md:p-10 rounded-none shadow-sm border border-zinc-200">
          <div className="mb-8 border-b border-zinc-200 pb-4">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wide">Entri Akuisisi Perangkat</h2>
            <p className="text-xs text-zinc-500 mt-1">Gunakan titik untuk pemisah ribuan (Misal: 4.500.000).</p>
          </div>
          
          <form action={tambahBarang} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Kategori</label>
                <select name="kategori" className="w-full rounded-none border border-zinc-300 bg-white p-3.5 text-sm font-semibold text-zinc-800 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all">
                  <option value="iPhone">iPhone</option>
                  <option value="Android">Android</option>
                  <option value="Laptop">Laptop</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Spesifikasi Unit</label>
                <input type="text" name="nama_barang" placeholder="Contoh: iPhone 11 Pro 256GB Inter" className="w-full rounded-none border border-zinc-300 bg-white p-3.5 text-sm font-semibold text-zinc-800 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all placeholder-zinc-400" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Identitas Unik (IMEI / SN)</label>
              <input type="text" name="imei_sn" placeholder="Masukkan Serial Number / IMEI Valid" className="w-full rounded-none border border-zinc-300 bg-white p-3.5 text-sm font-bold text-zinc-800 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none font-mono placeholder-zinc-400" required />
            </div>

            <div className="p-8 bg-zinc-100/50 rounded-none border border-zinc-200 space-y-6">
              <h3 className="text-sm font-black text-zinc-800 uppercase tracking-widest border-b border-zinc-300 pb-3">Struktur Harga Pokok Penjualan (HPP)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nilai Akuisisi (Rp)</label>
                  <input type="text" inputMode="numeric" name="harga_beli" placeholder="0" className="w-full rounded-none border border-zinc-300 p-3 text-sm font-black text-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none bg-white" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Biaya Restorasi (Rp)</label>
                  <input type="text" inputMode="numeric" name="biaya_perbaikan" placeholder="0" className="w-full rounded-none border border-zinc-300 p-3 text-sm font-black text-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Biaya Operasional (Rp)</label>
                  <input type="text" inputMode="numeric" name="biaya_lainnya" placeholder="0" className="w-full rounded-none border border-zinc-300 p-3 text-sm font-black text-zinc-900 focus:ring-2 focus:ring-zinc-900 outline-none bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Jurnal Pengeluaran</label>
                <input type="text" name="keterangan_biaya" placeholder="Catat detail perbaikan atau rincian operasional..." className="w-full rounded-none border border-zinc-300 p-3 text-sm font-medium text-zinc-700 focus:ring-2 focus:ring-zinc-900 outline-none bg-white placeholder-zinc-400" />
              </div>
            </div>

            <button type="submit" className="w-full bg-zinc-900 hover:bg-black text-stone-100 font-bold uppercase tracking-widest py-4 px-4 rounded-none transition duration-200">
              Registrasi Aset
            </button>
          </form>
        </section>

        {/* 2. TABEL STOK READY */}
        <section className="bg-stone-50 rounded-none shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-zinc-200 flex justify-between items-center bg-white">
            <div>
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wide">Inventaris Aktif</h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">Aset yang belum dieksekusi ke pasar.</p>
            </div>
            <span className="bg-zinc-900 text-stone-100 text-xs font-bold px-4 py-2 uppercase tracking-widest">{perangkatReady?.length || 0} Unit</span>
          </div>
          
          {!perangkatReady || perangkatReady.length === 0 ? (
            <div className="p-12 text-center bg-zinc-50/50">
              <p className="text-zinc-400 text-sm font-semibold tracking-wide uppercase">Tidak ada likuiditas tertahan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-500 text-xs uppercase tracking-widest font-bold border-b border-zinc-200">
                    <th className="p-5 pl-8">Spesifikasi</th>
                    <th className="p-5">Identitas</th>
                    <th className="p-5">Total Modal</th>
                    <th className="p-5 text-right pr-8">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-200 bg-white">
                  {perangkatReady.map((item: any) => {
                    const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                    const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                    
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 transition-colors group">
                        <td className="p-5 pl-8">
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-block w-max bg-zinc-200 text-zinc-700 text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-widest">{item.kategori}</span>
                            <span className="font-bold text-zinc-900">{item.nama_barang}</span>
                          </div>
                        </td>
                        <td className="p-5 text-zinc-500 font-mono text-xs font-bold">{item.imei_sn}</td>
                        <td className="p-5 font-black text-zinc-800">Rp {totalHpp.toLocaleString('id-ID')}</td>
                        <td className="p-5 pr-8">
                          <div className="flex items-center justify-end gap-3 opacity-100 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                           <form action={hapusBarang}>
                            <input type="hidden" name="device_id" value={item.id} />
                             <DeleteButton />
                           </form>
                            
                            <form action={jualBarang} className="flex items-center gap-2">
                              <input type="hidden" name="device_id" value={item.id} />
                              <input type="text" inputMode="numeric" name="harga_jual" placeholder="Nilai Pelepasan" className="rounded-none border border-zinc-300 p-2 w-36 text-xs text-zinc-900 font-bold outline-none focus:ring-2 focus:ring-zinc-900 bg-stone-50" required />
                              <button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-widest py-2 px-4 rounded-none transition-colors">
                                Eksekusi
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
        <section className="bg-stone-50 rounded-none shadow-sm border border-zinc-200 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-700"></div>
          <div className="p-6 md:p-8 border-b border-zinc-200 flex justify-between items-center bg-white">
            <div>
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-wide">Buku Besar Konversi (Sold)</h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">Rekam jejak ekstraksi nilai aset.</p>
            </div>
          </div>
          
          {!perangkatSold || perangkatSold.length === 0 ? (
            <div className="p-12 text-center bg-zinc-50/50">
              <p className="text-zinc-400 text-sm font-semibold tracking-wide uppercase">Tidak ada data riwayat transaksi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-500 text-xs uppercase tracking-widest font-bold border-b border-zinc-200">
                    <th className="p-5 pl-8">Aset</th>
                    <th className="p-5">Nilai Dasar</th>
                    <th className="p-5">Nilai Pelepasan</th>
                    <th className="p-5">Margin Netto</th>
                    <th className="p-5 text-right pr-8">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-zinc-200 bg-white">
                  {perangkatSold.map((item: any) => {
                    const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                    const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                    const transaksi = item.transactions?.[0] || { harga_jual: 0 }
                    const profitBersih = transaksi.harga_jual - totalHpp
                    const isProfit = profitBersih >= 0;

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 transition-colors group">
                        <td className="p-5 pl-8">
                          <div className="font-bold text-zinc-900">{item.nama_barang}</div>
                          <div className="text-xs text-zinc-400 font-mono mt-1 font-semibold">{item.imei_sn}</div>
                        </td>
                        <td className="p-5 text-zinc-600 font-semibold">Rp {totalHpp.toLocaleString('id-ID')}</td>
                        <td className="p-5 text-zinc-900 font-black">Rp {transaksi.harga_jual.toLocaleString('id-ID')}</td>
                        <td className="p-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-none border text-xs font-black uppercase tracking-widest ${isProfit ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                            {isProfit ? '+' : '-'} Rp {Math.abs(profitBersih).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-5 text-right pr-8">
                           {/* TOMBOL HAPUS UNTUK DATA SOLD */}
                           <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
    </main>
  )
}