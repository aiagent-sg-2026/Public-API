import './previews/domainCards.css'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { apiCatalog, type ApiDemo } from './apiCatalog'
import { getPreviewProfile, type PreviewLayout } from './previewProfiles'
import { uiText, type UiLocale, type UiMessageKey } from './i18n'
import { deferredPreview } from './previews/previewBundles'

export type { PreviewLayout } from './previewProfiles'
export { buildDemoPreview } from './previews/buildDemoPreview'

const familyPreview = (name: string) => deferredPreview('family', name)
const CalendarPreview = familyPreview('CalendarPreview')
const CrossrefWorksPreview = familyPreview('CrossrefWorksPreview')
const DeveloperFeedPreview = familyPreview('DeveloperFeedPreview')
const DictionaryEntryPreview = familyPreview('DictionaryEntryPreview')
const FederalRegisterPreview = familyPreview('FederalRegisterPreview')
const FloodForecastPreview = familyPreview('FloodForecastPreview')
const LocationPreview = familyPreview('LocationPreview')
const MediaGalleryPreview = familyPreview('MediaGalleryPreview')
const NaturalEventsPreview = familyPreview('NaturalEventsPreview')
const ResearchLibraryPreview = familyPreview('ResearchLibraryPreview')
const ResultListPreview = familyPreview('ResultListPreview')
const SecurityCenterPreview = familyPreview('SecurityCenterPreview')
const SolarCyclePreview = familyPreview('SolarCyclePreview')
const SpaceWeatherPreview = familyPreview('SpaceWeatherPreview')
const TransitBoardPreview = familyPreview('TransitBoardPreview')
const TriviaGamePreview = familyPreview('TriviaGamePreview')

const specializedPreview = (name: string) => deferredPreview('specialized', name)
const AnimeQuotePreview = specializedPreview('AnimeQuotePreview')
const BrazilPostcodePreview = specializedPreview('BrazilPostcodePreview')
const CarparkAvailabilityPreview = specializedPreview('CarparkAvailabilityPreview')
const ChessRatingsPreview = specializedPreview('ChessRatingsPreview')
const CountryPreview = specializedPreview('CountryPreview')
const DatamuseWordPreview = specializedPreview('DatamuseWordPreview')
const IpifyPublicIpPreview = specializedPreview('IpifyPublicIpPreview')
const CatFactPreview = specializedPreview('CatFactPreview')
const DndSpellPreview = specializedPreview('DndSpellPreview')
const FuelPricePreview = specializedPreview('FuelPricePreview')
const GbifTaxonomyPreview = specializedPreview('GbifTaxonomyPreview')
const GeneratedImagePreview = specializedPreview('GeneratedImagePreview')
const GoModuleVersionsPreview = specializedPreview('GoModuleVersionsPreview')
const HuggingFaceModelsPreview = specializedPreview('HuggingFaceModelsPreview')
const IconifySearchPreview = specializedPreview('IconifySearchPreview')
const HomebrewPackagePreview = specializedPreview('HomebrewPackagePreview')
const JsDelivrPackagePreview = specializedPreview('JsDelivrPackagePreview')
const LaunchSchedulePreview = specializedPreview('LaunchSchedulePreview')
const LichessLeaderboardPreview = specializedPreview('LichessLeaderboardPreview')
const MarineForecastPreview = specializedPreview('MarineForecastPreview')
const MetMuseumSearchPreview = specializedPreview('MetMuseumSearchPreview')
const NhtsaMakesPreview = specializedPreview('NhtsaMakesPreview')
const Open5eMonsterPreview = specializedPreview('Open5eMonsterPreview')
const NobelPrizePreview = specializedPreview('NobelPrizePreview')
const NewtonMathPreview = specializedPreview('NewtonMathPreview')
const OpenF1SessionsPreview = specializedPreview('OpenF1SessionsPreview')
const PoetryReaderPreview = specializedPreview('PoetryReaderPreview')
const StarWarsPeoplePreview = specializedPreview('StarWarsPeoplePreview')
const WiktionaryEntryPreview = specializedPreview('WiktionaryEntryPreview')

const weatherPreview = (name: string) => deferredPreview('weather', name)
const AirQualityForecastPreview = weatherPreview('AirQualityForecastPreview')
const AreaForecastPreview = weatherPreview('AreaForecastPreview')
const CurrentConditionsPreview = weatherPreview('CurrentConditionsPreview')
const FourDayForecastPreview = weatherPreview('FourDayForecastPreview')
const RegionalAirQualityPreview = weatherPreview('RegionalAirQualityPreview')
const StationReadingsPreview = weatherPreview('StationReadingsPreview')
const TwentyFourHourForecastPreview = weatherPreview('TwentyFourHourForecastPreview')
const UvIndexPreview = weatherPreview('UvIndexPreview')

const operationalPreview = (name: string) => deferredPreview('operational', name)
const FdicBankPreview = operationalPreview('FdicBankPreview')
const GleifLeiPreview = operationalPreview('GleifLeiPreview')
const MempoolFeePreview = operationalPreview('MempoolFeePreview')
const OsrmRoutePreview = operationalPreview('OsrmRoutePreview')
const RdapDomainPreview = operationalPreview('RdapDomainPreview')

const marketPreview = (name: string) => deferredPreview('market', name)
const MarketPreview = marketPreview('MarketPreview')
const OpenMeteoClimatePreview = marketPreview('OpenMeteoClimatePreview')

const semanticPreview = (name: string) => deferredPreview('semantic', name)
const scienceSemanticPreview = (name: string) => deferredPreview('science-semantic', name)
const DrugLabelPreview = scienceSemanticPreview('DrugLabelPreview')
const FoodRecallPreview = scienceSemanticPreview('FoodRecallPreview')
const PrayerTimesPreview = semanticPreview('PrayerTimesPreview')
const RxNormDrugPreview = scienceSemanticPreview('RxNormDrugPreview')
const TideWaterLevelPreview = semanticPreview('TideWaterLevelPreview')
const ProteinAnnotationPreview = scienceSemanticPreview('ProteinAnnotationPreview')
const PdbStructurePreview = scienceSemanticPreview('PdbStructurePreview')
const ChemblMoleculePreview = scienceSemanticPreview('ChemblMoleculePreview')
const PubChemCompoundPreview = scienceSemanticPreview('PubChemCompoundPreview')
const CarbonIntensityPreview = semanticPreview('CarbonIntensityPreview')
const EnsemblGenePreview = scienceSemanticPreview('EnsemblGenePreview')
const ElevationPreview = semanticPreview('ElevationPreview')
const FloodStationPreview = semanticPreview('FloodStationPreview')
const UsgsWaterPreview = semanticPreview('UsgsWaterPreview')
const EurostatPopulationPreview = semanticPreview('EurostatPopulationPreview')
const RefugeePopulationPreview = semanticPreview('RefugeePopulationPreview')
const FemaDisasterPreview = semanticPreview('FemaDisasterPreview')
const MalaysiaCoreCpiPreview = semanticPreview('MalaysiaCoreCpiPreview')
const FoodHygienePreview = semanticPreview('FoodHygienePreview')
const MalaysiaHouseholdIncomePreview = semanticPreview('MalaysiaHouseholdIncomePreview')
const MalaysiaPopulationPreview = semanticPreview('MalaysiaPopulationPreview')
const HumanitarianEventPreview = semanticPreview('HumanitarianEventPreview')
const UnSdgGoalsPreview = semanticPreview('UnSdgGoalsPreview')
const CelestrakSatellitesPreview = semanticPreview('CelestrakSatellitesPreview')
const ObisOccurrencePreview = semanticPreview('ObisOccurrencePreview')
const WormsSpeciesPreview = semanticPreview('WormsSpeciesPreview')
const PaleobiodbTaxonPreview = semanticPreview('PaleobiodbTaxonPreview')
const IpWhoisPreview = semanticPreview('IpWhoisPreview')
const GeoBoundariesPreview = semanticPreview('GeoBoundariesPreview')
const WikidataEntityPreview = semanticPreview('WikidataEntityPreview')
const OpenCitationsPreview = semanticPreview('OpenCitationsPreview')
const UkParliamentMembersPreview = semanticPreview('UkParliamentMembersPreview')
const CanadaOpenDataPreview = semanticPreview('CanadaOpenDataPreview')
const sportsSemanticPreview = (name: string) => deferredPreview('sports-semantic', name)
const JolpicaF1Preview = sportsSemanticPreview('JolpicaF1Preview')
const OpenDotaMatchesPreview = sportsSemanticPreview('OpenDotaMatchesPreview')
const OpenLigaDbMatchesPreview = sportsSemanticPreview('OpenLigaDbMatchesPreview')
const MlbSchedulePreview = sportsSemanticPreview('MlbSchedulePreview')

