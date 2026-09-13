import{E as G,G as u,ab as h,N as z,ad as i,ac as $,c8 as J,M as K,d as X,H as W,e as p,c9 as Y,J as q,T as Q,ah as U,g as A,k as Z,o as s,a as _,Y as C,aP as ee,O as y,$ as oe,b as re,X as ne,ap as H,aE as te,ai as c,a0 as le,ca as se,cb as ie,cc as ae,cd as ce}from"./index-BrC03CDs.js";var de={iconMargin:"11px 8px 0 12px",iconMarginRtl:"11px 12px 0 8px",iconSize:"24px",closeIconSize:"16px",closeSize:"20px",closeMargin:"13px 14px 0 0",closeMarginRtl:"13px 0 0 14px",padding:"13px"};function fe(r){const{lineHeight:e,borderRadius:d,fontWeightStrong:x,baseColor:l,dividerColor:v,actionColor:E,textColor1:f,textColor2:n,closeColorHover:g,closeColorPressed:b,closeIconColor:m,closeIconColorHover:I,closeIconColorPressed:t,infoColor:o,successColor:P,warningColor:S,errorColor:T,fontSize:R}=r;return{...de,fontSize:R,lineHeight:e,titleFontWeight:x,borderRadius:d,border:`1px solid ${v}`,color:E,titleTextColor:f,iconColor:n,contentTextColor:n,closeBorderRadius:d,closeColorHover:g,closeColorPressed:b,closeIconColor:m,closeIconColorHover:I,closeIconColorPressed:t,borderInfo:`1px solid ${u(l,h(o,{alpha:.25}))}`,colorInfo:u(l,h(o,{alpha:.08})),titleTextColorInfo:f,iconColorInfo:o,contentTextColorInfo:n,closeColorHoverInfo:g,closeColorPressedInfo:b,closeIconColorInfo:m,closeIconColorHoverInfo:I,closeIconColorPressedInfo:t,borderSuccess:`1px solid ${u(l,h(P,{alpha:.25}))}`,colorSuccess:u(l,h(P,{alpha:.08})),titleTextColorSuccess:f,iconColorSuccess:P,contentTextColorSuccess:n,closeColorHoverSuccess:g,closeColorPressedSuccess:b,closeIconColorSuccess:m,closeIconColorHoverSuccess:I,closeIconColorPressedSuccess:t,borderWarning:`1px solid ${u(l,h(S,{alpha:.33}))}`,colorWarning:u(l,h(S,{alpha:.08})),titleTextColorWarning:f,iconColorWarning:S,contentTextColorWarning:n,closeColorHoverWarning:g,closeColorPressedWarning:b,closeIconColorWarning:m,closeIconColorHoverWarning:I,closeIconColorPressedWarning:t,borderError:`1px solid ${u(l,h(T,{alpha:.25}))}`,colorError:u(l,h(T,{alpha:.08})),titleTextColorError:f,iconColorError:T,contentTextColorError:n,closeColorHoverError:g,closeColorPressedError:b,closeIconColorError:m,closeIconColorHoverError:I,closeIconColorPressedError:t}}const ge={common:G,self:fe};var ue=z("alert",`
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
 `)])]),i("icon",{color:"var(--n-icon-color)"}),z("alert-body",{padding:"var(--n-padding)"},[i("title",{color:"var(--n-title-text-color)"}),i("content",{color:"var(--n-content-text-color)"})]),J({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),i("icon",`
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
 `,[K("& +",[i("content",{marginTop:"9px"})])]),i("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),i("icon",{transition:"color .3s var(--n-bezier)"})]);const he={...W.props,title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function};var ve=X({name:"Alert",inheritAttrs:!1,props:he,slots:Object,setup(r){const{mergedClsPrefixRef:e,mergedBorderedRef:d,inlineThemeDisabled:x,mergedRtlRef:l}=q(r),v=W("Alert","-alert",ue,ge,r,e),E=Q("Alert",l,e),f=A(()=>{const{common:{cubicBezierEaseInOut:t},self:o}=v.value,{fontSize:P,borderRadius:S,titleFontWeight:T,lineHeight:R,iconSize:w,iconMargin:k,iconMarginRtl:B,closeIconSize:M,closeBorderRadius:L,closeSize:F,closeMargin:V,closeMarginRtl:j,padding:N}=o,{type:a}=r,{left:O,right:D}=te(k);return{"--n-bezier":t,"--n-color":o[c("color",a)],"--n-close-icon-size":M,"--n-close-border-radius":L,"--n-close-color-hover":o[c("closeColorHover",a)],"--n-close-color-pressed":o[c("closeColorPressed",a)],"--n-close-icon-color":o[c("closeIconColor",a)],"--n-close-icon-color-hover":o[c("closeIconColorHover",a)],"--n-close-icon-color-pressed":o[c("closeIconColorPressed",a)],"--n-icon-color":o[c("iconColor",a)],"--n-border":o[c("border",a)],"--n-title-text-color":o[c("titleTextColor",a)],"--n-content-text-color":o[c("contentTextColor",a)],"--n-line-height":R,"--n-border-radius":S,"--n-font-size":P,"--n-title-font-weight":T,"--n-icon-size":w,"--n-icon-margin":k,"--n-icon-margin-rtl":B,"--n-close-size":F,"--n-close-margin":V,"--n-close-margin-rtl":j,"--n-padding":N,"--n-icon-margin-left":O,"--n-icon-margin-right":D}}),n=x?U("alert",A(()=>r.type[0]),f,r):void 0,g=Z(!0),b=()=>{const{onAfterLeave:t,onAfterHide:o}=r;t&&t(),o&&o()};return{rtlEnabled:E,mergedClsPrefix:e,mergedBordered:d,visible:g,handleCloseClick:()=>{var t;Promise.resolve((t=r.onClose)==null?void 0:t.call(r)).then(o=>{o!==!1&&(g.value=!1)})},handleAfterLeave:()=>{b()},mergedTheme:v,cssVars:x?void 0:f,themeClass:n==null?void 0:n.themeClass,onRender:n==null?void 0:n.onRender}},render(){var r;return(r=this.onRender)==null||r.call(this),s(),p(Y,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:e,$slots:d}=this,x={class:[`${e}-alert`,this.themeClass,this.closable&&`${e}-alert--closable`,this.showIcon&&`${e}-alert--show-icon`,!this.title&&this.closable&&`${e}-alert--right-adjust`,this.rtlEnabled&&`${e}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?(s(),_("div",H({key:1},H(this.$attrs,x)),[C(()=>this.closable&&(s(),p(ee,{clsPrefix:e,class:y(`${e}-alert__close`),onClick:this.handleCloseClick},null,8,["clsPrefix","class","onClick"]))),C(()=>this.bordered&&(s(),_("div",{class:y(`${e}-alert__border`)},null,2))),C(()=>this.showIcon&&(s(),_("div",{class:y(`${e}-alert__icon`),"aria-hidden":"true"},[C(()=>oe(d.icon,()=>[(s(),p(le,{clsPrefix:e},{default:()=>{switch(this.type){case"success":return s(),p(ce,{key:3});case"info":return s(),p(ae,{key:4});case"warning":return s(),p(ie,{key:5});case"error":return s(),p(se,{key:6});default:return null}}},1032,["clsPrefix"]))]))],2))),re("div",{class:y([`${e}-alert-body`,this.mergedBordered&&`${e}-alert-body--bordered`])},[C(()=>ne(d.header,l=>{const v=l||this.title;return v?(s(),_("div",{key:2,class:y(`${e}-alert-body__title`)},[C(()=>v)],2)):null})),C(()=>d.default&&(s(),_("div",{class:y(`${e}-alert-body__content`)},[C(()=>d.default())],2)))],2)],16)):null}},1032,["onAfterLeave"])}});export{ve as A};
