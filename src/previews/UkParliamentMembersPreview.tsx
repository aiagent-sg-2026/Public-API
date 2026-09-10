import { asRecord, CardEmpty, CardHeading, Facts, finite, rows, text } from './cardPrimitives'

const houseLabel = (value: unknown) => value === 1 ? 'House of Commons' : value === 2 ? 'House of Lords' : value === undefined || value === null ? 'House not supplied' : `House ${String(value)}`
const dateOnly = (value: unknown) => text(value)?.slice(0, 10)

export function UkParliamentMembersPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const items = rows(root.items)
  const members = items.map((item) => asRecord(item.value)).filter((member) => Object.keys(member).length > 0)
  if (!members.length) return <CardEmpty domain="parliament-members" title="No current Parliament members returned" detail="The UK Parliament Members API did not return any current Commons or Lords members for this search." state="empty"/>

  const totalResults = finite(root.totalResults)
  const take = finite(root.take)
  const skip = finite(root.skip)
  const first = members[0]
  return <div className="domain-card parliament-members-preview" data-domain-card="parliament-members" data-result-state="ready" data-row-count={members.length} data-total-results={totalResults} data-provider-take={take} data-provider-skip={skip} data-primary-member-id={finite(first.id)}>
    <CardHeading eyebrow="UK Parliament · Members API" title={`${members.length} current member${members.length === 1 ? '' : 's'} returned`} description="The search endpoint returns current members of the House of Commons or House of Lords. Constituency/location is shown only when the provider supplies it for the latest house membership."><span className="domain-state">{totalResults === undefined ? 'Current members' : `${totalResults} match${totalResults === 1 ? '' : 'es'} total`}</span></CardHeading>
    <div className="parliament-result-context" aria-label="Parliament search result context">
      <span><strong>{members.length}</strong> returned in this response</span>
      <span><strong>{take ?? 'Not supplied'}</strong> provider take</span>
      <span><strong>{skip ?? 'Not supplied'}</strong> provider skip</span>
    </div>
    <ol className="parliament-member-list" aria-label="Current UK Parliament members">
      {members.map((member, index) => {
        const party = asRecord(member.latestParty)
        const membership = asRecord(member.latestHouseMembership)
        const status = asRecord(membership.membershipStatus)
        const memberId = finite(member.id)
        const partyId = finite(party.id)
        const membershipFromId = finite(membership.membershipFromId)
        const displayName = text(member.nameDisplayAs) ?? text(member.nameFullTitle) ?? `Member ${index + 1}`
        const fullTitle = text(member.nameFullTitle)
        const partyName = text(party.name) ?? 'Party not supplied'
        const house = houseLabel(membership.house)
        const membershipFrom = text(membership.membershipFrom)
        const startDate = text(membership.membershipStartDate)
        const endDate = text(membership.membershipEndDate)
        const statusDescription = text(status.statusDescription) ?? (status.statusIsActive === true ? 'Current Member' : status.statusIsActive === false ? 'Inactive membership' : 'Status not supplied')
        return <li key={memberId ?? `${displayName}-${index}`} data-member-index={index + 1} data-member-id={memberId} data-party-id={partyId} data-house={membership.house} data-membership-from-id={membershipFromId} data-membership-status={statusDescription} data-membership-active={status.statusIsActive === undefined ? undefined : String(status.statusIsActive)}>
          <header><div><small>{house} · Member ID {memberId ?? 'not supplied'}</small><h4>{displayName}</h4>{fullTitle && fullTitle !== displayName && <p>{fullTitle}</p>}</div><span>{partyName}</span></header>
          <Facts items={[
            { label: 'Party', value: partyName },
            { label: 'Party abbreviation', value: text(party.abbreviation) ?? 'Not supplied' },
            { label: 'House', value: house },
            { label: 'Membership from', value: membershipFrom ?? 'Not supplied' },
            { label: 'Membership started', value: startDate ? <time dateTime={startDate}>{dateOnly(startDate)}</time> : 'Not supplied' },
            { label: 'Membership status', value: statusDescription },
            ...(endDate ? [{ label: 'Membership ended', value: <time dateTime={endDate}>{dateOnly(endDate)}</time> }] : []),
          ]}/>
        </li>
      })}
    </ol>
    <p className="domain-note">This is current-members search metadata. It does not infer parliamentary offices or roles, and it does not invent a constituency/location when the provider omits one.</p>
  </div>
}
