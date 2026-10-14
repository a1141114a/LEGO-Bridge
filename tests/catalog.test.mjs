import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {products} from '../dist/products.js';
test('catalog has unique numbered sets, exceeds 800 pieces, and separates unverified sale status',()=>{
 assert.ok(products.length>200);
 assert.equal(new Set(products.map(p=>p.id)).size,products.length);
 for(const p of products){assert.match(p.id,/^\d{5,7}$/);assert.ok(p.pieces>800);assert.ok(p.series);assert.equal(p.stock,null);assert.ok(p.sources.us||p.sources.kr||p.sources.cn);assert.equal(p.priceType,'OFFICIAL_WITH_MERCHANT_RULES');}
});
test('merchant prices use the agreed formula and never turn missing official prices into zero',()=>{
 for(const p of products){
  assert.equal(p.cny,p.global==null?null:Math.round(p.global*9*.6));
  assert.equal(p.krw,p.korea==null?null:Math.round(p.korea*.75));
  if(p.global!=null)assert.ok(p.sources.us);
  if(p.korea!=null)assert.ok(p.sources.kr);
 }
});
test('every gallery has a main photo and two different verified official detail photos',()=>{
 for(const p of products){assert.equal(p.images.length,3,'Missing gallery for '+p.id);assert.equal(new Set(p.images).size,3);assert.equal(p.images[0],p.image);for(const url of p.images){if(url.startsWith('./assets/details/')){assert.ok(url.includes(p.id));assert.ok(existsSync(new URL('../dist/'+url,import.meta.url)));assert.equal(p.detailSource,'OFFICIAL_IMAGE_SCREENSHOT_CROP');}else assert.match(url,/^https:\/\/www\.lego\.com\/cdn\/cs\/(set|catalogue)\/assets\//);const file=url.split('/').at(-1);const numbered=file.match(/^(\d{5,7})[_\-.]/);if(numbered)assert.equal(numbered[1],p.id,'Image ID mismatch '+p.id);}}
});
