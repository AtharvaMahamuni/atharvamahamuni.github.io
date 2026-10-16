# atharvamahamuni.github.io

Personal portfolio of Atharva Mahamuni. Plain static HTML and CSS, served by GitHub Pages.

## Tests

Animation checks (reduced motion, no-JS, scroll reveals, card hover/focus lift, nav active state) run in headless Chromium with Google Analytics blocked:

```sh
npm install
npx playwright install chromium
npm test
```
