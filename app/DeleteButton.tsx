'use client' // Ini deklarasi mutlak bahwa file ini berjalan di browser (Client Component)

export default function DeleteButton() {
  return (
    <button 
      type="submit" 
      className="bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-xs py-2 px-3 rounded-lg transition-colors shadow-sm border border-rose-200" 
      onClick={(e) => { 
        if(!confirm('Tindakan fatal: Yakin ingin menghapus data perangkat ini secara permanen?')) {
          e.preventDefault() 
        }
      }}
    >
      Hapus
    </button>
  )
}