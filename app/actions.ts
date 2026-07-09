'use server'

import { supabase } from '../utils/supabase'
import { revalidatePath } from 'next/cache'

// Fungsi 1: Input Barang Baru (Sudah ada sebelumnya)
export async function tambahBarang(formData: FormData) {
  const kategori = formData.get('kategori') as string
  const nama_barang = formData.get('nama_barang') as string
  const imei_sn = formData.get('imei_sn') as string
  
  const harga_beli = parseFloat(formData.get('harga_beli') as string) || 0
  const biaya_perbaikan = parseFloat(formData.get('biaya_perbaikan') as string) || 0
  const biaya_lainnya = parseFloat(formData.get('biaya_lainnya') as string) || 0
  const keterangan_biaya = formData.get('keterangan_biaya') as string

  if (!kategori || !nama_barang || !imei_sn) {
    throw new Error('Kategori, Nama Barang, dan IMEI wajib diisi!')
  }

  const { data: deviceData, error: deviceError } = await supabase
    .from('devices')
    .insert([{ kategori, nama_barang, imei_sn, status: 'ready' }])
    .select()
    .single()

  if (deviceError) {
    throw new Error(`Gagal input unit: ${deviceError.message}`)
  }

  const { error: capitalError } = await supabase
    .from('capitals')
    .insert([{
      device_id: deviceData.id,
      harga_beli,
      biaya_perbaikan,
      biaya_lainnya,
      keterangan_biaya
    }])

  if (capitalError) {
    throw new Error(`Gagal input modal: ${capitalError.message}`)
  }

  revalidatePath('/')
}

// Fungsi 2: Eksekusi Penjualan & Hitung Realisasi Profit (Fungsi Baru)
export async function jualBarang(formData: FormData) {
  const device_id = formData.get('device_id') as string
  const harga_jual = parseFloat(formData.get('harga_jual') as string) || 0

  if (!device_id || harga_jual <= 0) {
    throw new Error('Data penjualan tidak valid! Harga jual harus diisi.')
  }

  // 1. Catat transaksi penjualan ke tabel transactions
  const { error: txError } = await supabase
    .from('transactions')
    .insert([{ device_id, harga_jual }])

  if (txError) {
    throw new Error(`Gagal mencatat transaksi: ${txError.message}`)
  }

  // 2. Ubah status barang di tabel devices menjadi 'sold'
  const { error: deviceError } = await supabase
    .from('devices')
    .update({ status: 'sold' })
    .eq('id', device_id)

  if (deviceError) {
    throw new Error(`Gagal memperbarui status perangkat: ${deviceError.message}`)
  }

  // Refresh data halaman utama secara realtime
  revalidatePath('/')
}