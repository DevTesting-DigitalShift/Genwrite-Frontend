import{c as n}from"./index-CfcK-_FJ.js";/**
 * @license lucide-react v0.488.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],d=n("x",r),c=3.5,i=Object.freeze({analysis:{competitors:10,keywords:1},blog:{quick:5,proofread:5,single:10},aiImages:10});function a(t,s="gemini"){const e=t.split(".");let o=e.length==1?i[t]:i[e[0]][e[1]];if(!o)throw new Error("Unknown Operation: No cost avaliable");return s.toLowerCase()!="gemini"&&(o=Math.ceil(c*o)),o}console.log(a("blog.proofread"));export{d as X,a as g};
