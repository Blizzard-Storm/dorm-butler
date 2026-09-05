import{T as oe}from"./Tag-BDWJ2205.js";import{A as Oe}from"./Alert-DquM4lj0.js";import{ab as Ae,bR as He,g as D,E as ye,M,N as p,aj as V,ak as w,d as ne,H as ee,o as m,a as x,O as y,Y as C,aa as A,J as _e,h as Me,R as he,an as Ce,k as Y,a2 as xe,G as Q,al as we,bS as Ue,bT as Ke,ap as qe,b as u,bU as Ge,ao as H,ai as Xe,bJ as $e,br as be,X as J,e as Se,P as Ye,U as fe,aH as Je,av as Qe,bK as Ze,aB as pe,aA as q,j as f,w as g,u as d,a3 as re,F as me,f as ge,t as z,a_ as et,l as Z,q as R,s as tt,bV as ke,a4 as ae,x as ze,n as je,B as ot,_ as rt}from"./index-2nvU8qd5.js";import{g as lt}from"./get-slot-VaplJ9hC.js";import{u as nt}from"./use-compitable-D77EeJMM.js";import{u as at}from"./use-message-BB5VV9Nm.js";import{S as ve,a as it}from"./Slider-k5F7OWHS.js";import{u as st}from"./use-merged-state-ClOgiocA.js";import"./Follower-43Ga-Qaz.js";function dt(e,o){const s=Ae(He,null);return D(()=>e.hljs||(s==null?void 0:s.mergedHljsRef.value))}function ct(e){const{textColor2:o,fontSize:s,fontWeightStrong:l,textColor3:h}=e;return{textColor:o,fontSize:s,fontWeightStrong:l,"mono-3":"#a0a1a7","hue-1":"#0184bb","hue-2":"#4078f2","hue-3":"#a626a4","hue-4":"#50a14f","hue-5":"#e45649","hue-5-2":"#c91243","hue-6":"#986801","hue-6-2":"#c18401",lineNumberTextColor:h}}const ut={common:ye,self:ct};var ht=M([p("code",`
 font-size: var(--n-font-size);
 font-family: var(--n-font-family);
 `,[V("show-line-numbers",`
 display: flex;
 `),w("line-numbers",`
 user-select: none;
 padding-right: 12px;
 text-align: right;
 transition: color .3s var(--n-bezier);
 color: var(--n-line-number-text-color);
 `),V("word-wrap",[M("pre",`
 white-space: pre-wrap;
 word-break: break-all;
 `)]),M("pre",`
 margin: 0;
 line-height: inherit;
 font-size: inherit;
 font-family: inherit;
 `),M("[class^=hljs]",`
 color: var(--n-text-color);
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),({props:e})=>{const o=`${e.bPrefix}code`;return[`${o} .hljs-comment,
 ${o} .hljs-quote {
 color: var(--n-mono-3);
 font-style: italic;
 }`,`${o} .hljs-doctag,
 ${o} .hljs-keyword,
 ${o} .hljs-formula {
 color: var(--n-hue-3);
 }`,`${o} .hljs-section,
 ${o} .hljs-name,
 ${o} .hljs-selector-tag,
 ${o} .hljs-deletion,
 ${o} .hljs-subst {
 color: var(--n-hue-5);
 }`,`${o} .hljs-literal {
 color: var(--n-hue-1);
 }`,`${o} .hljs-string,
 ${o} .hljs-regexp,
 ${o} .hljs-addition,
 ${o} .hljs-attribute,
 ${o} .hljs-meta-string {
 color: var(--n-hue-4);
 }`,`${o} .hljs-built_in,
 ${o} .hljs-class .hljs-title {
 color: var(--n-hue-6-2);
 }`,`${o} .hljs-attr,
 ${o} .hljs-variable,
 ${o} .hljs-template-variable,
 ${o} .hljs-type,
 ${o} .hljs-selector-class,
 ${o} .hljs-selector-attr,
 ${o} .hljs-selector-pseudo,
 ${o} .hljs-number {
 color: var(--n-hue-6);
 }`,`${o} .hljs-symbol,
 ${o} .hljs-bullet,
 ${o} .hljs-link,
 ${o} .hljs-meta,
 ${o} .hljs-selector-id,
 ${o} .hljs-title {
 color: var(--n-hue-2);
 }`,`${o} .hljs-emphasis {
 font-style: italic;
 }`,`${o} .hljs-strong {
 font-weight: var(--n-font-weight-strong);
 }`,`${o} .hljs-link {
 text-decoration: underline;
 }`]}]);const bt={...ee.props,language:String,code:{type:String,default:""},trim:{type:Boolean,default:!0},hljs:Object,uri:Boolean,inline:Boolean,wordWrap:Boolean,showLineNumbers:Boolean,internalFontSize:Number,internalNoHighlight:Boolean};var ft=ne({name:"Code",props:bt,setup(e,{slots:o}){const{internalNoHighlight:s}=e,{mergedClsPrefixRef:l,inlineThemeDisabled:h}=_e(),v=Y(null),k=s?{value:void 0}:dt(e),_=(c,r,n)=>{const{value:a}=k;return!a||!(c&&a.getLanguage(c))?null:a.highlight(n?r.trim():r,{language:c}).value},$=D(()=>e.inline||e.wordWrap?!1:e.showLineNumbers),S=()=>{if(o.default)return;const{value:c}=v;if(!c)return;const{language:r}=e,n=e.uri?window.decodeURIComponent(e.code):e.code;if(r){const B=_(r,n,e.trim);if(B!==null){if(e.inline)c.innerHTML=B;else{const W=c.querySelector(".__code__");W&&c.removeChild(W);const P=document.createElement("pre");P.className="__code__",P.innerHTML=B,c.appendChild(P)}return}}if(e.inline){c.textContent=n;return}const a=c.querySelector(".__code__");if(a)a.textContent=n;else{const B=document.createElement("pre");B.className="__code__",B.textContent=n,c.innerHTML="",c.appendChild(B)}};Me(S),he(xe(e,"language"),S),he(xe(e,"code"),S),s||he(k,S);const j=ee("Code","-code",ht,ut,e,l),i=D(()=>{const{common:{cubicBezierEaseInOut:c,fontFamilyMono:r},self:{textColor:n,fontSize:a,fontWeightStrong:B,lineNumberTextColor:W,"mono-3":P,"hue-1":N,"hue-2":U,"hue-3":K,"hue-4":I,"hue-5":L,"hue-5-2":b,"hue-6":T,"hue-6-2":F}}=j.value,{internalFontSize:E}=e;return{"--n-font-size":E?`${E}px`:a,"--n-font-family":r,"--n-font-weight-strong":B,"--n-bezier":c,"--n-text-color":n,"--n-mono-3":P,"--n-hue-1":N,"--n-hue-2":U,"--n-hue-3":K,"--n-hue-4":I,"--n-hue-5":L,"--n-hue-5-2":b,"--n-hue-6":T,"--n-hue-6-2":F,"--n-line-number-text-color":W}}),t=h?Ce("code",D(()=>`${e.internalFontSize||"a"}`),i,e):void 0;return{mergedClsPrefix:l,codeRef:v,mergedShowLineNumbers:$,lineNumbers:D(()=>{let c=1;const r=[];let n=!1;for(const a of e.code)a===`
`?(n=!0,r.push(c++)):n=!1;return n||r.push(c++),r.join(`
`)}),cssVars:h?void 0:i,themeClass:t==null?void 0:t.themeClass,onRender:t==null?void 0:t.onRender}},render(){const{mergedClsPrefix:e,wordWrap:o,mergedShowLineNumbers:s,onRender:l}=this;return l==null||l(),m(),x("code",{class:y([`${e}-code`,this.themeClass,o&&`${e}-code--word-wrap`,s&&`${e}-code--show-line-numbers`]),style:A(this.cssVars),ref:"codeRef"},[s?(m(),x("pre",{key:0,class:y(`${e}-code__line-numbers`)},[C(()=>this.lineNumbers)],2)):C(()=>null),C(()=>{var h,v;return(v=(h=this.$slots).default)==null?void 0:v.call(h)})],6)}}),pt={thPaddingBorderedSmall:"8px 12px",thPaddingBorderedMedium:"12px 16px",thPaddingBorderedLarge:"16px 24px",thPaddingSmall:"0",thPaddingMedium:"0",thPaddingLarge:"0",tdPaddingBorderedSmall:"8px 12px",tdPaddingBorderedMedium:"12px 16px",tdPaddingBorderedLarge:"16px 24px",tdPaddingSmall:"0 0 8px 0",tdPaddingMedium:"0 0 12px 0",tdPaddingLarge:"0 0 16px 0"};function mt(e){const{tableHeaderColor:o,textColor2:s,textColor1:l,cardColor:h,modalColor:v,popoverColor:k,dividerColor:_,borderRadius:$,fontWeightStrong:S,lineHeight:j,fontSizeSmall:i,fontSizeMedium:t,fontSizeLarge:c}=e;return{...pt,lineHeight:j,fontSizeSmall:i,fontSizeMedium:t,fontSizeLarge:c,titleTextColor:l,thColor:Q(h,o),thColorModal:Q(v,o),thColorPopover:Q(k,o),thTextColor:l,thFontWeight:S,tdTextColor:s,tdColor:h,tdColorModal:v,tdColorPopover:k,borderColor:Q(h,_),borderColorModal:Q(v,_),borderColorPopover:Q(k,_),borderRadius:$}}const gt={common:ye,self:mt};function Re(e,o="default",s=[]){const{children:l}=e;if(l!==null&&typeof l=="object"&&!Array.isArray(l)){const h=l[o];if(typeof h=="function")return h()}return s}var vt=M([p("descriptions",{fontSize:"var(--n-font-size)"},[p("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),p("descriptions-table-wrapper",[p("descriptions-table",[p("descriptions-table-row",[p("descriptions-table-header",{padding:"var(--n-th-padding)"}),p("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),we("bordered",[p("descriptions-table-wrapper",[p("descriptions-table",[p("descriptions-table-row",[M("&:last-child",[p("descriptions-table-content",{paddingBottom:0})])])])])]),V("left-label-placement",[p("descriptions-table-content",[M("> *",{verticalAlign:"top"})])]),V("left-label-align",[M("th",{textAlign:"left"})]),V("center-label-align",[M("th",{textAlign:"center"})]),V("right-label-align",[M("th",{textAlign:"right"})]),V("bordered",[p("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[p("descriptions-table",[p("descriptions-table-row",[M("&:not(:last-child)",[p("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),p("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),p("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[M("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),p("descriptions-table-content",[M("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),p("descriptions-header",`
 font-weight: var(--n-th-font-weight);
 font-size: 18px;
 transition: color .3s var(--n-bezier);
 line-height: var(--n-line-height);
 margin-bottom: 16px;
 color: var(--n-title-text-color);
 `),p("descriptions-table-wrapper",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[p("descriptions-table",`
 width: 100%;
 border-collapse: separate;
 border-spacing: 0;
 box-sizing: border-box;
 `,[p("descriptions-table-row",`
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[p("descriptions-table-header",`
 font-weight: var(--n-th-font-weight);
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-th-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),p("descriptions-table-content",`
 vertical-align: top;
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-td-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[w("content",`
 transition: color .3s var(--n-bezier);
 display: inline-block;
 color: var(--n-td-text-color);
 `)]),w("label",`
 font-weight: var(--n-th-font-weight);
 transition: color .3s var(--n-bezier);
 display: inline-block;
 margin-right: 14px;
 color: var(--n-th-text-color);
 `)])])])]),p("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 `),Ue(p("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),Ke(p("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]);const xt="DESCRIPTION_ITEM_FLAG";function wt(e){return typeof e=="object"&&e&&!Array.isArray(e)?e.type&&e.type.DESCRIPTION_ITEM_FLAG:!1}const yt=["colspan"],_t=["colspan"],Ct=["colspan"],$t=["colspan"],St={...ee.props,title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:String,bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var Be=ne({name:"Descriptions",props:St,slots:Object,setup(e){const{mergedClsPrefixRef:o,inlineThemeDisabled:s,mergedComponentPropsRef:l}=_e(e),h=D(()=>{var $,S;return e.size||((S=($=l==null?void 0:l.value)==null?void 0:$.Descriptions)==null?void 0:S.size)||"medium"}),v=ee("Descriptions","-descriptions",vt,gt,e,o),k=D(()=>{const{bordered:$}=e,S=h.value,{common:{cubicBezierEaseInOut:j},self:{titleTextColor:i,thColor:t,thColorModal:c,thColorPopover:r,thTextColor:n,thFontWeight:a,tdTextColor:B,tdColor:W,tdColorModal:P,tdColorPopover:N,borderColor:U,borderColorModal:K,borderColorPopover:I,borderRadius:L,lineHeight:b,[H("fontSize",S)]:T,[H($?"thPaddingBordered":"thPadding",S)]:F,[H($?"tdPaddingBordered":"tdPadding",S)]:E}}=v.value;return{"--n-title-text-color":i,"--n-th-padding":F,"--n-td-padding":E,"--n-font-size":T,"--n-bezier":j,"--n-th-font-weight":a,"--n-line-height":b,"--n-th-text-color":n,"--n-td-text-color":B,"--n-th-color":t,"--n-th-color-modal":c,"--n-th-color-popover":r,"--n-td-color":W,"--n-td-color-modal":P,"--n-td-color-popover":N,"--n-border-radius":L,"--n-border-color":U,"--n-border-color-modal":K,"--n-border-color-popover":I}}),_=s?Ce("descriptions",D(()=>{let $="";const{bordered:S}=e;return S&&($+="a"),$+=h.value[0],$}),k,e):void 0;return{mergedClsPrefix:o,cssVars:s?void 0:k,themeClass:_==null?void 0:_.themeClass,onRender:_==null?void 0:_.onRender,compitableColumn:nt(e,["columns","column"]),inlineThemeDisabled:s,mergedSize:h}},render(){const e=this.$slots.default,o=e?qe(e()):[];o.length;const{contentClass:s,labelClass:l,compitableColumn:h,labelPlacement:v,labelAlign:k,mergedSize:_,bordered:$,title:S,cssVars:j,mergedClsPrefix:i,separator:t,onRender:c}=this;c==null||c();const r=o.filter(a=>wt(a)),n=r.reduce((a,B,W)=>{const P=B.props||{},N=r.length-1===W,U=["label"in P?P.label:Re(B,"label")],K=[Re(B)],I=P.span||1,L=a.span;a.span+=I;const b=P.labelStyle||P["label-style"]||this.labelStyle,T=P.contentStyle||P["content-style"]||this.contentStyle;if(v==="left")$?a.row.push((m(),x("th",{key:1,class:y([`${i}-descriptions-table-header`,l]),colspan:1,style:A(b)},[C(()=>U)],6)),(m(),x("td",{key:2,class:y([`${i}-descriptions-table-content`,s]),colspan:N?(h-L)*2+1:I*2-1,style:A(T)},[C(()=>K)],14,yt))):a.row.push((m(),x("td",{key:3,class:y(`${i}-descriptions-table-content`),colspan:N?(h-L)*2:I*2},[u("span",{class:y([`${i}-descriptions-table-content__label`,l]),style:A(b)},[C(()=>[...U,t&&(m(),x("span",{key:4,class:y(`${i}-descriptions-separator`)},[C(()=>t)],2))])],6),u("span",{class:y([`${i}-descriptions-table-content__content`,s]),style:A(T)},[C(()=>K)],6)],10,_t)));else{const F=N?(h-L)*2:I*2;a.row.push((m(),x("th",{key:5,class:y([`${i}-descriptions-table-header`,l]),colspan:F,style:A(b)},[C(()=>U)],14,Ct))),a.secondRow.push((m(),x("td",{key:6,class:y([`${i}-descriptions-table-content`,s]),colspan:F,style:A(T)},[C(()=>K)],14,$t)))}return(a.span>=h||N)&&(a.span=0,a.row.length&&(a.rows.push(a.row),a.row=[]),v!=="left"&&a.secondRow.length&&(a.rows.push(a.secondRow),a.secondRow=[])),a},{span:0,row:[],secondRow:[],rows:[]}).rows.map(a=>(m(),x("tr",{class:y(`${i}-descriptions-table-row`)},[C(()=>a)],2)));return m(),x("div",{style:A(j),class:y([`${i}-descriptions`,this.themeClass,`${i}-descriptions--${v}-label-placement`,`${i}-descriptions--${k}-label-align`,`${i}-descriptions--${_}-size`,$&&`${i}-descriptions--bordered`])},[S||this.$slots.header?(m(),x("div",{key:0,class:y(`${i}-descriptions-header`)},[C(()=>S||lt(this,"header"))],2)):C(()=>null),u("div",{class:y(`${i}-descriptions-table-wrapper`)},[u("table",{class:y(`${i}-descriptions-table`)},[u("tbody",null,[C(()=>v==="top"&&(m(),x("tr",{class:y(`${i}-descriptions-table-row`),style:{visibility:"collapse"}},[C(()=>Ge(h*2,(m(),x("td"))))],2))),C(()=>n)])],2)],2)],6)}});const kt={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var O=ne({name:"DescriptionsItem",[xt]:!0,props:kt,slots:Object,render(){return null}}),zt={buttonHeightSmall:"14px",buttonHeightMedium:"18px",buttonHeightLarge:"22px",buttonWidthSmall:"14px",buttonWidthMedium:"18px",buttonWidthLarge:"22px",buttonWidthPressedSmall:"20px",buttonWidthPressedMedium:"24px",buttonWidthPressedLarge:"28px",railHeightSmall:"18px",railHeightMedium:"22px",railHeightLarge:"26px",railWidthSmall:"32px",railWidthMedium:"40px",railWidthLarge:"48px"};function jt(e){const{primaryColor:o,opacityDisabled:s,borderRadius:l,textColor3:h}=e;return{...zt,iconColor:h,textColor:"white",loadingColor:o,opacityDisabled:s,railColor:"rgba(0, 0, 0, .14)",railColorActive:o,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:l,railBorderRadiusMedium:l,railBorderRadiusLarge:l,buttonBorderRadiusSmall:l,buttonBorderRadiusMedium:l,buttonBorderRadiusLarge:l,boxShadowFocus:`0 0 0 2px ${Xe(o,{alpha:.2})}`}}const Rt={common:ye,self:jt};var Bt=p("switch",`
 height: var(--n-height);
 min-width: var(--n-width);
 vertical-align: middle;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 outline: none;
 justify-content: center;
 align-items: center;
`,[w("children-placeholder",`
 height: var(--n-rail-height);
 display: flex;
 flex-direction: column;
 overflow: hidden;
 pointer-events: none;
 visibility: hidden;
 `),w("rail-placeholder",`
 display: flex;
 flex-wrap: none;
 `),w("button-placeholder",`
 width: calc(1.75 * var(--n-rail-height));
 height: var(--n-rail-height);
 `),p("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[$e({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),w("checked, unchecked",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 box-sizing: border-box;
 position: absolute;
 white-space: nowrap;
 top: 0;
 bottom: 0;
 display: flex;
 align-items: center;
 line-height: 1;
 `),w("checked",`
 right: 0;
 padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),w("unchecked",`
 left: 0;
 justify-content: flex-end;
 padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),M("&:focus",[w("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),V("round",[w("rail","border-radius: calc(var(--n-rail-height) / 2);",[w("button","border-radius: calc(var(--n-button-height) / 2);")])]),we("disabled",[we("icon",[V("rubber-band",[V("pressed",[w("rail",[w("button","max-width: var(--n-button-width-pressed);")])]),w("rail",[M("&:active",[w("button","max-width: var(--n-button-width-pressed);")])]),V("active",[V("pressed",[w("rail",[w("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),w("rail",[M("&:active",[w("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),V("active",[w("rail",[w("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),w("rail",`
 overflow: hidden;
 height: var(--n-rail-height);
 min-width: var(--n-rail-width);
 border-radius: var(--n-rail-border-radius);
 cursor: pointer;
 position: relative;
 transition:
 opacity .3s var(--n-bezier),
 background .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-rail-color);
 `,[w("button-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 font-size: calc(var(--n-button-height) - 4px);
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 display: flex;
 justify-content: center;
 align-items: center;
 line-height: 1;
 `,[$e()]),w("button",`
 align-items: center; 
 top: var(--n-offset);
 left: var(--n-offset);
 height: var(--n-button-height);
 width: var(--n-button-width-pressed);
 max-width: var(--n-button-width);
 border-radius: var(--n-button-border-radius);
 background-color: var(--n-button-color);
 box-shadow: var(--n-button-box-shadow);
 box-sizing: border-box;
 cursor: inherit;
 content: "";
 position: absolute;
 transition:
 background-color .3s var(--n-bezier),
 left .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 max-width .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `)]),V("active",[w("rail","background-color: var(--n-rail-color-active);")]),V("loading",[w("rail",`
 cursor: wait;
 `)]),V("disabled",[w("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]);const Pt=["aria-checked","tabindex","onClick","onFocus","onBlur","onKeyup","onKeydown"],Mt={...ee.props,size:String,value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},spinProps:Object,onChange:[Function,Array]};let le;var Pe=ne({name:"Switch",props:Mt,slots:Object,setup(e){le===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?le=CSS.supports("width","max(1px)"):le=!1:le=!0);const{mergedClsPrefixRef:o,inlineThemeDisabled:s,mergedComponentPropsRef:l}=_e(e),h=ee("Switch","-switch",Bt,Rt,e,o),v=Ye(e,{mergedSize(b){var F,E;if(e.size!==void 0)return e.size;if(b)return b.mergedSize.value;const T=(E=(F=l==null?void 0:l.value)==null?void 0:F.Switch)==null?void 0:E.size;return T||"medium"}}),{mergedSizeRef:k,mergedDisabledRef:_}=v,$=Y(e.defaultValue),S=xe(e,"value"),j=st(S,$),i=D(()=>j.value===e.checkedValue),t=Y(!1),c=Y(!1),r=D(()=>{const{railStyle:b}=e;if(b)return b({focused:c.value,checked:i.value})});function n(b){const{"onUpdate:value":T,onChange:F,onUpdateValue:E}=e,{nTriggerFormInput:ie,nTriggerFormChange:se}=v;T&&fe(T,b),E&&fe(E,b),F&&fe(F,b),$.value=b,ie(),se()}function a(){const{nTriggerFormFocus:b}=v;b()}function B(){const{nTriggerFormBlur:b}=v;b()}function W(){e.loading||_.value||(j.value!==e.checkedValue?n(e.checkedValue):n(e.uncheckedValue))}function P(){c.value=!0,a()}function N(){c.value=!1,B(),t.value=!1}function U(b){e.loading||_.value||b.key===" "&&(j.value!==e.checkedValue?n(e.checkedValue):n(e.uncheckedValue),t.value=!1)}function K(b){e.loading||_.value||b.key===" "&&(b.preventDefault(),t.value=!0)}const I=D(()=>{const{value:b}=k,{self:{opacityDisabled:T,railColor:F,railColorActive:E,buttonBoxShadow:ie,buttonColor:se,boxShadowFocus:Ve,loadingColor:Te,textColor:Le,iconColor:Fe,[H("buttonHeight",b)]:G,[H("buttonWidth",b)]:De,[H("buttonWidthPressed",b)]:Ee,[H("railHeight",b)]:X,[H("railWidth",b)]:te,[H("railBorderRadius",b)]:Ie,[H("buttonBorderRadius",b)]:We},common:{cubicBezierEaseInOut:Ne}}=h.value;let de,ce,ue;return le?(de=`calc((${X} - ${G}) / 2)`,ce=`max(${X}, ${G})`,ue=`max(${te}, calc(${te} + ${G} - ${X}))`):(de=pe((q(X)-q(G))/2),ce=pe(Math.max(q(X),q(G))),ue=q(X)>q(G)?te:pe(q(te)+q(G)-q(X))),{"--n-bezier":Ne,"--n-button-border-radius":We,"--n-button-box-shadow":ie,"--n-button-color":se,"--n-button-width":De,"--n-button-width-pressed":Ee,"--n-button-height":G,"--n-height":ce,"--n-offset":de,"--n-opacity-disabled":T,"--n-rail-border-radius":Ie,"--n-rail-color":F,"--n-rail-color-active":E,"--n-rail-height":X,"--n-rail-width":te,"--n-width":ue,"--n-box-shadow-focus":Ve,"--n-loading-color":Te,"--n-text-color":Le,"--n-icon-color":Fe}}),L=s?Ce("switch",D(()=>k.value[0]),I,e):void 0;return{handleClick:W,handleBlur:N,handleFocus:P,handleKeyup:U,handleKeydown:K,mergedRailStyle:r,pressed:t,mergedClsPrefix:o,mergedValue:j,checked:i,mergedDisabled:_,cssVars:s?void 0:I,themeClass:L==null?void 0:L.themeClass,onRender:L==null?void 0:L.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:o,checked:s,mergedRailStyle:l,onRender:h,$slots:v}=this;h==null||h();const{checked:k,unchecked:_,icon:$,"checked-icon":S,"unchecked-icon":j}=v,i=!(be($)&&be(S)&&be(j));return m(),x("div",{role:"switch","aria-checked":s,class:y([`${e}-switch`,this.themeClass,i&&`${e}-switch--icon`,s&&`${e}-switch--active`,o&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`]),tabindex:this.mergedDisabled?void 0:0,style:A(this.cssVars),onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},[u("div",{class:y(`${e}-switch__rail`),"aria-hidden":"true",style:A(l)},[C(()=>J(k,t=>J(_,c=>t||c?(m(),x("div",{key:4,"aria-hidden":!0,class:y(`${e}-switch__children-placeholder`)},[u("div",{class:y(`${e}-switch__rail-placeholder`)},[u("div",{class:y(`${e}-switch__button-placeholder`)},null,2),C(()=>t)],2),u("div",{class:y(`${e}-switch__rail-placeholder`)},[u("div",{class:y(`${e}-switch__button-placeholder`)},null,2),C(()=>c)],2)],2)):null))),u("div",{class:y(`${e}-switch__button`)},[C(()=>J($,t=>J(S,c=>J(j,r=>(m(),Se(Ze,null,{default:()=>this.loading?(m(),Se(Je,Qe({key:"loading",clsPrefix:e,strokeWidth:20},this.spinProps),null,16,["clsPrefix"])):this.checked&&(c||t)?(m(),x("div",{class:y(`${e}-switch__button-icon`),key:c?"checked-icon":"icon"},[C(()=>c||t)],2)):!this.checked&&(r||t)?(m(),x("div",{class:y(`${e}-switch__button-icon`),key:r?"unchecked-icon":"icon"},[C(()=>r||t)],2)):null},1024)))))),C(()=>J(k,t=>t&&(m(),x("div",{key:"checked",class:y(`${e}-switch__checked`)},[C(()=>t)],2)))),C(()=>J(_,t=>t&&(m(),x("div",{key:"unchecked",class:y(`${e}-switch__unchecked`)},[C(()=>t)],2))))],2)],6)],46,Pt)}});const Vt={class:"page"},Tt={class:"mono"},Lt={class:"dim"},Ft={class:"mono small"},Dt={class:"acts"},Et={key:0,class:"dim"},It={key:1,class:"ports"},Wt={class:"mono"},Nt={class:"dim"},Ot={key:0,class:"badline"},At={class:"lbl"},Ht={class:"cap-name mono"},Ut={key:0,class:"dim"},Kt={class:"footnote"},qt=ne({__name:"System",setup(e){const o=at(),s=Y(null),l=D(()=>ot.value),h=D(()=>{var i;return((i=l.value)==null?void 0:i.link.mode)==="mock"}),v=Y(0),k=Y(!1),_=Y(!1);async function $(){var t;s.value=await Z.systemInfo();const i=(t=l.value)==null?void 0:t.link.fault_injection;i&&(v.value=Math.round(i.command_fail_rate*100),k.value=i.node_b_offline,_.value=i.node_c_offline)}async function S(i){await Z.mockFaultRate(i/100),o.info(`命令失败率已设为 ${i}%`)}async function j(i,t){await Z.mockOffline(i,t)}return Me($),(i,t)=>{var c;return m(),x("div",Vt,[t[20]||(t[20]=u("div",{class:"section-title"},"运行模式",-1)),f(d(re),{bordered:!1,class:"c"},{default:g(()=>[f(d(Be),{column:1,"label-placement":"left",size:"small"},{default:g(()=>[f(d(O),{label:"设备模式"},{default:g(()=>[f(d(oe),{type:h.value?"warning":"success",size:"small",round:""},{default:g(()=>[R(z(h.value?"模拟设备 (DEVICE_MODE=mock)":"真实串口 (DEVICE_MODE=serial)"),1)]),_:1},8,["type"])]),_:1}),f(d(O),{label:"串口"},{default:g(()=>{var r,n;return[u("span",Tt,z((r=s.value)==null?void 0:r.configured_port)+" @ "+z((n=s.value)==null?void 0:n.configured_baud)+" 8N1",1)]}),_:1}),f(d(O),{label:"链路状态"},{default:g(()=>{var r,n;return[f(d(oe),{type:(r=l.value)!=null&&r.link.connected?"success":"error",size:"small",round:""},{default:g(()=>{var a;return[R(z((a=l.value)!=null&&a.link.connected?"已连接":"未连接"),1)]}),_:1},8,["type"]),u("span",Lt,"　最后收帧 "+z(d(tt)((n=l.value)==null?void 0:n.link.last_frame_at)),1)]}),_:1}),f(d(O),{label:"WebSocket"},{default:g(()=>[f(d(oe),{type:d(ke)?"success":"error",size:"small",round:""},{default:g(()=>[R(z(d(ke)?"已连接":"断开重连中"),1)]),_:1},8,["type"])]),_:1}),f(d(O),{label:"数据库"},{default:g(()=>{var r;return[u("span",Ft,z((r=s.value)==null?void 0:r.database),1)]}),_:1}),f(d(O),{label:"AI 助手"},{default:g(()=>{var r;return[f(d(oe),{type:(r=s.value)!=null&&r.llm.enabled?"success":"default",size:"small",round:""},{default:g(()=>{var n;return[R(z((n=s.value)!=null&&n.llm.enabled?`已配置 · ${s.value.llm.model}`:"未配置"),1)]}),_:1},8,["type"])]}),_:1})]),_:1}),u("div",Dt,[f(d(ae),{size:"small",onClick:$},{default:g(()=>[...t[8]||(t[8]=[R("刷新",-1)])]),_:1})])]),_:1}),t[21]||(t[21]=u("div",{class:"section-title"},"可用串口",-1)),f(d(re),{bordered:!1,class:"c"},{default:g(()=>{var r;return[(r=s.value)!=null&&r.available_ports.length?(m(),x("div",It,[(m(!0),x(me,null,ze(s.value.available_ports,n=>(m(),x("div",{key:n.device,class:"port"},[u("b",Wt,z(n.device),1),u("span",Nt,z(n.description),1)]))),128))])):(m(),x("div",Et,"没有检测到串口设备。")),t[9]||(t[9]=u("div",{class:"tip"},[R(" 改用真实硬件：在 "),u("span",{class:"mono"},"backend/.env"),R(" 里把 "),u("span",{class:"mono"},"DEVICE_MODE"),R(" 改成 "),u("span",{class:"mono"},"serial"),R("， "),u("span",{class:"mono"},"SERIAL_PORT"),R(" 填 CH340 对应的口，然后重启后端。 ")],-1))]}),_:1}),t[22]||(t[22]=u("div",{class:"section-title"},"通信诊断",-1)),f(d(re),{bordered:!1,class:"c"},{default:g(()=>{var r;return[f(d(Be),{column:2,"label-placement":"top",size:"small"},{default:g(()=>[f(d(O),{label:"485 CRC 累计错误"},{default:g(()=>{var n,a;return[u("b",{class:je({bad:(((n=l.value)==null?void 0:n.diagnostics.crc_errors)??0)>0})},z(((a=l.value)==null?void 0:a.diagnostics.crc_errors)??0),3)]}),_:1}),f(d(O),{label:"已解析报文行"},{default:g(()=>{var n;return[R(z(((n=l.value)==null?void 0:n.diagnostics.frames_ok)??0),1)]}),_:1}),f(d(O),{label:"解析失败行"},{default:g(()=>{var n,a;return[u("b",{class:je({bad:(((n=l.value)==null?void 0:n.diagnostics.frames_bad)??0)>0})},z(((a=l.value)==null?void 0:a.diagnostics.frames_bad)??0),3)]}),_:1}),f(d(O),{label:"丢弃噪声字节"},{default:g(()=>{var n;return[R(z(((n=l.value)==null?void 0:n.link.bytes_dropped)??0),1)]}),_:1})]),_:1}),(r=l.value)!=null&&r.link.last_bad_line?(m(),x("div",Ot,[t[10]||(t[10]=R(" 最近一条无法解析的行： ",-1)),f(d(ft),{code:l.value.link.last_bad_line,"word-wrap":""},null,8,["code"])])):ge("",!0),t[11]||(t[11]=u("div",{class:"tip"}," CRC 错误长期为 0 才算总线健康。持续增长时先把三块板的 BUS_BAUD 一起降到 1200 重新下载，再检查 485 的 A/B 是否接反。 ",-1))]}),_:1}),h.value?(m(),x(me,{key:0},[t[19]||(t[19]=u("div",{class:"section-title"},"故障注入（仅模拟模式）",-1)),f(d(re),{bordered:!1,class:"c"},{default:g(()=>[f(d(Oe),{type:"info",bordered:!1,style:{"margin-bottom":"16px"}},{default:g(()=>[...t[12]||(t[12]=[R(' 用来演示"命令失败/超时"和"节点掉线"这两类异常路径。默认全部关闭，保证演示可复现。 ',-1)])]),_:1}),f(d(ve),{vertical:"",size:"large"},{default:g(()=>[u("div",null,[u("div",At,"命令失败率："+z(v.value)+"%",1),f(d(it),{value:v.value,"onUpdate:value":[t[0]||(t[0]=r=>v.value=r),S],min:0,max:100,step:10},null,8,["value"])]),f(d(ve),{align:"center"},{default:g(()=>[t[13]||(t[13]=u("span",{class:"lbl"},"节点B 强制离线",-1)),f(d(Pe),{value:k.value,"onUpdate:value":[t[1]||(t[1]=r=>k.value=r),t[2]||(t[2]=r=>j("B",r))]},null,8,["value"]),t[14]||(t[14]=u("span",{class:"lbl",style:{"margin-left":"16px"}},"节点C 强制离线",-1)),f(d(Pe),{value:_.value,"onUpdate:value":[t[3]||(t[3]=r=>_.value=r),t[4]||(t[4]=r=>j("C",r))]},null,8,["value"])]),_:1}),f(d(ve),null,{default:g(()=>[f(d(ae),{size:"small",onClick:t[5]||(t[5]=r=>d(Z).mockDoor(!0))},{default:g(()=>[...t[15]||(t[15]=[R("模拟开门",-1)])]),_:1}),f(d(ae),{size:"small",onClick:t[6]||(t[6]=r=>d(Z).mockDoor(!1))},{default:g(()=>[...t[16]||(t[16]=[R("模拟关门",-1)])]),_:1}),f(d(ae),{size:"small",onClick:t[7]||(t[7]=r=>d(Z).mockVibration())},{default:g(()=>[...t[17]||(t[17]=[R("模拟一次振动",-1)])]),_:1})]),_:1}),t[18]||(t[18]=u("div",{class:"tip"}," 布防状态下开门会立刻触发报警；振动需要在 2 秒窗口内累计 3 次才触发， 这两条规则都与 NodeC 固件一致。 ",-1))]),_:1})]),_:1})],64)):ge("",!0),t[23]||(t[23]=u("div",{class:"section-title"},"固件能力",-1)),f(d(re),{bordered:!1,class:"c"},{default:g(()=>{var r;return[(m(!0),x(me,null,ze((r=l.value)==null?void 0:r.capabilities,(n,a)=>(m(),x("div",{key:a,class:"cap"},[f(d(oe),{type:n.supported?"success":"warning",size:"small",round:""},{default:g(()=>[R(z(n.supported?"可用":"不可用"),1)]),_:2},1032,["type"]),u("span",Ht,z(a),1),n.reason?(m(),x("span",Ut,z(n.reason),1)):ge("",!0)]))),128))]}),_:1}),u("div",Kt," 状态时间戳 "+z(d(et)((c=l.value)==null?void 0:c.ts)),1)])}}}),ro=rt(qt,[["__scopeId","data-v-b57588c3"]]);export{ro as default};
