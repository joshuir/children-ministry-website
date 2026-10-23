export const INTRO_KEY = "cm-intro-seen";
const KEY = INTRO_KEY;

/** Inline script: decides before first paint whether the intro plays, so there's never a flash. */
export const introBoot = (everyVisit: boolean) =>
  `(function(){try{var d=document.documentElement;if(location.pathname.indexOf('/admin')===0){d.classList.add('intro-skip');return}var seen=${everyVisit ? "false" : `sessionStorage.getItem('${KEY}')`};if(seen){d.classList.add('intro-skip')}else{d.classList.add('intro-playing');setTimeout(function(){if(d.classList.contains('intro-playing')){d.classList.remove('intro-playing');d.classList.add('intro-skip');window.dispatchEvent(new Event('intro:done'))}},20000)}}catch(e){}})();`;

