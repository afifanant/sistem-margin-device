'use client'

import { Trash2 } from 'lucide-react'

export default function DeleteButton() {
  return (
    <button 
      type="submit" 
      className="bg-slate-900/40 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 p-2 rounded-lg transition-all border border-slate-800 hover:border-rose-500/30 cursor-pointer" 
      title="Hapus Permanen"
      onClick={(e) => { 
        if(!confirm('Tindakan fatal: Yakin ingin menghapus data perangkat ini secara permanen?')) {
          e.preventDefault() 
        }
      }}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}