import './operationalCards.css'
import { SemanticCards, type SemanticCard } from './SemanticCards'
import { cleanText, formatNumber, isRecord, numberValue, previewValue, recordArray, textArray, textValue } from './previewData'

const gleifDate = (value: unknown) => {
  const text = cleanText(value)
  if (!text) return '—'
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10)
}

const gleifAddress = (value: unknown) => {
  const address = isRecord(value) ? value : {}
  const lines = textArray(address.addressLines)
  const parts = [...lines, cleanText(address.city), cleanText(address.region), cleanText(address.postalCode), cleanText(address.country)]
    .filter((part): part is string => Boolean(part))
  return parts.join(', ') || '—'
}

const gleifRelationshipLabels: Record<string, string> = {
  'direct-parent': 'Direct parent relation',
  'ultimate-parent': 'Ultimate parent relation',
  'direct-children': 'Direct children relation',
  'ultimate-children': 'Ultimate children relation',
  branches: 'Branch relation',
}

export function GleifLeiPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const records = recordArray(root.data).slice(0, 8)
  const cards: SemanticCard[] = records.map((record) => {
    const attributes = isRecord(record.attributes) ? record.attributes : {}
    const entity = isRecord(attributes.entity) ? attributes.entity : {}
    const registration = isRecord(attributes.registration) ? attributes.registration : {}
    const legalName = isRecord(entity.legalName) ? cleanText(entity.legalName.name) : undefined
    const relationships = isRecord(record.relationships) ? record.relationships : {}
    const relationTags = Object.entries(gleifRelationshipLabels).flatMap(([key, label]) => {
      const relationship = isRecord(relationships[key]) ? relationships[key] : {}
      const links = isRecord(relationship.links) ? relationship.links : {}
      return cleanText(links.related) ? [label] : []
    })
    const bics = textArray(attributes.bic)
    return {
      title: legalName ?? cleanText(record.id) ?? 'Legal entity',
      eyebrow: 'GLEIF · Global LEI Index',
      badge: cleanText(entity.status) ?? cleanText(registration.status),
      description: 'Level 1 identity and registration facts from the returned LEI record. Relationship tags indicate provider links available from this record; no extra relationship request is made.',
      metrics: [
        { label: 'LEI', value: cleanText(attributes.lei) ?? cleanText(record.id) ?? '—' },
        { label: 'Headquarters', value: gleifAddress(entity.headquartersAddress) },
        { label: 'Jurisdiction', value: previewValue(entity.jurisdiction) },
        { label: 'Registration status', value: previewValue(registration.status) },
        { label: 'Initial registration', value: gleifDate(registration.initialRegistrationDate) },
        { label: 'Next renewal', value: gleifDate(registration.nextRenewalDate) },
        { label: 'BIC mappings', value: bics.length ? bics.join(', ') : '—' },
      ],
      tags: relationTags,
    }
  })
  if (!cards.length) return <div className="weather-empty"><strong>LEI records unavailable</strong><span>The response did not include legal-entity records.</span></div>
  const first = records[0]
  const firstAttributes = first && isRecord(first.attributes) ? first.attributes : {}
  const firstEntity = isRecord(firstAttributes.entity) ? firstAttributes.entity : {}
  const firstRegistration = isRecord(firstAttributes.registration) ? firstAttributes.registration : {}
  const firstLegalName = isRecord(firstEntity.legalName) ? cleanText(firstEntity.legalName.name) : undefined
  return <div
    className="legal-entity-preview"
    data-result-count={records.length}
    data-primary-lei={cleanText(firstAttributes.lei) ?? cleanText(first?.id) ?? ''}
    data-primary-legal-name={firstLegalName ?? ''}
    data-primary-entity-status={cleanText(firstEntity.status) ?? ''}
    data-primary-registration-status={cleanText(firstRegistration.status) ?? ''}
  ><SemanticCards cards={cards} emptyTitle="LEI records unavailable"/></div>
}

const fdicDate = (value: unknown) => cleanText(value) ?? '—'

