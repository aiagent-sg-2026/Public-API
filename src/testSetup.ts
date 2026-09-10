// Unit semantic assertions intentionally preload preview bundles so direct ResponseDemoPreview renders stay synchronous.
// Production does not import this setup file; first-use browser loading still goes through React.lazy + Suspense.
import { preloadAllPreviewBundles } from './previews/previewBundles'

await preloadAllPreviewBundles()
