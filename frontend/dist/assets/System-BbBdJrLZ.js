import{T as te}from"./Tag-D-HOhYvY.js";import{A as Ne}from"./Alert-q4OhI9gD.js";import{a6 as Le,bY as We,g as E,x as Be,H as V,I as p,ai as T,aj as w,d as le,A as Q,o as m,a as g,J as y,T as _,af as W,C as ye,aa as Pe,M as ue,am as _e,D as X,Y as ge,ak as we,bZ as Ue,b_ as Ke,ao as He,b as u,b$ as Ye,c0 as qe,an as U,c1 as Ge,ah as Xe,bP as xe,bu as he,R as Z,e as $e,K as Ze,O as be,aF as Je,at as Qe,bQ as et,az as fe,ay as Y,h as b,w as v,u as i,Z as oe,F as pe,f as me,t as S,b1 as tt,a0 as J,j as z,k as ot,c2 as ke,$ as re,p as Ce,n as Se,s as nt,_ as lt}from"./index-B1hbSlEf.js";import{g as rt}from"./get-slot-VaplJ9hC.js";import{u as st}from"./use-compitable-FkjbibL5.js";import{u as at}from"./use-message-CctsSs6y.js";import{S as ve,a as it}from"./Slider-B1R3sx5s.js";import{u as dt}from"./use-merged-state-CBoZ3HUc.js";import"./Follower-BPoRfbrE.js";function ct(e,o){const d=Le(We,null);return E(()=>e.hljs||(d==null?void 0:d.mergedHljsRef.value))}function ut(e){const{textColor2:o,fontSize:d,fontWeightStrong:r,textColor3:f}=e;return{textColor:o,fontSize:d,fontWeightStrong:r,"mono-3":"#a0a1a7","hue-1":"#0184bb","hue-2":"#4078f2","hue-3":"#a626a4","hue-4":"#50a14f","hue-5":"#e45649","hue-5-2":"#c91243","hue-6":"#986801","hue-6-2":"#c18401",lineNumberTextColor:f}}const ht={common:Be,self:ut};var bt=V([p("code",`
 font-size: var(--n-font-size);
 font-family: var(--n-font-family);
 `,[T("show-line-numbers",`
 display: flex;
 `),w("line-numbers",`
 user-select: none;
 padding-right: 12px;
 text-align: right;
 transition: color .3s var(--n-bezier);
 color: var(--n-line-number-text-color);
 `),T("word-wrap",[V("pre",`
 white-space: pre-wrap;
 word-break: break-all;
 `)]),V("pre",`
 margin: 0;
 line-height: inherit;
 font-size: inherit;
 font-family: inherit;
 `),V("[class^=hljs]",`
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
 }`]}]);const ft={...Q.props,language:String,code:{type:String,default:""},trim:{type:Boolean,default:!0},hljs:Object,uri:Boolean,inline:Boolean,wordWrap:Boolean,showLineNumbers:Boolean,internalFontSize:Number,internalNoHighlight:Boolean};var pt=le({name:"Code",props:ft,setup(e,{slots:o}){const{internalNoHighlight:d}=e,{mergedClsPrefixRef:r,inlineThemeDisabled:f}=ye(),x=X(null),j=d?{value:void 0}:ct(e),C=(c,n,l)=>{const{value:s}=j;return!s||!(c&&s.getLanguage(c))?null:s.highlight(l?n.trim():n,{language:c}).value},$=E(()=>e.inline||e.wordWrap?!1:e.showLineNumbers),k=()=>{if(o.default)return;const{value:c}=x;if(!c)return;const{language:n}=e,l=e.uri?window.decodeURIComponent(e.code):e.code;if(n){const R=C(n,l,e.trim);if(R!==null){if(e.inline)c.innerHTML=R;else{const A=c.querySelector(".__code__");A&&c.removeChild(A);const B=document.createElement("pre");B.className="__code__",B.innerHTML=R,c.appendChild(B)}return}}if(e.inline){c.textContent=l;return}const s=c.querySelector(".__code__");if(s)s.textContent=l;else{const R=document.createElement("pre");R.className="__code__",R.textContent=l,c.innerHTML="",c.appendChild(R)}};Pe(k),ue(ge(e,"language"),k),ue(ge(e,"code"),k),d||ue(j,k);const P=Q("Code","-code",bt,ht,e,r),a=E(()=>{const{common:{cubicBezierEaseInOut:c,fontFamilyMono:n},self:{textColor:l,fontSize:s,fontWeightStrong:R,lineNumberTextColor:A,"mono-3":B,"hue-1":N,"hue-2":K,"hue-3":H,"hue-4":O,"hue-5":F,"hue-5-2":h,"hue-6":D,"hue-6-2":I}}=P.value,{internalFontSize:M}=e;return{"--n-font-size":M?`${M}px`:s,"--n-font-family":n,"--n-font-weight-strong":R,"--n-bezier":c,"--n-text-color":l,"--n-mono-3":B,"--n-hue-1":N,"--n-hue-2":K,"--n-hue-3":H,"--n-hue-4":O,"--n-hue-5":F,"--n-hue-5-2":h,"--n-hue-6":D,"--n-hue-6-2":I,"--n-line-number-text-color":A}}),t=f?_e("code",E(()=>`${e.internalFontSize||"a"}`),a,e):void 0;return{mergedClsPrefix:r,codeRef:x,mergedShowLineNumbers:$,lineNumbers:E(()=>{let c=1;const n=[];let l=!1;for(const s of e.code)s===`
`?(l=!0,n.push(c++)):l=!1;return l||n.push(c++),n.join(`
`)}),cssVars:f?void 0:a,themeClass:t==null?void 0:t.themeClass,onRender:t==null?void 0:t.onRender}},render(){const{mergedClsPrefix:e,wordWrap:o,mergedShowLineNumbers:d,onRender:r}=this;return r==null||r(),m(),g("code",{class:y([`${e}-code`,this.themeClass,o&&`${e}-code--word-wrap`,d&&`${e}-code--show-line-numbers`]),style:W(this.cssVars),ref:"codeRef"},[d?(m(),g("pre",{key:0,class:y(`${e}-code__line-numbers`)},[_(()=>this.lineNumbers)],2)):_(()=>null),_(()=>{var f,x;return(x=(f=this.$slots).default)==null?void 0:x.call(f)})],6)}});function ze(e,o="default",d=[]){const{children:r}=e;if(r!==null&&typeof r=="object"&&!Array.isArray(r)){const f=r[o];if(typeof f=="function")return f()}return d}var mt=V([p("descriptions",{fontSize:"var(--n-font-size)"},[p("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),p("descriptions-table-wrapper",[p("descriptions-table",[p("descriptions-table-row",[p("descriptions-table-header",{padding:"var(--n-th-padding)"}),p("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),we("bordered",[p("descriptions-table-wrapper",[p("descriptions-table",[p("descriptions-table-row",[V("&:last-child",[p("descriptions-table-content",{paddingBottom:0})])])])])]),T("left-label-placement",[p("descriptions-table-content",[V("> *",{verticalAlign:"top"})])]),T("left-label-align",[V("th",{textAlign:"left"})]),T("center-label-align",[V("th",{textAlign:"center"})]),T("right-label-align",[V("th",{textAlign:"right"})]),T("bordered",[p("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[p("descriptions-table",[p("descriptions-table-row",[V("&:not(:last-child)",[p("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),p("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),p("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[V("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),p("descriptions-table-content",[V("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),p("descriptions-header",`
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
 `))]);const vt="DESCRIPTION_ITEM_FLAG";function gt(e){return typeof e=="object"&&e&&!Array.isArray(e)?e.type&&e.type.DESCRIPTION_ITEM_FLAG:!1}const wt=["colspan"],yt=["colspan"],_t=["colspan"],xt=["colspan"],$t={...Q.props,title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:String,bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var je=le({name:"Descriptions",props:$t,slots:Object,setup(e){const{mergedClsPrefixRef:o,inlineThemeDisabled:d,mergedComponentPropsRef:r}=ye(e),f=E(()=>{var $,k;return e.size||((k=($=r==null?void 0:r.value)==null?void 0:$.Descriptions)==null?void 0:k.size)||"medium"}),x=Q("Descriptions","-descriptions",mt,qe,e,o),j=E(()=>{const{bordered:$}=e,k=f.value,{common:{cubicBezierEaseInOut:P},self:{titleTextColor:a,thColor:t,thColorModal:c,thColorPopover:n,thTextColor:l,thFontWeight:s,tdTextColor:R,tdColor:A,tdColorModal:B,tdColorPopover:N,borderColor:K,borderColorModal:H,borderColorPopover:O,borderRadius:F,lineHeight:h,[U("fontSize",k)]:D,[U($?"thPaddingBordered":"thPadding",k)]:I,[U($?"tdPaddingBordered":"tdPadding",k)]:M}}=x.value;return{"--n-title-text-color":a,"--n-th-padding":I,"--n-td-padding":M,"--n-font-size":D,"--n-bezier":P,"--n-th-font-weight":s,"--n-line-height":h,"--n-th-text-color":l,"--n-td-text-color":R,"--n-th-color":t,"--n-th-color-modal":c,"--n-th-color-popover":n,"--n-td-color":A,"--n-td-color-modal":B,"--n-td-color-popover":N,"--n-border-radius":F,"--n-border-color":K,"--n-border-color-modal":H,"--n-border-color-popover":O}}),C=d?_e("descriptions",E(()=>{let $="";const{bordered:k}=e;return k&&($+="a"),$+=f.value[0],$}),j,e):void 0;return{mergedClsPrefix:o,cssVars:d?void 0:j,themeClass:C==null?void 0:C.themeClass,onRender:C==null?void 0:C.onRender,compitableColumn:st(e,["columns","column"]),inlineThemeDisabled:d,mergedSize:f}},render(){const e=this.$slots.default,o=e?He(e()):[];o.length;const{contentClass:d,labelClass:r,compitableColumn:f,labelPlacement:x,labelAlign:j,mergedSize:C,bordered:$,title:k,cssVars:P,mergedClsPrefix:a,separator:t,onRender:c}=this;c==null||c();const n=o.filter(s=>gt(s)),l=n.reduce((s,R,A)=>{const B=R.props||{},N=n.length-1===A,K=["label"in B?B.label:ze(R,"label")],H=[ze(R)],O=B.span||1,F=s.span;s.span+=O;const h=B.labelStyle||B["label-style"]||this.labelStyle,D=B.contentStyle||B["content-style"]||this.contentStyle;if(x==="left")$?s.row.push((m(),g("th",{key:1,class:y([`${a}-descriptions-table-header`,r]),colspan:1,style:W(h)},[_(()=>K)],6)),(m(),g("td",{key:2,class:y([`${a}-descriptions-table-content`,d]),colspan:N?(f-F)*2+1:O*2-1,style:W(D)},[_(()=>H)],14,wt))):s.row.push((m(),g("td",{key:3,class:y(`${a}-descriptions-table-content`),colspan:N?(f-F)*2:O*2},[u("span",{class:y([`${a}-descriptions-table-content__label`,r]),style:W(h)},[_(()=>[...K,t&&(m(),g("span",{key:4,class:y(`${a}-descriptions-separator`)},[_(()=>t)],2))])],6),u("span",{class:y([`${a}-descriptions-table-content__content`,d]),style:W(D)},[_(()=>H)],6)],10,yt)));else{const I=N?(f-F)*2:O*2;s.row.push((m(),g("th",{key:5,class:y([`${a}-descriptions-table-header`,r]),colspan:I,style:W(h)},[_(()=>K)],14,_t))),s.secondRow.push((m(),g("td",{key:6,class:y([`${a}-descriptions-table-content`,d]),colspan:I,style:W(D)},[_(()=>H)],14,xt)))}return(s.span>=f||N)&&(s.span=0,s.row.length&&(s.rows.push(s.row),s.row=[]),x!=="left"&&s.secondRow.length&&(s.rows.push(s.secondRow),s.secondRow=[])),s},{span:0,row:[],secondRow:[],rows:[]}).rows.map(s=>(m(),g("tr",{class:y(`${a}-descriptions-table-row`)},[_(()=>s)],2)));return m(),g("div",{style:W(P),class:y([`${a}-descriptions`,this.themeClass,`${a}-descriptions--${x}-label-placement`,`${a}-descriptions--${j}-label-align`,`${a}-descriptions--${C}-size`,$&&`${a}-descriptions--bordered`])},[k||this.$slots.header?(m(),g("div",{key:0,class:y(`${a}-descriptions-header`)},[_(()=>k||rt(this,"header"))],2)):_(()=>null),u("div",{class:y(`${a}-descriptions-table-wrapper`)},[u("table",{class:y(`${a}-descriptions-table`)},[u("tbody",null,[_(()=>x==="top"&&(m(),g("tr",{class:y(`${a}-descriptions-table-row`),style:{visibility:"collapse"}},[_(()=>Ye(f*2,(m(),g("td"))))],2))),_(()=>l)])],2)],2)],6)}});const kt={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var L=le({name:"DescriptionsItem",[vt]:!0,props:kt,slots:Object,render(){return null}});function Ct(e){const{primaryColor:o,opacityDisabled:d,borderRadius:r,textColor3:f}=e;return{...Ge,iconColor:f,textColor:"white",loadingColor:o,opacityDisabled:d,railColor:"rgba(0, 0, 0, .14)",railColorActive:o,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:r,railBorderRadiusMedium:r,railBorderRadiusLarge:r,buttonBorderRadiusSmall:r,buttonBorderRadiusMedium:r,buttonBorderRadiusLarge:r,boxShadowFocus:`0 0 0 2px ${Xe(o,{alpha:.2})}`}}const St={common:Be,self:Ct};var zt=p("switch",`
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
 `,[xe({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),w("checked, unchecked",`
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
 `),V("&:focus",[w("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),T("round",[w("rail","border-radius: calc(var(--n-rail-height) / 2);",[w("button","border-radius: calc(var(--n-button-height) / 2);")])]),we("disabled",[we("icon",[T("rubber-band",[T("pressed",[w("rail",[w("button","max-width: var(--n-button-width-pressed);")])]),w("rail",[V("&:active",[w("button","max-width: var(--n-button-width-pressed);")])]),T("active",[T("pressed",[w("rail",[w("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),w("rail",[V("&:active",[w("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),T("active",[w("rail",[w("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),w("rail",`
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
 `,[xe()]),w("button",`
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
 `)]),T("active",[w("rail","background-color: var(--n-rail-color-active);")]),T("loading",[w("rail",`
 cursor: wait;
 `)]),T("disabled",[w("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]);const jt=["aria-checked","tabindex","onClick","onFocus","onBlur","onKeyup","onKeydown"],Rt={...Q.props,size:String,value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},spinProps:Object,onChange:[Function,Array]};let ne;var Re=le({name:"Switch",props:Rt,slots:Object,setup(e){ne===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?ne=CSS.supports("width","max(1px)"):ne=!1:ne=!0);const{mergedClsPrefixRef:o,inlineThemeDisabled:d,mergedComponentPropsRef:r}=ye(e),f=Q("Switch","-switch",zt,St,e,o),x=Ze(e,{mergedSize(h){var I,M;if(e.size!==void 0)return e.size;if(h)return h.mergedSize.value;const D=(M=(I=r==null?void 0:r.value)==null?void 0:I.Switch)==null?void 0:M.size;return D||"medium"}}),{mergedSizeRef:j,mergedDisabledRef:C}=x,$=X(e.defaultValue),k=ge(e,"value"),P=dt(k,$),a=E(()=>P.value===e.checkedValue),t=X(!1),c=X(!1),n=E(()=>{const{railStyle:h}=e;if(h)return h({focused:c.value,checked:a.value})});function l(h){const{"onUpdate:value":D,onChange:I,onUpdateValue:M}=e,{nTriggerFormInput:se,nTriggerFormChange:ae}=x;D&&be(D,h),M&&be(M,h),I&&be(I,h),$.value=h,se(),ae()}function s(){const{nTriggerFormFocus:h}=x;h()}function R(){const{nTriggerFormBlur:h}=x;h()}function A(){e.loading||C.value||(P.value!==e.checkedValue?l(e.checkedValue):l(e.uncheckedValue))}function B(){c.value=!0,s()}function N(){c.value=!1,R(),t.value=!1}function K(h){e.loading||C.value||h.key===" "&&(P.value!==e.checkedValue?l(e.checkedValue):l(e.uncheckedValue),t.value=!1)}function H(h){e.loading||C.value||h.key===" "&&(h.preventDefault(),t.value=!0)}const O=E(()=>{const{value:h}=j,{self:{opacityDisabled:D,railColor:I,railColorActive:M,buttonBoxShadow:se,buttonColor:ae,boxShadowFocus:Ve,loadingColor:Te,textColor:De,iconColor:Fe,[U("buttonHeight",h)]:q,[U("buttonWidth",h)]:Ie,[U("buttonWidthPressed",h)]:Ee,[U("railHeight",h)]:G,[U("railWidth",h)]:ee,[U("railBorderRadius",h)]:Me,[U("buttonBorderRadius",h)]:Oe},common:{cubicBezierEaseInOut:Ae}}=f.value;let ie,de,ce;return ne?(ie=`calc((${G} - ${q}) / 2)`,de=`max(${G}, ${q})`,ce=`max(${ee}, calc(${ee} + ${q} - ${G}))`):(ie=fe((Y(G)-Y(q))/2),de=fe(Math.max(Y(G),Y(q))),ce=Y(G)>Y(q)?ee:fe(Y(ee)+Y(q)-Y(G))),{"--n-bezier":Ae,"--n-button-border-radius":Oe,"--n-button-box-shadow":se,"--n-button-color":ae,"--n-button-width":Ie,"--n-button-width-pressed":Ee,"--n-button-height":q,"--n-height":de,"--n-offset":ie,"--n-opacity-disabled":D,"--n-rail-border-radius":Me,"--n-rail-color":I,"--n-rail-color-active":M,"--n-rail-height":G,"--n-rail-width":ee,"--n-width":ce,"--n-box-shadow-focus":Ve,"--n-loading-color":Te,"--n-text-color":De,"--n-icon-color":Fe}}),F=d?_e("switch",E(()=>j.value[0]),O,e):void 0;return{handleClick:A,handleBlur:N,handleFocus:B,handleKeyup:K,handleKeydown:H,mergedRailStyle:n,pressed:t,mergedClsPrefix:o,mergedValue:P,checked:a,mergedDisabled:C,cssVars:d?void 0:O,themeClass:F==null?void 0:F.themeClass,onRender:F==null?void 0:F.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:o,checked:d,mergedRailStyle:r,onRender:f,$slots:x}=this;f==null||f();const{checked:j,unchecked:C,icon:$,"checked-icon":k,"unchecked-icon":P}=x,a=!(he($)&&he(k)&&he(P));return m(),g("div",{role:"switch","aria-checked":d,class:y([`${e}-switch`,this.themeClass,a&&`${e}-switch--icon`,d&&`${e}-switch--active`,o&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`]),tabindex:this.mergedDisabled?void 0:0,style:W(this.cssVars),onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},[u("div",{class:y(`${e}-switch__rail`),"aria-hidden":"true",style:W(r)},[_(()=>Z(j,t=>Z(C,c=>t||c?(m(),g("div",{key:4,"aria-hidden":!0,class:y(`${e}-switch__children-placeholder`)},[u("div",{class:y(`${e}-switch__rail-placeholder`)},[u("div",{class:y(`${e}-switch__button-placeholder`)},null,2),_(()=>t)],2),u("div",{class:y(`${e}-switch__rail-placeholder`)},[u("div",{class:y(`${e}-switch__button-placeholder`)},null,2),_(()=>c)],2)],2)):null))),u("div",{class:y(`${e}-switch__button`)},[_(()=>Z($,t=>Z(k,c=>Z(P,n=>(m(),$e(et,null,{default:()=>this.loading?(m(),$e(Je,Qe({key:"loading",clsPrefix:e,strokeWidth:20},this.spinProps),null,16,["clsPrefix"])):this.checked&&(c||t)?(m(),g("div",{class:y(`${e}-switch__button-icon`),key:c?"checked-icon":"icon"},[_(()=>c||t)],2)):!this.checked&&(n||t)?(m(),g("div",{class:y(`${e}-switch__button-icon`),key:n?"unchecked-icon":"icon"},[_(()=>n||t)],2)):null},1024)))))),_(()=>Z(j,t=>t&&(m(),g("div",{key:"checked",class:y(`${e}-switch__checked`)},[_(()=>t)],2)))),_(()=>Z(C,t=>t&&(m(),g("div",{key:"unchecked",class:y(`${e}-switch__unchecked`)},[_(()=>t)],2))))],2)],6)],46,jt)}});const Bt={class:"page"},Pt={class:"mono"},Vt={class:"dim"},Tt={class:"mono small"},Dt={class:"acts"},Ft={key:0,class:"dim"},It={key:1,class:"ports"},Et={class:"mono"},Mt={class:"dim"},Ot={key:0,class:"badline"},At={class:"lbl"},Nt={class:"cap-name mono"},Lt={key:0,class:"dim"},Wt={class:"footnote"},Ut=le({__name:"System",setup(e){const o=at(),d=X(null),r=E(()=>nt.value),f=E(()=>{var a;return((a=r.value)==null?void 0:a.link.mode)==="mock"}),x=X(0),j=X(!1),C=X(!1);async function $(){var t;d.value=await J.systemInfo();const a=(t=r.value)==null?void 0:t.link.fault_injection;a&&(x.value=Math.round(a.command_fail_rate*100),j.value=a.node_b_offline,C.value=a.node_c_offline)}async function k(a){await J.mockFaultRate(a/100),o.info(`命令失败率已设为 ${a}%`)}async function P(a,t){await J.mockOffline(a,t)}return Pe($),(a,t)=>{var c;return m(),g("div",Bt,[t[20]||(t[20]=u("div",{class:"section-title"},"运行模式",-1)),b(i(oe),{bordered:!1,class:"c"},{default:v(()=>[b(i(je),{column:1,"label-placement":"left",size:"small"},{default:v(()=>[b(i(L),{label:"设备模式"},{default:v(()=>[b(i(te),{type:f.value?"warning":"success",size:"small",round:""},{default:v(()=>[z(S(f.value?"模拟设备 (DEVICE_MODE=mock)":"真实串口 (DEVICE_MODE=serial)"),1)]),_:1},8,["type"])]),_:1}),b(i(L),{label:"串口"},{default:v(()=>{var n,l;return[u("span",Pt,S((n=d.value)==null?void 0:n.configured_port)+" @ "+S((l=d.value)==null?void 0:l.configured_baud)+" 8N1",1)]}),_:1}),b(i(L),{label:"链路状态"},{default:v(()=>{var n,l;return[b(i(te),{type:(n=r.value)!=null&&n.link.connected?"success":"error",size:"small",round:""},{default:v(()=>{var s;return[z(S((s=r.value)!=null&&s.link.connected?"已连接":"未连接"),1)]}),_:1},8,["type"]),u("span",Vt,"　最后收帧 "+S(i(ot)((l=r.value)==null?void 0:l.link.last_frame_at)),1)]}),_:1}),b(i(L),{label:"WebSocket"},{default:v(()=>[b(i(te),{type:i(ke)?"success":"error",size:"small",round:""},{default:v(()=>[z(S(i(ke)?"已连接":"断开重连中"),1)]),_:1},8,["type"])]),_:1}),b(i(L),{label:"数据库"},{default:v(()=>{var n;return[u("span",Tt,S((n=d.value)==null?void 0:n.database),1)]}),_:1}),b(i(L),{label:"AI 助手"},{default:v(()=>{var n;return[b(i(te),{type:(n=d.value)!=null&&n.llm.enabled?"success":"default",size:"small",round:""},{default:v(()=>{var l;return[z(S((l=d.value)!=null&&l.llm.enabled?`已配置 · ${d.value.llm.model}`:"未配置"),1)]}),_:1},8,["type"])]}),_:1})]),_:1}),u("div",Dt,[b(i(re),{size:"small",onClick:$},{default:v(()=>[...t[8]||(t[8]=[z("刷新",-1)])]),_:1})])]),_:1}),t[21]||(t[21]=u("div",{class:"section-title"},"可用串口",-1)),b(i(oe),{bordered:!1,class:"c"},{default:v(()=>{var n;return[(n=d.value)!=null&&n.available_ports.length?(m(),g("div",It,[(m(!0),g(pe,null,Ce(d.value.available_ports,l=>(m(),g("div",{key:l.device,class:"port"},[u("b",Et,S(l.device),1),u("span",Mt,S(l.description),1)]))),128))])):(m(),g("div",Ft,"没有检测到串口设备。")),t[9]||(t[9]=u("div",{class:"tip"},[z(" 改用真实硬件：在 "),u("span",{class:"mono"},"backend/.env"),z(" 里把 "),u("span",{class:"mono"},"DEVICE_MODE"),z(" 改成 "),u("span",{class:"mono"},"serial"),z("， "),u("span",{class:"mono"},"SERIAL_PORT"),z(" 填 CH340 对应的口，然后重启后端。 ")],-1))]}),_:1}),t[22]||(t[22]=u("div",{class:"section-title"},"通信诊断",-1)),b(i(oe),{bordered:!1,class:"c"},{default:v(()=>{var n;return[b(i(je),{column:2,"label-placement":"top",size:"small"},{default:v(()=>[b(i(L),{label:"485 CRC 累计错误"},{default:v(()=>{var l,s;return[u("b",{class:Se({bad:(((l=r.value)==null?void 0:l.diagnostics.crc_errors)??0)>0})},S(((s=r.value)==null?void 0:s.diagnostics.crc_errors)??0),3)]}),_:1}),b(i(L),{label:"已解析报文行"},{default:v(()=>{var l;return[z(S(((l=r.value)==null?void 0:l.diagnostics.frames_ok)??0),1)]}),_:1}),b(i(L),{label:"解析失败行"},{default:v(()=>{var l,s;return[u("b",{class:Se({bad:(((l=r.value)==null?void 0:l.diagnostics.frames_bad)??0)>0})},S(((s=r.value)==null?void 0:s.diagnostics.frames_bad)??0),3)]}),_:1}),b(i(L),{label:"丢弃噪声字节"},{default:v(()=>{var l;return[z(S(((l=r.value)==null?void 0:l.link.bytes_dropped)??0),1)]}),_:1})]),_:1}),(n=r.value)!=null&&n.link.last_bad_line?(m(),g("div",Ot,[t[10]||(t[10]=z(" 最近一条无法解析的行： ",-1)),b(i(pt),{code:r.value.link.last_bad_line,"word-wrap":""},null,8,["code"])])):me("",!0),t[11]||(t[11]=u("div",{class:"tip"}," CRC 错误长期为 0 才算总线健康。持续增长时先把三块板的 BUS_BAUD 一起降到 1200 重新下载，再检查 485 的 A/B 是否接反。 ",-1))]}),_:1}),f.value?(m(),g(pe,{key:0},[t[19]||(t[19]=u("div",{class:"section-title"},"故障注入（仅模拟模式）",-1)),b(i(oe),{bordered:!1,class:"c"},{default:v(()=>[b(i(Ne),{type:"info",bordered:!1,style:{"margin-bottom":"16px"}},{default:v(()=>[...t[12]||(t[12]=[z(' 用来演示"命令失败/超时"和"节点掉线"这两类异常路径。默认全部关闭，保证演示可复现。 ',-1)])]),_:1}),b(i(ve),{vertical:"",size:"large"},{default:v(()=>[u("div",null,[u("div",At,"命令失败率："+S(x.value)+"%",1),b(i(it),{value:x.value,"onUpdate:value":[t[0]||(t[0]=n=>x.value=n),k],min:0,max:100,step:10},null,8,["value"])]),b(i(ve),{align:"center"},{default:v(()=>[t[13]||(t[13]=u("span",{class:"lbl"},"节点B 强制离线",-1)),b(i(Re),{value:j.value,"onUpdate:value":[t[1]||(t[1]=n=>j.value=n),t[2]||(t[2]=n=>P("B",n))]},null,8,["value"]),t[14]||(t[14]=u("span",{class:"lbl",style:{"margin-left":"16px"}},"节点C 强制离线",-1)),b(i(Re),{value:C.value,"onUpdate:value":[t[3]||(t[3]=n=>C.value=n),t[4]||(t[4]=n=>P("C",n))]},null,8,["value"])]),_:1}),b(i(ve),null,{default:v(()=>[b(i(re),{size:"small",onClick:t[5]||(t[5]=n=>i(J).mockDoor(!0))},{default:v(()=>[...t[15]||(t[15]=[z("模拟开门",-1)])]),_:1}),b(i(re),{size:"small",onClick:t[6]||(t[6]=n=>i(J).mockDoor(!1))},{default:v(()=>[...t[16]||(t[16]=[z("模拟关门",-1)])]),_:1}),b(i(re),{size:"small",onClick:t[7]||(t[7]=n=>i(J).mockVibration())},{default:v(()=>[...t[17]||(t[17]=[z("模拟一次振动",-1)])]),_:1})]),_:1}),t[18]||(t[18]=u("div",{class:"tip"}," 布防状态下开门会立刻触发报警；振动需要在 2 秒窗口内累计 3 次才触发， 这两条规则都与 NodeC 固件一致。 ",-1))]),_:1})]),_:1})],64)):me("",!0),t[23]||(t[23]=u("div",{class:"section-title"},"固件能力",-1)),b(i(oe),{bordered:!1,class:"c"},{default:v(()=>{var n;return[(m(!0),g(pe,null,Ce((n=r.value)==null?void 0:n.capabilities,(l,s)=>(m(),g("div",{key:s,class:"cap"},[b(i(te),{type:l.supported?"success":"warning",size:"small",round:""},{default:v(()=>[z(S(l.supported?"可用":"不可用"),1)]),_:2},1032,["type"]),u("span",Nt,S(s),1),l.reason?(m(),g("span",Lt,S(l.reason),1)):me("",!0)]))),128))]}),_:1}),u("div",Wt," 状态时间戳 "+S(i(tt)((c=r.value)==null?void 0:c.ts)),1)])}}}),eo=lt(Ut,[["__scopeId","data-v-b57588c3"]]);export{eo as default};
