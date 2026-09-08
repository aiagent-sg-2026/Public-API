import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'noaa-tides')
if (!api) throw new Error('Missing noaa-tides fixture')

describe('NOAA coastal water-level semantic preview', () => {
  afterEach(cleanup)

  it('preserves NOAA station, measurement, datum, timing, and QA/QC semantics', () => {
    render(<ResponseDemoPreview
      api={api}
      requestUrl="https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=8518750&product=water_level&date=latest&datum=MLLW&units=metric&time_zone=gmt&application=Public_API_Workbench&format=json"
      data={{
        metadata: { id: '8518750', name: 'The Battery', lat: '40.7006', lon: '-74.0142' },
        data: [{ t: '2026-09-07 03:30', v: '0.325', s: '0.035', f: '1,0,0,0', q: 'p' }],
      }}
    />)

    const preview = screen.getByRole('region', { name: 'NOAA Tides & Currents' })
    expect(preview).toHaveAttribute('data-preview-layout', 'coastal-water-level')
    const card = preview.querySelector('.tide-water-level-preview')
    expect(card).toHaveAttribute('data-station-id', '8518750')
    expect(card).toHaveAttribute('data-station-name', 'The Battery')
    expect(card).toHaveAttribute('data-primary-water-level', '0.325')
    expect(card).toHaveAttribute('data-water-level-unit', 'm')
    expect(card).toHaveAttribute('data-observed-at', '2026-09-07 03:30')
    expect(card).toHaveAttribute('data-quality-level', 'p')
    expect(card).toHaveAttribute('data-datum', 'MLLW')
    expect(card).toHaveAttribute('data-time-zone', 'gmt')
    expect(card).toHaveAttribute('data-sigma', '0.035')
    expect(card).toHaveAttribute('data-flags', '1,0,0,0')
    expect(within(preview).getByRole('heading', { name: 'The Battery' })).toBeInTheDocument()
    expect(preview).toHaveTextContent('0.325 m')
    expect(preview).toHaveTextContent('Mean Lower Low Water (MLLW)')
    expect(preview).toHaveTextContent('2026-09-07 03:30 GMT')
    expect(preview).toHaveTextContent('Preliminary')
    expect(preview).toHaveTextContent('0.035 m')
    expect(preview).toHaveTextContent('Samples outside 3σ band')
    expect(preview).toHaveTextContent('Latest point available within 18 minutes')
    expect(preview).not.toHaveTextContent('NOAA Tides & Currents record 1')
  })
})
