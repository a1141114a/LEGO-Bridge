// Short, decorative feedback. All interactions still work with motion disabled.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const animate = (el, frames, options) => {
  if (!el || reduced.matches) return;
  return el.animate(frames, {duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)', ...options});
};
export function cartFeedback(source) {
  if (reduced.matches) return;
  const target = document.querySelector('#cartButton');
  animate(target, [{transform:'scale(1)'},{transform:'scale(1.12)',offset:.45},{transform:'scale(1)'}]);
  if (!source || !target) return;
  const start = source.getBoundingClientRect(), end = target.getBoundingClientRect();
  const brick = document.createElement('span');
  brick.className = 'flying-brick';
  brick.setAttribute('aria-hidden','true');
  brick.style.left = `${start.left + start.width/2 - 10}px`;
  brick.style.top = `${start.top + start.height/2 - 7}px`;
  document.body.append(brick);
  const dx = end.left + end.width/2 - start.left - start.width/2;
  const dy = end.top + end.height/2 - start.top - start.height/2;
  const flight = animate(brick, [
    {transform:'translate(0,0) rotate(-12deg)',opacity:1},
    {transform:`translate(${dx*.45}px,${dy*.45-55}px) rotate(12deg)`,opacity:1,offset:.45},
    {transform:`translate(${dx}px,${dy}px) scale(.25) rotate(35deg)`,opacity:0}
  ], {duration:620});
  flight.finished.catch(()=>{}).finally(()=>brick.remove());
}
document.addEventListener('click', e => {
  const control = e.target.closest('button,a');
  if (!control || control.disabled) return;
  if (control.matches('button,.primary,.secondary,.category')) {
    animate(control,[{transform:'scale(1)'},{transform:'scale(.94)',offset:.3},{transform:'scale(1)'}],{duration:240});
  }
  if (control.matches('[data-favorite]')) {
    animate(control,[{transform:'scale(1)'},{transform:'scale(1.4) rotate(-12deg)',offset:.45},{transform:'scale(1)'}],{duration:420});
  }
}, true);
// Covers route changes and refreshed product filters without changing focus or scroll.
const app = document.querySelector('#app');
new MutationObserver(records => {
  if (!records.some(r=>r.type==='childList')) return;
  animate(app,[{opacity:.45,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}]);
}).observe(app,{childList:true});
