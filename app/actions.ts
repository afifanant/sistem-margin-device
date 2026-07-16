'use server'

import { supabase } from '../utils/supabase'
import { revalidatePath } from 'next/cache'

// Fungsi pembersih titik/koma dari input teks menjadi angka murni
const parseRupiah = (value: string | null) => {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9]/g, '')) || 0;
}

// 1. FUNGSI INPUT BARANG BARU
export async function tambahBarang(formData: FormData) {
  const kategori = formData.get('kategori') as string
  const nama_barang = formData.get('nama_barang') as string
  const imei_sn = formData.get('imei_sn') as string
  
  const harga_beli = parseRupiah(formData.get('harga_beli') as string)
  const biaya_perbaikan = parseRupiah(formData.get('biaya_perbaikan') as string)
  const biaya_lainnya = parseRupiah(formData.get('biaya_lainnya') as string)
  const keterangan_biaya = formData.get('keterangan_biaya') as string

  if (!kategori || !nama_barang || !imei_sn) {
    throw new Error('Kategori, Nama Barang, dan Kode HP/SN wajib diisi!')
  }

  const { data: deviceData, error: deviceError } = await supabase
    .from('devices')
    .insert([{ kategori, nama_barang, imei_sn, status: 'ready' }])
    .select()
    .single()

  if (deviceError) throw new Error(`Gagal input unit: ${deviceError.message}`)

  const { error: capitalError } = await supabase
    .from('capitals')
    .insert([{
      device_id: deviceData.id,
      harga_beli,
      biaya_perbaikan,
      biaya_lainnya,
      keterangan_biaya
    }])

  if (capitalError) throw new Error(`Gagal input modal: ${capitalError.message}`)

  revalidatePath('/')
}

// 2. FUNGSI EKSEKUSI PENJUALAN
export async function jualBarang(formData: FormData) {
  const device_id = formData.get('device_id') as string
  const harga_jual = parseRupiah(formData.get('harga_jual') as string)
  const tanggal_terjual = formData.get('tanggal_terjual') as string

  if (!device_id || harga_jual <= 0) {
    throw new Error('Data penjualan tidak valid! Harga jual harus diisi.')
  }

  const txData: any = { device_id, harga_jual }
  if (tanggal_terjual) {
    txData.tanggal_terjual = tanggal_terjual
  }

  const { error: txError } = await supabase
    .from('transactions')
    .insert([txData])

  if (txError) throw new Error(`Gagal mencatat transaksi: ${txError.message}`)

  const { error: deviceError } = await supabase
    .from('devices')
    .update({ status: 'sold' })
    .eq('id', device_id)

  if (deviceError) throw new Error(`Gagal memperbarui status perangkat: ${deviceError.message}`)

  revalidatePath('/')
}

// 3. FUNGSI HAPUS ABSOLUT (Mendukung Penghapusan Unit Ready & Sold secara Aman)
export async function hapusBarang(formData: FormData) {
  const device_id = formData.get('device_id') as string

  if (!device_id) throw new Error('ID perangkat tidak ditemukan')

  // Langkah A: Bersihkan riwayat transaksi terlebih dahulu (mencegah Foreign Key Error)
  const { error: txDeleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('device_id', device_id)

  if (txDeleteError) throw new Error(`Gagal membersihkan data transaksi: ${txDeleteError.message}`)

  // Langkah B: Bersihkan rincian modal dasar
  const { error: capDeleteError } = await supabase
    .from('capitals')
    .delete()
    .eq('device_id', device_id)

  if (capDeleteError) throw new Error(`Gagal membersihkan data modal: ${capDeleteError.message}`)

  // Langkah C: Hapus data utama perangkat setelah dependensinya bersih
  const { error: deviceDeleteError } = await supabase
    .from('devices')
    .delete()
    .eq('id', device_id)

  if (deviceDeleteError) throw new Error(`Gagal menghapus entitas perangkat: ${deviceDeleteError.message}`)

  revalidatePath('/')
}