import { asRecord, CardEmpty, CardHeading, CopyValue, Facts, text } from './cardPrimitives'

const ipFamily = (ip: string) => ip.includes(':') ? 'IPv6' : 'IPv4'

export function IpifyPublicIpPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const ip = text(root.ip)
  if (!ip) return <CardEmpty domain="public-ip" title="Public IP unavailable" detail="ipify did not return the expected public IP address field for this request." state="invalid"/>

  const family = ipFamily(ip)
  return <div className="domain-card ipify-public-ip-preview" data-domain-card="public-ip" data-result-state="ready" data-ip-family={family} data-public-ip={ip}>
    <CardHeading eyebrow="ipify · universal IPv4/IPv6 endpoint" title="Public network address" description="The address below is the public IP observed by ipify for this browser request. It is network identity only; this endpoint does not provide geolocation."><span className="domain-state">{family}</span></CardHeading>
    <Facts items={[
      { label: 'Public IP address', value: <code>{ip}</code> },
      { label: 'Address family', value: family },
      { label: 'Observation', value: 'Seen by the ipify request endpoint' },
    ]}/>
    <CopyValue label="public IP address" value={ip}/>
    <p className="domain-note">The value may identify a shared NAT, VPN, proxy, or other egress network rather than a specific device. Use a geolocation service only when location data is actually required.</p>
  </div>
}
