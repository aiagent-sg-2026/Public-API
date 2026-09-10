export type PreviewLayout =
  | 'security-scorecard'
  | 'grammar-review'
  | 'vehicle-recalls'
  | 'color-swatch'
  | 'carbon-intensity'
  | 'terrain-elevation'
  | 'flood-stations'
  | 'water-gauge'
  | 'population-statistic'
  | 'refugee-population'
  | 'household-income'
  | 'population-total'
  | 'humanitarian-events'
  | 'sdg-goals'
  | 'satellite-orbits'
  | 'marine-occurrences'
  | 'marine-taxonomy'
  | 'fossil-taxon'
  | 'ip-geolocation'
  | 'boundary-layer'
  | 'f1-season-catalog'
  | 'pro-match-results'
  | 'football-matchday'
  | 'baseball-schedule'
  | 'disaster-declared-areas'
  | 'core-cpi-index'
  | 'food-hygiene-ratings'
  | 'dns-records'
  | 'download-summary'
  | 'release-lifecycle'
  | 'exchange-rates'
  | 'weather-dashboard'
  | 'country-profile'
  | 'market-chart'
  | 'media-gallery'
  | 'location-map'
  | 'calendar-timeline'
  | 'solar-cycle'
  | 'natural-events'
  | 'transit-board'
  | 'trivia-game'
  | 'developer-feed'
  | 'security-center'
  | 'research-library'
  | 'dictionary-entry'
  | 'drug-label'
  | 'food-recalls'
  | 'prayer-schedule'
  | 'drug-terminology'
  | 'coastal-water-level'
  | 'protein-annotation'
  | 'molecular-structure'
  | 'molecule-profile'
  | 'compound-properties'
  | 'gene-locus'
  | 'domain-registration'
  | 'legal-entity'
  | 'bank-institution'
  | 'route-summary'
  | 'transaction-fees'
  | 'availability-board'
  | 'collection-index'
  | 'manufacturer-directory'
  | 'taxonomy-directory'
  | 'motorsport-results'
  | 'quote-card'
  | 'character-dossier'
  | 'federal-agency-overview'
  | 'federal-awards'
  | 'knowledge-entities'
  | 'citation-count'
  | 'parliament-members'
  | 'ai-model-catalog'
  | 'open-data-catalog'
  | 'icon-catalog'
  | 'homebrew-package'
  | 'monster-statblock'
  | 'lexical-matches'
  | 'symbolic-math'
  | 'public-ip'
  | 'cat-fact'
  | 'fuel-dashboard'
  | 'marine-forecast'
  | 'awards-timeline'
  | 'chess-ratings'
  | 'scholarly-search'
  | 'result-list'

export type PreviewProfile = {
  layout: PreviewLayout
  label: string
}

