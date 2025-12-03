import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-dark-50 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-dark-300 mb-4">Página no encontrada</h2>
        <p className="text-dark-400 mb-8">
          La página que estás buscando no existe o fue movida.
        </p>
        <Link href="/" className="btn btn-primary inline-flex items-center gap-2">
          <Home className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
