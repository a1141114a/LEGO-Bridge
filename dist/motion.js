// Short, decorative feedback. All interactions still work with motion disabled.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const animate = (el, frames, options) => {
  if (!el || reduced.matches) return;
  return el.animate(frames, {duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)', ...options});
};
export function cartFeedback(source) {
  if (reduced.matches) return;
  const target = document.querySelector('#cartButton');
  if (!source || !target) return;
  const start = source.getBoundingClientRect(), end = target.getBoundingClientRect();
  const brick = document.createElement('span');
  brick.className = 'flying-brick';
  brick.setAttribute('aria-hidden','true');
  brick.style.left = `${start.left + start.width/2 - 17}px`;
  brick.style.top = `${start.top + start.height/2 - 12}px`;
  document.body.append(brick);
  const dx = end.left + end.width/2 - start.left - start.width/2;
  const dy = end.top + end.height/2 - start.top - start.height/2;
  const flight = animate(brick, [
    {transform:'translate(0,0) scale(.7) rotate(-12deg)',opacity:1},
    {transform:'translate(0,-18px) scale(1.15) rotate(-12deg)',opacity:1,offset:.15},
    {transform:`translate(${dx*.45}px,${dy*.45-75}px) rotate(12deg)`,opacity:1,offset:.55},
    {transform:`translate(${dx}px,${dy}px) scale(.9) rotate(0deg)`,opacity:1,offset:.9},
    {transform:`translate(${dx}px,${dy}px) scale(.25) rotate(35deg)`,opacity:0}
  ], {duration:1450});
  flight.finished.then(()=>animate(target,[{transform:'scale(1)'},{transform:'scale(1.18)',offset:.45},{transform:'scale(1)'}],{duration:480})).catch(()=>{}).finally(()=>brick.remove());
}
document.addEventListener('click', e => {
  const control = e.target.closest('button,a');
  if (!control || control.disabled) return;
  if (control.matches('button,.primary,.secondary,.category') && !control.matches('[data-favorite]')) {
    animate(control,[{transform:'scale(1)'},{transform:'scale(.94)',offset:.3},{transform:'scale(1)'}],{duration:240});
  }
  if (control.matches('[data-favorite]')) {
    animate(control.querySelector('.heart-icon'),[
      {transform:'scale(1)',boxShadow:'0 0 0 0 #ee594500'},
      {transform:'scale(1.7) rotate(-15deg)',boxShadow:'0 0 0 8px #ee59452b',offset:.25},
      {transform:'scale(1.12) rotate(0deg)',boxShadow:'0 0 0 12px #ee594510',offset:.48},
      {transform:'scale(1.5) rotate(10deg)',boxShadow:'0 0 0 7px #ee59452b',offset:.7},
      {transform:'scale(1)',boxShadow:'0 0 0 15px #ee594500'}
    ],{duration:950});
  }
}, true);
// Covers route changes and refreshed product filters without changing focus or scroll.
const app = document.querySelector('#app');
new MutationObserver(records => {
  if (!records.some(r=>r.type==='childList')) return;
  animate(app,[{opacity:.45,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}]);
}).observe(app,{childList:true});
