import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, text } from './cardPrimitives'

const yesNo = (value: unknown) => typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 'Not supplied'
const locationText = (city?: string, region?: string, country?: string) => [city, region, country].filter(Boolean).join(', ') || 'Location not supplied'
const coordinateText = (latitude?: number, longitude?: number) => latitude === undefined || longitude === undefined ? 'Not supplied' : `${numericText(latitude)}, ${numericText(longitude)}`

export function IpWhoisPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const success = root.success === true
  if (!success) {
    const message = text(root.message) ?? 'The provider did not return a successful IP geolocation result.'
    return <CardEmpty domain="ip-geolocation" title="IP lookup not completed" detail={`ipwho.is returned: ${message}`} state="invalid"/>
  }

  const connection = asRecord(root.connection)
  const timezone = asRecord(root.timezone)
  const ip = text(root.ip)
  if (!ip) return <CardEmpty domain="ip-geolocation" title="IP geolocation response is incomplete" detail="ipwho.is reported success but did not supply the queried IP address." state="invalid"/>

  const type = text(root.type)
  const country = text(root.country)
  const countryCode = text(root.country_code)
  const region = text(root.region)
  const regionCode = text(root.region_code)
  const city = text(root.city)
  const latitude = finite(root.latitude)
  const longitude = finite(root.longitude)
  const timezoneId = text(timezone.id)
  const timezoneUtc = text(timezone.utc)
  const asn = finite(connection.asn)
  const organization = text(connection.org)
  const isp = text(connection.isp)
  const networkDomain = text(connection.domain)

  return <div className="domain-card ipwhois-preview" data-domain-card="ip-geolocation" data-result-state="ready" data-primary-ip={ip} data-ip-type={type} data-country-code={countryCode} data-region-code={regionCode} data-latitude={latitude} data-longitude={longitude} data-timezone-id={timezoneId} data-asn={asn} data-isp={isp} data-geolocation-basis="approximate-network-derived">
    <CardHeading eyebrow="ipwho.is · IP geolocation" title={ip} description="Approximate network-derived geolocation and network ownership for this IP address. These coordinates are not device GPS or a precise personal address."><span className="domain-state">{type ?? 'IP type not supplied'}</span></CardHeading>
    <div className="ipwhois-summary">
      <section aria-labelledby="ipwhois-location-heading">
        <h4 id="ipwhois-location-heading">Approximate location</h4>
        <strong>{locationText(city, region, country)}</strong>
        <Facts items={[
          { label: 'Country code', value: countryCode ?? 'Not supplied' },
          { label: 'Region code', value: regionCode ?? 'Not supplied' },
          { label: 'Coordinates · WGS84 approximate', value: coordinateText(latitude, longitude) },
          { label: 'Postal code', value: text(root.postal) ?? 'Not supplied' },
          { label: 'Timezone', value: timezoneId ?? 'Not supplied' },
          { label: 'UTC offset', value: timezoneUtc ?? 'Not supplied' },
          { label: 'Daylight saving active', value: yesNo(timezone.is_dst) },
        ]}/>
      </section>
      <section aria-labelledby="ipwhois-network-heading">
        <h4 id="ipwhois-network-heading">Network identity</h4>
        <strong>{organization ?? isp ?? 'Network organization not supplied'}</strong>
        <Facts items={[
          { label: 'ASN', value: asn === undefined ? 'Not supplied' : `AS${numericText(asn)}` },
          { label: 'Organization', value: organization ?? 'Not supplied' },
          { label: 'ISP', value: isp ?? 'Not supplied' },
          { label: 'Network domain', value: networkDomain ?? 'Not supplied' },
          { label: 'Continent', value: text(root.continent) ?? 'Not supplied' },
          { label: 'EU-associated country', value: yesNo(root.is_eu) },
        ]}/>
      </section>
    </div>
    <p className="domain-note">The free ipwho.is endpoint allows 1,000 requests per day. For browser CORS traffic, the provider counts requests per domain, so Public-API shares that daily domain quota. IP geolocation is approximate and can reflect routing or network registration rather than a person's physical location.</p>
  </div>
}
