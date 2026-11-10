import './styles/tokens.css';import './styles/base.css';import './styles/components.css';import './styles/graph.css';import {mountSigils} from './ui/sigil.js';import {initNav} from './ui/nav.js';import {initScanner} from './ui/scanner.js';import {playIntro} from './animation/intro.js';import {initScrollScenes,initAmbient} from './animation/scroll.js';import {ScrollTrigger} from './animation/gsap.js';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
async function boot(){mountSigils();initNav();initScanner({reduced});document.body.classList.add('is-intro');await playIntro({reduced});document.body.classList.remove('is-intro');initScrollScenes({reduced});initAmbient({reduced});ScrollTrigger.refresh();document.fonts?.ready.then(()=>ScrollTrigger.refresh())}
boot();
