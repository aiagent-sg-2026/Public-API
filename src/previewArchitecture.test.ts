import { describe, expect, it } from 'vitest'
import responsePreviewSource from './responsePreview.tsx?raw'
import previewBundlesSource from './previews/previewBundles.tsx?raw'
import appSource from './App.tsx?raw'
import previewLoadBoundarySource from './PreviewLoadBoundary.tsx?raw'
import diagnosticBundleSource from './previews/DiagnosticPreviewBundle.ts?raw'
import semanticBundleSource from './previews/SemanticPreviewBundle.ts?raw'
import scienceSemanticBundleSource from './previews/ScienceSemanticPreviewBundle.ts?raw'
import sportsSemanticBundleSource from './previews/SportsSemanticPreviewBundle.ts?raw'
import operationalBundleSource from './previews/OperationalPreviews.tsx?raw'
import catalogFamilyBundleSource from './previews/CatalogFamilyPreviews.tsx?raw'
import specializedCatalogBundleSource from './previews/SpecializedCatalogPreviews.tsx?raw'
import weatherBundleSource from './previews/WeatherPreviews.tsx?raw'
import marketBundleSource from './previews/MarketPreviews.tsx?raw'
import dateListSource from './previews/DateList.tsx?raw'
import semanticCardsSource from './previews/SemanticCards.tsx?raw'
import floodStationSource from './previews/FloodStationPreview.tsx?raw'


describe('response preview architecture', () => {
  it('keeps API-specific implementations behind on-demand preview bundles', () => {
    const previewFunctions = [...responsePreviewSource.matchAll(/(?:export\s+)?function\s+([A-Z][A-Za-z0-9]*Preview)\s*\(/g)]
      .map((match) => match[1])

    expect(previewFunctions).toEqual(['ResponseDemoPreview'])
    expect(responsePreviewSource).toContain("from './previews/previewBundles'")
    expect(responsePreviewSource).not.toMatch(/from '\.\/previews\/(?:CatalogFamilyPreviews|SpecializedCatalogPreviews|WeatherPreviews|OperationalPreviews|MarketPreviews|SemanticPreviewBundle|ScienceSemanticPreviewBundle|SportsSemanticPreviewBundle|DiagnosticPreviewBundle)'/)
    for (const bundle of ['CatalogFamilyPreviews', 'SpecializedCatalogPreviews', 'WeatherPreviews', 'OperationalPreviews', 'MarketPreviews', 'SemanticPreviewBundle', 'ScienceSemanticPreviewBundle', 'SportsSemanticPreviewBundle', 'DiagnosticPreviewBundle']) {
      expect(previewBundlesSource).toContain(`import('./${bundle}')`)
    }
    expect(previewBundlesSource).toContain("import { createElement, lazy, type ComponentType } from 'react'")
    expect(previewBundlesSource).toMatch(/const LazyPreview = lazy\(/)
    expect(previewBundlesSource).not.toContain('throw loadPreviewBundle(bundle)')
    expect(previewBundlesSource).toContain('resolvedBundles.get(bundle)')
    expect(previewBundlesSource).toContain('pendingBundles.delete(bundle)')
    expect(appSource).toContain('<PreviewLoadBoundary resetKey=')
    expect(appSource).toContain('<LazyResponseDemoPreview')
    expect(previewLoadBoundarySource).toContain('Semantic preview unavailable')
    expect(previewLoadBoundarySource).toContain('Reload application')
    expect(previewLoadBoundarySource).toContain('data-preview-load-state="error"')
  })

  it('keeps family-specific preview CSS behind the matching async bundle', () => {
    expect(responsePreviewSource).toContain("import './previews/domainCards.css'")
    expect(catalogFamilyBundleSource).toContain("import './catalogFamilyCards.css'")
    expect(specializedCatalogBundleSource).toContain("import './specializedCatalogCards.css'")
    expect(weatherBundleSource).toContain("import './weatherCards.css'")
    expect(marketBundleSource).toContain("import './marketCards.css'")
    expect(dateListSource).toContain("import './dateList.css'")
    expect(semanticCardsSource).toContain("import './semanticCards.css'")
    expect(weatherBundleSource).toContain("import './stationList.css'")
    expect(floodStationSource).toContain("import './stationList.css'")
    expect(responsePreviewSource).not.toContain('diagnosticCards.css')
    expect(responsePreviewSource).not.toContain('operationalCards.css')
    expect(responsePreviewSource).not.toContain('semanticDomainCards.css')

    expect(diagnosticBundleSource).toContain("import './diagnosticCards.css'")
    expect(operationalBundleSource).toContain("import './operationalCards.css'")
    expect(semanticBundleSource).toContain("import './semanticDomainCards.css'")
    for (const sciencePreview of ['DrugLabelPreview', 'FoodRecallPreview', 'RxNormDrugPreview', 'ProteinAnnotationPreview', 'PdbStructurePreview', 'ChemblMoleculePreview', 'PubChemCompoundPreview', 'EnsemblGenePreview']) {
      expect(semanticBundleSource).not.toContain(sciencePreview)
      expect(scienceSemanticBundleSource).toContain(`export { ${sciencePreview} }`)
    }
    expect(scienceSemanticBundleSource).toContain("import './scienceSemanticCards.css'")
    const sportsPreviews = ['JolpicaF1Preview', 'OpenDotaMatchesPreview', 'OpenLigaDbMatchesPreview', 'MlbSchedulePreview']
    for (const sportsPreview of sportsPreviews) {
      expect(semanticBundleSource).not.toContain(sportsPreview)
      expect(sportsSemanticBundleSource).toContain(`export { ${sportsPreview} }`)
    }
    expect(sportsSemanticBundleSource).toContain("import './sportsSemanticCards.css'")

  })

})