const FederalAgencyOverviewPreview = semanticPreview('FederalAgencyOverviewPreview')
const FederalAwardsPreview = semanticPreview('FederalAwardsPreview')

const diagnosticPreview = (name: string) => deferredPreview('diagnostic', name)
const ScorecardPreview = diagnosticPreview('ScorecardPreview')
const GrammarPreview = diagnosticPreview('GrammarPreview')
const RecallsPreview = diagnosticPreview('RecallsPreview')
const ColorPreview = diagnosticPreview('ColorPreview')
const DnsPreview = diagnosticPreview('DnsPreview')
const DownloadsPreview = diagnosticPreview('DownloadsPreview')
const LifecyclePreview = diagnosticPreview('LifecyclePreview')
const ExchangeRateApiPreview = diagnosticPreview('ExchangeRateApiPreview')
const CoinbaseRatesPreview = diagnosticPreview('CoinbaseRatesPreview')
const VatcomplyRatesPreview = diagnosticPreview('VatcomplyRatesPreview')

export type WeatherPreviewVariant = 'current' | 'four-day' | 'twenty-four-hour' | 'area-forecast' | 'station-readings' | 'regional-air-quality' | 'air-quality-forecast' | 'uv-index'

const stationWeatherIds = ['data-gov-air-temperature', 'data-gov-rainfall', 'data-gov-relative-humidity', 'data-gov-wind-direction', 'data-gov-wind-speed']

