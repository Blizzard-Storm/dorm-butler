import{x as J,cf as K,z as g,ah as h,I as z,aj as i,ai as $,cg as U,H as q,d as G,A as H,e as m,ch as Q,C as X,N as Y,am as Z,g as A,D as ee,o as s,a as _,T as C,aU as oe,J as y,V as re,b as ne,R as te,at as W,aI as le,an as c,W as se,ci as ie,cj as ae,ck as ce,cl as de}from"./index-B1hbSlEf.js";function fe(r){const{lineHeight:e,borderRadius:d,fontWeightStrong:p,baseColor:l,dividerColor:v,actionColor:k,textColor1:f,textColor2:n,closeColorHover:u,closeColorPressed:b,closeIconColor:x,closeIconColorHover:I,closeIconColorPressed:t,infoColor:o,successColor:P,warningColor:T,errorColor:S,fontSize:R}=r;return{...K,fontSize:R,lineHeight:e,titleFontWeight:p,borderRadius:d,border:`1px solid ${v}`,color:k,titleTextColor:f,iconColor:n,contentTextColor:n,closeBorderRadius:d,closeColorHover:u,closeColorPressed:b,closeIconColor:x,closeIconColorHover:I,closeIconColorPressed:t,borderInfo:`1px solid ${g(l,h(o,{alpha:.25}))}`,colorInfo:g(l,h(o,{alpha:.08})),titleTextColorInfo:f,iconColorInfo:o,contentTextColorInfo:n,closeColorHoverInfo:u,closeColorPressedInfo:b,closeIconColorInfo:x,closeIconColorHoverInfo:I,closeIconColorPressedInfo:t,borderSuccess:`1px solid ${g(l,h(P,{alpha:.25}))}`,colorSuccess:g(l,h(P,{alpha:.08})),titleTextColorSuccess:f,iconColorSuccess:P,contentTextColorSuccess:n,closeColorHoverSuccess:u,closeColorPressedSuccess:b,closeIconColorSuccess:x,closeIconColorHoverSuccess:I,closeIconColorPressedSuccess:t,borderWarning:`1px solid ${g(l,h(T,{alpha:.33}))}`,colorWarning:g(l,h(T,{alpha:.08})),titleTextColorWarning:f,iconColorWarning:T,contentTextColorWarning:n,closeColorHoverWarning:u,closeColorPressedWarning:b,closeIconColorWarning:x,closeIconColorHoverWarning:I,closeIconColorPressedWarning:t,borderError:`1px solid ${g(l,h(S,{alpha:.25}))}`,colorError:g(l,h(S,{alpha:.08})),titleTextColorError:f,iconColorError:S,contentTextColorError:n,closeColorHoverError:u,closeColorPressedError:b,closeIconColorError:x,closeIconColorHoverError:I,closeIconColorPressedError:t}}const ue={common:J,self:fe};var ge=z("alert",`
 line-height: var(--n-line-height);
 border-radius: var(--n-border-radius);
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-color);
 text-align: start;
 word-break: break-word;
`,[i("border",`
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 transition: border-color .3s var(--n-bezier);
 border: var(--n-border);
 pointer-events: none;
 `),$("closable",[z("alert-body",[i("title",`
 padding-right: 24px;
 `)])]),i("icon",{color:"var(--n-icon-color)"}),z("alert-body",{padding:"var(--n-padding)"},[i("title",{color:"var(--n-title-text-color)"}),i("content",{color:"var(--n-content-text-color)"})]),U({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),i("icon",`
 position: absolute;
 left: 0;
 top: 0;
 align-items: center;
 justify-content: center;
 display: flex;
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 margin: var(--n-icon-margin);
 `),i("close",`
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 `),$("show-icon",[z("alert-body",{paddingLeft:"calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))"})]),$("right-adjust",[z("alert-body",{paddingRight:"calc(var(--n-close-size) + var(--n-padding) + 2px)"})]),z("alert-body",`
 border-radius: var(--n-border-radius);
 transition: border-color .3s var(--n-bezier);
 `,[i("title",`
 transition: color .3s var(--n-bezier);
 font-size: 16px;
 line-height: 19px;
 font-weight: var(--n-title-font-weight);
 `,[q("& +",[i("content",{marginTop:"9px"})])]),i("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),i("icon",{transition:"color .3s var(--n-bezier)"})]);const he={...H.props,title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function};var ve=G({name:"Alert",inheritAttrs:!1,props:he,slots:Object,setup(r){const{mergedClsPrefixRef:e,mergedBorderedRef:d,inlineThemeDisabled:p,mergedRtlRef:l}=X(r),v=H("Alert","-alert",ge,ue,r,e),k=Y("Alert",l,e),f=A(()=>{const{common:{cubicBezierEaseInOut:t},self:o}=v.value,{fontSize:P,borderRadius:T,titleFontWeight:S,lineHeight:R,iconSize:w,iconMargin:E,iconMarginRtl:B,closeIconSize:L,closeBorderRadius:j,closeSize:F,closeMargin:M,closeMarginRtl:V,padding:N}=o,{type:a}=r,{left:D,right:O}=le(E);return{"--n-bezier":t,"--n-color":o[c("color",a)],"--n-close-icon-size":L,"--n-close-border-radius":j,"--n-close-color-hover":o[c("closeColorHover",a)],"--n-close-color-pressed":o[c("closeColorPressed",a)],"--n-close-icon-color":o[c("closeIconColor",a)],"--n-close-icon-color-hover":o[c("closeIconColorHover",a)],"--n-close-icon-color-pressed":o[c("closeIconColorPressed",a)],"--n-icon-color":o[c("iconColor",a)],"--n-border":o[c("border",a)],"--n-title-text-color":o[c("titleTextColor",a)],"--n-content-text-color":o[c("contentTextColor",a)],"--n-line-height":R,"--n-border-radius":T,"--n-font-size":P,"--n-title-font-weight":S,"--n-icon-size":w,"--n-icon-margin":E,"--n-icon-margin-rtl":B,"--n-close-size":F,"--n-close-margin":M,"--n-close-margin-rtl":V,"--n-padding":N,"--n-icon-margin-left":D,"--n-icon-margin-right":O}}),n=p?Z("alert",A(()=>r.type[0]),f,r):void 0,u=ee(!0),b=()=>{const{onAfterLeave:t,onAfterHide:o}=r;t&&t(),o&&o()};return{rtlEnabled:k,mergedClsPrefix:e,mergedBordered:d,visible:u,handleCloseClick:()=>{var t;Promise.resolve((t=r.onClose)==null?void 0:t.call(r)).then(o=>{o!==!1&&(u.value=!1)})},handleAfterLeave:()=>{b()},mergedTheme:v,cssVars:p?void 0:f,themeClass:n==null?void 0:n.themeClass,onRender:n==null?void 0:n.onRender}},render(){var r;return(r=this.onRender)==null||r.call(this),s(),m(Q,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:e,$slots:d}=this,p={class:[`${e}-alert`,this.themeClass,this.closable&&`${e}-alert--closable`,this.showIcon&&`${e}-alert--show-icon`,!this.title&&this.closable&&`${e}-alert--right-adjust`,this.rtlEnabled&&`${e}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?(s(),_("div",W({key:1},W(this.$attrs,p)),[C(()=>this.closable&&(s(),m(oe,{clsPrefix:e,class:y(`${e}-alert__close`),onClick:this.handleCloseClick},null,8,["clsPrefix","class","onClick"]))),C(()=>this.bordered&&(s(),_("div",{class:y(`${e}-alert__border`)},null,2))),C(()=>this.showIcon&&(s(),_("div",{class:y(`${e}-alert__icon`),"aria-hidden":"true"},[C(()=>re(d.icon,()=>[(s(),m(se,{clsPrefix:e},{default:()=>{switch(this.type){case"success":return s(),m(de,{key:3});case"info":return s(),m(ce,{key:4});case"warning":return s(),m(ae,{key:5});case"error":return s(),m(ie,{key:6});default:return null}}},1032,["clsPrefix"]))]))],2))),ne("div",{class:y([`${e}-alert-body`,this.mergedBordered&&`${e}-alert-body--bordered`])},[C(()=>te(d.header,l=>{const v=l||this.title;return v?(s(),_("div",{key:2,class:y(`${e}-alert-body__title`)},[C(()=>v)],2)):null})),C(()=>d.default&&(s(),_("div",{class:y(`${e}-alert-body__content`)},[C(()=>d.default())],2)))],2)],16)):null}},1032,["onAfterLeave"])}});export{ve as A};
