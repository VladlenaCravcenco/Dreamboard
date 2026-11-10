import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import LandingScreen from './screens/LandingScreen';

/** Static HTML of the guest landing page, injected into dist/index.html at build time. */
export function renderLanding() {
  return renderToString(<StaticRouter location="/"><LandingScreen /></StaticRouter>);
}
