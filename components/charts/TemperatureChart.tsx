'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Depth level configuration
const DEPTH_LEVELS = [
  { key: 'tempLevel1', label: '0–7 cm', color: '#ef4444' },   // red
  { key: 'tempLevel2', label: '7–28 cm', color: '#f97316' },   // orange
  { key: 'tempLevel3', label: '28–100 cm', color: '#3b82f6' }, // blue
  { key: 'tempLevel4', label: '100–289 cm', color: '#8b5cf6' }, // violet
] as const

export interface TemperatureReading {
  id: string
  date: string
  temperatureCelsius: number
  tempLevel1?: number | null
  tempLevel2?: number | null
  tempLevel3?: number | null
  tempLevel4?: number | null
  dataSource?: string
}

export interface TemperatureChartProps {
  /** Temperature readings array */
  data: TemperatureReading[]
  /** True while data is being fetched */
  loading?: boolean
  /** Error message to display */
  error?: string
  /** Chart height in px (default 320) */
  height?: number
}

/** Format ISO date string to short locale label */
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

interface TooltipPayloadEntry {
  dataKey: string
  name: string
  value: number
  color: string
}

/** Custom Recharts Tooltip */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null

  const dateLabel = typeof label === 'string' ? label : ''

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
        {dateLabel
          ? new Date(dateLabel).toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : ''}
      </p>
      {payload.map((entry: TooltipPayloadEntry) => (
        <p key={entry.dataKey} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>{' '}
          <span className="font-semibold">{(entry.value as number)?.toFixed(1)} °C</span>
        </p>
      ))}
    </div>
  )
}

export default function TemperatureChart({
  data,
  loading = false,
  error,
  height = 320,
}: TemperatureChartProps) {
  // Determine which depth levels actually have data
  const activeDepths = useMemo(() => {
    return DEPTH_LEVELS.filter((depth) =>
      data.some((d) => d[depth.key as keyof TemperatureReading] != null),
    )
  }, [data])

  // If no per-depth data, fall back to the aggregated temperatureCelsius
  const hasDepthData = activeDepths.length > 0

  // Compute YAxis domain: min-2 .. max+2
  const [yMin, yMax] = useMemo(() => {
    let min = Infinity
    let max = -Infinity

    for (const d of data) {
      if (hasDepthData) {
        for (const depth of activeDepths) {
          const v = d[depth.key as keyof TemperatureReading] as number | null | undefined
          if (v != null) {
            if (v < min) min = v
            if (v > max) max = v
          }
        }
      } else {
        const v = d.temperatureCelsius
        if (v != null) {
          if (v < min) min = v
          if (v > max) max = v
        }
      }
    }

    if (!isFinite(min)) return [0, 40]
    return [Math.floor(min - 2), Math.ceil(max + 2)]
  }, [data, hasDepthData, activeDepths])

  // Sort data by date for proper line rendering
  const sortedData = useMemo(
    () => [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data],
  )

  // --- States: loading, error, empty ---
  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600" style={{ height }}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Cargando datos…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 px-4" style={{ height }}>
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-4" style={{ height }}>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          No hay datos de temperatura para el período seleccionado.
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={sortedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />

        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 12 }}
          className="text-gray-500 dark:text-gray-400"
          minTickGap={30}
        />

        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={(v: number) => `${v}°`}
          tick={{ fontSize: 12 }}
          className="text-gray-500 dark:text-gray-400"
          width={48}
        />

        <Tooltip content={<CustomTooltip />} />

        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />

        {hasDepthData
          ? activeDepths.map((depth) => (
              <Line
                key={depth.key}
                type="monotone"
                dataKey={depth.key}
                name={depth.label}
                stroke={depth.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))
          : (
              <Line
                type="monotone"
                dataKey="temperatureCelsius"
                name="Temperatura (0–7 cm)"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
      </LineChart>
    </ResponsiveContainer>
  )
}