export function selectWeatherPreviewVariant(api: Pick<ApiDemo, 'id'>): WeatherPreviewVariant {
  if (api.id === 'open-meteo-air-quality') return 'air-quality-forecast'
  if (api.id === 'data-gov-4day-forecast') return 'four-day'
  if (api.id === 'data-gov-24hr-forecast') return 'twenty-four-hour'
  if (api.id === 'data-gov-forecast-2hr') return 'area-forecast'
  if (stationWeatherIds.includes(api.id)) return 'station-readings'
  if (['data-gov-pm25', 'data-gov-psi'].includes(api.id)) return 'regional-air-quality'
  if (api.id === 'data-gov-uv-index') return 'uv-index'
  return 'current'
}
export type SsotRuntimeMeta = { httpStatus: number; elapsed: number; size: number }
const formatResponseBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`

export function selectPreviewLayout(api: Pick<ApiDemo, 'id' | 'category'>): PreviewLayout {
  return getPreviewProfile(api.id)?.layout ?? 'result-list'
}

type ApiPreviewProps = { api: ApiDemo; data: unknown; requestUrl?: string }
export type ApiPreviewComponent = (props: ApiPreviewProps) => ReactElement

const componentName = (id: string) => `${id.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('')}Preview`

const defineApiPreview = (id: string, render: (props: ApiPreviewProps) => ReactElement): ApiPreviewComponent => {
  const Component = ({ api, data, requestUrl }: ApiPreviewProps) => <div
    className={`api-specific-preview api-specific-${id}`}
    data-api-preview-component={id}
    data-visual-signature={componentName(id)}
    data-card-design="api-owned-v2"
    aria-label={`${api.name} visual component`}
  >{render({ api, data, requestUrl })}</div>
  Object.defineProperty(Component, 'name', { value: componentName(id) })
  return Component
}

// Every catalog item owns a distinct React component function. Components may
// compose the low-level chart, metric, gallery, map, and timeline primitives
// above, but no catalog item is dispatched through a family-level component.
export const apiPreviewComponents: Partial<Record<string, ApiPreviewComponent>> = {
  countries: defineApiPreview('countries', ({ api, data }) => <CountryPreview api={api} data={data}/>),
  weather: defineApiPreview('weather', ({ api, data }) => <CurrentConditionsPreview api={api} data={data}/>),
  people: defineApiPreview('people', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  dogs: defineApiPreview('dogs', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  posts: defineApiPreview('posts', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  holidays: defineApiPreview('holidays', ({ api, data }) => <CalendarPreview api={api} data={data}/>),
  'geocoding-search': defineApiPreview('geocoding-search', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'aladhan-prayer-times': defineApiPreview('aladhan-prayer-times', ({ data }) => <PrayerTimesPreview data={data}/>),
  'open-meteo-air-quality': defineApiPreview('open-meteo-air-quality', ({ api, data }) => <AirQualityForecastPreview data={data}/>),
  'sunrise-sunset': defineApiPreview('sunrise-sunset', ({ data }) => <SolarCyclePreview data={data}/>),
  'nasa-eonet-events': defineApiPreview('nasa-eonet-events', ({ data }) => <NaturalEventsPreview data={data}/>),
  'mbta-transit-routes': defineApiPreview('mbta-transit-routes', ({ data }) => <TransitBoardPreview data={data}/>),
  'open-trivia': defineApiPreview('open-trivia', ({ data }) => <TriviaGamePreview data={data}/>),
  'carbon-intensity-gb': defineApiPreview('carbon-intensity-gb', ({ data }) => <CarbonIntensityPreview data={data}/>),
  'open-meteo-elevation': defineApiPreview('open-meteo-elevation', ({ data, requestUrl }) => <ElevationPreview data={data} requestUrl={requestUrl}/>),
  'data-gov-24hr-forecast': defineApiPreview('data-gov-24hr-forecast', ({ data }) => <TwentyFourHourForecastPreview data={data}/>),
  'data-gov-4day-forecast': defineApiPreview('data-gov-4day-forecast', ({ data }) => <FourDayForecastPreview data={data}/>),
  'data-gov-air-temperature': defineApiPreview('data-gov-air-temperature', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-carpark': defineApiPreview('data-gov-carpark', ({ data }) => <CarparkAvailabilityPreview data={data}/>),
  'data-gov-forecast-2hr': defineApiPreview('data-gov-forecast-2hr', ({ data }) => <AreaForecastPreview data={data}/>),
  'data-gov-pm25': defineApiPreview('data-gov-pm25', ({ api, data }) => <RegionalAirQualityPreview api={api} data={data}/>),
  'data-gov-psi': defineApiPreview('data-gov-psi', ({ api, data }) => <RegionalAirQualityPreview api={api} data={data}/>),
  'data-gov-rainfall': defineApiPreview('data-gov-rainfall', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-relative-humidity': defineApiPreview('data-gov-relative-humidity', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-taxi': defineApiPreview('data-gov-taxi', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'data-gov-traffic-images': defineApiPreview('data-gov-traffic-images', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'data-gov-uv-index': defineApiPreview('data-gov-uv-index', ({ data }) => <UvIndexPreview data={data}/>),
  'data-gov-wind-direction': defineApiPreview('data-gov-wind-direction', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-gov-wind-speed': defineApiPreview('data-gov-wind-speed', ({ api, data }) => <StationReadingsPreview api={api} data={data}/>),
  'data-usa': defineApiPreview('data-usa', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  devto: defineApiPreview('devto', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'fiscal-data-treasury': defineApiPreview('fiscal-data-treasury', ({ data }) => <FederalAgencyOverviewPreview data={data}/>),
  github: defineApiPreview('github', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'hacker-news': defineApiPreview('hacker-news', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'ipify-public-ip': defineApiPreview('ipify-public-ip', ({ data }) => <IpifyPublicIpPreview data={data}/>),
  'met-museum-object-detail': defineApiPreview('met-museum-object-detail', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'met-museum-search': defineApiPreview('met-museum-search', ({ data }) => <MetMuseumSearchPreview data={data}/>),
  'nhtsa-vpic': defineApiPreview('nhtsa-vpic', ({ data }) => <NhtsaMakesPreview data={data}/>),
  'nhtsa-vehicle-recalls': defineApiPreview('nhtsa-vehicle-recalls', ({ data, requestUrl }) => <RecallsPreview data={data} requestUrl={requestUrl}/>),
  'npm-search': defineApiPreview('npm-search', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'nvd-cpe-search': defineApiPreview('nvd-cpe-search', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'nvd-cve-detail': defineApiPreview('nvd-cve-detail', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'nvd-cves': defineApiPreview('nvd-cves', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'nvd-recent-cves': defineApiPreview('nvd-recent-cves', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'postcodes-io': defineApiPreview('postcodes-io', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'pypi-json': defineApiPreview('pypi-json', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'stack-exchange': defineApiPreview('stack-exchange', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'uk-bank-holidays': defineApiPreview('uk-bank-holidays', ({ api, data }) => <CalendarPreview api={api} data={data}/>),
  'hebcal-calendar': defineApiPreview('hebcal-calendar', ({ api, data }) => <CalendarPreview api={api} data={data}/>),
  usaspending: defineApiPreview('usaspending', ({ data }) => <FederalAwardsPreview data={data}/>),
  usgs: defineApiPreview('usgs', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'wikidata-sparql': defineApiPreview('wikidata-sparql', ({ data }) => <WikidataEntityPreview data={data}/>),
  'openssf-scorecard': defineApiPreview('openssf-scorecard', ({ data }) => <ScorecardPreview data={data}/>),
  'opencitations-index': defineApiPreview('opencitations-index', ({ data, requestUrl }) => <OpenCitationsPreview data={data} requestUrl={requestUrl}/>),
  'world-bank-gdp': defineApiPreview('world-bank-gdp', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'world-bank-population': defineApiPreview('world-bank-population', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'frankfurter-sgd-myr-history': defineApiPreview('frankfurter-sgd-myr-history', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'open-library-search': defineApiPreview('open-library-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'free-dictionary': defineApiPreview('free-dictionary', ({ data }) => <DictionaryEntryPreview data={data}/>),
  pokeapi: defineApiPreview('pokeapi', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'art-institute-search': defineApiPreview('art-institute-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'tvmaze-search': defineApiPreview('tvmaze-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'open-food-facts': defineApiPreview('open-food-facts', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'gbif-species-search': defineApiPreview('gbif-species-search', ({ data }) => <GbifTaxonomyPreview data={data}/>),
  'clinical-trials-search': defineApiPreview('clinical-trials-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'europe-pmc-search': defineApiPreview('europe-pmc-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'openfda-drug-labels': defineApiPreview('openfda-drug-labels', ({ data }) => <DrugLabelPreview data={data}/>),
  'coinpaprika-ticker': defineApiPreview('coinpaprika-ticker', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'malaysia-fuel-price': defineApiPreview('malaysia-fuel-price', ({ data }) => <FuelPricePreview data={data}/>),
  'open-meteo-marine': defineApiPreview('open-meteo-marine', ({ data }) => <MarineForecastPreview data={data}/>),
  'nobel-prizes': defineApiPreview('nobel-prizes', ({ data }) => <NobelPrizePreview data={data}/>),
  'chess-player-stats': defineApiPreview('chess-player-stats', ({ data }) => <ChessRatingsPreview data={data}/>),
  'crossref-works': defineApiPreview('crossref-works', ({ data }) => <CrossrefWorksPreview data={data}/>),
  'noaa-space-weather': defineApiPreview('noaa-space-weather', ({ data }) => <SpaceWeatherPreview data={data}/>),
  'osv-vulnerability': defineApiPreview('osv-vulnerability', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'federal-register-documents': defineApiPreview('federal-register-documents', ({ data }) => <FederalRegisterPreview data={data}/>),
  'wikipedia-search': defineApiPreview('wikipedia-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'open-meteo-flood': defineApiPreview('open-meteo-flood', ({ data }) => <FloodForecastPreview data={data}/>),
  'open-meteo-history': defineApiPreview('open-meteo-history', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'kraken-public-ticker': defineApiPreview('kraken-public-ticker', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'gitlab-public-projects': defineApiPreview('gitlab-public-projects', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'uk-police-street-crime': defineApiPreview('uk-police-street-crime', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'open-brewery-directory': defineApiPreview('open-brewery-directory', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'rick-morty-characters': defineApiPreview('rick-morty-characters', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'wikimedia-pageviews': defineApiPreview('wikimedia-pageviews', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'vam-collections': defineApiPreview('vam-collections', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'openf1-historical': defineApiPreview('openf1-historical', ({ data }) => <OpenF1SessionsPreview data={data}/>),
  'irail-liveboard': defineApiPreview('irail-liveboard', ({ data }) => <TransitBoardPreview data={data}/>),
  'spaceflight-news': defineApiPreview('spaceflight-news', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'launch-library-upcoming': defineApiPreview('launch-library-upcoming', ({ data }) => <LaunchSchedulePreview data={data}/>),
  'wiktionary-entry': defineApiPreview('wiktionary-entry', ({ data }) => <WiktionaryEntryPreview data={data}/>),
  'animechan-random-quote': defineApiPreview('animechan-random-quote', ({ data }) => <AnimeQuotePreview data={data}/>),
  'jokeapi-safe': defineApiPreview('jokeapi-safe', ({ data }) => <TriviaGamePreview data={data}/>),
  'dummyjson-recipes': defineApiPreview('dummyjson-recipes', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'brasilapi-postcode': defineApiPreview('brasilapi-postcode', ({ data }) => <BrazilPostcodePreview data={data}/>),
  'poetrydb-poems': defineApiPreview('poetrydb-poems', ({ data }) => <PoetryReaderPreview data={data}/>),
  'coingecko-keyless-market': defineApiPreview('coingecko-keyless-market', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'swapi-people': defineApiPreview('swapi-people', ({ data }) => <StarWarsPeoplePreview data={data}/>),
  'google-dns-doh': defineApiPreview('google-dns-doh', ({ data }) => <DnsPreview data={data}/>),
  'color-api': defineApiPreview('color-api', ({ data }) => <ColorPreview data={data}/>),
  'nasa-image-search': defineApiPreview('nasa-image-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'lichess-top-players': defineApiPreview('lichess-top-players', ({ data }) => <LichessLeaderboardPreview data={data}/>),
  'pubmed-search': defineApiPreview('pubmed-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'rxnorm-drug-search': defineApiPreview('rxnorm-drug-search', ({ data, requestUrl }) => <RxNormDrugPreview data={data} requestUrl={requestUrl}/>),
  'inaturalist-observations': defineApiPreview('inaturalist-observations', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'first-epss': defineApiPreview('first-epss', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'endoflife-date': defineApiPreview('endoflife-date', ({ data }) => <LifecyclePreview data={data}/>),
  'deps-dev': defineApiPreview('deps-dev', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'ecb-fx-rates': defineApiPreview('ecb-fx-rates', ({ data }) => <CoinbaseRatesPreview data={data}/>),
  'un-sdg-goals': defineApiPreview('un-sdg-goals', ({ data }) => <UnSdgGoalsPreview data={data}/>),
  'datacite-search': defineApiPreview('datacite-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'ror-search': defineApiPreview('ror-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'celestrak-satellites': defineApiPreview('celestrak-satellites', ({ data, requestUrl }) => <CelestrakSatellitesPreview data={data} requestUrl={requestUrl}/>),
  'cleveland-museum-search': defineApiPreview('cleveland-museum-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'scryfall-card-search': defineApiPreview('scryfall-card-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'dnd5e-spell-lookup': defineApiPreview('dnd5e-spell-lookup', ({ data }) => <DndSpellPreview data={data}/>),
  'qr-code-generator': defineApiPreview('qr-code-generator', ({ api, requestUrl }) => <GeneratedImagePreview api={api} requestUrl={requestUrl}/>),
  'where-the-iss-at': defineApiPreview('where-the-iss-at', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'eurostat-population': defineApiPreview('eurostat-population', ({ data }) => <EurostatPopulationPreview data={data}/>),
  'bls-timeseries': defineApiPreview('bls-timeseries', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'fema-disasters': defineApiPreview('fema-disasters', ({ data }) => <FemaDisasterPreview data={data}/>),
  'noaa-tides': defineApiPreview('noaa-tides', ({ data, requestUrl }) => <TideWaterLevelPreview data={data} requestUrl={requestUrl}/>),
  'rdap-domain-lookup': defineApiPreview('rdap-domain-lookup', ({ data }) => <RdapDomainPreview data={data}/>),
  'languagetool-grammar-check': defineApiPreview('languagetool-grammar-check', ({ data }) => <GrammarPreview data={data}/>),
  'zenodo-search': defineApiPreview('zenodo-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'doaj-search': defineApiPreview('doaj-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'pubchem-compound': defineApiPreview('pubchem-compound', ({ data }) => <PubChemCompoundPreview data={data}/>),
  'chembl-molecule': defineApiPreview('chembl-molecule', ({ data }) => <ChemblMoleculePreview data={data}/>),
  'uniprot-protein': defineApiPreview('uniprot-protein', ({ data }) => <ProteinAnnotationPreview data={data}/>),
  'rcsb-pdb-entry': defineApiPreview('rcsb-pdb-entry', ({ data }) => <PdbStructurePreview data={data}/>),
  'ensembl-gene-lookup': defineApiPreview('ensembl-gene-lookup', ({ data }) => <EnsemblGenePreview data={data}/>),
  'obis-marine-occurrences': defineApiPreview('obis-marine-occurrences', ({ data, requestUrl }) => <ObisOccurrencePreview data={data} requestUrl={requestUrl}/>),
  'worms-species-lookup': defineApiPreview('worms-species-lookup', ({ data, requestUrl }) => <WormsSpeciesPreview data={data} requestUrl={requestUrl}/>),
  'paleobiodb-taxa': defineApiPreview('paleobiodb-taxa', ({ data, requestUrl }) => <PaleobiodbTaxonPreview data={data} requestUrl={requestUrl}/>),
  'usgs-water-legacy': defineApiPreview('usgs-water-legacy', ({ data }) => <UsgsWaterPreview data={data}/>),
  'rubygems-lookup': defineApiPreview('rubygems-lookup', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'nuget-package-lookup': defineApiPreview('nuget-package-lookup', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'internet-archive-search': defineApiPreview('internet-archive-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'ipwhois-lookup': defineApiPreview('ipwhois-lookup', ({ data }) => <IpWhoisPreview data={data}/>),
  'newton-math-solver': defineApiPreview('newton-math-solver', ({ data }) => <NewtonMathPreview data={data}/>),
  'datamuse-rhymes': defineApiPreview('datamuse-rhymes', ({ data, requestUrl }) => <DatamuseWordPreview data={data} requestUrl={requestUrl}/>),
  'open5e-monster-search': defineApiPreview('open5e-monster-search', ({ data }) => <Open5eMonsterPreview data={data}/>),
  'dicebear-avatar': defineApiPreview('dicebear-avatar', ({ api, requestUrl }) => <GeneratedImagePreview api={api} requestUrl={requestUrl}/>),
  'catfacts': defineApiPreview('catfacts', ({ data }) => <CatFactPreview data={data}/>),
  'randomfox-photo': defineApiPreview('randomfox-photo', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'anilist-graphql': defineApiPreview('anilist-graphql', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'openverse-search': defineApiPreview('openverse-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'apple-itunes-search': defineApiPreview('apple-itunes-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'packagist-search': defineApiPreview('packagist-search', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'jolpica-f1': defineApiPreview('jolpica-f1', ({ data }) => <JolpicaF1Preview data={data}/>),
  'hn-search-algolia': defineApiPreview('hn-search-algolia', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'bank-of-canada-valet': defineApiPreview('bank-of-canada-valet', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'swiss-transit-connections': defineApiPreview('swiss-transit-connections', ({ api, data }) => <TransitBoardPreview data={data}/>),
  'nasa-power-climate': defineApiPreview('nasa-power-climate', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'zippopotam-postcode': defineApiPreview('zippopotam-postcode', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'malaysia-core-cpi': defineApiPreview('malaysia-core-cpi', ({ data }) => <MalaysiaCoreCpiPreview data={data}/>),
  'malaysia-household-income': defineApiPreview('malaysia-household-income', ({ data }) => <MalaysiaHouseholdIncomePreview data={data}/>),
  'malaysia-population': defineApiPreview('malaysia-population', ({ data }) => <MalaysiaPopulationPreview data={data}/>),
  'openfda-food-recalls': defineApiPreview('openfda-food-recalls', ({ data }) => <FoodRecallPreview data={data}/>),
  'iconify-search': defineApiPreview('iconify-search', ({ data }) => <IconifySearchPreview data={data}/>),
  'homebrew-formula-json': defineApiPreview('homebrew-formula-json', ({ data }) => <HomebrewPackagePreview data={data}/>),
  'npm-download-counts': defineApiPreview('npm-download-counts', ({ data }) => <DownloadsPreview data={data}/>),
  'geoboundaries-admin-boundaries': defineApiPreview('geoboundaries-admin-boundaries', ({ data }) => <GeoBoundariesPreview data={data}/>),
  'osrm-route': defineApiPreview('osrm-route', ({ data }) => <OsrmRoutePreview data={data}/>),
  'opendota-pro-matches': defineApiPreview('opendota-pro-matches', ({ data }) => <OpenDotaMatchesPreview data={data}/>),
  'openligadb-matches': defineApiPreview('openligadb-matches', ({ data }) => <OpenLigaDbMatchesPreview data={data}/>),
  'uk-parliament-members': defineApiPreview('uk-parliament-members', ({ data }) => <UkParliamentMembersPreview data={data}/>),
  'mlb-stats-api': defineApiPreview('mlb-stats-api', ({ data }) => <MlbSchedulePreview data={data}/>),
  'gleif-lei': defineApiPreview('gleif-lei', ({ data }) => <GleifLeiPreview data={data}/>),
  'fdic-bankfind': defineApiPreview('fdic-bankfind', ({ data }) => <FdicBankPreview data={data}/>),
  'uk-food-hygiene': defineApiPreview('uk-food-hygiene', ({ data }) => <FoodHygienePreview data={data}/>),
  'uk-flood-monitoring': defineApiPreview('uk-flood-monitoring', ({ data, requestUrl }) => <FloodStationPreview data={data} requestUrl={requestUrl}/>),
  'unhcr-refugees': defineApiPreview('unhcr-refugees', ({ data }) => <RefugeePopulationPreview data={data}/>),
  'hdx-humanitarian-datasets': defineApiPreview('hdx-humanitarian-datasets', ({ data }) => <HumanitarianEventPreview data={data}/>),
  'open-meteo-climate': defineApiPreview('open-meteo-climate', ({ data, requestUrl }) => <OpenMeteoClimatePreview data={data} requestUrl={requestUrl}/>),
  'models-dev': defineApiPreview('models-dev', ({ data }) => <HuggingFaceModelsPreview data={data}/>),
  'vatcomply': defineApiPreview('vatcomply', ({ data }) => <VatcomplyRatesPreview data={data}/>),
  'mempool-space-btc': defineApiPreview('mempool-space-btc', ({ data }) => <MempoolFeePreview data={data}/>),
  'metacpan': defineApiPreview('metacpan', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'hexpm': defineApiPreview('hexpm', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'pub-dev': defineApiPreview('pub-dev', ({ api, data }) => <DeveloperFeedPreview api={api} data={data}/>),
  'go-module-proxy': defineApiPreview('go-module-proxy', ({ data }) => <GoModuleVersionsPreview data={data}/>),
  'flathub-appstream': defineApiPreview('flathub-appstream', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'github-global-advisories': defineApiPreview('github-global-advisories', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
  'dblp-search': defineApiPreview('dblp-search', ({ api, data }) => <ResearchLibraryPreview api={api} data={data}/>),
  'citybikes-network': defineApiPreview('citybikes-network', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'wikimedia-commons-search': defineApiPreview('wikimedia-commons-search', ({ api, data }) => <MediaGalleryPreview api={api} data={data}/>),
  'nominatim-search': defineApiPreview('nominatim-search', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'jsdelivr-package': defineApiPreview('jsdelivr-package', ({ api, data, requestUrl }) => <JsDelivrPackagePreview api={api} data={data} requestUrl={requestUrl}/>),
  'canada-open-data-search': defineApiPreview('canada-open-data-search', ({ data }) => <CanadaOpenDataPreview data={data}/>),
  'gbif-occurrence-search': defineApiPreview('gbif-occurrence-search', ({ api, data }) => <LocationPreview api={api} data={data}/>),
  'open-meteo-ensemble': defineApiPreview('open-meteo-ensemble', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'world-bank-indicator-explorer': defineApiPreview('world-bank-indicator-explorer', ({ api, data }) => <MarketPreview api={api} data={data}/>),
  'exchange-rate-current': defineApiPreview('exchange-rate-current', ({ data }) => <ExchangeRateApiPreview data={data}/>),
  'circl-vulnerability': defineApiPreview('circl-vulnerability', ({ api, data }) => <SecurityCenterPreview api={api} data={data}/>),
}

export const apiPreviewComponentIds = Object.keys(apiPreviewComponents)


export type ApiSsotCardDefinition = {
  id: string
  layout: PreviewLayout
  label: string
  Component: ApiPreviewComponent
  source: 'live-response'
  fallbackPolicy: 'forbidden'
}

export const apiSsotCardRegistry: Partial<Record<string, ApiSsotCardDefinition>> = Object.fromEntries(apiCatalog.map((api) => {
  const profile = getPreviewProfile(api.id)
  const Component = apiPreviewComponents[api.id]
  if (!profile || !Component) throw new Error(`Missing SSOT card definition for ${api.id}`)
  return [api.id, {
    id: api.id,
    layout: profile.layout,
    label: profile.label,
    Component,
    source: 'live-response' as const,
    fallbackPolicy: 'forbidden' as const,
  }]
}))

export const apiSsotCardIds = Object.keys(apiSsotCardRegistry)

const previewMeta: Record<PreviewLayout, { icon: string; eyebrow: string; title: string; description: string }> = {
  'security-scorecard': { icon: '◇', eyebrow: 'Security practices', title: 'Repository check evidence', description: 'Individual scored and inconclusive security checks.' },
  'grammar-review': { icon: 'Aa', eyebrow: 'Writing review', title: 'Grammar findings', description: 'Context, explanations and suggested replacements.' },
  'vehicle-recalls': { icon: '!', eyebrow: 'Vehicle recalls', title: 'Recall campaigns', description: 'Complete defect, consequence and remedy information.' },
  'color-swatch': { icon: '◐', eyebrow: 'Color specification', title: 'Color workbench', description: 'A color swatch with full color-space specifications.' },
  'carbon-intensity': { icon: 'CO₂', eyebrow: 'Electricity emissions', title: 'Great Britain carbon intensity', description: 'Current half-hour forecast and estimated actual carbon intensity from NESO.' },
  'terrain-elevation': { icon: '△', eyebrow: 'Terrain elevation', title: 'Coordinate elevation', description: 'Copernicus GLO-90 terrain elevation paired with the WGS84 coordinate that produced the response.' },
  'flood-stations': { icon: '≈', eyebrow: 'River monitoring', title: 'Environment Agency stations', description: 'Matching monitoring stations with exact river identity, location, status, catchment, and available measurement types.' },
  'water-gauge': { icon: '≈', eyebrow: 'Water monitoring', title: 'Latest USGS observation', description: 'Latest continuous streamflow or gage-height observation with status, units, time, and location context.' },
  'population-statistic': { icon: 'Σ', eyebrow: 'Official population statistics', title: 'Eurostat population', description: 'Population on 1 January with explicit geography, year, unit, age, sex, and frequency dimensions.' },
  'refugee-population': { icon: '↔', eyebrow: 'Forced displacement', title: 'UNHCR year-end population', description: 'Origin-country displacement and return populations with explicit ISO identity and reporting year.' },
  'disaster-declared-areas': { icon: '!', eyebrow: 'Federal disaster declarations', title: 'FEMA declared areas', description: 'Area-level OpenFEMA declaration records with declaration identity, incident context, dates, and assistance-program flags.' },
  'core-cpi-index': { icon: '∿', eyebrow: 'Consumer prices', title: 'Malaysia core CPI index', description: 'Overall monthly core CPI index level with explicit base, reporting month, and semantic trend values.' },
  'food-hygiene-ratings': { icon: '5', eyebrow: 'Food hygiene', title: 'UK food hygiene ratings', description: 'FSA establishment ratings with inspection date, authority, and correctly oriented FHRS component scores.' },
  'household-income': { icon: 'RM', eyebrow: 'Household income', title: 'Malaysia household income', description: 'Nominal HIES mean and median monthly gross household income across published survey observations.' },
  'population-total': { icon: 'MY', eyebrow: 'Demography', title: 'Malaysia population', description: 'National total population with demographic dimensions fixed to overall totals and provider units made explicit.' },
  'humanitarian-events': { icon: 'IF', eyebrow: 'Humanitarian events', title: 'IFRC GO emergencies', description: 'Recent events with source-separated field-report impact figures and disaster-start chronology.' },
  'sdg-goals': { icon: '17', eyebrow: 'Global goals', title: 'UN Sustainable Development Goals', description: 'Official SDG goal identities, titles, descriptions, and provider API paths from the current goal catalogue.' },
  'satellite-orbits': { icon: '◎', eyebrow: 'Orbital elements', title: 'CelesTrak GP orbital elements', description: 'CCSDS OMM-style orbital elements at their supplied epoch, with catalog identity and units kept explicit.' },
  'marine-occurrences': { icon: '≈', eyebrow: 'Marine biodiversity', title: 'OBIS occurrence evidence', description: 'Darwin Core occurrence identity, status, timing, location, dataset provenance, and provider quality flags.' },
  'marine-taxonomy': { icon: 'T', eyebrow: 'Marine taxonomy', title: 'WoRMS taxon resolution', description: 'Queried taxon identity, status, stable Aphia IDs, classification, habitat flags, and current accepted-name relationship.' },
  'fossil-taxon': { icon: 'F', eyebrow: 'Paleobiology taxonomy', title: 'Fossil taxon profile', description: 'PBDB taxon identity, accepted-name relationship, extancy, and fossil occurrence count scoped to the taxon plus subtaxa.' },
  'knowledge-entities': { icon: 'Q', eyebrow: 'Knowledge graph', title: 'Wikidata entity bindings', description: 'Stable Wikidata QIDs, entity URIs, and returned labels preserved from bounded SPARQL bindings.' },
  'citation-count': { icon: '↙', eyebrow: 'Citation index', title: 'Incoming citation count', description: 'A DOI-bound incoming citation count scoped explicitly to OpenCitations Index v2.' },
  'federal-agency-overview': { icon: 'US', eyebrow: 'Federal agency overview', title: 'Agency overview', description: 'USAspending agency identity, mission, fiscal-year context, official links, and emergency-funding reference codes.' },
  'federal-awards': { icon: '$', eyebrow: 'Federal contract awards', title: 'Prime contract awards', description: 'USAspending award-level amounts, obligation dates, recipients, agencies, contract type, and pagination context.' },
  'ip-geolocation': { icon: 'IP', eyebrow: 'Network geolocation', title: 'Approximate IP location', description: 'Approximate WGS84 location, timezone, ASN, organization, and ISP metadata for one public IP address.' },
  'boundary-layer': { icon: '▱', eyebrow: 'Administrative boundaries', title: 'Boundary layer metadata', description: 'gbOpen layer identity, provenance, per-unit geometry statistics, source license, and provider download links.' },
  'f1-season-catalog': { icon: 'F1', eyebrow: 'Formula 1 season catalogue', title: 'Drivers, constructors and races', description: 'Dataset-aware Formula 1 season identities and calendar facts from Jolpica.' },
  'pro-match-results': { icon: 'VS', eyebrow: 'Professional esports', title: 'OpenDota match results', description: 'Professional match identity, kill counts, winner, timing, league, and series metadata with provider semantics kept explicit.' },
  'football-matchday': { icon: '⚽', eyebrow: 'Football matchday', title: 'OpenLigaDB schedule and results', description: 'Team identity, kickoff timing, status, goals, and typed result stages for one league matchday.' },
  'baseball-schedule': { icon: '⚾', eyebrow: 'Baseball schedule', title: 'MLB dated schedule', description: 'Game identity, start time, status, home/away teams, venue, series context, records, and provider-supplied scores.' },
  'dns-records': { icon: '⌘', eyebrow: 'DNS diagnosis', title: 'DNS records', description: 'Resolver status, cache lifetime, and complete answer records.' },
  'download-summary': { icon: '↓', eyebrow: 'Package adoption', title: 'Download summary', description: 'Period downloads with the provider reporting window.' },
  'release-lifecycle': { icon: '◷', eyebrow: 'Software lifecycle', title: 'Release support', description: 'Release cycles, maintenance flags and dated support milestones.' },
  'exchange-rates': { icon: '⇄', eyebrow: 'Currency conversion', title: 'Exchange rates', description: 'Convert using this response and inspect available rates.' },

  'weather-dashboard': { icon: '☀', eyebrow: 'Live response · Weather layout', title: 'Current conditions', description: 'A ready-to-use weather dashboard built from observations, units, and location data.' },
  'country-profile': { icon: '◎', eyebrow: 'Live response · Profile layout', title: 'Country profile', description: 'A structured destination profile using regional and economic metadata.' },
  'market-chart': { icon: '↗', eyebrow: 'Live response · Market layout', title: 'Market snapshot', description: 'A financial panel that turns price history and rates into an at-a-glance trend.' },
  'media-gallery': { icon: '▧', eyebrow: 'Live response · Visual layout', title: 'Visual gallery', description: 'An image-led interface using media, profile, or catalogue fields from the response.' },
  'location-map': { icon: '⌖', eyebrow: 'Live response · Location layout', title: 'Location explorer', description: 'A spatial interface that maps coordinates and keeps every location agent-readable.' },
  'calendar-timeline': { icon: '□', eyebrow: 'Live response · Calendar layout', title: 'Event timeline', description: 'A chronological interface built from dates, event names, and regional metadata.' },
  'solar-cycle': { icon: '☀', eyebrow: 'Live response · Solar layout', title: 'Sun & moon cycle', description: 'A daylight timeline built from local sunrise, sunset, twilight, solar, and lunar data.' },
  'natural-events': { icon: '◎', eyebrow: 'Live response · Earth monitor', title: 'Natural events monitor', description: 'Near-real-time natural events organized by category, location, status, and observation time.' },
  'transit-board': { icon: 'T', eyebrow: 'Live response · Transit layout', title: 'Transit route board', description: 'A route-focused interface using MBTA colors, destinations, and service types.' },
  'trivia-game': { icon: '?', eyebrow: 'Live response · Game layout', title: 'Trivia challenge', description: 'A playable-looking question deck with decoded prompts, answer options, and difficulty labels.' },
  'developer-feed': { icon: '</>', eyebrow: 'Live response · Developer layout', title: 'Developer workspace', description: 'Repositories, packages, posts, and community activity translated into actionable cards.' },
  'security-center': { icon: '◇', eyebrow: 'Live response · Security layout', title: 'Security advisory center', description: 'Vulnerability and product records organized by severity, identifiers, and review dates.' },
  'research-library': { icon: '▤', eyebrow: 'Live response · Research layout', title: 'Research library', description: 'Books, papers, and clinical studies presented with authorship, status, and identifiers.' },
  'dictionary-entry': { icon: 'Aa', eyebrow: 'Live response · Language layout', title: 'Dictionary entry', description: 'Definitions, parts of speech, examples, and synonyms mapped from the word response.' },
  'drug-label': { icon: 'Rx', eyebrow: 'Live response · Drug label layout', title: 'Drug label summary', description: 'Product identity and regulated label sections mapped from the returned openFDA record.' },
  'food-recalls': { icon: 'FDA', eyebrow: 'Live response · Recall layout', title: 'Food recall enforcement report', description: 'Recall identity, classification, status, affected product, firm, dates, reason, and distribution mapped from FDA enforcement records.' },
  'prayer-schedule': { icon: '◷', eyebrow: 'Live response · Prayer schedule', title: 'Daily prayer times', description: 'Prayer times, Gregorian/Hijri date context, timezone, coordinates, and calculation method mapped from the AlAdhan response.' },
  'drug-terminology': { icon: 'Rx', eyebrow: 'Live response · Drug terminology', title: 'RxNorm drug concepts', description: 'Clinical and branded drug concepts grouped by RxNorm term type with stable RxCUI identifiers.' },
  'coastal-water-level': { icon: '≈', eyebrow: 'Live response · Coastal observation', title: 'Coastal water level', description: 'Station identity, observed height, datum, timing, and NOAA quality-control evidence from the latest CO-OPS water-level response.' },
  'protein-annotation': { icon: 'P', eyebrow: 'Live response · Protein annotation', title: 'Protein annotation', description: 'Stable UniProtKB identity, organism, gene, sequence facts, and bounded provider function annotation.' },
  'molecular-structure': { icon: '3D', eyebrow: 'Live response · Molecular structure', title: 'Molecular structure record', description: 'PDB entry identity, experimental method, resolution, archive facts, entity counts, and primary publication metadata.' },
  'molecule-profile': { icon: '◇', eyebrow: 'Live response · Molecule profile', title: 'ChEMBL molecule profile', description: 'Molecule identity, provider chemical properties, development metadata, structure identifiers, and classifications.' },
  'compound-properties': { icon: '◇', eyebrow: 'Live response · Compound properties', title: 'PubChem compound properties', description: 'Stable PubChem compound identity with the requested molecular formula, molecular weight, and IUPAC name.' },
  'gene-locus': { icon: 'DNA', eyebrow: 'Live response · Gene locus', title: 'Ensembl gene locus', description: 'Stable gene identity, species, assembly coordinates, strand, biotype, canonical transcript, and provider description.' },
  'domain-registration': { icon: '◎', eyebrow: 'Live response · Registration layout', title: 'Domain registration', description: 'Registrar identity, lifecycle dates, nameservers, registry handle, and complete RDAP status.' },
  'legal-entity': { icon: 'LEI', eyebrow: 'Live response · Entity layout', title: 'Legal entity profile', description: 'Official LEI identity, headquarters, registration state, mapped identifiers, and available corporate relationship links.' },
  'bank-institution': { icon: '$', eyebrow: 'Live response · Banking layout', title: 'FDIC institution profile', description: 'Institution identity, operating status, headquarters, reported assets/deposits, offices, and regulator metadata.' },
  'route-summary': { icon: '↝', eyebrow: 'Live response · Route layout', title: 'Route summary', description: 'Provider route distance, estimated travel time, snapped endpoints, geometry size, and turn-by-turn steps.' },
  'transaction-fees': { icon: '₿', eyebrow: 'Live response · Fee layout', title: 'Bitcoin fee recommendations', description: 'Provider-recommended sat/vB rates for fastest, half-hour, hour, economy, and minimum transaction targets.' },
  'availability-board': { icon: 'P', eyebrow: 'Live response · Availability layout', title: 'Availability board', description: 'Capacity, availability, occupancy, and record coverage mapped into an operational status board.' },
  'collection-index': { icon: '▦', eyebrow: 'Live response · Collection index', title: 'Collection index', description: 'Collection match counts and provider object identifiers exposed as a semantic search index.' },
  'manufacturer-directory': { icon: 'M', eyebrow: 'Live response · Directory layout', title: 'Manufacturer directory', description: 'Manufacturer identities and registry identifiers presented as a semantic directory.' },
  'taxonomy-directory': { icon: 'T', eyebrow: 'Live response · Taxonomy layout', title: 'Taxonomy directory', description: 'Scientific names, ranks, status, lineage, and taxonomy identifiers presented as domain records.' },
  'motorsport-results': { icon: 'F1', eyebrow: 'Live response · Motorsport layout', title: 'Motorsport results', description: 'Race-session, qualifying, standings, driver, constructor, and timing facts mapped into competition results.' },
  'quote-card': { icon: '“', eyebrow: 'Live response · Quote layout', title: 'Quote card', description: 'Quoted text, speaker identity, and source work presented as a readable semantic quotation.' },
  'character-dossier': { icon: '✦', eyebrow: 'Live response · Character layout', title: 'Character dossier', description: 'Character identity, physical attributes, appearances, and relationship facts presented as semantic profiles.' },
  'parliament-members': { icon: 'UK', eyebrow: 'Live response · Parliament members', title: 'Current Parliament members', description: 'Current Commons and Lords member identity, party affiliation, latest-house membership, and provider pagination context.' },
  'ai-model-catalog': { icon: 'AI', eyebrow: 'Live response · Model catalogue', title: 'Hugging Face model metadata', description: 'Model identity, task/library, access state, provider license tags, popularity, and update metadata from Hub search.' },
  'open-data-catalog': { icon: 'CA', eyebrow: 'Live response · Open-data catalogue', title: 'Canada open-government records', description: 'Dataset and publication catalogue identity, publisher, licence, dates, restrictions, bilingual metadata, and resource formats.' },
  'icon-catalog': { icon: '◈', eyebrow: 'Live response · Icon catalogue', title: 'Icon identifiers and licence context', description: 'Iconify identifiers joined to their returned icon-set author, licence, and search-page metadata.' },
  'homebrew-package': { icon: 'B', eyebrow: 'Live response · Package metadata', title: 'Homebrew package metadata', description: 'Formula and cask identity with version, dependencies or app artifacts, licence, and platform metadata kept semantically distinct.' },
  'monster-statblock': { icon: 'CR', eyebrow: 'Live response · Creature stat cards', title: 'Open5e creature search', description: 'Source-aware V2 creature identity, challenge rating, defence, health, movement, perception, and game-system context.' },
  'lexical-matches': { icon: 'Aa', eyebrow: 'Live response · Lexical matches', title: 'Pronunciation-aware word matches', description: 'Datamuse sounds-like results mapped into ranked words with pronunciation, part-of-speech, syllable, and provider-ordering context.' },
  'symbolic-math': { icon: '∑', eyebrow: 'Live response · Symbolic math', title: 'Symbolic operation result', description: 'The provider-returned operation, input expression, and symbolic result kept explicit for verification and reuse.' },
  'public-ip': { icon: 'IP', eyebrow: 'Live response · Network identity', title: 'Public IP address', description: 'The provider-observed IPv4 or IPv6 address with explicit network-identity semantics and no implied geolocation.' },
  'cat-fact': { icon: 'CAT', eyebrow: 'Live response · Cat fact', title: 'Random cat fact', description: 'Provider-returned cat trivia presented as readable semantic content with its reported length.' },
  'fuel-dashboard': { icon: '⛽', eyebrow: 'Live response · Fuel market layout', title: 'Malaysia fuel board', description: 'Official weekly pump prices, subsidy tiers, changes, and price history in a retail-market dashboard.' },
  'marine-forecast': { icon: '≈', eyebrow: 'Live response · Marine layout', title: 'Marine forecast', description: 'Wave, current, bearing, period, and sea-temperature series presented as a coastal conditions cockpit.' },
  'awards-timeline': { icon: 'N', eyebrow: 'Live response · Awards layout', title: 'Nobel Prize timeline', description: 'Prize years, categories, laureates, discoveries, and award values arranged chronologically.' },
  'chess-ratings': { icon: '♞', eyebrow: 'Live response · Chess layout', title: 'Player ratings', description: 'Competitive ratings, personal bests, match records, and win ratios compared across time controls.' },
  'scholarly-search': { icon: 'DOI', eyebrow: 'Live response · Scholarly layout', title: 'Scholarly works', description: 'DOI metadata organized by title, authorship, publication year, publisher, type, and citation count.' },
  'result-list': { icon: '✦', eyebrow: 'Live response · Results layout', title: 'Result explorer', description: 'A structured result browser adapted to this API response.' },
}

const weatherPreviewMeta: Record<WeatherPreviewVariant, { icon: string; eyebrow: string; title: string; description: string }> = {
  current: previewMeta['weather-dashboard'],
  'four-day': { icon: '☂', eyebrow: 'Live response · Daily forecast', title: '4-day outlook', description: 'Daily conditions, temperature ranges, humidity, and wind values mapped directly from the forecast response.' },
  'twenty-four-hour': { icon: '◒', eyebrow: 'Live response · Regional forecast', title: '24-hour forecast', description: 'A full-day outlook with general conditions and time-based forecasts for every Singapore region.' },
  'area-forecast': { icon: '⌖', eyebrow: 'Live response · Neighbourhood forecast', title: '2-hour area forecast', description: 'Short-range conditions grouped by named Singapore neighbourhoods.' },
  'station-readings': { icon: '◉', eyebrow: 'Live response · Sensor network', title: 'Station readings', description: 'Live measurements joined with station names, units, coordinates, and network statistics.' },
  'regional-air-quality': { icon: '≋', eyebrow: 'Live response · Air quality', title: 'Regional air quality', description: 'PSI and particulate readings compared across Singapore’s five reporting regions.' },
  'air-quality-forecast': { icon: '≋', eyebrow: 'Live response · Air quality', title: 'Current air quality', description: 'Current AQI and pollutant concentrations mapped directly from the selected coordinates.' },
  'uv-index': { icon: '☀', eyebrow: 'Live response · UV monitoring', title: 'UV index', description: 'The latest ultraviolet exposure level and its reporting timeline.' },
}

export function ResponseDemoPreview({ api, data, requestUrl, runtime, locale = 'en' }: { api: ApiDemo; data: unknown; requestUrl?: string; runtime?: SsotRuntimeMeta; locale?: UiLocale }) {
  const t = (key: UiMessageKey, values?: Record<string, string | number>) => uiText(locale, key, values)
  const ssotDefinition = apiSsotCardRegistry[api.id]
  const layout = ssotDefinition?.layout ?? selectPreviewLayout(api)
  const weatherVariant = layout === 'weather-dashboard' ? selectWeatherPreviewVariant(api) : undefined
  const profileLabel = ssotDefinition?.label ?? getPreviewProfile(api.id)?.label ?? previewMeta[layout].eyebrow
  const layoutMeta = weatherVariant ? weatherPreviewMeta[weatherVariant] : previewMeta[layout]
  const PreviewComponent = ssotDefinition?.Component ?? apiPreviewComponents[api.id]
  const content: ReactNode = PreviewComponent
    ? <PreviewComponent api={api} data={data} requestUrl={requestUrl}/>
    : <ResultListPreview data={data} api={api}/>

  const headingId = `demo-preview-${api.id}`
  const formattedSize = runtime ? formatResponseBytes(runtime.size) : undefined
  return <section
    className={`demo-preview preview-${layout}`}
    aria-labelledby={headingId}
    data-webmcp-surface="api-demo-preview"
    data-ssot-card={api.id}
    data-ssot-design="result-card-v2"
    data-ssot-source="live-response"
    data-ssot-adapter={PreviewComponent ? componentName(api.id) : 'generic-fallback'}
    data-ssot-fallback={PreviewComponent ? 'false' : 'true'}
    data-preview-layout={layout}
    data-preview-variant={weatherVariant}
    data-preview-component={PreviewComponent ? api.id : 'generic-fallback'}
    data-api-id={api.id}
    data-provider={api.provider}
    data-category={api.category}
    style={{ '--preview-accent': api.accent } as CSSProperties}
  >
    <span className="sr-only" role="status">{t('request.responseReceived', { name: api.name })}</span>
    <div className="demo-preview-head">
      <span className="demo-preview-monogram" aria-hidden="true">{api.monogram}</span>
      <div className="demo-preview-copy">
        <div className="demo-preview-kicker"><span className="live-response-badge"><i aria-hidden="true"/>{t('request.liveResponse')}</span><span className="preview-profile-badge" lang="en"><i aria-hidden="true">{layoutMeta.icon}</i>{profileLabel}</span></div>
        <h2 id={headingId} lang="en">{api.name}</h2>
        <p lang="en">{api.description}</p>
        <div className="demo-preview-context" aria-label={t('request.apiContext')}><span>{t('request.provider')} · <span lang="en">{api.provider}</span></span><span>{t('request.category')} · <span lang="en">{api.category}</span></span></div>
      </div>
      <div className="ssot-runtime" aria-label={t('request.liveMetadata')}>{runtime ? <><b aria-label={t('request.httpStatus', { status: runtime.httpStatus })}>{runtime.httpStatus} OK</b><span aria-label={t('request.responseTime', { elapsed: runtime.elapsed })}>{runtime.elapsed} ms</span><span aria-label={t('request.responseSize', { size: formattedSize ?? '' })}>{formattedSize}</span></> : <span>{t('request.previewReady')}</span>}</div>
    </div>
    {content}
  </section>
}
