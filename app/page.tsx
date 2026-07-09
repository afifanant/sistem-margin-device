import { tambahBarang, jualBarang } from './actions'
import { supabase } from '../utils/supabase'

export default async function Home() {
  // 1. Ambil data stok yang masih READY
  const { data: perangkatReady } = await supabase
    .from('devices')
    .select(`
      id, kategori, nama_barang, imei_sn,
      capitals (harga_beli, biaya_perbaikan, biaya_lainnya)
    `)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  // 2. Ambil data stok yang sudah TERJUAL (SOLD) beserta nilai transaksinya
  const { data: perangkatSold } = await supabase
    .from('devices')
    .select(`
      id, kategori, nama_barang, imei_sn,
      capitals (harga_beli, biaya_perbaikan, biaya_lainnya),
      transactions (harga_jual, tanggal_terjual)
    `)
    .eq('status', 'sold')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold text-gray-900 border-b pb-4">Sistem Pencatatan Margin & Modal</h1>
      
      {/* 1. FORM INPUT BARANG */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Input Perangkat Baru</h2>
        <form action={tambahBarang} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select name="kategori" className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="iPhone">iPhone</option>
                <option value="Android">Android</option>
                <option value="Laptop">Laptop</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
              <input type="text" name="nama_barang" placeholder="Contoh: iPhone 11 Pro 64GB Inter" className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IMEI / Serial Number</label>
            <input type="text" name="imei_sn" placeholder="Masukkan SN atau IMEI unik" className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <h3 className="font-medium text-gray-800">Struktur Modal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli (Rp)</label>
                <input type="number" name="harga_beli" placeholder="0" className="w-full rounded-md border border-gray-300 p-2 text-gray-900 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Servis/Bypass (Rp)</label>
                <input type="number" name="biaya_perbaikan" placeholder="0" className="w-full rounded-md border border-gray-300 p-2 text-gray-900 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Lainnya (Rp)</label>
                <input type="number" name="biaya_lainnya" placeholder="0" className="w-full rounded-md border border-gray-300 p-2 text-gray-900 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Biaya (Opsional)</label>
              <input type="text" name="keterangan_biaya" placeholder="Misal: Ganti baterai" className="w-full rounded-md border border-gray-300 p-2 text-gray-900 outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-sm">
            Simpan ke Database
          </button>
        </form>
      </div>

      {/* 2. TABEL STOK READY (DENGAN AKSI JUAL) */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Stok Barang Ready ({perangkatReady?.length || 0})</h2>
        {!perangkatReady || perangkatReady.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Tidak ada barang ready.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-sm font-semibold">
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3">Total HPP</th>
                  <th className="p-3 text-center">Aksi Eksekusi Jual</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {perangkatReady.map((item: any) => {
                  const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                  const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 text-blue-600 font-medium">{item.kategori}</td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">{item.nama_barang}</div>
                        <div className="text-xs text-gray-400 font-mono">{item.imei_sn}</div>
                      </td>
                      <td className="p-3 font-bold text-gray-800">Rp {totalHpp.toLocaleString('id-ID')}</td>
                      <td className="p-3">
                        {/* FORM MINI UNTUK INPUT HARGA JUAL */}
                        <form action={jualBarang} className="flex items-center justify-center gap-2">
                          <input type="hidden" name="device_id" value={item.id} />
                          <input type="number" name="harga_jual" placeholder="Input Harga Jual (Rp)" className="rounded-md border border-gray-300 p-1.5 w-40 text-xs text-black outline-none focus:ring-1 focus:ring-green-500" required />
                          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-1.5 px-3 rounded transition">
                            Jual
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. TABEL REALISASI PENJUALAN & MARGIN PROFIT */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 border-t-4 border-t-green-600">
        <h2 className="text-xl font-semibold mb-4 text-green-700">Laporan Realisasi Keuntungan (Sold)</h2>
        {!perangkatSold || perangkatSold.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Belum ada barang yang terjual. Eksekusi penjualan pada tabel di atas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-sm font-semibold">
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3">Total HPP (Modal)</th>
                  <th className="p-3">Harga Jual Real</th>
                  <th className="p-3">Margin Bersih (Profit)</th>
                  <th className="p-3">Persentase Keuntungan</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {perangkatSold.map((item: any) => {
                  const modal = item.capitals?.[0] || { harga_beli: 0, biaya_perbaikan: 0, biaya_lainnya: 0 }
                  const totalHpp = modal.harga_beli + modal.biaya_perbaikan + modal.biaya_lainnya
                  const transaksi = item.transactions?.[0] || { harga_jual: 0 }
                  const profitBersih = transaksi.harga_jual - totalHpp
                  const persentase = totalHpp > 0 ? (profitBersih / totalHpp) * 100 : 0

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 bg-green-50/20">
                      <td className="p-3">
                        <div className="font-semibold text-gray-900">{item.nama_barang}</div>
                        <div className="text-xs text-gray-400 font-mono">{item.imei_sn}</div>
                      </td>
                      <td className="p-3 text-gray-600">Rp {totalHpp.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-semibold text-gray-900">Rp {transaksi.harga_jual.toLocaleString('id-ID')}</td>
                      <td className={`p-3 font-bold ${profitBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rp {profitBersih.toLocaleString('id-ID')}
                      </td>
                      <td className={`p-3 font-medium ${profitBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {persentase.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}