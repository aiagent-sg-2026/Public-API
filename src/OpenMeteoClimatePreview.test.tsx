import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'open-meteo-climate')
if (!api) throw new Error('Missing open-meteo-climate fixture')

describe('Open-Meteo Climate semantic preview', () => {
  afterEach(cleanup)

  it('preserves the executed climate model and maps daily climate arrays into semantic metrics', () => {
    render(<ResponseDemoPreview
      api={api}
      requestUrl="https://climate-api.open-meteo.com/v1/climate?latitude=1.4&longitude=103.8&start_date=2026-08-03&end_date=2026-08-05&models=CMCC_CM2_VHR4&daily=temperature_2m_mean%2Cprecipitation_sum&format=json"
      data={{
        latitude: 1.4,
        longitude: 103.8,
        elevation: 46,
        daily_units: { time: 'iso8601', temperature_2m_mean: '°C', precipitation_sum: 'mm' },
        daily: {
          time: ['2026-08-03', '2026-08-04', '2026-08-05'],
          temperature_2m_mean: [26, 27, 28],
          precipitation_sum: [1.5, 0, 2.5],
        },
      }}
    />)

    const preview = screen.getByRole('region', { name: 'Open-Meteo Climate' })
    expect(preview).toHaveAttribute('data-preview-layout', 'market-chart')
    const card = preview.querySelector('[data-domain-card="climate-projection"]')
    expect(card).toHaveAttribute('data-result-state', 'ready')
    expect(card).toHaveAttribute('data-primary-model', 'CMCC_CM2_VHR4')
    expect(card).toHaveAttribute('data-period-start', '2026-08-03')
    expect(card).toHaveAttribute('data-period-end', '2026-08-05')
    expect(card).toHaveAttribute('data-observation-count', '3')
    expect(card).toHaveAttribute('data-latest-temperature', '28')
    expect(preview).toHaveTextContent('CMCC_CM2_VHR4 climate projection')
    expect(preview).toHaveTextContent('Latest daily mean28 °C')
    expect(preview).toHaveTextContent('Period mean27 °C')
    expect(preview).toHaveTextContent('Total precipitation4 mm')
    expect(preview).toHaveTextContent('Returned days3')
    expect(preview).not.toHaveTextContent('Observations1')
  })

  it('fails semantically closed when no dated daily mean-temperature series is present', () => {
    render(<ResponseDemoPreview api={api} data={{ daily: { time: [], temperature_2m_mean: [] } }}/>)
    const preview = screen.getByRole('region', { name: 'Open-Meteo Climate' })
    const empty = preview.querySelector('[data-domain-card="climate-projection"]')
    expect(empty).toHaveAttribute('data-result-state', 'empty')
    expect(preview).toHaveTextContent('Climate projection unavailable')
  })
})