const fdicStatus = (record: Record<string, unknown>) => {
  if (numberValue(record.ACTIVE) === 1) return 'Active'
  if (numberValue(record.INACTIVE) === 1) return 'Former / inactive'
  return 'Status unavailable'
}

const fdicMainOffice = (record: Record<string, unknown>) => {
  const cityStateZip = [cleanText(record.CITY), cleanText(record.STALP), cleanText(record.ZIP)].filter((part): part is string => Boolean(part)).join(' ')
  return [cleanText(record.ADDRESS), cityStateZip].filter(Boolean).join(', ') || '—'
}

const fdicFinancialValue = (value: unknown) => {
  const number = numberValue(value)
  return number === undefined ? '—' : formatNumber(number, 0)
}

export function FdicBankPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const records = recordArray(root.data)
    .map((entry) => isRecord(entry.data) ? entry.data : entry)
    .slice(0, 8)
  if (!records.length) return <div className="weather-empty"><strong>FDIC institution records unavailable</strong><span>The response did not include institution records.</span></div>

  const cards: SemanticCard[] = records.map((record) => ({
    title: cleanText(record.NAME) ?? `FDIC certificate ${previewValue(record.CERT)}`,
    eyebrow: `FDIC institution · Certificate ${previewValue(record.CERT)}`,
    badge: fdicStatus(record),
    description: 'Institution identity, structure, and latest financial fields returned by the FDIC institutions endpoint. Monetary values are shown in the provider’s $000s reporting units.',
    metrics: [
      { label: 'Main office', value: fdicMainOffice(record) },
      { label: 'Established', value: fdicDate(record.ESTYMD) },
      { label: 'FDIC insured since', value: fdicDate(record.INSDATE) },
      { label: 'Total assets ($000s)', value: fdicFinancialValue(record.ASSET) },
      { label: 'Total deposits ($000s)', value: fdicFinancialValue(record.DEP) },
      { label: 'Domestic deposits ($000s)', value: fdicFinancialValue(record.DEPDOM) },
      { label: 'Offices', value: previewValue(record.OFFICES ?? record.OFFDOM) },
      { label: 'Primary regulator', value: previewValue(record.REGAGNT) },
      { label: 'Financial report date', value: fdicDate(record.REPDTE ?? record.RISDATE) },
    ],
    tags: [
      cleanText(record.BKCLASS) ? `Bank class ${cleanText(record.BKCLASS)}` : undefined,
      cleanText(record.FDICREGN) ? `FDIC region ${cleanText(record.FDICREGN)}` : undefined,
      numberValue(record.INSFDIC) === 1 ? 'FDIC insured' : undefined,
    ].filter((tag): tag is string => Boolean(tag)),
  }))

  const first = records[0]
  const meta = isRecord(root.meta) ? root.meta : {}
  return <div
    className="bank-institution-preview"
    data-result-count={records.length}
    data-provider-match-count={numberValue(meta.total) ?? ''}
    data-primary-bank-name={cleanText(first.NAME) ?? ''}
    data-primary-fdic-certificate={textValue(first.CERT) ?? ''}
    data-primary-active={numberValue(first.ACTIVE) === 1 ? 'true' : 'false'}
    data-primary-assets-thousands={numberValue(first.ASSET) ?? ''}
    data-primary-deposits-thousands={numberValue(first.DEP) ?? ''}
    data-primary-office-count={numberValue(first.OFFICES ?? first.OFFDOM) ?? ''}
  ><SemanticCards cards={cards} emptyTitle="FDIC institution records unavailable"/></div>
}

const satPerVbyte = (value: unknown) => {
  const number = numberValue(value)
  return number === undefined ? '—' : `${formatNumber(number, 2)} sat/vB`
}

