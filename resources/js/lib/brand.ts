import { usePage } from "@inertiajs/react"

export interface Brand {
  appName: string
  schoolName: string
  schoolLogo: string
}

/**
 * Identitas aplikasi dan sekolah pelanggan (diatur lewat APP_NAME, SCHOOL_NAME, SCHOOL_LOGO di .env),
 * sehingga satu kode BK-EWS dapat dipakai banyak sekolah tanpa mengubah tampilan.
 */
export function useBrand(): Brand {
  const { app } = usePage<{ app?: { name?: string; school?: { name?: string; logo?: string } } }>().props
  return {
    appName: app?.name || "BK-EWS",
    schoolName: app?.school?.name || "Sekolah Mitra JKS",
    schoolLogo: app?.school?.logo || "/images/logo-sekolah.svg",
  }
}
