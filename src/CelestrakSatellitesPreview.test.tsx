import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'celestrak-satellites')
if (!api) throw new Error('Missing celestrak-satellites fixture')
const officialStyleIss = { OBJECT_NAME: 'ISS (ZARYA)', OBJECT_ID: '1998-067A', EPOCH: '2026-06-19T12:16:41.638656', MEAN_MOTION: 15.49315858, ECCENTRICITY: 0.00045965, INCLINATION: 51.6332, RA_OF_ASC_NODE: 288.5889, ARG_OF_PERICENTER: 205.0015, MEAN_ANOMALY: 155.0751, CLASSIFICATION_TYPE: 'U', NORAD_CAT_ID: 25544, ELEMENT_SET_NO: 999, REV_AT_EPOCH: 57211 }

describe('CelesTrak GP orbital-element semantic preview', () => {
  afterEach(cleanup)
  it('labels OMM values with orbital meaning and keeps request group metadata', () => {
    render(<ResponseDemoPreview api={api} data={[officialStyleIss]} requestUrl="https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json"/>)
    const preview = screen.getByRole('region', { name: 'CelesTrak Orbital Elements' })
    expect(preview).toHaveAttribute('data-preview-layout', 'satellite-orbits')
    const card = preview.querySelector('.celestrak-satellites-preview')
    expect(card).toHaveAttribute('data-requested-group', 'stations')
    expect(card).toHaveAttribute('data-primary-norad-id', '25544')
    expect(card).toHaveAttribute('data-primary-mean-motion-rev-day', '15.49315858')
    expect(preview).toHaveTextContent('15.49315858 rev/day')
    expect(preview).toHaveTextContent('51.6332°')
    expect(preview).toHaveTextContent('0.00045965')
    expect(preview).toHaveTextContent('not real-time satellite positions')
    expect(preview).toHaveTextContent('Automated verification remains cadence-limited')
  })
})
