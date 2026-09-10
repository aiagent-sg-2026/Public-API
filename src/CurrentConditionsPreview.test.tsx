import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { CurrentConditionsPreview } from './previews/WeatherPreviews'

const api = apiCatalog.find((candidate) => candidate.id === 'weather')
if (!api) throw new Error('Missing Live Weather fixture')

describe('CurrentConditionsPreview semantic contract', () => {
  afterEach(cleanup)

  it('exposes the exact Open-Meteo current-condition response as a ready semantic card', () => {
    const { container } = render(<CurrentConditionsPreview api={api} data={{
      latitude: 1.3708259,
      longitude: 103.80237,
      timezone: 'Asia/Singapore',
      current_units: { temperature_2m: '°C', relative_humidity_2m: '%', wind_speed_10m: 'km/h', weather_code: 'wmo code' },
      current: { time: '2026-09-10T18:30', temperature_2m: 29, relative_humidity_2m: 76, wind_speed_10m: 4, weather_code: 3 },
    }}/>)

    const card = container.querySelector('[data-domain-card="current-weather"]')
    expect(card).toHaveAttribute('data-result-state', 'ready')
    expect(card).toHaveAttribute('data-observation-time', '2026-09-10T18:30')
    expect(card).toHaveAttribute('data-temperature-2m', '29')
    expect(card).toHaveAttribute('data-relative-humidity-2m', '76')
    expect(card).toHaveAttribute('data-wind-speed-10m', '4')
    expect(card).toHaveAttribute('data-weather-code', '3')
    expect(screen.getByText('29°C')).toBeInTheDocument()
    expect(screen.getByText('76%')).toBeInTheDocument()
    expect(screen.getByText('4 km/h')).toBeInTheDocument()
  })

  it('fails semantically closed when an HTTP-success-shaped body has no current measurements', () => {
    const { container } = render(<CurrentConditionsPreview api={api} data={{}}/>)
    const card = container.querySelector('[data-domain-card="current-weather"]')

    expect(card).toHaveAttribute('data-result-state', 'invalid')
    expect(screen.getByText('Current weather response unavailable')).toBeInTheDocument()
    expect(screen.getByText(/No live weather conclusion can be drawn/)).toBeInTheDocument()
    expect(screen.queryByText('Live reading')).not.toBeInTheDocument()
  })

  it('marks incomplete current measurements as partial instead of inventing live placeholder values', () => {
    const { container } = render(<CurrentConditionsPreview api={api} data={{
      timezone: 'Asia/Singapore',
      current: { time: '2026-09-10T18:30', temperature_2m: 29 },
    }}/>)
    const card = container.querySelector('[data-domain-card="current-weather"]')

    expect(card).toHaveAttribute('data-result-state', 'partial')
    expect(screen.getByRole('status')).toHaveTextContent('Missing: humidity, wind speed, weather code.')
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('Live reading')).not.toBeInTheDocument()
  })
})
