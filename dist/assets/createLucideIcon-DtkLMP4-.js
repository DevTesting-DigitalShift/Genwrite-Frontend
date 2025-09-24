var x=Object.defineProperty,L=Object.defineProperties;var v=Object.getOwnPropertyDescriptors;var c=Object.getOwnPropertySymbols;var d=Object.prototype.hasOwnProperty,w=Object.prototype.propertyIsEnumerable;var C=(e,t,r)=>t in e?x(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,l=(e,t)=>{for(var r in t||(t={}))d.call(t,r)&&C(e,r,t[r]);if(c)for(var r of c(t))w.call(t,r)&&C(e,r,t[r]);return e},f=(e,t)=>L(e,v(t));var u=(e,t)=>{var r={};for(var o in e)d.call(e,o)&&t.indexOf(o)<0&&(r[o]=e[o]);if(e!=null&&c)for(var o of c(e))t.indexOf(o)<0&&w.call(e,o)&&(r[o]=e[o]);return r};import{r as s}from"./index-CjBclZHk.js";/**
 * @license lucide-react v0.488.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),$=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,r,o)=>o?o.toUpperCase():r.toLowerCase()),g=e=>{const t=$(e);return t.charAt(0).toUpperCase()+t.slice(1)},h=(...e)=>e.filter((t,r,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===r).join(" ").trim();/**
 * @license lucide-react v0.488.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var y={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.488.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=s.forwardRef((B,A)=>{var p=B,{color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:o,className:i="",children:a,iconNode:m}=p,n=u(p,["color","size","strokeWidth","absoluteStrokeWidth","className","children","iconNode"]);return s.createElement("svg",l(f(l({ref:A},y),{width:t,height:t,stroke:e,strokeWidth:o?Number(r)*24/Number(t):r,className:h("lucide",i)}),n),[...m.map(([b,k])=>s.createElement(b,k)),...Array.isArray(a)?a:[a]])});/**
 * @license lucide-react v0.488.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=(e,t)=>{const r=s.forwardRef((m,a)=>{var n=m,{className:o}=n,i=u(n,["className"]);return s.createElement(j,l({ref:a,iconNode:t,className:h(`lucide-${E(g(e))}`,`lucide-${e}`,o)},i))});return r.displayName=g(e),r};export{U as c};