export function MempoolFeePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const fastestFee = numberValue(root.fastestFee)
  const halfHourFee = numberValue(root.halfHourFee)
  const hourFee = numberValue(root.hourFee)
  const economyFee = numberValue(root.economyFee)
  const minimumFee = numberValue(root.minimumFee)
  const hasFee = [fastestFee, halfHourFee, hourFee, economyFee, minimumFee].some((value) => value !== undefined)
  if (!hasFee) return <div className="weather-empty"><strong>Recommended fees unavailable</strong><span>The response did not include mempool.space recommended fee rates.</span></div>

  const spread = fastestFee !== undefined && minimumFee !== undefined ? Math.max(0, fastestFee - minimumFee) : undefined
  return <div
    className="transaction-fees-preview"
    data-primary-fee-sat-vb={fastestFee ?? ''}
    data-half-hour-fee-sat-vb={halfHourFee ?? ''}
    data-hour-fee-sat-vb={hourFee ?? ''}
    data-economy-fee-sat-vb={economyFee ?? ''}
    data-minimum-fee-sat-vb={minimumFee ?? ''}
  >
    <SemanticCards cards={[{
      title: 'Recommended Bitcoin fee rates',
      eyebrow: 'mempool.space fee estimator',
      badge: fastestFee === undefined ? undefined : `${satPerVbyte(fastestFee)} fastest`,
      description: 'Current suggested fee rates for new Bitcoin transactions. This endpoint reports fee recommendations; it does not by itself provide full mempool backlog or chain-health data.',
      metrics: [
        { label: 'Fastest', value: satPerVbyte(fastestFee) },
        { label: 'Half-hour target', value: satPerVbyte(halfHourFee) },
        { label: 'One-hour target', value: satPerVbyte(hourFee) },
        { label: 'Economy', value: satPerVbyte(economyFee) },
        { label: 'Minimum', value: satPerVbyte(minimumFee) },
        { label: 'Fastest-to-minimum spread', value: satPerVbyte(spread) },
      ],
    }]} emptyTitle="Recommended fees unavailable"/>
  </div>
}

export function RdapDomainPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const domain = cleanText(root.ldhName)
  if (!domain) return <div className="weather-empty"><strong>Domain registration unavailable</strong><span>The RDAP response did not include a domain registration record.</span></div>

  const statuses = textArray(root.status)
  const nameservers = recordArray(root.nameservers).map((entry) => cleanText(entry.ldhName)).filter((value): value is string => Boolean(value))
  const registrar = recordArray(root.entities).find((entity) => textArray(entity.roles).some((role) => role.toLowerCase() === 'registrar'))
  const vcard = registrar && Array.isArray(registrar.vcardArray) ? registrar.vcardArray : []
  const vcardProperties = Array.isArray(vcard[1]) ? vcard[1] : []
  const fullNameProperty = vcardProperties.find((property) => Array.isArray(property) && property[0] === 'fn')
  const registrarName = Array.isArray(fullNameProperty) ? cleanText(fullNameProperty[3]) : undefined
  const events = recordArray(root.events)
  const eventDate = (action: string) => {
    const value = events.find((event) => cleanText(event.eventAction)?.toLowerCase() === action)?.eventDate
    const text = cleanText(value)
    if (!text) return '—'
    const date = new Date(text)
    return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10)
  }

  return <SemanticCards cards={[{
    title: domain,
    eyebrow: 'RDAP domain registration',
    badge: statuses[0],
    description: 'Registration data returned through RDAP.org, including registrar, lifecycle events, nameservers, and registry status.',
    metrics: [
      { label: 'Registrar', value: registrarName ?? cleanText(registrar?.handle) ?? '—' },
      { label: 'Registered', value: eventDate('registration') },
      { label: 'Expires', value: eventDate('expiration') },
      { label: 'Last changed', value: eventDate('last changed') },
      { label: 'Nameservers', value: nameservers.join(', ') || '—' },
      { label: 'Registry handle', value: previewValue(root.handle) },
      { label: 'Status', value: statuses.join(', ') || '—' },
    ],
  }]} emptyTitle="Domain registration unavailable"/>
}

const formatRouteDistance = (value: unknown) => {
  const meters = numberValue(value)
  if (meters === undefined) return '—'
  return meters >= 1000 ? `${formatNumber(meters / 1000, 2)} km` : `${formatNumber(meters, 0)} m`
}

