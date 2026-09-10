import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'uk-parliament-members')
if (!api) throw new Error('Missing UK Parliament fixture')

describe('UK Parliament members semantic preview', () => {
  afterEach(cleanup)

  it('preserves current-member identity, house membership, party, and provider pagination semantics', () => {
    render(<ResponseDemoPreview api={api} data={{
      items: [{ value: {
        id: 4483,
        nameDisplayAs: 'Rishi Sunak',
        nameFullTitle: 'Rt Hon Rishi Sunak MP',
        latestParty: { id: 4, name: 'Conservative', abbreviation: 'Con' },
        latestHouseMembership: {
          membershipFrom: 'Richmond and Northallerton', membershipFromId: 4259, house: 1,
          membershipStartDate: '2015-05-07T00:00:00', membershipEndDate: null,
          membershipStatus: { statusIsActive: true, statusDescription: 'Current Member', statusStartDate: '2024-07-04T00:00:00' },
        },
      } }], totalResults: 1, skip: 0, take: 3,
    }}/>)

    const preview = screen.getByRole('region', { name: 'UK Parliament Members' })
    expect(preview).toHaveAttribute('data-preview-layout', 'parliament-members')
    expect(preview).toHaveAttribute('data-ssot-fallback', 'false')
    const card = preview.querySelector('.parliament-members-preview')
    expect(card).toHaveAttribute('data-total-results', '1')
    expect(card).toHaveAttribute('data-provider-take', '3')
    const member = preview.querySelector('[data-member-id="4483"]')
    expect(member).toHaveAttribute('data-party-id', '4')
    expect(member).toHaveAttribute('data-house', '1')
    expect(member).toHaveAttribute('data-membership-from-id', '4259')
    expect(member).toHaveAttribute('data-membership-active', 'true')
    expect(preview).toHaveTextContent('Rishi Sunak')
    expect(preview).toHaveTextContent('House of Commons')
    expect(preview).toHaveTextContent('Richmond and Northallerton')
    expect(preview).toHaveTextContent('Current Member')
    expect(preview).not.toHaveTextContent('UK Parliament Members record 1')
  })

  it('does not invent a constituency/location when latest membership omits it', () => {
    render(<ResponseDemoPreview api={api} data={{ items: [{ value: {
      id: 99,
      nameDisplayAs: 'Example Peer',
      latestParty: { id: 8, name: 'Crossbench' },
      latestHouseMembership: { house: 2, membershipStartDate: '2020-01-01T00:00:00', membershipStatus: { statusIsActive: true, statusDescription: 'Current Member' } },
    } }], totalResults: 1, skip: 0, take: 1 }}/>)
    const preview = screen.getByRole('region', { name: 'UK Parliament Members' })
    expect(preview).toHaveTextContent('House of Lords')
    expect(preview).toHaveTextContent('Membership fromNot supplied')
  })
})
