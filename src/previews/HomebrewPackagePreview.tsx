import { asRecord, CardEmpty, CardHeading, Facts, text } from './cardPrimitives'

const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
const yesNo = (value: unknown) => value === true ? 'Yes' : value === false ? 'No' : 'Not supplied'
const valueText = (value: unknown) => text(value) ?? (typeof value === 'number' && Number.isFinite(value) ? String(value) : 'Not supplied')

const macosRequirement = (dependsOn: Record<string, unknown>) => {
  const macos = asRecord(dependsOn.macos)
  const entry = Object.entries(macos)[0]
  if (!entry) return 'Not supplied'
  const [operator, raw] = entry
  const versions = stringArray(raw)
  return versions.length ? `${operator} ${versions.join(', ')}` : valueText(raw)
}

const artifactLabel = (artifact: Record<string, unknown>) => {
  for (const key of ['app', 'pkg', 'binary', 'installer', 'audio_unit_plugin', 'vst_plugin', 'vst3_plugin', 'qlplugin']) {
    const values = stringArray(artifact[key])
    if (values.length) return `${key.replaceAll('_', ' ')}: ${values.join(', ')}`
  }
  const keys = Object.keys(artifact).filter((key) => key !== 'target')
  return keys.length ? keys.join(', ') : 'Artifact metadata'
}

export function HomebrewPackagePreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  if (!Object.keys(root).length) return <CardEmpty domain="homebrew-package" title="Homebrew package metadata unavailable" detail="The API response did not include formula or cask metadata." state="empty"/>

  const caskToken = text(root.token)
  if (caskToken) {
    const names = stringArray(root.name)
    const token = caskToken ?? text(root.full_token) ?? 'Unknown cask'
    const displayName = names[0] ?? token
    const version = valueText(root.version)
    const requirement = macosRequirement(asRecord(root.depends_on))
    const artifacts = Array.isArray(root.artifacts) ? root.artifacts.map(asRecord).filter((entry) => Object.keys(entry).length > 0) : []
    const visibleArtifacts = artifacts.map(artifactLabel).filter((label) => !label.startsWith('uninstall') && !label.startsWith('zap')).slice(0, 8)
    return <div className="domain-card homebrew-package-preview" data-domain-card="homebrew-package" data-result-state="ready" data-package-kind="cask" data-package-token={token} data-package-name={displayName} data-version={version} data-auto-updates={String(root.auto_updates === true)} data-macos-requirement={requirement} data-artifact-count={artifacts.length}>
      <CardHeading eyebrow="Homebrew · cask metadata" title={displayName} description={text(root.desc) ?? 'Homebrew cask package metadata from the live JSON API.'}><span className="domain-state">Cask</span></CardHeading>
      <Facts items={[
        { label: 'Token', value: token }, { label: 'Version', value: version }, { label: 'Tap', value: valueText(root.tap) },
        { label: 'Auto-updates', value: yesNo(root.auto_updates) }, { label: 'macOS requirement', value: requirement },
        { label: 'Artifact entries', value: artifacts.length.toLocaleString('en') }, { label: 'Deprecated', value: yesNo(root.deprecated) }, { label: 'Disabled', value: yesNo(root.disabled) },
      ]}/>
      {text(root.homepage) && <p className="domain-note">Homepage: <code>{text(root.homepage)}</code></p>}
      {visibleArtifacts.length > 0 && <section aria-labelledby="homebrew-artifacts-heading"><h4 id="homebrew-artifacts-heading">Install artifacts</h4><ul>{visibleArtifacts.map((label) => <li key={label}><code>{label}</code></li>)}</ul></section>}
      <p className="domain-note">Cask metadata describes macOS application packaging. Auto-update and OS requirements are provider fields; uninstall/zap details remain in Raw JSON and are not presented as install dependencies.</p>
    </div>
  }

  const name = text(root.full_name) ?? text(root.name) ?? 'Unknown formula'
  const versions = asRecord(root.versions)
  const stableVersion = valueText(versions.stable)
  const dependencies = stringArray(root.dependencies)
  const buildDependencies = stringArray(root.build_dependencies)
  const macosDependencies = stringArray(root.uses_from_macos)
  const bottleFiles = Object.keys(asRecord(asRecord(asRecord(root.bottle).stable).files))
  return <div className="domain-card homebrew-package-preview" data-domain-card="homebrew-package" data-result-state="ready" data-package-kind="formula" data-package-name={name} data-version={stableVersion} data-license={text(root.license) ?? ''} data-dependency-count={dependencies.length} data-build-dependency-count={buildDependencies.length} data-bottle-platform-count={bottleFiles.length}>
    <CardHeading eyebrow="Homebrew · formula metadata" title={name} description={text(root.desc) ?? 'Homebrew formula package metadata from the live JSON API.'}><span className="domain-state">Formula</span></CardHeading>
    <Facts items={[
      { label: 'Stable version', value: stableVersion }, { label: 'Tap', value: valueText(root.tap) }, { label: 'Licence', value: valueText(root.license) },
      { label: 'Bottled', value: yesNo(versions.bottle) }, { label: 'Bottle platforms', value: bottleFiles.length.toLocaleString('en') }, { label: 'Keg-only', value: yesNo(root.keg_only) },
      { label: 'Runtime dependencies', value: dependencies.length.toLocaleString('en') }, { label: 'Build dependencies', value: buildDependencies.length.toLocaleString('en') },
    ]}/>
    {text(root.homepage) && <p className="domain-note">Homepage: <code>{text(root.homepage)}</code></p>}
    {dependencies.length > 0 && <section aria-labelledby="homebrew-dependencies-heading"><h4 id="homebrew-dependencies-heading">Runtime dependencies</h4><p>{dependencies.slice(0, 16).map((dependency) => <code key={dependency}>{dependency} </code>)}</p>{dependencies.length > 16 && <p className="domain-note">Showing 16 of {dependencies.length} runtime dependencies; Raw JSON retains the complete list.</p>}</section>}
    {macosDependencies.length > 0 && <p className="domain-note">Uses from macOS: {macosDependencies.join(', ')}.</p>}
    <p className="domain-note">Formula and cask JSON are different provider shapes. Formula dependencies, bottle availability, licence, and version are kept distinct from cask app artifacts and macOS requirements.</p>
  </div>
}
