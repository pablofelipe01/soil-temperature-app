'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  /** Clases del contenedor visual (fondo, borde, padding, etc.) */
  className?: string
  /** Grados máximos de inclinación en cada eje */
  maxTilt?: number
  /** Profundidad en px a la que "flota" el contenido sobre la tarjeta */
  depth?: number
  /** Muestra el reflejo que sigue al cursor */
  glare?: boolean
}

/**
 * Tarjeta con efecto 3D que sigue al cursor.
 *
 * Se desactiva automáticamente en dispositivos sin puntero fino (móviles) y
 * cuando el usuario prefiere movimiento reducido, quedando como una tarjeta
 * estática normal.
 */
function TiltCard({
  children,
  className = '',
  maxTilt = 10,
  depth = 24,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 })
  const [active, setActive] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
    )
    const update = () => setEnabled(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !ref.current) return

      const rect = ref.current.getBoundingClientRect()
      // Posición relativa del cursor: -0.5 (izquierda/arriba) → 0.5 (derecha/abajo)
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height

      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        setTilt({
          x: -(py - 0.5) * 2 * maxTilt,
          y: (px - 0.5) * 2 * maxTilt,
        })
        setGlarePos({ x: px * 100, y: py * 100 })
      })
    },
    [enabled, maxTilt]
  )

  const handleMouseEnter = useCallback(() => {
    if (enabled) setActive(true)
  }, [enabled])

  const handleMouseLeave = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
    setActive(false)
    setTilt({ x: 0, y: 0 })
    setGlarePos({ x: 50, y: 50 })
  }, [])

  return (
    <div style={{ perspective: '1000px' }} className="h-full">
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative h-full overflow-hidden rounded-xl ${className}`}
        style={{
          transformStyle: 'preserve-3d',
          transform: enabled
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${active ? 1.02 : 1})`
            : undefined,
          transition: active
            ? 'transform 120ms ease-out'
            : 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: enabled ? 'transform' : undefined,
        }}
      >
        {glare && enabled && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
            style={{
              opacity: active ? 1 : 0,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.45), transparent 55%)`,
            }}
          />
        )}
        <div
          className="relative h-full"
          style={{
            transform: enabled ? `translateZ(${depth}px)` : undefined,
            transformStyle: 'preserve-3d',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export { TiltCard, type TiltCardProps }
