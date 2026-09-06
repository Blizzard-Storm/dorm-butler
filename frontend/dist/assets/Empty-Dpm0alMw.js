import{E as b,d as S,K as B,b as y,N as I,ak as u,M as H,H as L,o as i,a,O as f,F as v,Y as c,e as h,a0 as D,aa as M,J as R,an as T,g as d,ao as g}from"./index-DFGY6xA0.js";import{u as $}from"./use-locale-xSd9g4ad.js";var N={iconSizeTiny:"28px",iconSizeSmall:"34px",iconSizeMedium:"40px",iconSizeLarge:"46px",iconSizeHuge:"52px"};function Z(e){const{textColorDisabled:o,iconColor:r,textColor2:s,fontSizeTiny:p,fontSizeSmall:C,fontSizeMedium:x,fontSizeLarge:z,fontSizeHuge:m}=e;return{...N,fontSizeTiny:p,fontSizeSmall:C,fontSizeMedium:x,fontSizeLarge:z,fontSizeHuge:m,textColor:o,iconColor:r,extraTextColor:s}}const F={name:"Empty",common:b,self:Z};var O=S({name:"Empty",render(){return(()=>{const e=B("15c1a247ae156450");return e[0]||(e[0]=y("svg",{viewBox:"0 0 28 28",fill:"none",xmlns:"http://www.w3.org/2000/svg"},[y("path",{d:"M26 7.5C26 11.0899 23.0899 14 19.5 14C15.9101 14 13 11.0899 13 7.5C13 3.91015 15.9101 1 19.5 1C23.0899 1 26 3.91015 26 7.5ZM16.8536 4.14645C16.6583 3.95118 16.3417 3.95118 16.1464 4.14645C15.9512 4.34171 15.9512 4.65829 16.1464 4.85355L18.7929 7.5L16.1464 10.1464C15.9512 10.3417 15.9512 10.6583 16.1464 10.8536C16.3417 11.0488 16.6583 11.0488 16.8536 10.8536L19.5 8.20711L22.1464 10.8536C22.3417 11.0488 22.6583 11.0488 22.8536 10.8536C23.0488 10.6583 23.0488 10.3417 22.8536 10.1464L20.2071 7.5L22.8536 4.85355C23.0488 4.65829 23.0488 4.34171 22.8536 4.14645C22.6583 3.95118 22.3417 3.95118 22.1464 4.14645L19.5 6.79289L16.8536 4.14645Z",fill:"currentColor"}),y("path",{d:"M25 22.75V12.5991C24.5572 13.0765 24.053 13.4961 23.5 13.8454V16H17.5L17.3982 16.0068C17.0322 16.0565 16.75 16.3703 16.75 16.75C16.75 18.2688 15.5188 19.5 14 19.5C12.4812 19.5 11.25 18.2688 11.25 16.75L11.2432 16.6482C11.1935 16.2822 10.8797 16 10.5 16H4.5V7.25C4.5 6.2835 5.2835 5.5 6.25 5.5H12.2696C12.4146 4.97463 12.6153 4.47237 12.865 4H6.25C4.45507 4 3 5.45507 3 7.25V22.75C3 24.5449 4.45507 26 6.25 26H21.75C23.5449 26 25 24.5449 25 22.75ZM4.5 22.75V17.5H9.81597L9.85751 17.7041C10.2905 19.5919 11.9808 21 14 21L14.215 20.9947C16.2095 20.8953 17.842 19.4209 18.184 17.5H23.5V22.75C23.5 23.7165 22.7165 24.5 21.75 24.5H6.25C5.2835 24.5 4.5 23.7165 4.5 22.75Z",fill:"currentColor"})],-1))})()}}),P=I("empty",`
 display: flex;
 flex-direction: column;
 align-items: center;
 font-size: var(--n-font-size);
`,[u("icon",`
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 line-height: var(--n-icon-size);
 color: var(--n-icon-color);
 transition:
 color .3s var(--n-bezier);
 `,[H("+",[u("description",`
 margin-top: 8px;
 `)])]),u("description",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),u("extra",`
 text-align: center;
 transition: color .3s var(--n-bezier);
 margin-top: 12px;
 color: var(--n-extra-text-color);
 `)]);const K={...L.props,description:String,showDescription:{type:Boolean,default:!0},showIcon:{type:Boolean,default:!0},size:{type:String,default:"medium"},renderIcon:Function};var Y=S({name:"Empty",props:K,slots:Object,setup(e){const{mergedClsPrefixRef:o,inlineThemeDisabled:r,mergedComponentPropsRef:s}=R(e),p=L("Empty","-empty",P,F,e,o),{localeRef:C}=$("Empty"),x=d(()=>{var t,n;return e.description??((n=(t=s==null?void 0:s.value)==null?void 0:t.Empty)==null?void 0:n.description)}),z=d(()=>{var t,n;return((n=(t=s==null?void 0:s.value)==null?void 0:t.Empty)==null?void 0:n.renderIcon)||(()=>(i(),h(O)))}),m=d(()=>{const{size:t}=e,{common:{cubicBezierEaseInOut:n},self:{[g("iconSize",t)]:E,[g("fontSize",t)]:_,textColor:V,iconColor:k,extraTextColor:w}}=p.value;return{"--n-icon-size":E,"--n-font-size":_,"--n-bezier":n,"--n-text-color":V,"--n-icon-color":k,"--n-extra-text-color":w}}),l=r?T("empty",d(()=>{let t="";const{size:n}=e;return t+=n[0],t}),m,e):void 0;return{mergedClsPrefix:o,mergedRenderIcon:z,localizedDescription:d(()=>x.value||C.value.description),cssVars:r?void 0:m,themeClass:l==null?void 0:l.themeClass,onRender:l==null?void 0:l.onRender}},render(){const{$slots:e,mergedClsPrefix:o,onRender:r}=this;return r==null||r(),i(),a("div",{class:f([`${o}-empty`,this.themeClass]),style:M(this.cssVars)},[this.showIcon?(i(),a("div",{key:0,class:f(`${o}-empty__icon`)},[e.icon?(i(),a(v,{key:0},[c(()=>e.icon())],64)):(i(),h(D,{key:1,clsPrefix:o},{default:this.mergedRenderIcon},1032,["clsPrefix"]))],2)):c(()=>null),this.showDescription?(i(),a("div",{key:2,class:f(`${o}-empty__description`)},[e.default?(i(),a(v,{key:0},[c(()=>e.default())],64)):(i(),a(v,{key:1},[c(()=>this.localizedDescription)],64))],2)):c(()=>null),e.extra?(i(),a("div",{key:4,class:f(`${o}-empty__extra`)},[c(()=>e.extra())],2)):c(()=>null)],6)}});export{Y as E,F as e};