const profileEntries: Array<[id: string, layout: PreviewLayout, label: string]> = [
  ['countries', 'country-profile', 'Country intelligence profile'],
  ['weather', 'weather-dashboard', 'Live weather cockpit'],
  ['people', 'media-gallery', 'Generated people directory'],
  ['dogs', 'media-gallery', 'Random dog photo wall'],
  ['posts', 'developer-feed', 'REST post inspector'],
  ['holidays', 'calendar-timeline', 'International holiday planner'],
  ['hebcal-calendar', 'calendar-timeline', 'Hebrew and Jewish observance calendar'],
  ['aladhan-prayer-times', 'prayer-schedule', 'Daily prayer schedule and calendar context'],
  ['geocoding-search', 'location-map', 'Global geocoding result map'],
  ['open-meteo-air-quality', 'weather-dashboard', 'Coordinate air-quality monitor'],
  ['sunrise-sunset', 'solar-cycle', 'Daylight and solar clock'],
  ['nasa-eonet-events', 'natural-events', 'NASA Earth event monitor'],
  ['mbta-transit-routes', 'transit-board', 'Boston transit route board'],
  ['open-trivia', 'trivia-game', 'Interactive trivia question deck'],
  ['carbon-intensity-gb', 'carbon-intensity', 'Great Britain carbon intensity'],
  ['data-gov-24hr-forecast', 'weather-dashboard', 'Singapore 24-hour outlook'],
  ['data-gov-4day-forecast', 'weather-dashboard', 'Singapore four-day planner'],
  ['data-gov-air-temperature', 'weather-dashboard', 'Temperature station network'],
  ['data-gov-carpark', 'availability-board', 'Singapore carpark capacity dashboard'],
  ['data-gov-forecast-2hr', 'weather-dashboard', 'Neighbourhood forecast matrix'],
  ['data-gov-pm25', 'weather-dashboard', 'PM2.5 regional monitor'],
  ['data-gov-psi', 'weather-dashboard', 'PSI regional health panel'],
  ['data-gov-rainfall', 'weather-dashboard', 'Rain gauge station network'],
  ['data-gov-relative-humidity', 'weather-dashboard', 'Humidity sensor network'],
  ['data-gov-taxi', 'location-map', 'Available taxi live map'],
  ['data-gov-traffic-images', 'media-gallery', 'Traffic camera operations wall'],
  ['data-gov-uv-index', 'weather-dashboard', 'UV exposure timeline'],
  ['data-gov-wind-direction', 'weather-dashboard', 'Wind direction station compass'],
  ['data-gov-wind-speed', 'weather-dashboard', 'Wind speed station dashboard'],
  ['data-usa', 'market-chart', 'United States population explorer'],
  ['devto', 'developer-feed', 'DEV article discovery feed'],
  ['fiscal-data-treasury', 'federal-agency-overview', 'U.S. Treasury agency overview'],
  ['github', 'developer-feed', 'GitHub repository command center'],
  ['hacker-news', 'developer-feed', 'Hacker News story brief'],
  ['ipify-public-ip', 'public-ip', 'Public IP network identity'],
  ['met-museum-object-detail', 'media-gallery', 'Museum object spotlight'],
  ['met-museum-search', 'collection-index', 'Met collection search index'],
  ['nhtsa-vpic', 'manufacturer-directory', 'Vehicle manufacturer registry'],
  ['nhtsa-vehicle-recalls', 'vehicle-recalls', 'Vehicle defect, consequence and remedy'],
  ['npm-search', 'developer-feed', 'npm package comparison grid'],
  ['nvd-cpe-search', 'security-center', 'CPE product dictionary'],
  ['nvd-cve-detail', 'security-center', 'Single CVE investigation dossier'],
  ['nvd-cves', 'security-center', 'CVE search result center'],
  ['nvd-recent-cves', 'security-center', 'Recently modified CVE watchlist'],
  ['postcodes-io', 'location-map', 'UK postcode intelligence card'],
  ['pypi-json', 'developer-feed', 'Python package release profile'],
  ['stack-exchange', 'developer-feed', 'Stack Overflow activity queue'],
  ['uk-bank-holidays', 'calendar-timeline', 'UK bank holiday calendar'],
  ['usaspending', 'federal-awards', 'Federal contract award ledger'],
  ['usgs', 'location-map', 'Earthquake activity map'],
  ['wikidata-sparql', 'knowledge-entities', 'Wikidata entity bindings'],
  ['openssf-scorecard', 'security-scorecard', 'Repository security check evidence'],
  ['opencitations-index', 'citation-count', 'OpenCitations incoming citation count'],
  ['vam-collections', 'media-gallery', 'V&A objects collection search'],
  ['world-bank-gdp', 'market-chart', 'Singapore GDP history'],
  ['world-bank-population', 'market-chart', 'Singapore population history'],
  ['frankfurter-sgd-myr-history', 'market-chart', 'SGD/MYR exchange-rate history'],
  ['open-library-search', 'research-library', 'Open Library bookshelf'],
  ['free-dictionary', 'dictionary-entry', 'Word definition study card'],
  ['pokeapi', 'media-gallery', 'Pokémon stat and ability profile'],
  ['art-institute-search', 'media-gallery', 'Art Institute exhibition wall'],
  ['tvmaze-search', 'media-gallery', 'Television show discovery rail'],
  ['open-food-facts', 'media-gallery', 'Food product nutrition label'],
  ['gbif-species-search', 'taxonomy-directory', 'Species taxonomy explorer'],
  ['clinical-trials-search', 'research-library', 'Clinical study registry'],
  ['europe-pmc-search', 'research-library', 'Life-science paper library'],
  ['openfda-drug-labels', 'drug-label', 'FDA regulated drug label summary'],
  ['coinpaprika-ticker', 'market-chart', 'Cryptocurrency market terminal'],
  ['malaysia-fuel-price', 'fuel-dashboard', 'Malaysia weekly fuel-price board'],
  ['open-meteo-marine', 'marine-forecast', 'Coastal and ocean forecast cockpit'],
  ['nobel-prizes', 'awards-timeline', 'Nobel laureate and discovery timeline'],
  ['chess-player-stats', 'chess-ratings', 'Chess performance rating board'],
  ['crossref-works', 'scholarly-search', 'DOI and scholarly works explorer'],
  ['noaa-space-weather', 'weather-dashboard', 'NOAA space-weather operations cockpit'],
  ['osv-vulnerability', 'security-center', 'Open-source vulnerability dossier'],
  ['federal-register-documents', 'calendar-timeline', 'Federal rulemaking publication timeline'],
  ['wikipedia-search', 'media-gallery', 'Wikipedia visual knowledge explorer'],
  ['open-meteo-flood', 'weather-dashboard', 'Global river-discharge forecast panel'],
  ['open-meteo-history', 'market-chart', 'Historical climate trend comparison'],
  ['kraken-public-ticker', 'market-chart', 'Kraken public market terminal'],
  ['gitlab-public-projects', 'developer-feed', 'GitLab public project discovery feed'],
  ['uk-police-street-crime', 'location-map', 'UK anonymised street-crime map'],
  ['open-brewery-directory', 'location-map', 'Global brewery location directory'],
  ['rick-morty-characters', 'media-gallery', 'Character and episode gallery'],
  ['wikimedia-pageviews', 'market-chart', 'Wikipedia readership trend chart'],
  ['openf1-historical', 'motorsport-results', 'Formula 1 qualifying classification'],
  ['jolpica-f1', 'f1-season-catalog', 'Jolpica Formula 1 season catalogue'],
  ['open-meteo-elevation', 'terrain-elevation', 'Terrain elevation lookup'],
  ['zippopotam-postcode', 'location-map', 'Postcode geolocation lookup'],
  ['irail-liveboard', 'transit-board', 'Belgian railway live departure board'],
  ['swiss-transit-connections', 'transit-board', 'Swiss transit connection lookup'],
  ['spaceflight-news', 'media-gallery', 'Spaceflight newsroom briefing wall'],
  ['launch-library-upcoming', 'calendar-timeline', 'Upcoming mission launch countdown'],
  ['wiktionary-entry', 'dictionary-entry', 'Wiktionary structured language entry'],
  ['animechan-random-quote', 'quote-card', 'Anime quote character stage'],
  ['anilist-graphql', 'media-gallery', 'AniList media discovery'],
  ['openverse-search', 'media-gallery', 'Openverse media search'],
  ['apple-itunes-search', 'media-gallery', 'Apple iTunes search wall'],
  ['packagist-search', 'developer-feed', 'Packagist package explorer'],
  ['jokeapi-safe', 'trivia-game', 'Safe interactive joke stage'],
  ['hn-search-algolia', 'developer-feed', 'Hacker News keyword search'],
  ['dummyjson-recipes', 'media-gallery', 'Prototype recipe discovery grid'],
  ['bank-of-canada-valet', 'market-chart', 'Bank of Canada time-series series'],
  ['nasa-power-climate', 'market-chart', 'NASA POWER climate monitor'],
  ['brasilapi-postcode', 'location-map', 'Brazilian postcode location profile'],
  ['poetrydb-poems', 'research-library', 'Public-domain poetry reading room'],
  ['coingecko-keyless-market', 'market-chart', 'Keyless cryptocurrency market snapshot'],
  ['swapi-people', 'character-dossier', 'Star Wars character dossier'],
  ['google-dns-doh', 'dns-records', 'DNS resolution and answer records'],
  ['color-api', 'color-swatch', 'Color swatch and specifications'],
  ['nasa-image-search', 'media-gallery', 'NASA media discovery wall'],
  ['lichess-top-players', 'chess-ratings', 'Lichess leaderboard board'],
  ['pubmed-search', 'research-library', 'PubMed identifier search results'],
  ['rxnorm-drug-search', 'drug-terminology', 'RxNorm drug terminology registry'],
  ['inaturalist-observations', 'media-gallery', 'Species observation photo wall'],
  ['first-epss', 'security-center', 'CVE exploitation probability score'],
  ['endoflife-date', 'release-lifecycle', 'Software release support explorer'],
  ['deps-dev', 'developer-feed', 'Package ecosystem dependency profile'],
  ['ecb-fx-rates', 'exchange-rates', 'Fiat and crypto rate conversion'],
  ['un-sdg-goals', 'sdg-goals', 'United Nations Sustainable Development Goal catalogue'],
  ['datacite-search', 'research-library', 'DataCite DOI search results'],
  ['ror-search', 'research-library', 'Research organization registry profile'],
  ['celestrak-satellites', 'satellite-orbits', 'CelesTrak GP orbital-element board'],
  ['cleveland-museum-search', 'media-gallery', 'Open-access artwork gallery'],
  ['scryfall-card-search', 'media-gallery', 'Magic: The Gathering card gallery'],
  ['dnd5e-spell-lookup', 'dictionary-entry', 'D&D 5e spell reference card'],
  ['qr-code-generator', 'media-gallery', 'Generated QR code preview'],
  ['where-the-iss-at', 'location-map', 'ISS live position tracker'],
  ['eurostat-population', 'population-statistic', 'Eurostat population-on-1-January statistic'],
  ['bls-timeseries', 'market-chart', 'U.S. labor statistics time series'],
  ['fema-disasters', 'disaster-declared-areas', 'FEMA declared geographic areas'],
  ['noaa-tides', 'coastal-water-level', 'NOAA coastal water-level observation'],
  ['rdap-domain-lookup', 'domain-registration', 'RDAP domain registration record'],
  ['languagetool-grammar-check', 'grammar-review', 'Writing issues and suggested replacements'],
  ['zenodo-search', 'research-library', 'Zenodo research record search'],
  ['doaj-search', 'research-library', 'Open-access article search'],
  ['pubchem-compound', 'compound-properties', 'PubChem compound property profile'],
  ['chembl-molecule', 'molecule-profile', 'ChEMBL molecule research profile'],
  ['uniprot-protein', 'protein-annotation', 'UniProt protein annotation profile'],
  ['rcsb-pdb-entry', 'molecular-structure', 'Protein Data Bank structure record'],
  ['ensembl-gene-lookup', 'gene-locus', 'Ensembl stable gene locus profile'],
  ['obis-marine-occurrences', 'marine-occurrences', 'OBIS marine occurrence evidence'],
  ['worms-species-lookup', 'marine-taxonomy', 'WoRMS accepted-name taxonomy resolution'],
  ['paleobiodb-taxa', 'fossil-taxon', 'Paleobiology fossil taxon profile'],
  ['usgs-water-legacy', 'water-gauge', 'USGS continuous water observation'],
  ['rubygems-lookup', 'developer-feed', 'Ruby gem release profile'],
  ['nuget-package-lookup', 'developer-feed', '.NET package release profile'],
  ['internet-archive-search', 'media-gallery', 'Archived media discovery wall'],
  ['ipwhois-lookup', 'ip-geolocation', 'Approximate IP location and network identity'],
  ['newton-math-solver', 'symbolic-math', 'Symbolic math operation result'],
  ['datamuse-rhymes', 'lexical-matches', 'Pronunciation-aware lexical matches'],
  ['open5e-monster-search', 'monster-statblock', 'Open5e V2 source-aware creature stat cards'],
  ['dicebear-avatar', 'media-gallery', 'Generated avatar preview'],
  ['catfacts', 'cat-fact', 'Random cat fact'],
  ['randomfox-photo', 'media-gallery', 'Random fox photo card'],
  ['malaysia-core-cpi', 'core-cpi-index', 'Malaysia overall core CPI index trend'],
  ['malaysia-household-income', 'household-income', 'Malaysia HIES mean and median household-income trend'],
  ['malaysia-population', 'population-total', 'Malaysia national total population trend'],
  ['openfda-food-recalls', 'food-recalls', 'FDA food recall enforcement reports'],
  ['iconify-search', 'icon-catalog', 'Icon identifier and licence catalogue'],
  ['homebrew-formula-json', 'homebrew-package', 'Homebrew formula and cask package metadata'],
  ['npm-download-counts', 'download-summary', 'Package download reporting window'],
  ['geoboundaries-admin-boundaries', 'boundary-layer', 'Administrative boundary layer provenance and downloads'],
  ['osrm-route', 'route-summary', 'OSRM route summary and turn steps'],
  ['opendota-pro-matches', 'pro-match-results', 'OpenDota professional match results'],
  ['openligadb-matches', 'football-matchday', 'OpenLigaDB matchday schedule and typed results'],
  ['uk-parliament-members', 'parliament-members', 'UK Parliament current members directory'],
  ['gleif-lei', 'legal-entity', 'Global LEI legal-entity profile'],
  ['fdic-bankfind', 'bank-institution', 'FDIC institution identity and financial snapshot'],
  ['uk-food-hygiene', 'food-hygiene-ratings', 'UK food hygiene rating and intervention scores'],
  ['uk-flood-monitoring', 'flood-stations', 'Environment Agency river monitoring stations'],
  ['unhcr-refugees', 'refugee-population', 'UNHCR year-end displacement population profile'],
  ['hdx-humanitarian-datasets', 'humanitarian-events', 'IFRC GO source-aware emergency event brief'],
  ['open-meteo-climate', 'market-chart', 'Climate model projection comparison'],
  ['models-dev', 'ai-model-catalog', 'Hugging Face model catalogue and access metadata'],
  ['vatcomply', 'exchange-rates', 'VATComply daily exchange-rate conversion'],
  ['mempool-space-btc', 'transaction-fees', 'Bitcoin recommended transaction fee rates'],
  ['metacpan', 'developer-feed', 'Perl/CPAN module discovery'],
  ['hexpm', 'developer-feed', 'Hex package distribution lookup'],
  ['pub-dev', 'developer-feed', 'Dart and Flutter package lookup'],
  ['go-module-proxy', 'developer-feed', 'Go module version catalog'],
  ['flathub-appstream', 'media-gallery', 'Linux desktop appstream browser'],
  ['mlb-stats-api', 'baseball-schedule', 'MLB dated schedule and game-state summary'],
  ['github-global-advisories', 'security-center', 'GitHub global advisory watchlist'],
  ['dblp-search', 'research-library', 'DBLP computer-science publication search'],
  ['citybikes-network', 'location-map', 'Live bike-sharing station map'],
  ['wikimedia-commons-search', 'media-gallery', 'Wikimedia Commons licensed media wall'],
  ['nominatim-search', 'location-map', 'OpenStreetMap geocoding explorer'],
  ['jsdelivr-package', 'developer-feed', 'jsDelivr package release SSOT'],
  ['canada-open-data-search', 'open-data-catalog', 'Canada open-government catalogue search'],
  ['gbif-occurrence-search', 'location-map', 'GBIF biodiversity occurrence map'],
  ['open-meteo-ensemble', 'market-chart', 'Ensemble forecast uncertainty chart'],
  ['world-bank-indicator-explorer', 'market-chart', 'World Bank selectable indicator trend'],
  ['exchange-rate-current', 'exchange-rates', 'Daily FX rates and conversion'],
  ['circl-vulnerability', 'security-center', 'CIRCL CVE investigation record'],
]

export const previewProfileIds = profileEntries.map(([id]) => id)

export const previewProfiles: Record<string, PreviewProfile> = Object.fromEntries(profileEntries.map(([id, layout, label]) =>
  [id, { layout, label }],
))

export const getPreviewProfile = (id: string): PreviewProfile | undefined => previewProfiles[id]
