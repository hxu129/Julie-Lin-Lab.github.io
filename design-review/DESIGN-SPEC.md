# Lin Lab redesign — Molecular Cartography

## Revision 2 — Image-led page rhythms

This revision supersedes the earlier all-page cartographic poster treatment. The shared paper/ink system remains, but each English core page now has a distinct content rhythm:

- **Home:** one restrained display-serif title, an un-tinted research figure, then a real laboratory group image.
- **Research:** a visual essay with three research figures at three different scales; headings are sans-serif.
- **Publications:** a compact chronological archive with one selected-paper image and dense citation rows.
- **People:** a single group photograph plus a text directory; no repeated avatar cards.
- **News:** a real-photo journal using existing laboratory and event images.
- **Join Us:** a quiet campus photograph and an application-information layout.

Typography is deliberately narrowed: display serif is reserved for the Home title and selected paper title; all page titles, section headings, and directory UI use Manrope. Existing repository images are used as content, not as tinted decorative texture. The generated design mockups are planning references only and are not website assets.

## Release content and asset contract

- `main` is the sole source of truth for visible research, publication, people, news, recruitment, and contact content. A visual re-layout may split source text into semantic HTML, but must not introduce a claim, omit a source fact, or paraphrase it into a different assertion.
- The user-supplied `homepage_figure.zip` is a visual source only. Its iPSC differentiation montage is used as a decorative Research-page rail with empty alternative text and no added caption or research claim.
- Existing source images may be re-cropped or reordered for visual hierarchy, but their placement must not imply a new result, project, affiliation, or event.
- Generated concept images are review references only; no generated research image, publication figure, or scientific claim is deployed.

## Decision

Create a high-impact, evidence-led research site: **Molecular Cartography**. The site should feel like a contemporary science atlas: a precise RNA-to-synapse journey expressed through editorial typography, fine rules, diagrammatic pathways, and real research imagery. It must not become a generic university template, an AI-biotech landing page, or a neon science-fiction interface.

The focal question remains the laboratory's own established framing:

> Neuronal RNA Metabolism — From nucleus to synapse.

## Design thesis

- **Atlas first, evidence second, action third.** The homepage leads with a diagrammatic nucleus-to-synapse path, then resolves into research chapters, publications, and recruitment.
- **Use scientific material as the visual language.** Mechanism diagrams, axonal trajectories, and microscopy supply the subject matter; all interface geometry remains clearly editorial and non-data. Do not use generic double helices, stock laboratory photography, or invented research claims.
- **Paper is the default reading surface.** Use an archival warm white for long-form research, people, and publications; midnight ink is reserved for the journey, selected work, and recruitment sequence.
- **Cool through typography and composition, not effects.** Large editorial type, fine cartographic rules, a single continuous path, and image/citation juxtaposition are the signature moves. No carousels, bento grids, pills, glowing borders, or decorative statistics.
- **mCherry is data, not the brand.** Do not use mCherry magenta/red as an interface colour, hero tint, CTA field, or repeated decorative motif. If a paper image contains mCherry, preserve it only within the cited image itself.

## Information architecture

1. **Home**
   - Editorial hero: headline, one-sentence descriptor, a decorative-but-non-data RNA path, Research and Join Us actions.
   - Three cartographic research chapters: RNA Regulation, Local Translation, Disease Mechanisms.
   - Featured publication strip, direct People link without an avatar rail, dark recruitment sequence, footer.
2. **Research**
   - Three research chapters with full scientific imagery, brief plain-language framing, methods and representative papers.
   - A small data/technique rail only where it clarifies the work (synaptosome isolation, translatome profiling, iPSC-derived models).
3. **Publications**
   - A selected-paper editorial rail first; the full bibliography below by year/topic, rather than an undifferentiated wall of citations.
4. **People**
   - PI feature followed by consistently cropped person cards, role and research-interest tags, then detail pages.
5. **News and Join Us**
   - Clear chronological news list and an opportunity-first recruitment page; avoid burying eligibility information in prose.

## Visual system

| Role | Token | Use |
| --- | --- | --- |
| Paper | `#F5F1E8` | Default long-form surface and footer |
| Midnight ink | `#0A1C2C` | Hero, selected work, recruitment |
| Text ink | `#112438` | Headings and primary text on paper |
| Slate | `#637481` | Secondary text and rules |
| Cartographic blue | `#376A83` | Illustration, active navigation, path detail |
| Aged copper | `#A86B3D` | Rare figure marker and underlining detail only |
| mCherry and fluorescent colours | source-dependent | Preserved only in a cited research image; never repeated as UI accents |

- Typography: `DM Serif Display` only for the Home title and selected-paper title; `Manrope` for all other headings, body, and interface; `Source Serif 4` only for paper metadata/captions; and `Noto Sans SC` where Chinese appears.
- Geometry: open paper bands, cartographic rules, and square image frames. Avoid container-within-container card stacks and rounded card grids.
- Icons: thin custom SVG line icons, 1.5 px stroke; arrows are part of the navigation system, not plain-text glyphs.
- Motion: `transform`/`opacity` on scroll; a slow, CSS/SVG nucleus-to-synapse path in the hero; no auto-rotating slides. Every motion effect must obey `prefers-reduced-motion`.

## Proposed asset roles and evidence boundary

| Asset | Intended role | Source status | Release gate |
| --- | --- | --- | --- |
| `images/RBM3.png` | RNA Regulation chapter and selected publication visual | Existing repository asset; appears to be a paper mechanism figure | Confirm article/figure credit and reuse permission before release |
| `images/Axon_Local_Translation.jpg` | Local Translation chapter | Existing repository asset; appears to be a paper diagram | Confirm article/figure credit and reuse permission before release |
| `images/Chiasm.jpeg` / `Growth_Cone*.jpeg` | Neuronal-science atmospheric imagery | Already public on the current site; existing page credits Dr William A. Harris | Retain an explicit credit near any reuse; verify current intended credit wording |
| `images/Weixin*.png` | Candidate fluorescence hero/research imagery | Existing repository assets; provenance is not encoded in filenames | Identify experiment/paper/source and obtain desired credit wording before release |
| `images/EMBO_Paper.jpg` | Selected-paper thumbnail | Existing repository asset | Confirm that it is the intended EMBO paper visual and retain citation link |
| `images/iPSC-neuronal-differentiation.png` | Decorative visual rail on Research | User-supplied from `homepage_figure.zip`; not content evidence | User determines release authorization; retain empty alt text and no scientific caption |

Existing repository presence establishes that an asset was previously deployed, not that every derivative or new use is legally cleared. The first implementation may use low-risk layout placeholders or already-published assets while the release ledger remains explicit.

## Build sequence

1. Replace the legacy Colorlib shell with a lightweight shared semantic layout, responsive top navigation, and a reusable token stylesheet.
2. Build the complete Home surface against the accepted concept; use source-derived lab copy and only verified assets.
3. Build Research, Publications, People, News, and Join Us using page-specific rhythms, retaining the complete canonical source content.
4. Add page metadata and remove unused legacy libraries and the failing global Google Maps script.
5. Verify desktop and mobile views visually, test all internal links, and check reduced-motion behavior before release.

## Explicit non-goals

- No fabricated research figures, results, member profiles, publication metadata, or claims.
- No direct scraping/republication of journal assets without an identified source and credit/permission decision.
- No marketing-style fake metrics, automatic hero carousel, overly generic AI imagery, or “futuristic” effects unrelated to RNA/neuroscience.
