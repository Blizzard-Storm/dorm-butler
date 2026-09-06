import{T as oe}from"./Tag-NRdffYtW.js";import{A as We}from"./Alert-sXZ9XjBn.js";import{ab as Oe,bT as He,g as D,E as we,M,N as m,aj as V,ak as _,d as ne,H as ee,o as g,a as x,O as y,Y as $,aa as O,J as Ce,h as Me,R as be,an as $e,k as Y,a2 as _e,G as Q,al as ye,bU as Ue,bV as Ke,ap as qe,b as h,bW as Ge,ao as H,ai as Xe,bL as Se,br as fe,X as J,e as ke,P as Ye,U as pe,aH as Je,av as Qe,bM as Ze,aB as me,aA as q,j as u,w as p,u as i,a3 as le,F as ge,f as ve,t as C,a_ as et,l as Z,q as B,s as tt,bX as ze,a4 as ae,x as Be,n as ie,B as ot,_ as lt}from"./index-CvJznS5I.js";import{g as rt}from"./get-slot-VaplJ9hC.js";import{u as nt}from"./use-compitable-bqkYQaFK.js";import{u as at}from"./use-message-BjDooqjf.js";import{S as xe,a as it}from"./Slider-BPCgyDl2.js";import{u as st}from"./use-merged-state-BSrCI6eV.js";function dt(e,l){const d=Oe(He,null);return D(()=>e.hljs||(d==null?void 0:d.mergedHljsRef.value))}function ct(e){const{textColor2:l,fontSize:d,fontWeightStrong:r,textColor3:b}=e;return{textColor:l,fontSize:d,fontWeightStrong:r,"mono-3":"#a0a1a7","hue-1":"#0184bb","hue-2":"#4078f2","hue-3":"#a626a4","hue-4":"#50a14f","hue-5":"#e45649","hue-5-2":"#c91243","hue-6":"#986801","hue-6-2":"#c18401",lineNumberTextColor:b}}const ut={common:we,self:ct};var ht=M([m("code",`
 font-size: var(--n-font-size);
 font-family: var(--n-font-family);
 `,[V("show-line-numbers",`
 display: flex;
 `),_("line-numbers",`
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
 `)]),({props:e})=>{const l=`${e.bPrefix}code`;return[`${l} .hljs-comment,
 ${l} .hljs-quote {
 color: var(--n-mono-3);
 font-style: italic;
 }`,`${l} .hljs-doctag,
 ${l} .hljs-keyword,
 ${l} .hljs-formula {
 color: var(--n-hue-3);
 }`,`${l} .hljs-section,
 ${l} .hljs-name,
 ${l} .hljs-selector-tag,
 ${l} .hljs-deletion,
 ${l} .hljs-subst {
 color: var(--n-hue-5);
 }`,`${l} .hljs-literal {
 color: var(--n-hue-1);
 }`,`${l} .hljs-string,
 ${l} .hljs-regexp,
 ${l} .hljs-addition,
 ${l} .hljs-attribute,
 ${l} .hljs-meta-string {
 color: var(--n-hue-4);
 }`,`${l} .hljs-built_in,
 ${l} .hljs-class .hljs-title {
 color: var(--n-hue-6-2);
 }`,`${l} .hljs-attr,
 ${l} .hljs-variable,
 ${l} .hljs-template-variable,
 ${l} .hljs-type,
 ${l} .hljs-selector-class,
 ${l} .hljs-selector-attr,
 ${l} .hljs-selector-pseudo,
 ${l} .hljs-number {
 color: var(--n-hue-6);
 }`,`${l} .hljs-symbol,
 ${l} .hljs-bullet,
 ${l} .hljs-link,
 ${l} .hljs-meta,
 ${l} .hljs-selector-id,
 ${l} .hljs-title {
 color: var(--n-hue-2);
 }`,`${l} .hljs-emphasis {
 font-style: italic;
 }`,`${l} .hljs-strong {
 font-weight: var(--n-font-weight-strong);
 }`,`${l} .hljs-link {
 text-decoration: underline;
 }`]}]);const bt={...ee.props,language:String,code:{type:String,default:""},trim:{type:Boolean,default:!0},hljs:Object,uri:Boolean,inline:Boolean,wordWrap:Boolean,showLineNumbers:Boolean,internalFontSize:Number,internalNoHighlight:Boolean};var ft=ne({name:"Code",props:bt,setup(e,{slots:l}){const{internalNoHighlight:d}=e,{mergedClsPrefixRef:r,inlineThemeDisabled:b}=Ce(),v=Y(null),z=d?{value:void 0}:dt(e),w=(c,a,o)=>{const{value:n}=z;return!n||!(c&&n.getLanguage(c))?null:n.highlight(o?a.trim():a,{language:c}).value},S=D(()=>e.inline||e.wordWrap?!1:e.showLineNumbers),k=()=>{if(l.default)return;const{value:c}=v;if(!c)return;const{language:a}=e,o=e.uri?window.decodeURIComponent(e.code):e.code;if(a){const j=w(a,o,e.trim);if(j!==null){if(e.inline)c.innerHTML=j;else{const N=c.querySelector(".__code__");N&&c.removeChild(N);const P=document.createElement("pre");P.className="__code__",P.innerHTML=j,c.appendChild(P)}return}}if(e.inline){c.textContent=o;return}const n=c.querySelector(".__code__");if(n)n.textContent=o;else{const j=document.createElement("pre");j.className="__code__",j.textContent=o,c.innerHTML="",c.appendChild(j)}};Me(k),be(_e(e,"language"),k),be(_e(e,"code"),k),d||be(z,k);const R=ee("Code","-code",ht,ut,e,r),s=D(()=>{const{common:{cubicBezierEaseInOut:c,fontFamilyMono:a},self:{textColor:o,fontSize:n,fontWeightStrong:j,lineNumberTextColor:N,"mono-3":P,"hue-1":W,"hue-2":U,"hue-3":K,"hue-4":I,"hue-5":F,"hue-5-2":f,"hue-6":T,"hue-6-2":A}}=R.value,{internalFontSize:E}=e;return{"--n-font-size":E?`${E}px`:n,"--n-font-family":a,"--n-font-weight-strong":j,"--n-bezier":c,"--n-text-color":o,"--n-mono-3":P,"--n-hue-1":W,"--n-hue-2":U,"--n-hue-3":K,"--n-hue-4":I,"--n-hue-5":F,"--n-hue-5-2":f,"--n-hue-6":T,"--n-hue-6-2":A,"--n-line-number-text-color":N}}),t=b?$e("code",D(()=>`${e.internalFontSize||"a"}`),s,e):void 0;return{mergedClsPrefix:r,codeRef:v,mergedShowLineNumbers:S,lineNumbers:D(()=>{let c=1;const a=[];let o=!1;for(const n of e.code)n===`
`?(o=!0,a.push(c++)):o=!1;return o||a.push(c++),a.join(`
`)}),cssVars:b?void 0:s,themeClass:t==null?void 0:t.themeClass,onRender:t==null?void 0:t.onRender}},render(){const{mergedClsPrefix:e,wordWrap:l,mergedShowLineNumbers:d,onRender:r}=this;return r==null||r(),g(),x("code",{class:y([`${e}-code`,this.themeClass,l&&`${e}-code--word-wrap`,d&&`${e}-code--show-line-numbers`]),style:O(this.cssVars),ref:"codeRef"},[d?(g(),x("pre",{key:0,class:y(`${e}-code__line-numbers`)},[$(()=>this.lineNumbers)],2)):$(()=>null),$(()=>{var b,v;return(v=(b=this.$slots).default)==null?void 0:v.call(b)})],6)}}),pt={thPaddingBorderedSmall:"8px 12px",thPaddingBorderedMedium:"12px 16px",thPaddingBorderedLarge:"16px 24px",thPaddingSmall:"0",thPaddingMedium:"0",thPaddingLarge:"0",tdPaddingBorderedSmall:"8px 12px",tdPaddingBorderedMedium:"12px 16px",tdPaddingBorderedLarge:"16px 24px",tdPaddingSmall:"0 0 8px 0",tdPaddingMedium:"0 0 12px 0",tdPaddingLarge:"0 0 16px 0"};function mt(e){const{tableHeaderColor:l,textColor2:d,textColor1:r,cardColor:b,modalColor:v,popoverColor:z,dividerColor:w,borderRadius:S,fontWeightStrong:k,lineHeight:R,fontSizeSmall:s,fontSizeMedium:t,fontSizeLarge:c}=e;return{...pt,lineHeight:R,fontSizeSmall:s,fontSizeMedium:t,fontSizeLarge:c,titleTextColor:r,thColor:Q(b,l),thColorModal:Q(v,l),thColorPopover:Q(z,l),thTextColor:r,thFontWeight:k,tdTextColor:d,tdColor:b,tdColorModal:v,tdColorPopover:z,borderColor:Q(b,w),borderColorModal:Q(v,w),borderColorPopover:Q(z,w),borderRadius:S}}const gt={common:we,self:mt};function je(e,l="default",d=[]){const{children:r}=e;if(r!==null&&typeof r=="object"&&!Array.isArray(r)){const b=r[l];if(typeof b=="function")return b()}return d}var vt=M([m("descriptions",{fontSize:"var(--n-font-size)"},[m("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),m("descriptions-table-wrapper",[m("descriptions-table",[m("descriptions-table-row",[m("descriptions-table-header",{padding:"var(--n-th-padding)"}),m("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),ye("bordered",[m("descriptions-table-wrapper",[m("descriptions-table",[m("descriptions-table-row",[M("&:last-child",[m("descriptions-table-content",{paddingBottom:0})])])])])]),V("left-label-placement",[m("descriptions-table-content",[M("> *",{verticalAlign:"top"})])]),V("left-label-align",[M("th",{textAlign:"left"})]),V("center-label-align",[M("th",{textAlign:"center"})]),V("right-label-align",[M("th",{textAlign:"right"})]),V("bordered",[m("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[m("descriptions-table",[m("descriptions-table-row",[M("&:not(:last-child)",[m("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),m("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),m("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[M("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),m("descriptions-table-content",[M("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),m("descriptions-header",`
 font-weight: var(--n-th-font-weight);
 font-size: 18px;
 transition: color .3s var(--n-bezier);
 line-height: var(--n-line-height);
 margin-bottom: 16px;
 color: var(--n-title-text-color);
 `),m("descriptions-table-wrapper",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[m("descriptions-table",`
 width: 100%;
 border-collapse: separate;
 border-spacing: 0;
 box-sizing: border-box;
 `,[m("descriptions-table-row",`
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[m("descriptions-table-header",`
 font-weight: var(--n-th-font-weight);
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-th-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),m("descriptions-table-content",`
 vertical-align: top;
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-td-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[_("content",`
 transition: color .3s var(--n-bezier);
 display: inline-block;
 color: var(--n-td-text-color);
 `)]),_("label",`
 font-weight: var(--n-th-font-weight);
 transition: color .3s var(--n-bezier);
 display: inline-block;
 margin-right: 14px;
 color: var(--n-th-text-color);
 `)])])])]),m("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 `),Ue(m("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),Ke(m("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]);const xt="DESCRIPTION_ITEM_FLAG";function _t(e){return typeof e=="object"&&e&&!Array.isArray(e)?e.type&&e.type.DESCRIPTION_ITEM_FLAG:!1}const yt=["colspan"],wt=["colspan"],Ct=["colspan"],$t=["colspan"],St={...ee.props,title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:String,bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var Re=ne({name:"Descriptions",props:St,slots:Object,setup(e){const{mergedClsPrefixRef:l,inlineThemeDisabled:d,mergedComponentPropsRef:r}=Ce(e),b=D(()=>{var S,k;return e.size||((k=(S=r==null?void 0:r.value)==null?void 0:S.Descriptions)==null?void 0:k.size)||"medium"}),v=ee("Descriptions","-descriptions",vt,gt,e,l),z=D(()=>{const{bordered:S}=e,k=b.value,{common:{cubicBezierEaseInOut:R},self:{titleTextColor:s,thColor:t,thColorModal:c,thColorPopover:a,thTextColor:o,thFontWeight:n,tdTextColor:j,tdColor:N,tdColorModal:P,tdColorPopover:W,borderColor:U,borderColorModal:K,borderColorPopover:I,borderRadius:F,lineHeight:f,[H("fontSize",k)]:T,[H(S?"thPaddingBordered":"thPadding",k)]:A,[H(S?"tdPaddingBordered":"tdPadding",k)]:E}}=v.value;return{"--n-title-text-color":s,"--n-th-padding":A,"--n-td-padding":E,"--n-font-size":T,"--n-bezier":R,"--n-th-font-weight":n,"--n-line-height":f,"--n-th-text-color":o,"--n-td-text-color":j,"--n-th-color":t,"--n-th-color-modal":c,"--n-th-color-popover":a,"--n-td-color":N,"--n-td-color-modal":P,"--n-td-color-popover":W,"--n-border-radius":F,"--n-border-color":U,"--n-border-color-modal":K,"--n-border-color-popover":I}}),w=d?$e("descriptions",D(()=>{let S="";const{bordered:k}=e;return k&&(S+="a"),S+=b.value[0],S}),z,e):void 0;return{mergedClsPrefix:l,cssVars:d?void 0:z,themeClass:w==null?void 0:w.themeClass,onRender:w==null?void 0:w.onRender,compitableColumn:nt(e,["columns","column"]),inlineThemeDisabled:d,mergedSize:b}},render(){const e=this.$slots.default,l=e?qe(e()):[];l.length;const{contentClass:d,labelClass:r,compitableColumn:b,labelPlacement:v,labelAlign:z,mergedSize:w,bordered:S,title:k,cssVars:R,mergedClsPrefix:s,separator:t,onRender:c}=this;c==null||c();const a=l.filter(n=>_t(n)),o=a.reduce((n,j,N)=>{const P=j.props||{},W=a.length-1===N,U=["label"in P?P.label:je(j,"label")],K=[je(j)],I=P.span||1,F=n.span;n.span+=I;const f=P.labelStyle||P["label-style"]||this.labelStyle,T=P.contentStyle||P["content-style"]||this.contentStyle;if(v==="left")S?n.row.push((g(),x("th",{key:1,class:y([`${s}-descriptions-table-header`,r]),colspan:1,style:O(f)},[$(()=>U)],6)),(g(),x("td",{key:2,class:y([`${s}-descriptions-table-content`,d]),colspan:W?(b-F)*2+1:I*2-1,style:O(T)},[$(()=>K)],14,yt))):n.row.push((g(),x("td",{key:3,class:y(`${s}-descriptions-table-content`),colspan:W?(b-F)*2:I*2},[h("span",{class:y([`${s}-descriptions-table-content__label`,r]),style:O(f)},[$(()=>[...U,t&&(g(),x("span",{key:4,class:y(`${s}-descriptions-separator`)},[$(()=>t)],2))])],6),h("span",{class:y([`${s}-descriptions-table-content__content`,d]),style:O(T)},[$(()=>K)],6)],10,wt)));else{const A=W?(b-F)*2:I*2;n.row.push((g(),x("th",{key:5,class:y([`${s}-descriptions-table-header`,r]),colspan:A,style:O(f)},[$(()=>U)],14,Ct))),n.secondRow.push((g(),x("td",{key:6,class:y([`${s}-descriptions-table-content`,d]),colspan:A,style:O(T)},[$(()=>K)],14,$t)))}return(n.span>=b||W)&&(n.span=0,n.row.length&&(n.rows.push(n.row),n.row=[]),v!=="left"&&n.secondRow.length&&(n.rows.push(n.secondRow),n.secondRow=[])),n},{span:0,row:[],secondRow:[],rows:[]}).rows.map(n=>(g(),x("tr",{class:y(`${s}-descriptions-table-row`)},[$(()=>n)],2)));return g(),x("div",{style:O(R),class:y([`${s}-descriptions`,this.themeClass,`${s}-descriptions--${v}-label-placement`,`${s}-descriptions--${z}-label-align`,`${s}-descriptions--${w}-size`,S&&`${s}-descriptions--bordered`])},[k||this.$slots.header?(g(),x("div",{key:0,class:y(`${s}-descriptions-header`)},[$(()=>k||rt(this,"header"))],2)):$(()=>null),h("div",{class:y(`${s}-descriptions-table-wrapper`)},[h("table",{class:y(`${s}-descriptions-table`)},[h("tbody",null,[$(()=>v==="top"&&(g(),x("tr",{class:y(`${s}-descriptions-table-row`),style:{visibility:"collapse"}},[$(()=>Ge(b*2,(g(),x("td"))))],2))),$(()=>o)])],2)],2)],6)}});const kt={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var L=ne({name:"DescriptionsItem",[xt]:!0,props:kt,slots:Object,render(){return null}}),zt={buttonHeightSmall:"14px",buttonHeightMedium:"18px",buttonHeightLarge:"22px",buttonWidthSmall:"14px",buttonWidthMedium:"18px",buttonWidthLarge:"22px",buttonWidthPressedSmall:"20px",buttonWidthPressedMedium:"24px",buttonWidthPressedLarge:"28px",railHeightSmall:"18px",railHeightMedium:"22px",railHeightLarge:"26px",railWidthSmall:"32px",railWidthMedium:"40px",railWidthLarge:"48px"};function Bt(e){const{primaryColor:l,opacityDisabled:d,borderRadius:r,textColor3:b}=e;return{...zt,iconColor:b,textColor:"white",loadingColor:l,opacityDisabled:d,railColor:"rgba(0, 0, 0, .14)",railColorActive:l,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:r,railBorderRadiusMedium:r,railBorderRadiusLarge:r,buttonBorderRadiusSmall:r,buttonBorderRadiusMedium:r,buttonBorderRadiusLarge:r,boxShadowFocus:`0 0 0 2px ${Xe(l,{alpha:.2})}`}}const jt={common:we,self:Bt};var Rt=m("switch",`
 height: var(--n-height);
 min-width: var(--n-width);
 vertical-align: middle;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 outline: none;
 justify-content: center;
 align-items: center;
`,[_("children-placeholder",`
 height: var(--n-rail-height);
 display: flex;
 flex-direction: column;
 overflow: hidden;
 pointer-events: none;
 visibility: hidden;
 `),_("rail-placeholder",`
 display: flex;
 flex-wrap: none;
 `),_("button-placeholder",`
 width: calc(1.75 * var(--n-rail-height));
 height: var(--n-rail-height);
 `),m("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[Se({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),_("checked, unchecked",`
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
 `),_("checked",`
 right: 0;
 padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),_("unchecked",`
 left: 0;
 justify-content: flex-end;
 padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),M("&:focus",[_("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),V("round",[_("rail","border-radius: calc(var(--n-rail-height) / 2);",[_("button","border-radius: calc(var(--n-button-height) / 2);")])]),ye("disabled",[ye("icon",[V("rubber-band",[V("pressed",[_("rail",[_("button","max-width: var(--n-button-width-pressed);")])]),_("rail",[M("&:active",[_("button","max-width: var(--n-button-width-pressed);")])]),V("active",[V("pressed",[_("rail",[_("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),_("rail",[M("&:active",[_("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),V("active",[_("rail",[_("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),_("rail",`
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
 `,[_("button-icon",`
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
 `,[Se()]),_("button",`
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
 `)]),V("active",[_("rail","background-color: var(--n-rail-color-active);")]),V("loading",[_("rail",`
 cursor: wait;
 `)]),V("disabled",[_("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]);const Pt=["aria-checked","tabindex","onClick","onFocus","onBlur","onKeyup","onKeydown"],Mt={...ee.props,size:String,value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},spinProps:Object,onChange:[Function,Array]};let re;var Pe=ne({name:"Switch",props:Mt,slots:Object,setup(e){re===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?re=CSS.supports("width","max(1px)"):re=!1:re=!0);const{mergedClsPrefixRef:l,inlineThemeDisabled:d,mergedComponentPropsRef:r}=Ce(e),b=ee("Switch","-switch",Rt,jt,e,l),v=Ye(e,{mergedSize(f){var A,E;if(e.size!==void 0)return e.size;if(f)return f.mergedSize.value;const T=(E=(A=r==null?void 0:r.value)==null?void 0:A.Switch)==null?void 0:E.size;return T||"medium"}}),{mergedSizeRef:z,mergedDisabledRef:w}=v,S=Y(e.defaultValue),k=_e(e,"value"),R=st(k,S),s=D(()=>R.value===e.checkedValue),t=Y(!1),c=Y(!1),a=D(()=>{const{railStyle:f}=e;if(f)return f({focused:c.value,checked:s.value})});function o(f){const{"onUpdate:value":T,onChange:A,onUpdateValue:E}=e,{nTriggerFormInput:se,nTriggerFormChange:de}=v;T&&pe(T,f),E&&pe(E,f),A&&pe(A,f),S.value=f,se(),de()}function n(){const{nTriggerFormFocus:f}=v;f()}function j(){const{nTriggerFormBlur:f}=v;f()}function N(){e.loading||w.value||(R.value!==e.checkedValue?o(e.checkedValue):o(e.uncheckedValue))}function P(){c.value=!0,n()}function W(){c.value=!1,j(),t.value=!1}function U(f){e.loading||w.value||f.key===" "&&(R.value!==e.checkedValue?o(e.checkedValue):o(e.uncheckedValue),t.value=!1)}function K(f){e.loading||w.value||f.key===" "&&(f.preventDefault(),t.value=!0)}const I=D(()=>{const{value:f}=z,{self:{opacityDisabled:T,railColor:A,railColorActive:E,buttonBoxShadow:se,buttonColor:de,boxShadowFocus:Ve,loadingColor:Te,textColor:Le,iconColor:Fe,[H("buttonHeight",f)]:G,[H("buttonWidth",f)]:Ae,[H("buttonWidthPressed",f)]:De,[H("railHeight",f)]:X,[H("railWidth",f)]:te,[H("railBorderRadius",f)]:Ne,[H("buttonBorderRadius",f)]:Ee},common:{cubicBezierEaseInOut:Ie}}=b.value;let ce,ue,he;return re?(ce=`calc((${X} - ${G}) / 2)`,ue=`max(${X}, ${G})`,he=`max(${te}, calc(${te} + ${G} - ${X}))`):(ce=me((q(X)-q(G))/2),ue=me(Math.max(q(X),q(G))),he=q(X)>q(G)?te:me(q(te)+q(G)-q(X))),{"--n-bezier":Ie,"--n-button-border-radius":Ee,"--n-button-box-shadow":se,"--n-button-color":de,"--n-button-width":Ae,"--n-button-width-pressed":De,"--n-button-height":G,"--n-height":ue,"--n-offset":ce,"--n-opacity-disabled":T,"--n-rail-border-radius":Ne,"--n-rail-color":A,"--n-rail-color-active":E,"--n-rail-height":X,"--n-rail-width":te,"--n-width":he,"--n-box-shadow-focus":Ve,"--n-loading-color":Te,"--n-text-color":Le,"--n-icon-color":Fe}}),F=d?$e("switch",D(()=>z.value[0]),I,e):void 0;return{handleClick:N,handleBlur:W,handleFocus:P,handleKeyup:U,handleKeydown:K,mergedRailStyle:a,pressed:t,mergedClsPrefix:l,mergedValue:R,checked:s,mergedDisabled:w,cssVars:d?void 0:I,themeClass:F==null?void 0:F.themeClass,onRender:F==null?void 0:F.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:l,checked:d,mergedRailStyle:r,onRender:b,$slots:v}=this;b==null||b();const{checked:z,unchecked:w,icon:S,"checked-icon":k,"unchecked-icon":R}=v,s=!(fe(S)&&fe(k)&&fe(R));return g(),x("div",{role:"switch","aria-checked":d,class:y([`${e}-switch`,this.themeClass,s&&`${e}-switch--icon`,d&&`${e}-switch--active`,l&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`]),tabindex:this.mergedDisabled?void 0:0,style:O(this.cssVars),onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},[h("div",{class:y(`${e}-switch__rail`),"aria-hidden":"true",style:O(r)},[$(()=>J(z,t=>J(w,c=>t||c?(g(),x("div",{key:4,"aria-hidden":!0,class:y(`${e}-switch__children-placeholder`)},[h("div",{class:y(`${e}-switch__rail-placeholder`)},[h("div",{class:y(`${e}-switch__button-placeholder`)},null,2),$(()=>t)],2),h("div",{class:y(`${e}-switch__rail-placeholder`)},[h("div",{class:y(`${e}-switch__button-placeholder`)},null,2),$(()=>c)],2)],2)):null))),h("div",{class:y(`${e}-switch__button`)},[$(()=>J(S,t=>J(k,c=>J(R,a=>(g(),ke(Ze,null,{default:()=>this.loading?(g(),ke(Je,Qe({key:"loading",clsPrefix:e,strokeWidth:20},this.spinProps),null,16,["clsPrefix"])):this.checked&&(c||t)?(g(),x("div",{class:y(`${e}-switch__button-icon`),key:c?"checked-icon":"icon"},[$(()=>c||t)],2)):!this.checked&&(a||t)?(g(),x("div",{class:y(`${e}-switch__button-icon`),key:a?"unchecked-icon":"icon"},[$(()=>a||t)],2)):null},1024)))))),$(()=>J(z,t=>t&&(g(),x("div",{key:"checked",class:y(`${e}-switch__checked`)},[$(()=>t)],2)))),$(()=>J(w,t=>t&&(g(),x("div",{key:"unchecked",class:y(`${e}-switch__unchecked`)},[$(()=>t)],2))))],2)],6)],46,Pt)}});const Vt={class:"page"},Tt={class:"mono"},Lt={class:"dim"},Ft={class:"mono small"},At={class:"acts"},Dt={key:0,class:"dim"},Nt={key:1,class:"ports"},Et={class:"mono"},It={class:"dim"},Wt={key:0,class:"badline"},Ot={class:"lbl"},Ht={class:"cap-name mono"},Ut={key:0,class:"dim"},Kt={class:"footnote"},qt=ne({__name:"System",setup(e){const l=at(),d=Y(null),r=D(()=>ot.value),b=D(()=>{var s;return((s=r.value)==null?void 0:s.link.mode)==="mock"}),v=Y(0),z=Y(!1),w=Y(!1);async function S(){var t;d.value=await Z.systemInfo();const s=(t=r.value)==null?void 0:t.link.fault_injection;s&&(v.value=Math.round(s.command_fail_rate*100),z.value=s.node_b_offline,w.value=s.node_c_offline)}async function k(s){await Z.mockFaultRate(s/100),l.info(`命令失败率已设为 ${s}%`)}async function R(s,t){await Z.mockOffline(s,t)}return Me(S),(s,t)=>{var c;return g(),x("div",Vt,[t[20]||(t[20]=h("div",{class:"section-title"},"运行模式",-1)),u(i(le),{bordered:!1,class:"c"},{default:p(()=>[u(i(Re),{column:1,"label-placement":"left",size:"small"},{default:p(()=>[u(i(L),{label:"设备模式"},{default:p(()=>[u(i(oe),{type:b.value?"warning":"success",size:"small",round:""},{default:p(()=>[B(C(b.value?"模拟设备 (DEVICE_MODE=mock)":"真实串口 (DEVICE_MODE=serial)"),1)]),_:1},8,["type"])]),_:1}),u(i(L),{label:"串口"},{default:p(()=>{var a,o;return[h("span",Tt,C((a=d.value)==null?void 0:a.configured_port)+" @ "+C((o=d.value)==null?void 0:o.configured_baud)+" 8N1",1)]}),_:1}),u(i(L),{label:"链路状态"},{default:p(()=>{var a,o;return[u(i(oe),{type:(a=r.value)!=null&&a.link.connected?"success":"error",size:"small",round:""},{default:p(()=>{var n;return[B(C((n=r.value)!=null&&n.link.connected?"已连接":"未连接"),1)]}),_:1},8,["type"]),h("span",Lt,"　最后收帧 "+C(i(tt)((o=r.value)==null?void 0:o.link.last_frame_at)),1)]}),_:1}),u(i(L),{label:"WebSocket"},{default:p(()=>[u(i(oe),{type:i(ze)?"success":"error",size:"small",round:""},{default:p(()=>[B(C(i(ze)?"已连接":"断开重连中"),1)]),_:1},8,["type"])]),_:1}),u(i(L),{label:"数据库"},{default:p(()=>{var a;return[h("span",Ft,C((a=d.value)==null?void 0:a.database),1)]}),_:1}),u(i(L),{label:"AI 助手"},{default:p(()=>{var a;return[u(i(oe),{type:(a=d.value)!=null&&a.llm.enabled?"success":"default",size:"small",round:""},{default:p(()=>{var o;return[B(C((o=d.value)!=null&&o.llm.enabled?`已配置 · ${d.value.llm.model}`:"未配置"),1)]}),_:1},8,["type"])]}),_:1})]),_:1}),h("div",At,[u(i(ae),{size:"small",onClick:S},{default:p(()=>[...t[8]||(t[8]=[B("刷新",-1)])]),_:1})])]),_:1}),t[21]||(t[21]=h("div",{class:"section-title"},"可用串口",-1)),u(i(le),{bordered:!1,class:"c"},{default:p(()=>{var a;return[(a=d.value)!=null&&a.available_ports.length?(g(),x("div",Nt,[(g(!0),x(ge,null,Be(d.value.available_ports,o=>(g(),x("div",{key:o.device,class:"port"},[h("b",Et,C(o.device),1),h("span",It,C(o.description),1)]))),128))])):(g(),x("div",Dt,"没有检测到串口设备。")),t[9]||(t[9]=h("div",{class:"tip"},[B(" 改用真实硬件：在 "),h("span",{class:"mono"},"backend/.env"),B(" 里把 "),h("span",{class:"mono"},"DEVICE_MODE"),B(" 改成 "),h("span",{class:"mono"},"serial"),B("， "),h("span",{class:"mono"},"SERIAL_PORT"),B(" 填 CH340 对应的口，然后重启后端。 ")],-1))]}),_:1}),t[22]||(t[22]=h("div",{class:"section-title"},"通信诊断",-1)),u(i(le),{bordered:!1,class:"c"},{default:p(()=>{var a;return[u(i(Re),{column:2,"label-placement":"top",size:"small"},{default:p(()=>[u(i(L),{label:"485 CRC 累计错误"},{default:p(()=>{var o,n;return[h("b",{class:ie({bad:(((o=r.value)==null?void 0:o.diagnostics.crc_errors)??0)>0})},C(((n=r.value)==null?void 0:n.diagnostics.crc_errors)??0),3)]}),_:1}),u(i(L),{label:"已解析报文行"},{default:p(()=>{var o;return[B(C(((o=r.value)==null?void 0:o.diagnostics.frames_ok)??0),1)]}),_:1}),u(i(L),{label:"详细状态报文"},{default:p(()=>{var o;return[B(C(((o=r.value)==null?void 0:o.link.status_lines)??0),1)]}),_:1}),u(i(L),{label:"解析失败行"},{default:p(()=>{var o,n;return[h("b",{class:ie({bad:(((o=r.value)==null?void 0:o.diagnostics.frames_bad)??0)>0})},C(((n=r.value)==null?void 0:n.diagnostics.frames_bad)??0),3)]}),_:1}),u(i(L),{label:"丢弃噪声字节"},{default:p(()=>{var o;return[B(C(((o=r.value)==null?void 0:o.link.bytes_dropped)??0),1)]}),_:1}),u(i(L),{label:"NodeA 每秒主循环"},{default:p(()=>{var o;return[B(C(((o=r.value)==null?void 0:o.diagnostics.main_loops)==null?"未知":r.value.diagnostics.main_loops),1)]}),_:1}),u(i(L),{label:"NodeA 调度遗漏"},{default:p(()=>{var o,n;return[h("b",{class:ie({bad:(((o=r.value)==null?void 0:o.nodes.A.poll_miss)??0)>0})},C(((n=r.value)==null?void 0:n.nodes.A.poll_miss)==null?"未知":r.value.nodes.A.poll_miss),3)]}),_:1}),u(i(L),{label:"NodeB / NodeC 调度遗漏"},{default:p(()=>{var o,n;return[B(C(((o=r.value)==null?void 0:o.nodes.B.poll_miss)??"未知")+" / "+C(((n=r.value)==null?void 0:n.nodes.C.poll_miss)??"未知"),1)]}),_:1}),u(i(L),{label:"485 连续无应答 B / C"},{default:p(()=>{var o,n,j,N;return[h("b",{class:ie({bad:(((o=r.value)==null?void 0:o.diagnostics.master_reply_miss_b)??0)>0||(((n=r.value)==null?void 0:n.diagnostics.master_reply_miss_c)??0)>0})},C(((j=r.value)==null?void 0:j.diagnostics.master_reply_miss_b)??"未知")+" / "+C(((N=r.value)==null?void 0:N.diagnostics.master_reply_miss_c)??"未知"),3)]}),_:1})]),_:1}),(a=r.value)!=null&&a.link.last_bad_line?(g(),x("div",Wt,[t[10]||(t[10]=B(" 最近一条无法解析的行： ",-1)),u(i(ft),{code:r.value.link.last_bad_line,"word-wrap":""},null,8,["code"])])):ve("",!0),t[11]||(t[11]=h("div",{class:"tip"}," CRC 错误和调度遗漏应长期为 0，NodeA 每秒主循环应不低于 1000。 错误持续增长时先把三块板的 BUS_BAUD 一起降到 1200， 再检查 485 的 A/B 是否接反。 ",-1))]}),_:1}),b.value?(g(),x(ge,{key:0},[t[19]||(t[19]=h("div",{class:"section-title"},"故障注入（仅模拟模式）",-1)),u(i(le),{bordered:!1,class:"c"},{default:p(()=>[u(i(We),{type:"info",bordered:!1,style:{"margin-bottom":"16px"}},{default:p(()=>[...t[12]||(t[12]=[B(' 用来演示"命令失败/超时"和"节点掉线"这两类异常路径。默认全部关闭，保证演示可复现。 ',-1)])]),_:1}),u(i(xe),{vertical:"",size:"large"},{default:p(()=>[h("div",null,[h("div",Ot,"命令失败率："+C(v.value)+"%",1),u(i(it),{value:v.value,"onUpdate:value":[t[0]||(t[0]=a=>v.value=a),k],min:0,max:100,step:10},null,8,["value"])]),u(i(xe),{align:"center"},{default:p(()=>[t[13]||(t[13]=h("span",{class:"lbl"},"节点B 强制离线",-1)),u(i(Pe),{value:z.value,"onUpdate:value":[t[1]||(t[1]=a=>z.value=a),t[2]||(t[2]=a=>R("B",a))]},null,8,["value"]),t[14]||(t[14]=h("span",{class:"lbl",style:{"margin-left":"16px"}},"节点C 强制离线",-1)),u(i(Pe),{value:w.value,"onUpdate:value":[t[3]||(t[3]=a=>w.value=a),t[4]||(t[4]=a=>R("C",a))]},null,8,["value"])]),_:1}),u(i(xe),null,{default:p(()=>[u(i(ae),{size:"small",onClick:t[5]||(t[5]=a=>i(Z).mockDoor(!0))},{default:p(()=>[...t[15]||(t[15]=[B("模拟开门",-1)])]),_:1}),u(i(ae),{size:"small",onClick:t[6]||(t[6]=a=>i(Z).mockDoor(!1))},{default:p(()=>[...t[16]||(t[16]=[B("模拟关门",-1)])]),_:1}),u(i(ae),{size:"small",onClick:t[7]||(t[7]=a=>i(Z).mockVibration())},{default:p(()=>[...t[17]||(t[17]=[B("模拟一次振动",-1)])]),_:1})]),_:1}),t[18]||(t[18]=h("div",{class:"tip"}," 布防状态下开门会立刻触发报警；振动需要在 2 秒窗口内累计 3 次才触发， 这两条规则都与 NodeC 固件一致。 ",-1))]),_:1})]),_:1})],64)):ve("",!0),t[23]||(t[23]=h("div",{class:"section-title"},"固件能力",-1)),u(i(le),{bordered:!1,class:"c"},{default:p(()=>{var a;return[(g(!0),x(ge,null,Be((a=r.value)==null?void 0:a.capabilities,(o,n)=>(g(),x("div",{key:n,class:"cap"},[u(i(oe),{type:o.supported?"success":"warning",size:"small",round:""},{default:p(()=>[B(C(o.supported?"可用":"不可用"),1)]),_:2},1032,["type"]),h("span",Ht,C(n),1),o.reason?(g(),x("span",Ut,C(o.reason),1)):ve("",!0)]))),128))]}),_:1}),h("div",Kt," 状态时间戳 "+C(i(et)((c=r.value)==null?void 0:c.ts)),1)])}}}),oo=lt(qt,[["__scopeId","data-v-1614f8b7"]]);export{oo as default};
