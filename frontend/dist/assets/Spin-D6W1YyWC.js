import{E as T,M as v,N as d,bN as w,ac as b,d as B,bO as N,H as S,o as m,a as h,Y as f,O as l,b as z,aa as y,e as R,aC as V,j as P,J as $,ah as O,aG as E,g,k as L,aA as W,av as _,ai as j}from"./index-BrC03CDs.js";import{u as I}from"./use-compitable-C_QsvZ14.js";function M(e){const{opacityDisabled:t,heightTiny:o,heightSmall:p,heightMedium:a,heightLarge:n,heightHuge:r,primaryColor:s,fontSize:i}=e;return{fontSize:i,textColor:s,sizeTiny:o,sizeSmall:p,sizeMedium:a,sizeLarge:n,sizeHuge:r,color:s,opacitySpinning:t}}const D={common:T,self:M};var K=v([v("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),d("spin-container",`
 position: relative;
 `,[d("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[w()])]),d("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),d("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[b("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),d("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),d("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[b("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]);const Y={small:20,medium:18,large:16},A={...S.props,contentClass:String,contentStyle:[Object,String],description:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number,...N,strokeWidth:Number};var J=B({name:"Spin",props:A,slots:Object,setup(e){const{mergedClsPrefixRef:t,inlineThemeDisabled:o}=$(e),p=S("Spin","-spin",K,D,e,t),a=g(()=>{const{size:i}=e,{common:{cubicBezierEaseInOut:c},self:u}=p.value,{opacitySpinning:k,color:x,textColor:C}=u;return{"--n-bezier":c,"--n-opacity-spinning":k,"--n-size":typeof i=="number"?_(i):u[j("size",i)],"--n-color":x,"--n-text-color":C}}),n=o?O("spin",g(()=>{const{size:i}=e;return typeof i=="number"?String(i):i[0]}),a,e):void 0,r=I(e,["spinning","show"]),s=L(!1);return E(i=>{let c;if(r.value){const{delay:u}=e;if(u){c=window.setTimeout(()=>{s.value=!0},u),i(()=>{clearTimeout(c)});return}}s.value=r.value}),{mergedClsPrefix:t,active:s,mergedStrokeWidth:g(()=>{const{strokeWidth:i}=e;if(i!==void 0)return i;const{size:c}=e;return Y[typeof c=="number"?"medium":c]}),cssVars:o?void 0:a,themeClass:n==null?void 0:n.themeClass,onRender:n==null?void 0:n.onRender}},render(){var r;const{$slots:e,mergedClsPrefix:t,description:o}=this,p=e.icon&&this.rotate,a=(o||e.description)&&(m(),h("div",{class:l(`${t}-spin-description`)},[f(()=>{var s;return o||((s=e.description)==null?void 0:s.call(e))})],2)),n=e.icon?(m(),h("div",{key:1,class:l([`${t}-spin-body`,this.themeClass])},[z("div",{class:l([`${t}-spin`,p&&`${t}-spin--rotate`]),style:y(e.default?"":this.cssVars)},[f(()=>e.icon())],6),f(()=>a)],2)):(m(),h("div",{key:2,class:l([`${t}-spin-body`,this.themeClass])},[(m(),R(V,{clsPrefix:t,style:y(e.default?"":this.cssVars),stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,radius:this.radius,scale:this.scale,class:l(`${t}-spin`)},null,8,["clsPrefix","style","stroke","stroke-width","radius","scale","class"])),f(()=>a)],2));return(r=this.onRender)==null||r.call(this),e.default?(m(),h("div",{key:3,class:l([`${t}-spin-container`,this.themeClass]),style:y(this.cssVars)},[z("div",{class:l([`${t}-spin-content`,this.active&&`${t}-spin-content--spinning`,this.contentClass]),style:y(this.contentStyle)},[f(()=>{var s;return(s=e.default)==null?void 0:s.call(e)})],6),P(W,{name:"fade-in-transition"},{default:()=>this.active?n:null},1024)],6)):n}});export{J as S};
