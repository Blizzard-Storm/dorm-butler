import{T as Z}from"./Tag-Cc6g-_Kw.js";import{A as Oe}from"./Alert-D1mddeui.js";import{af as He,bT as Ue,g as A,E as Se,M as L,N as y,ac as F,ad as x,d as ie,H as te,o as p,a as v,O as C,Y as z,aa as H,J as $e,h as Te,R as me,ah as ke,k as G,a2 as we,G as ee,ae as xe,bU as Ke,bV as qe,aj as Ge,b as c,bW as Xe,ai as U,ab as Ye,bL as ze,bn as ge,X as Q,e as Ce,P as Je,U as ve,aC as Qe,ap as Ze,bM as et,av as ye,au as q,j as d,w as h,u as s,a3 as le,F as de,f as ne,t as _,aW as tt,l as J,q as j,s as ot,bX as re,bY as Be,a4 as ae,x as Re,n as ce,B as lt,_ as nt}from"./index-BrC03CDs.js";import{g as rt}from"./get-slot-VaplJ9hC.js";import{u as at}from"./use-compitable-C_QsvZ14.js";import{u as st}from"./use-message-RBCKY5yA.js";import{S as _e,a as it}from"./Slider-BDMUEra-.js";import{u as dt}from"./use-merged-state-yQdzVvcc.js";function ct(e,n){const i=He(Ue,null);return A(()=>e.hljs||(i==null?void 0:i.mergedHljsRef.value))}function ut(e){const{textColor2:n,fontSize:i,fontWeightStrong:o,textColor3:u}=e;return{textColor:n,fontSize:i,fontWeightStrong:o,"mono-3":"#a0a1a7","hue-1":"#0184bb","hue-2":"#4078f2","hue-3":"#a626a4","hue-4":"#50a14f","hue-5":"#e45649","hue-5-2":"#c91243","hue-6":"#986801","hue-6-2":"#c18401",lineNumberTextColor:u}}const ht={common:Se,self:ut};var bt=L([y("code",`
 font-size: var(--n-font-size);
 font-family: var(--n-font-family);
 `,[F("show-line-numbers",`
 display: flex;
 `),x("line-numbers",`
 user-select: none;
 padding-right: 12px;
 text-align: right;
 transition: color .3s var(--n-bezier);
 color: var(--n-line-number-text-color);
 `),F("word-wrap",[L("pre",`
 white-space: pre-wrap;
 word-break: break-all;
 `)]),L("pre",`
 margin: 0;
 line-height: inherit;
 font-size: inherit;
 font-family: inherit;
 `),L("[class^=hljs]",`
 color: var(--n-text-color);
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),({props:e})=>{const n=`${e.bPrefix}code`;return[`${n} .hljs-comment,
 ${n} .hljs-quote {
 color: var(--n-mono-3);
 font-style: italic;
 }`,`${n} .hljs-doctag,
 ${n} .hljs-keyword,
 ${n} .hljs-formula {
 color: var(--n-hue-3);
 }`,`${n} .hljs-section,
 ${n} .hljs-name,
 ${n} .hljs-selector-tag,
 ${n} .hljs-deletion,
 ${n} .hljs-subst {
 color: var(--n-hue-5);
 }`,`${n} .hljs-literal {
 color: var(--n-hue-1);
 }`,`${n} .hljs-string,
 ${n} .hljs-regexp,
 ${n} .hljs-addition,
 ${n} .hljs-attribute,
 ${n} .hljs-meta-string {
 color: var(--n-hue-4);
 }`,`${n} .hljs-built_in,
 ${n} .hljs-class .hljs-title {
 color: var(--n-hue-6-2);
 }`,`${n} .hljs-attr,
 ${n} .hljs-variable,
 ${n} .hljs-template-variable,
 ${n} .hljs-type,
 ${n} .hljs-selector-class,
 ${n} .hljs-selector-attr,
 ${n} .hljs-selector-pseudo,
 ${n} .hljs-number {
 color: var(--n-hue-6);
 }`,`${n} .hljs-symbol,
 ${n} .hljs-bullet,
 ${n} .hljs-link,
 ${n} .hljs-meta,
 ${n} .hljs-selector-id,
 ${n} .hljs-title {
 color: var(--n-hue-2);
 }`,`${n} .hljs-emphasis {
 font-style: italic;
 }`,`${n} .hljs-strong {
 font-weight: var(--n-font-weight-strong);
 }`,`${n} .hljs-link {
 text-decoration: underline;
 }`]}]);const ft={...te.props,language:String,code:{type:String,default:""},trim:{type:Boolean,default:!0},hljs:Object,uri:Boolean,inline:Boolean,wordWrap:Boolean,showLineNumbers:Boolean,internalFontSize:Number,internalNoHighlight:Boolean};var pt=ie({name:"Code",props:ft,setup(e,{slots:n}){const{internalNoHighlight:i}=e,{mergedClsPrefixRef:o,inlineThemeDisabled:u}=$e(),w=G(null),P=i?{value:void 0}:ct(e),S=(a,t,B)=>{const{value:r}=P;return!r||!(a&&r.getLanguage(a))?null:r.highlight(B?t.trim():t,{language:a}).value},$=A(()=>e.inline||e.wordWrap?!1:e.showLineNumbers),k=()=>{if(n.default)return;const{value:a}=w;if(!a)return;const{language:t}=e,B=e.uri?window.decodeURIComponent(e.code):e.code;if(t){const l=S(t,B,e.trim);if(l!==null){if(e.inline)a.innerHTML=l;else{const b=a.querySelector(".__code__");b&&a.removeChild(b);const R=document.createElement("pre");R.className="__code__",R.innerHTML=l,a.appendChild(R)}return}}if(e.inline){a.textContent=B;return}const r=a.querySelector(".__code__");if(r)r.textContent=B;else{const l=document.createElement("pre");l.className="__code__",l.textContent=B,a.innerHTML="",a.appendChild(l)}};Te(k),me(we(e,"language"),k),me(we(e,"code"),k),i||me(P,k);const M=te("Code","-code",bt,ht,e,o),g=A(()=>{const{common:{cubicBezierEaseInOut:a,fontFamilyMono:t},self:{textColor:B,fontSize:r,fontWeightStrong:l,lineNumberTextColor:b,"mono-3":R,"hue-1":T,"hue-2":E,"hue-3":K,"hue-4":O,"hue-5":I,"hue-5-2":f,"hue-6":D,"hue-6-2":N}}=M.value,{internalFontSize:W}=e;return{"--n-font-size":W?`${W}px`:r,"--n-font-family":t,"--n-font-weight-strong":l,"--n-bezier":a,"--n-text-color":B,"--n-mono-3":R,"--n-hue-1":T,"--n-hue-2":E,"--n-hue-3":K,"--n-hue-4":O,"--n-hue-5":I,"--n-hue-5-2":f,"--n-hue-6":D,"--n-hue-6-2":N,"--n-line-number-text-color":b}}),m=u?ke("code",A(()=>`${e.internalFontSize||"a"}`),g,e):void 0;return{mergedClsPrefix:o,codeRef:w,mergedShowLineNumbers:$,lineNumbers:A(()=>{let a=1;const t=[];let B=!1;for(const r of e.code)r===`
`?(B=!0,t.push(a++)):B=!1;return B||t.push(a++),t.join(`
`)}),cssVars:u?void 0:g,themeClass:m==null?void 0:m.themeClass,onRender:m==null?void 0:m.onRender}},render(){const{mergedClsPrefix:e,wordWrap:n,mergedShowLineNumbers:i,onRender:o}=this;return o==null||o(),p(),v("code",{class:C([`${e}-code`,this.themeClass,n&&`${e}-code--word-wrap`,i&&`${e}-code--show-line-numbers`]),style:H(this.cssVars),ref:"codeRef"},[i?(p(),v("pre",{key:0,class:C(`${e}-code__line-numbers`)},[z(()=>this.lineNumbers)],2)):z(()=>null),z(()=>{var u,w;return(w=(u=this.$slots).default)==null?void 0:w.call(u)})],6)}}),mt={thPaddingBorderedSmall:"8px 12px",thPaddingBorderedMedium:"12px 16px",thPaddingBorderedLarge:"16px 24px",thPaddingSmall:"0",thPaddingMedium:"0",thPaddingLarge:"0",tdPaddingBorderedSmall:"8px 12px",tdPaddingBorderedMedium:"12px 16px",tdPaddingBorderedLarge:"16px 24px",tdPaddingSmall:"0 0 8px 0",tdPaddingMedium:"0 0 12px 0",tdPaddingLarge:"0 0 16px 0"};function gt(e){const{tableHeaderColor:n,textColor2:i,textColor1:o,cardColor:u,modalColor:w,popoverColor:P,dividerColor:S,borderRadius:$,fontWeightStrong:k,lineHeight:M,fontSizeSmall:g,fontSizeMedium:m,fontSizeLarge:a}=e;return{...mt,lineHeight:M,fontSizeSmall:g,fontSizeMedium:m,fontSizeLarge:a,titleTextColor:o,thColor:ee(u,n),thColorModal:ee(w,n),thColorPopover:ee(P,n),thTextColor:o,thFontWeight:k,tdTextColor:i,tdColor:u,tdColorModal:w,tdColorPopover:P,borderColor:ee(u,S),borderColorModal:ee(w,S),borderColorPopover:ee(P,S),borderRadius:$}}const vt={common:Se,self:gt};function je(e,n="default",i=[]){const{children:o}=e;if(o!==null&&typeof o=="object"&&!Array.isArray(o)){const u=o[n];if(typeof u=="function")return u()}return i}var yt=L([y("descriptions",{fontSize:"var(--n-font-size)"},[y("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),y("descriptions-table-wrapper",[y("descriptions-table",[y("descriptions-table-row",[y("descriptions-table-header",{padding:"var(--n-th-padding)"}),y("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),xe("bordered",[y("descriptions-table-wrapper",[y("descriptions-table",[y("descriptions-table-row",[L("&:last-child",[y("descriptions-table-content",{paddingBottom:0})])])])])]),F("left-label-placement",[y("descriptions-table-content",[L("> *",{verticalAlign:"top"})])]),F("left-label-align",[L("th",{textAlign:"left"})]),F("center-label-align",[L("th",{textAlign:"center"})]),F("right-label-align",[L("th",{textAlign:"right"})]),F("bordered",[y("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[y("descriptions-table",[y("descriptions-table-row",[L("&:not(:last-child)",[y("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),y("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),y("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[L("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),y("descriptions-table-content",[L("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),y("descriptions-header",`
 font-weight: var(--n-th-font-weight);
 font-size: 18px;
 transition: color .3s var(--n-bezier);
 line-height: var(--n-line-height);
 margin-bottom: 16px;
 color: var(--n-title-text-color);
 `),y("descriptions-table-wrapper",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[y("descriptions-table",`
 width: 100%;
 border-collapse: separate;
 border-spacing: 0;
 box-sizing: border-box;
 `,[y("descriptions-table-row",`
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[y("descriptions-table-header",`
 font-weight: var(--n-th-font-weight);
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-th-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),y("descriptions-table-content",`
 vertical-align: top;
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-td-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[x("content",`
 transition: color .3s var(--n-bezier);
 display: inline-block;
 color: var(--n-td-text-color);
 `)]),x("label",`
 font-weight: var(--n-th-font-weight);
 transition: color .3s var(--n-bezier);
 display: inline-block;
 margin-right: 14px;
 color: var(--n-th-text-color);
 `)])])])]),y("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 `),Ke(y("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),qe(y("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]);const _t="DESCRIPTION_ITEM_FLAG";function wt(e){return typeof e=="object"&&e&&!Array.isArray(e)?e.type&&e.type.DESCRIPTION_ITEM_FLAG:!1}const xt=["colspan"],Ct=["colspan"],St=["colspan"],$t=["colspan"],kt={...te.props,title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:String,bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var Pe=ie({name:"Descriptions",props:kt,slots:Object,setup(e){const{mergedClsPrefixRef:n,inlineThemeDisabled:i,mergedComponentPropsRef:o}=$e(e),u=A(()=>{var $,k;return e.size||((k=($=o==null?void 0:o.value)==null?void 0:$.Descriptions)==null?void 0:k.size)||"medium"}),w=te("Descriptions","-descriptions",yt,vt,e,n),P=A(()=>{const{bordered:$}=e,k=u.value,{common:{cubicBezierEaseInOut:M},self:{titleTextColor:g,thColor:m,thColorModal:a,thColorPopover:t,thTextColor:B,thFontWeight:r,tdTextColor:l,tdColor:b,tdColorModal:R,tdColorPopover:T,borderColor:E,borderColorModal:K,borderColorPopover:O,borderRadius:I,lineHeight:f,[U("fontSize",k)]:D,[U($?"thPaddingBordered":"thPadding",k)]:N,[U($?"tdPaddingBordered":"tdPadding",k)]:W}}=w.value;return{"--n-title-text-color":g,"--n-th-padding":N,"--n-td-padding":W,"--n-font-size":D,"--n-bezier":M,"--n-th-font-weight":r,"--n-line-height":f,"--n-th-text-color":B,"--n-td-text-color":l,"--n-th-color":m,"--n-th-color-modal":a,"--n-th-color-popover":t,"--n-td-color":b,"--n-td-color-modal":R,"--n-td-color-popover":T,"--n-border-radius":I,"--n-border-color":E,"--n-border-color-modal":K,"--n-border-color-popover":O}}),S=i?ke("descriptions",A(()=>{let $="";const{bordered:k}=e;return k&&($+="a"),$+=u.value[0],$}),P,e):void 0;return{mergedClsPrefix:n,cssVars:i?void 0:P,themeClass:S==null?void 0:S.themeClass,onRender:S==null?void 0:S.onRender,compitableColumn:at(e,["columns","column"]),inlineThemeDisabled:i,mergedSize:u}},render(){const e=this.$slots.default,n=e?Ge(e()):[];n.length;const{contentClass:i,labelClass:o,compitableColumn:u,labelPlacement:w,labelAlign:P,mergedSize:S,bordered:$,title:k,cssVars:M,mergedClsPrefix:g,separator:m,onRender:a}=this;a==null||a();const t=n.filter(r=>wt(r)),B=t.reduce((r,l,b)=>{const R=l.props||{},T=t.length-1===b,E=["label"in R?R.label:je(l,"label")],K=[je(l)],O=R.span||1,I=r.span;r.span+=O;const f=R.labelStyle||R["label-style"]||this.labelStyle,D=R.contentStyle||R["content-style"]||this.contentStyle;if(w==="left")$?r.row.push((p(),v("th",{key:1,class:C([`${g}-descriptions-table-header`,o]),colspan:1,style:H(f)},[z(()=>E)],6)),(p(),v("td",{key:2,class:C([`${g}-descriptions-table-content`,i]),colspan:T?(u-I)*2+1:O*2-1,style:H(D)},[z(()=>K)],14,xt))):r.row.push((p(),v("td",{key:3,class:C(`${g}-descriptions-table-content`),colspan:T?(u-I)*2:O*2},[c("span",{class:C([`${g}-descriptions-table-content__label`,o]),style:H(f)},[z(()=>[...E,m&&(p(),v("span",{key:4,class:C(`${g}-descriptions-separator`)},[z(()=>m)],2))])],6),c("span",{class:C([`${g}-descriptions-table-content__content`,i]),style:H(D)},[z(()=>K)],6)],10,Ct)));else{const N=T?(u-I)*2:O*2;r.row.push((p(),v("th",{key:5,class:C([`${g}-descriptions-table-header`,o]),colspan:N,style:H(f)},[z(()=>E)],14,St))),r.secondRow.push((p(),v("td",{key:6,class:C([`${g}-descriptions-table-content`,i]),colspan:N,style:H(D)},[z(()=>K)],14,$t)))}return(r.span>=u||T)&&(r.span=0,r.row.length&&(r.rows.push(r.row),r.row=[]),w!=="left"&&r.secondRow.length&&(r.rows.push(r.secondRow),r.secondRow=[])),r},{span:0,row:[],secondRow:[],rows:[]}).rows.map(r=>(p(),v("tr",{class:C(`${g}-descriptions-table-row`)},[z(()=>r)],2)));return p(),v("div",{style:H(M),class:C([`${g}-descriptions`,this.themeClass,`${g}-descriptions--${w}-label-placement`,`${g}-descriptions--${P}-label-align`,`${g}-descriptions--${S}-size`,$&&`${g}-descriptions--bordered`])},[k||this.$slots.header?(p(),v("div",{key:0,class:C(`${g}-descriptions-header`)},[z(()=>k||rt(this,"header"))],2)):z(()=>null),c("div",{class:C(`${g}-descriptions-table-wrapper`)},[c("table",{class:C(`${g}-descriptions-table`)},[c("tbody",null,[z(()=>w==="top"&&(p(),v("tr",{class:C(`${g}-descriptions-table-row`),style:{visibility:"collapse"}},[z(()=>Xe(u*2,(p(),v("td"))))],2))),z(()=>B)])],2)],2)],6)}});const zt={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var V=ie({name:"DescriptionsItem",[_t]:!0,props:zt,slots:Object,render(){return null}}),Bt={buttonHeightSmall:"14px",buttonHeightMedium:"18px",buttonHeightLarge:"22px",buttonWidthSmall:"14px",buttonWidthMedium:"18px",buttonWidthLarge:"22px",buttonWidthPressedSmall:"20px",buttonWidthPressedMedium:"24px",buttonWidthPressedLarge:"28px",railHeightSmall:"18px",railHeightMedium:"22px",railHeightLarge:"26px",railWidthSmall:"32px",railWidthMedium:"40px",railWidthLarge:"48px"};function Rt(e){const{primaryColor:n,opacityDisabled:i,borderRadius:o,textColor3:u}=e;return{...Bt,iconColor:u,textColor:"white",loadingColor:n,opacityDisabled:i,railColor:"rgba(0, 0, 0, .14)",railColorActive:n,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:o,railBorderRadiusMedium:o,railBorderRadiusLarge:o,buttonBorderRadiusSmall:o,buttonBorderRadiusMedium:o,buttonBorderRadiusLarge:o,boxShadowFocus:`0 0 0 2px ${Ye(n,{alpha:.2})}`}}const jt={common:Se,self:Rt};var Pt=y("switch",`
 height: var(--n-height);
 min-width: var(--n-width);
 vertical-align: middle;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 outline: none;
 justify-content: center;
 align-items: center;
`,[x("children-placeholder",`
 height: var(--n-rail-height);
 display: flex;
 flex-direction: column;
 overflow: hidden;
 pointer-events: none;
 visibility: hidden;
 `),x("rail-placeholder",`
 display: flex;
 flex-wrap: none;
 `),x("button-placeholder",`
 width: calc(1.75 * var(--n-rail-height));
 height: var(--n-rail-height);
 `),y("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[ze({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),x("checked, unchecked",`
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
 `),x("checked",`
 right: 0;
 padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),x("unchecked",`
 left: 0;
 justify-content: flex-end;
 padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),L("&:focus",[x("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),F("round",[x("rail","border-radius: calc(var(--n-rail-height) / 2);",[x("button","border-radius: calc(var(--n-button-height) / 2);")])]),xe("disabled",[xe("icon",[F("rubber-band",[F("pressed",[x("rail",[x("button","max-width: var(--n-button-width-pressed);")])]),x("rail",[L("&:active",[x("button","max-width: var(--n-button-width-pressed);")])]),F("active",[F("pressed",[x("rail",[x("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),x("rail",[L("&:active",[x("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),F("active",[x("rail",[x("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),x("rail",`
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
 `,[x("button-icon",`
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
 `,[ze()]),x("button",`
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
 `)]),F("active",[x("rail","background-color: var(--n-rail-color-active);")]),F("loading",[x("rail",`
 cursor: wait;
 `)]),F("disabled",[x("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]);const Mt=["aria-checked","tabindex","onClick","onFocus","onBlur","onKeyup","onKeydown"],Tt={...te.props,size:String,value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},spinProps:Object,onChange:[Function,Array]};let se;var Me=ie({name:"Switch",props:Tt,slots:Object,setup(e){se===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?se=CSS.supports("width","max(1px)"):se=!1:se=!0);const{mergedClsPrefixRef:n,inlineThemeDisabled:i,mergedComponentPropsRef:o}=$e(e),u=te("Switch","-switch",Pt,jt,e,n),w=Je(e,{mergedSize(f){var N,W;if(e.size!==void 0)return e.size;if(f)return f.mergedSize.value;const D=(W=(N=o==null?void 0:o.value)==null?void 0:N.Switch)==null?void 0:W.size;return D||"medium"}}),{mergedSizeRef:P,mergedDisabledRef:S}=w,$=G(e.defaultValue),k=we(e,"value"),M=dt(k,$),g=A(()=>M.value===e.checkedValue),m=G(!1),a=G(!1),t=A(()=>{const{railStyle:f}=e;if(f)return f({focused:a.value,checked:g.value})});function B(f){const{"onUpdate:value":D,onChange:N,onUpdateValue:W}=e,{nTriggerFormInput:ue,nTriggerFormChange:he}=w;D&&ve(D,f),W&&ve(W,f),N&&ve(N,f),$.value=f,ue(),he()}function r(){const{nTriggerFormFocus:f}=w;f()}function l(){const{nTriggerFormBlur:f}=w;f()}function b(){e.loading||S.value||(M.value!==e.checkedValue?B(e.checkedValue):B(e.uncheckedValue))}function R(){a.value=!0,r()}function T(){a.value=!1,l(),m.value=!1}function E(f){e.loading||S.value||f.key===" "&&(M.value!==e.checkedValue?B(e.checkedValue):B(e.uncheckedValue),m.value=!1)}function K(f){e.loading||S.value||f.key===" "&&(f.preventDefault(),m.value=!0)}const O=A(()=>{const{value:f}=P,{self:{opacityDisabled:D,railColor:N,railColorActive:W,buttonBoxShadow:ue,buttonColor:he,boxShadowFocus:Ve,loadingColor:Le,textColor:Fe,iconColor:De,[U("buttonHeight",f)]:X,[U("buttonWidth",f)]:Ie,[U("buttonWidthPressed",f)]:Ne,[U("railHeight",f)]:Y,[U("railWidth",f)]:oe,[U("railBorderRadius",f)]:Ae,[U("buttonBorderRadius",f)]:Ee},common:{cubicBezierEaseInOut:We}}=u.value;let be,fe,pe;return se?(be=`calc((${Y} - ${X}) / 2)`,fe=`max(${Y}, ${X})`,pe=`max(${oe}, calc(${oe} + ${X} - ${Y}))`):(be=ye((q(Y)-q(X))/2),fe=ye(Math.max(q(Y),q(X))),pe=q(Y)>q(X)?oe:ye(q(oe)+q(X)-q(Y))),{"--n-bezier":We,"--n-button-border-radius":Ee,"--n-button-box-shadow":ue,"--n-button-color":he,"--n-button-width":Ie,"--n-button-width-pressed":Ne,"--n-button-height":X,"--n-height":fe,"--n-offset":be,"--n-opacity-disabled":D,"--n-rail-border-radius":Ae,"--n-rail-color":N,"--n-rail-color-active":W,"--n-rail-height":Y,"--n-rail-width":oe,"--n-width":pe,"--n-box-shadow-focus":Ve,"--n-loading-color":Le,"--n-text-color":Fe,"--n-icon-color":De}}),I=i?ke("switch",A(()=>P.value[0]),O,e):void 0;return{handleClick:b,handleBlur:T,handleFocus:R,handleKeyup:E,handleKeydown:K,mergedRailStyle:t,pressed:m,mergedClsPrefix:n,mergedValue:M,checked:g,mergedDisabled:S,cssVars:i?void 0:O,themeClass:I==null?void 0:I.themeClass,onRender:I==null?void 0:I.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:n,checked:i,mergedRailStyle:o,onRender:u,$slots:w}=this;u==null||u();const{checked:P,unchecked:S,icon:$,"checked-icon":k,"unchecked-icon":M}=w,g=!(ge($)&&ge(k)&&ge(M));return p(),v("div",{role:"switch","aria-checked":i,class:C([`${e}-switch`,this.themeClass,g&&`${e}-switch--icon`,i&&`${e}-switch--active`,n&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`]),tabindex:this.mergedDisabled?void 0:0,style:H(this.cssVars),onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},[c("div",{class:C(`${e}-switch__rail`),"aria-hidden":"true",style:H(o)},[z(()=>Q(P,m=>Q(S,a=>m||a?(p(),v("div",{key:4,"aria-hidden":!0,class:C(`${e}-switch__children-placeholder`)},[c("div",{class:C(`${e}-switch__rail-placeholder`)},[c("div",{class:C(`${e}-switch__button-placeholder`)},null,2),z(()=>m)],2),c("div",{class:C(`${e}-switch__rail-placeholder`)},[c("div",{class:C(`${e}-switch__button-placeholder`)},null,2),z(()=>a)],2)],2)):null))),c("div",{class:C(`${e}-switch__button`)},[z(()=>Q($,m=>Q(k,a=>Q(M,t=>(p(),Ce(et,null,{default:()=>this.loading?(p(),Ce(Qe,Ze({key:"loading",clsPrefix:e,strokeWidth:20},this.spinProps),null,16,["clsPrefix"])):this.checked&&(a||m)?(p(),v("div",{class:C(`${e}-switch__button-icon`),key:a?"checked-icon":"icon"},[z(()=>a||m)],2)):!this.checked&&(t||m)?(p(),v("div",{class:C(`${e}-switch__button-icon`),key:t?"unchecked-icon":"icon"},[z(()=>t||m)],2)):null},1024)))))),z(()=>Q(P,m=>m&&(p(),v("div",{key:"checked",class:C(`${e}-switch__checked`)},[z(()=>m)],2)))),z(()=>Q(S,m=>m&&(p(),v("div",{key:"unchecked",class:C(`${e}-switch__unchecked`)},[z(()=>m)],2))))],2)],6)],46,Mt)}});const Vt={class:"page"},Lt={class:"mono"},Ft={class:"dim"},Dt={class:"dim"},It={key:1,class:"dim"},Nt={class:"mono small"},At={class:"acts"},Et={key:0,class:"tip"},Wt={key:0,class:"dim"},Ot={key:1,class:"ports"},Ht={class:"mono"},Ut={class:"dim"},Kt={key:0,class:"badline"},qt={class:"lbl"},Gt={class:"cap-name mono"},Xt={key:0,class:"dim"},Yt={class:"footnote"},Jt=ie({__name:"System",setup(e){const n=st(),i=G(null),o=A(()=>lt.value),u=A(()=>{var a;return((a=o.value)==null?void 0:a.link.mode)==="mock"}),w=G(0),P=G(!1),S=G(!1),$=G(!1);async function k(){var t;i.value=await J.systemInfo();const a=(t=o.value)==null?void 0:t.link.fault_injection;a&&(w.value=Math.round(a.command_fail_rate*100),P.value=a.node_b_offline,S.value=a.node_c_offline)}async function M(a){await J.mockFaultRate(a/100),n.info(`命令失败率已设为 ${a}%`)}async function g(a,t){await J.mockOffline(a,t)}async function m(){var a;$.value=!0;try{const t=(a=o.value)!=null&&a.link.paused?await J.serialResume():await J.serialPause();n.info(t.message)}catch{n.error("操作失败，串口状态可能没有改变，请看诊断信息")}finally{$.value=!1}}return Te(k),(a,t)=>{var B;return p(),v("div",Vt,[t[20]||(t[20]=c("div",{class:"section-title"},"运行模式",-1)),d(s(le),{bordered:!1,class:"c"},{default:h(()=>{var r;return[d(s(Pe),{column:1,"label-placement":"left",size:"small"},{default:h(()=>[d(s(V),{label:"设备模式"},{default:h(()=>[d(s(Z),{type:u.value?"warning":"success",size:"small",round:""},{default:h(()=>[j(_(u.value?"模拟设备 (DEVICE_MODE=mock)":"真实串口 (DEVICE_MODE=serial)"),1)]),_:1},8,["type"])]),_:1}),d(s(V),{label:"串口"},{default:h(()=>{var l,b;return[c("span",Lt,_((l=i.value)==null?void 0:l.configured_port)+" @ "+_((b=i.value)==null?void 0:b.configured_baud)+" 8N1",1)]}),_:1}),d(s(V),{label:"链路状态"},{default:h(()=>{var l,b,R;return[d(s(Z),{type:(l=o.value)!=null&&l.link.paused?"warning":(b=o.value)!=null&&b.link.connected?"success":"error",size:"small",round:""},{default:h(()=>{var T,E;return[j(_((T=o.value)!=null&&T.link.paused?"已暂停（烧录中）":(E=o.value)!=null&&E.link.connected?"已连接":"未连接"),1)]}),_:1},8,["type"]),c("span",Ft,"　最后收帧 "+_(s(ot)((R=o.value)==null?void 0:R.link.last_frame_at)),1)]}),_:1}),d(s(V),{label:"板子固件"},{default:h(()=>[s(re)?(p(),v(de,{key:0},[d(s(Z),{type:s(re).confirmed?"success":"warning",size:"small",round:""},{default:h(()=>[j(_(s(re).name)+_(s(re).confirmed?"":"（推测）"),1)]),_:1},8,["type"]),c("span",Dt,"　"+_(s(re).reason),1)],64)):(p(),v("span",It,"尚未判定（还没收到足够的判据）"))]),_:1}),d(s(V),{label:"WebSocket"},{default:h(()=>[d(s(Z),{type:s(Be)?"success":"error",size:"small",round:""},{default:h(()=>[j(_(s(Be)?"已连接":"断开重连中"),1)]),_:1},8,["type"])]),_:1}),d(s(V),{label:"数据库"},{default:h(()=>{var l;return[c("span",Nt,_((l=i.value)==null?void 0:l.database),1)]}),_:1}),d(s(V),{label:"AI 助手"},{default:h(()=>{var l;return[d(s(Z),{type:(l=i.value)!=null&&l.llm.enabled?"success":"default",size:"small",round:""},{default:h(()=>{var b;return[j(_((b=i.value)!=null&&b.llm.enabled?`已配置 · ${i.value.llm.model}`:"未配置"),1)]}),_:1},8,["type"])]}),_:1})]),_:1}),c("div",At,[d(s(ae),{size:"small",onClick:k},{default:h(()=>[...t[8]||(t[8]=[j("刷新",-1)])]),_:1}),u.value?ne("",!0):(p(),Ce(s(ae),{key:0,size:"small",type:(r=o.value)!=null&&r.link.paused?"primary":"default",loading:$.value,onClick:m},{default:h(()=>{var l;return[j(_((l=o.value)!=null&&l.link.paused?"恢复串口":"暂停串口（烧录前点这个）"),1)]}),_:1},8,["type","loading"]))]),u.value?ne("",!0):(p(),v("div",Et," 要用 STC-ISP 烧录板子时，先点上面「暂停串口」——串口独占，STC-ISP 和后端不能同时打开同一个口。网页全程不用刷新、不用重启后端。 烧录时按 STC 要求拔插一次 USB，后端看到端口消失又出现就会自己恢复， 不用回来点按钮；真忘了也没关系，超过 15 分钟会自动恢复。 "))]}),_:1}),t[21]||(t[21]=c("div",{class:"section-title"},"可用串口",-1)),d(s(le),{bordered:!1,class:"c"},{default:h(()=>{var r;return[(r=i.value)!=null&&r.available_ports.length?(p(),v("div",Ot,[(p(!0),v(de,null,Re(i.value.available_ports,l=>(p(),v("div",{key:l.device,class:"port"},[c("b",Ht,_(l.device),1),c("span",Ut,_(l.description),1)]))),128))])):(p(),v("div",Wt,"没有检测到串口设备。")),t[9]||(t[9]=c("div",{class:"tip"},[j(" 改用真实硬件：在 "),c("span",{class:"mono"},"backend/.env"),j(" 里把 "),c("span",{class:"mono"},"DEVICE_MODE"),j(" 改成 "),c("span",{class:"mono"},"serial"),j("， "),c("span",{class:"mono"},"SERIAL_PORT"),j(" 填 CH340 对应的口，然后重启后端。 ")],-1))]}),_:1}),t[22]||(t[22]=c("div",{class:"section-title"},"通信诊断",-1)),d(s(le),{bordered:!1,class:"c"},{default:h(()=>{var r;return[d(s(Pe),{column:2,"label-placement":"top",size:"small"},{default:h(()=>[d(s(V),{label:"485 CRC 累计错误"},{default:h(()=>{var l,b;return[c("b",{class:ce({bad:(((l=o.value)==null?void 0:l.diagnostics.crc_errors)??0)>0})},_(((b=o.value)==null?void 0:b.diagnostics.crc_errors)??0),3)]}),_:1}),d(s(V),{label:"已解析报文行"},{default:h(()=>{var l;return[j(_(((l=o.value)==null?void 0:l.diagnostics.frames_ok)??0),1)]}),_:1}),d(s(V),{label:"详细状态报文"},{default:h(()=>{var l;return[j(_(((l=o.value)==null?void 0:l.link.status_lines)??0),1)]}),_:1}),d(s(V),{label:"解析失败行"},{default:h(()=>{var l,b;return[c("b",{class:ce({bad:(((l=o.value)==null?void 0:l.diagnostics.frames_bad)??0)>0})},_(((b=o.value)==null?void 0:b.diagnostics.frames_bad)??0),3)]}),_:1}),d(s(V),{label:"丢弃噪声字节"},{default:h(()=>{var l;return[j(_(((l=o.value)==null?void 0:l.link.bytes_dropped)??0),1)]}),_:1}),d(s(V),{label:"NodeA 每秒主循环"},{default:h(()=>{var l;return[j(_(((l=o.value)==null?void 0:l.diagnostics.main_loops)==null?"未知":o.value.diagnostics.main_loops),1)]}),_:1}),d(s(V),{label:"NodeA 调度遗漏"},{default:h(()=>{var l,b;return[c("b",{class:ce({bad:(((l=o.value)==null?void 0:l.nodes.A.poll_miss)??0)>0})},_(((b=o.value)==null?void 0:b.nodes.A.poll_miss)==null?"未知":o.value.nodes.A.poll_miss),3)]}),_:1}),d(s(V),{label:"NodeB / NodeC 调度遗漏"},{default:h(()=>{var l,b;return[j(_(((l=o.value)==null?void 0:l.nodes.B.poll_miss)??"未知")+" / "+_(((b=o.value)==null?void 0:b.nodes.C.poll_miss)??"未知"),1)]}),_:1}),d(s(V),{label:"485 连续无应答 B / C"},{default:h(()=>{var l,b,R,T;return[c("b",{class:ce({bad:(((l=o.value)==null?void 0:l.diagnostics.master_reply_miss_b)??0)>0||(((b=o.value)==null?void 0:b.diagnostics.master_reply_miss_c)??0)>0})},_(((R=o.value)==null?void 0:R.diagnostics.master_reply_miss_b)??"未知")+" / "+_(((T=o.value)==null?void 0:T.diagnostics.master_reply_miss_c)??"未知"),3)]}),_:1})]),_:1}),(r=o.value)!=null&&r.link.last_bad_line?(p(),v("div",Kt,[t[10]||(t[10]=j(" 最近一条无法解析的行： ",-1)),d(s(pt),{code:o.value.link.last_bad_line,"word-wrap":""},null,8,["code"])])):ne("",!0),t[11]||(t[11]=c("div",{class:"tip"}," CRC 错误和调度遗漏应长期为 0，NodeA 每秒主循环应不低于 1000。 错误持续增长时先把三块板的 BUS_BAUD 一起降到 1200， 再检查 485 的 A/B 是否接反。 ",-1))]}),_:1}),u.value?(p(),v(de,{key:0},[t[19]||(t[19]=c("div",{class:"section-title"},"故障注入（仅模拟模式）",-1)),d(s(le),{bordered:!1,class:"c"},{default:h(()=>[d(s(Oe),{type:"info",bordered:!1,style:{"margin-bottom":"16px"}},{default:h(()=>[...t[12]||(t[12]=[j(' 用来演示"命令失败/超时"和"节点掉线"这两类异常路径。默认全部关闭，保证演示可复现。 ',-1)])]),_:1}),d(s(_e),{vertical:"",size:"large"},{default:h(()=>[c("div",null,[c("div",qt,"命令失败率："+_(w.value)+"%",1),d(s(it),{value:w.value,"onUpdate:value":[t[0]||(t[0]=r=>w.value=r),M],min:0,max:100,step:10},null,8,["value"])]),d(s(_e),{align:"center"},{default:h(()=>[t[13]||(t[13]=c("span",{class:"lbl"},"节点B 强制离线",-1)),d(s(Me),{value:P.value,"onUpdate:value":[t[1]||(t[1]=r=>P.value=r),t[2]||(t[2]=r=>g("B",r))]},null,8,["value"]),t[14]||(t[14]=c("span",{class:"lbl",style:{"margin-left":"16px"}},"节点C 强制离线",-1)),d(s(Me),{value:S.value,"onUpdate:value":[t[3]||(t[3]=r=>S.value=r),t[4]||(t[4]=r=>g("C",r))]},null,8,["value"])]),_:1}),d(s(_e),null,{default:h(()=>[d(s(ae),{size:"small",onClick:t[5]||(t[5]=r=>s(J).mockDoor(!0))},{default:h(()=>[...t[15]||(t[15]=[j("模拟开门",-1)])]),_:1}),d(s(ae),{size:"small",onClick:t[6]||(t[6]=r=>s(J).mockDoor(!1))},{default:h(()=>[...t[16]||(t[16]=[j("模拟关门",-1)])]),_:1}),d(s(ae),{size:"small",onClick:t[7]||(t[7]=r=>s(J).mockVibration())},{default:h(()=>[...t[17]||(t[17]=[j("模拟一次振动",-1)])]),_:1})]),_:1}),t[18]||(t[18]=c("div",{class:"tip"}," 布防状态下开门会立刻触发报警；振动需要在 2 秒窗口内累计 3 次才触发， 这两条规则都与 NodeC 固件一致。 ",-1))]),_:1})]),_:1})],64)):ne("",!0),t[23]||(t[23]=c("div",{class:"section-title"},"固件能力",-1)),d(s(le),{bordered:!1,class:"c"},{default:h(()=>{var r;return[(p(!0),v(de,null,Re((r=o.value)==null?void 0:r.capabilities,(l,b)=>(p(),v("div",{key:b,class:"cap"},[d(s(Z),{type:l.supported?"success":"warning",size:"small",round:""},{default:h(()=>[j(_(l.supported?"可用":"不可用"),1)]),_:2},1032,["type"]),c("span",Gt,_(b),1),l.reason?(p(),v("span",Xt,_(l.reason),1)):ne("",!0)]))),128))]}),_:1}),c("div",Yt," 状态时间戳 "+_(s(tt)((B=o.value)==null?void 0:B.ts)),1)])}}}),ao=nt(Jt,[["__scopeId","data-v-c99ff4eb"]]);export{ao as default};
