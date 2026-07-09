'use server'

import { supabase } from '../utils/supabase'
import { revalidatePath } from 'next/cache'

// Fungsi pembersih titik/koma dari input teks menjadi angka murni
const parseRupiah = (value: string | null) => {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9]/g, '')) || 0;
}

export async function tambahBarang(formData: FormData) {
  const kategori = formData.get('kategori') as string
  const nama_barang = formData.get('nama_barang') as string
  const imei_sn = formData.get('imei_sn') as string
  
  // Menggunakan parseRupiah agar aman meski diinput pakai titik
  const harga_beli = parseRupiah(formData.get('harga_beli') as string)
  const biaya_perbaikan = parseRupiah(formData.get('biaya_perbaikan') as string)
  const biaya_lainnya = parseRupiah(formData.get('biaya_lainnya') as string)
  const keterangan_biaya = formData.get('keterangan_biaya') as string

  if (!kategori || !nama_barang || !imei_sn) {
    throw new Error('Kategori, Nama Barang, dan IMEI wajib diisi!')
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

export async function jualBarang(formData: FormData) {
  const device_id = formData.get('device_id') as string
  const harga_jual = parseRupiah(formData.get('harga_jual') as string)

  if (!device_id || harga_jual <= 0) {
    throw new Error('Data penjualan tidak valid! Harga jual harus diisi.')
  }

  const { error: txError } = await supabase
    .from('transactions')
    .insert([{ device_id, harga_jual }])

  if (txError) throw new Error(`Gagal mencatat transaksi: ${txError.message}`)

  const { error: deviceError } = await supabase
    .from('devices')
    .update({ status: 'sold' })
    .eq('id', device_id)

  if (deviceError) throw new Error(`Gagal memperbarui status perangkat: ${deviceError.message}`)

  revalidatePath('/')
}

// FUNGSI BARU: Hapus Barang (HANYA UNTUK STATUS READY)
export async function hapusBarang(formData: FormData) {
  const device_id = formData.get('device_id') as string

  if (!device_id) throw new Error('ID perangkat tidak ditemukan')

  // Catatan Keamanan: Supabase akan otomatis menghapus data di tabel 'capitals' 
  // karena kita sudah set ON DELETE CASCADE saat bikin tabel dulu.
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', device_id)
    .eq('status', 'ready') // Pengaman: Barang 'sold' gak bisa dihapus dari sini

  if (error) throw new Error(`Gagal menghapus data: ${error.message}`)

  revalidatePath('/')
}