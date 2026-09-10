import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, text } from './cardPrimitives'

const safeHref = (value: unknown) => {
  const candidate = text(value)
  if (!candidate) return undefined
  try { const url = new URL(candidate); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}
const numberText = (value: unknown, unit = '') => {
  const number = finite(value)
  return number === undefined ? 'Not supplied' : `${numericText(number)}${unit}`
}

export function GeoBoundariesPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const boundaryId = text(root.boundaryID)
  if (!boundaryId) return <CardEmpty domain="boundary-layer" title="Boundary layer metadata unavailable" detail="geoBoundaries returned no usable boundary-layer metadata for this country and administrative level." state="empty"/>

  const name = text(root.boundaryName) ?? 'Administrative boundary layer'
  const iso = text(root.boundaryISO)
  const level = text(root.boundaryType)
  const representedYear = text(root.boundaryYearRepresented)
  const unitCount = finite(root.admUnitCount)
  const meanArea = finite(root.meanAreaSqKM)
  const meanPerimeter = finite(root.meanPerimeterLengthKM)
  const source = text(root.boundarySource)
  const sourceLicense = text(root.boundaryLicense)
  const buildDate = text(root.buildDate)
  const sourceUpdate = text(root.sourceDataUpdateDate)
  const links = [
    ['Full GeoJSON', safeHref(root.gjDownloadURL)],
    ['Simplified GeoJSON', safeHref(root.simplifiedGeometryGeoJSON)],
    ['TopoJSON', safeHref(root.tjDownloadURL)],
    ['Layer archive', safeHref(root.staticDownloadLink)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return <div className="domain-card geoboundaries-preview" data-domain-card="boundary-layer" data-result-state="ready" data-boundary-id={boundaryId} data-country-iso={iso} data-admin-level={level} data-represented-year={representedYear} data-admin-unit-count={unitCount} data-mean-unit-area-sq-km={meanArea} data-mean-unit-perimeter-km={meanPerimeter} data-build-date={buildDate} data-source-update-date={sourceUpdate} data-source-license={sourceLicense} data-release-type="gbOpen">
    <CardHeading eyebrow="geoBoundaries · gbOpen layer metadata" title={`${name}${level ? ` · ${level}` : ''}`} description="Metadata for one gbOpen administrative-boundary layer. Geometry is not embedded in this API response; the provider returns download links to the actual boundary files."><span className="domain-state">{iso ?? 'ISO not supplied'}</span></CardHeading>
    <Facts items={[
      { label: 'Boundary layer ID', value: <code>{boundaryId}</code> },
      { label: 'Represented year', value: representedYear ?? 'Not supplied' },
      { label: 'Administrative units in layer', value: unitCount === undefined ? 'Not supplied' : numericText(unitCount) },
      { label: 'Mean administrative-unit area', value: numberText(meanArea, ' km²') },
      { label: 'Mean administrative-unit perimeter', value: numberText(meanPerimeter, ' km') },
      { label: 'Source integrated', value: sourceUpdate ?? 'Not supplied' },
      { label: 'geoBoundaries build', value: buildDate ?? 'Not supplied' },
      { label: 'UN SDG region', value: text(root['UNSDG-region']) ?? 'Not supplied' },
      { label: 'World Bank income group', value: text(root.worldBankIncomeGroup) ?? 'Not supplied' },
    ]}/>
    <section className="geoboundaries-provenance" aria-labelledby="geoboundaries-provenance-heading">
      <h4 id="geoboundaries-provenance-heading">Source and license</h4>
      <p><strong>Boundary source:</strong> {source ?? 'Not supplied'}</p>
      <p><strong>Original source license:</strong> {sourceLicense ?? 'Not supplied'}</p>
      {text(root.licenseDetail) && <p><strong>License detail:</strong> {text(root.licenseDetail)}</p>}
    </section>
    <section className="geoboundaries-downloads" aria-labelledby="geoboundaries-downloads-heading">
      <h4 id="geoboundaries-downloads-heading">Boundary downloads</h4>
      {links.length ? <ul>{links.map(([label, href]) => <li key={label}><a href={href} target="_blank" rel="noreferrer" aria-label={`${label} for ${name} ${level ?? ''}`.trim()}>{label}</a></li>)}</ul> : <p>No provider download URLs were supplied.</p>}
    </section>
    <p className="domain-note">geoBoundaries requires attribution for API/programmatic use. This route is fixed to the provider's gbOpen release type. The response's boundaryLicense is the original source-data license; meanAreaSqKM and meanPerimeterLengthKM are averages across administrative units in the layer, not total country area or perimeter.</p>
  </div>
}
