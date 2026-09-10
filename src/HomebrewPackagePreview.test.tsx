import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { apiCatalog } from './apiCatalog'
import { ResponseDemoPreview } from './responsePreview'

const api = apiCatalog.find((candidate) => candidate.id === 'homebrew-formula-json')
if (!api) throw new Error('Missing Homebrew fixture')

describe('Homebrew package semantic preview', () => {
  afterEach(cleanup)

  it('renders formula version, licence, bottle and dependency semantics', () => {
    render(<ResponseDemoPreview api={api} data={{ name: 'node', full_name: 'node', tap: 'homebrew/core', desc: 'JavaScript runtime', license: 'MIT', homepage: 'https://nodejs.org/', versions: { stable: '26.8.1', head: 'HEAD', bottle: true }, keg_only: false, dependencies: ['libuv', 'openssl@3'], build_dependencies: ['pkgconf'], uses_from_macos: ['python'], bottle: { stable: { files: { arm64_tahoe: {}, arm64_linux: {} } } } }}/>)
    const preview = screen.getByRole('region', { name: 'Homebrew Formula JSON' })
    expect(preview).toHaveAttribute('data-preview-layout', 'homebrew-package')
    const card = preview.querySelector('.homebrew-package-preview')
    expect(card).toHaveAttribute('data-package-kind', 'formula')
    expect(card).toHaveAttribute('data-package-name', 'node')
    expect(card).toHaveAttribute('data-version', '26.8.1')
    expect(card).toHaveAttribute('data-license', 'MIT')
    expect(card).toHaveAttribute('data-dependency-count', '2')
    expect(card).toHaveAttribute('data-bottle-platform-count', '2')
    expect(preview).toHaveTextContent('Runtime dependencies')
    expect(preview).toHaveTextContent('libuv')
    expect(preview).not.toHaveTextContent('Homebrew Formula JSON record 1')
  })

  it('keeps cask app artifacts and macOS requirements separate from formula dependencies', () => {
    render(<ResponseDemoPreview api={api} data={{ token: 'postman', full_token: 'postman', name: ['Postman'], desc: 'API development platform', homepage: 'https://www.postman.com/', version: '12.27.1', auto_updates: true, tap: 'homebrew/cask', depends_on: { macos: { '>=': ['11'] } }, artifacts: [{ uninstall: [{ quit: 'com.postmanlabs.mac' }] }, { app: ['Postman.app'], target: '/Applications/Postman.app' }, { zap: [{ trash: ['~/Library/Caches/Postman'] }] }], deprecated: false, disabled: false }}/>)
    const preview = screen.getByRole('region', { name: 'Homebrew Formula JSON' })
    const card = preview.querySelector('.homebrew-package-preview')
    expect(card).toHaveAttribute('data-package-kind', 'cask')
    expect(card).toHaveAttribute('data-package-token', 'postman')
    expect(card).toHaveAttribute('data-version', '12.27.1')
    expect(card).toHaveAttribute('data-auto-updates', 'true')
    expect(card).toHaveAttribute('data-macos-requirement', '>= 11')
    expect(card).toHaveAttribute('data-artifact-count', '3')
    expect(preview).toHaveTextContent('Postman.app')
    expect(preview).toHaveTextContent('Auto-updates')
    expect(preview).not.toHaveTextContent('Runtime dependencies')
  })
})
