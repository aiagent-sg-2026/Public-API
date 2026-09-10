import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText } from './cardPrimitives'

const requestCoordinate = (requestUrl: string | undefined, key: 'latitude' | 'longitude') => {
  if (!requestUrl) return undefined
  try {
    return finite(new URL(requestUrl).searchParams.get(key))
  } catch {
    return undefined
  }
}

const coordinateLabel = (value: number | undefined) => value === undefined ? 'Not supplied' : numericText(value)
const elevationLabel = (value: number | undefined) => value === undefined ? 'Not supplied' : `${numericText(value)} m`

export function ElevationPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const root = asRecord(data)
  const values = Array.isArray(root.elevation) ? root.elevation : root.elevation === undefined ? [] : [root.elevation]
  const elevation = finite(values[0])

  if (elevation === undefined) {
    return <CardEmpty
      domain="terrain-elevation"
      title="Terrain elevation unavailable"
      detail="Open-Meteo did not return a numeric terrain elevation for the requested coordinate."
      state="empty"
    />
  }

  const latitude = requestCoordinate(requestUrl, 'latitude') ?? finite(root.latitude)
  const longitude = requestCoordinate(requestUrl, 'longitude') ?? finite(root.longitude)
  const coordinateSummary = latitude !== undefined && longitude !== undefined
    ? `WGS84 ${coordinateLabel(latitude)}, ${coordinateLabel(longitude)}`
    : 'Requested coordinates were not captured with this response.'

  return <div
    className="domain-card elevation-preview"
    data-domain-card="terrain-elevation"
    data-result-state="ready"
    data-primary-elevation-meters={elevation}
    data-request-latitude={latitude}
    data-request-longitude={longitude}
    data-dem-resolution-meters="90"
    data-source-dataset="Copernicus DEM 2021 GLO-90"
  >
    <CardHeading
      eyebrow="Open-Meteo · Copernicus GLO-90"
      title={`${elevationLabel(elevation)} terrain elevation`}
      description={coordinateSummary}
    >
      <span className="domain-state">90 m DEM</span>
    </CardHeading>

    <Facts items={[
      { label: 'Terrain elevation', value: elevationLabel(elevation) },
      { label: 'Requested latitude', value: coordinateLabel(latitude) },
      { label: 'Requested longitude', value: coordinateLabel(longitude) },
      { label: 'DEM resolution', value: '90 m' },
      { label: 'Dataset', value: 'Copernicus DEM 2021 GLO-90' },
    ]}/>

    <p className="domain-note">Open-Meteo returns only an elevation array from this endpoint, so the requested WGS84 coordinate is preserved from the request URL. Open-Meteo requires attribution to both the Copernicus programme and Open-Meteo when using this elevation data.</p>
  </div>
}