const formatRouteDuration = (value: unknown) => {
  const seconds = numberValue(value)
  if (seconds === undefined) return '—'
  const rounded = Math.max(0, Math.round(seconds))
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const remainingSeconds = rounded % 60
  if (hours) return `${hours} hr ${minutes} min`
  if (minutes) return `${minutes} min ${remainingSeconds} sec`
  return `${remainingSeconds} sec`
}

const routeWaypointLabel = (waypoint: Record<string, unknown> | undefined) => {
  if (!waypoint) return '—'
  const name = cleanText(waypoint.name)
  const location = Array.isArray(waypoint.location) ? waypoint.location.map(numberValue).filter((value): value is number => value !== undefined) : []
  const coordinate = location.length >= 2 ? `${formatNumber(location[1], 5)}, ${formatNumber(location[0], 5)}` : ''
  return [name, coordinate].filter(Boolean).join(' · ') || '—'
}

export function OsrmRoutePreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const routes = recordArray(root.routes).slice(0, 3)
  const waypoints = recordArray(root.waypoints)
  const primary = routes[0]
  const primaryLegs = primary ? recordArray(primary.legs) : []
  const primarySteps = primaryLegs.flatMap((leg) => recordArray(leg.steps))
  const geometry = primary && isRecord(primary.geometry) ? primary.geometry : {}
  const geometryCoordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : []
  const start = routeWaypointLabel(waypoints[0])
  const destination = routeWaypointLabel(waypoints.at(-1))

  const cards: SemanticCard[] = routes.map((route, index) => {
    const legs = recordArray(route.legs)
    const steps = legs.flatMap((leg) => recordArray(leg.steps))
    const routeGeometry = isRecord(route.geometry) ? route.geometry : {}
    const coordinateCount = Array.isArray(routeGeometry.coordinates) ? routeGeometry.coordinates.length : 0
    return {
      title: routes.length === 1 ? 'Calculated route' : `Route ${index + 1}`,
      eyebrow: 'OSRM route service',
      badge: cleanText(route.weight_name) ?? undefined,
      description: index === 0 ? `Snapped from ${start} to ${destination}.` : 'Alternative route returned by the provider.',
      metrics: [
        { label: 'Distance', value: formatRouteDistance(route.distance) },
        { label: 'Estimated travel time', value: formatRouteDuration(route.duration) },
        { label: 'Route legs', value: String(legs.length) },
        { label: 'Turn steps', value: String(steps.length) },
        { label: 'Geometry points', value: String(coordinateCount) },
        { label: 'Weight', value: previewValue(route.weight) },
      ],
    }
  })

  if (!routes.length) return <div className="weather-empty"><strong>Route unavailable</strong><span>The response did not include a route result.</span></div>

  const shownSteps = primarySteps.slice(0, 40)
  return <div
    className="route-summary-preview"
    data-route-count={routes.length}
    data-primary-distance-m={numberValue(primary?.distance)}
    data-primary-duration-s={numberValue(primary?.duration)}
    data-primary-step-count={primarySteps.length}
    data-primary-geometry-point-count={geometryCoordinates.length}
    data-route-code={cleanText(root.code) ?? ''}
  >
    <SemanticCards cards={cards} emptyTitle="Route unavailable"/>
    <section className="route-step-panel" aria-labelledby="route-step-heading">
      <header><div><small>Primary route</small><h3 id="route-step-heading">Turn-by-turn steps</h3></div><span>{primarySteps.length} provider steps</span></header>
      <ol>{shownSteps.map((step, index) => {
        const maneuver = isRecord(step.maneuver) ? step.maneuver : {}
        const maneuverType = [cleanText(maneuver.type), cleanText(maneuver.modifier)].filter(Boolean).join(' · ') || 'Continue'
        const road = cleanText(step.name) || 'Unnamed road'
        return <li key={`${index}-${road}-${previewValue(step.distance)}`}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{maneuverType}</b><strong>{road}</strong><small>{formatRouteDistance(step.distance)} · {formatRouteDuration(step.duration)}</small></div></li>
      })}</ol>
      {primarySteps.length > shownSteps.length && <p>Showing the first {shownSteps.length} of {primarySteps.length} provider steps. Raw JSON retains the complete response.</p>}
    </section>
  </div>
}
