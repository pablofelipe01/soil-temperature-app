import Image from 'next/image'

interface HeroBackgroundProps {
  /** Intensidad del velo oscuro sobre la fotografía (0–100) */
  overlay?: 'soft' | 'medium' | 'strong'
  /** Prioriza la carga (usar solo en la imagen visible al entrar) */
  priority?: boolean
  /**
   * `absolute` (por defecto) rellena el contenedor con `relative` más cercano.
   * `fixed` ancla la fotografía al viewport, para páginas largas donde el
   *  contenido debe desplazarse sobre un fondo estable.
   */
  position?: 'absolute' | 'fixed'
  className?: string
}

const overlays: Record<NonNullable<HeroBackgroundProps['overlay']>, string> = {
  soft: 'from-slate-950/55 via-slate-950/45 to-slate-950/75',
  medium: 'from-slate-950/70 via-slate-950/60 to-slate-950/85',
  strong: 'from-slate-950/85 via-slate-950/80 to-slate-950/95',
}

/**
 * Fotografía de fondo a sangre (cielo nocturno sobre parcela) con velos de
 * contraste. Se coloca detrás del contenido; el contenido debe ir en un
 * hermano con `relative`.
 */
export default function HeroBackground({
  overlay = 'medium',
  priority = false,
  position = 'absolute',
  className = '',
}: HeroBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`${position} inset-0 overflow-hidden ${className}`}
    >
      <Image
        src="/hero-night-sky.png"
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        quality={85}
        className="object-cover object-center"
      />
      {/* Velo vertical para legibilidad del texto */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlays[overlay]}`} />
      {/* Tinte verde de marca, muy sutil */}
      <div className="absolute inset-0 bg-emerald-950/20 mix-blend-multiply" />
      {/* Viñeta */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,6,23,0.75)_100%)]" />
    </div>
  )
}
