import{T as oe}from"./Tag-46eeSRsH.js";import{A as We}from"./Alert-BfkK-80U.js";import{ab as Oe,bT as He,g as N,E as Ce,M as V,N as v,aj as L,ak as x,d as ie,H as ee,o as g,a as y,O as w,Y as z,aa as H,J as $e,h as Me,R as fe,an as Se,k as G,a2 as _e,G as Z,al as xe,bU as Ue,bV as Ke,ap as qe,b as c,bW as Ge,ao as U,ai as Xe,bL as ke,br as pe,X as Q,e as we,P as Ye,U as me,aH as Je,av as Qe,bM as Ze,aB as ge,aA as q,j as d,w as b,u as i,a3 as le,F as ve,f as re,t as C,a_ as et,l as J,q as R,s as tt,bX as ze,a4 as ne,x as Be,n as se,B as ot,_ as lt}from"./index-DgZF15SC.js";import{g as rt}from"./get-slot-VaplJ9hC.js";import{u as nt}from"./use-compitable-D5JY3BXA.js";import{u as at}from"./use-message-YPvVCq6p.js";import{S as ye,a as it}from"./Slider-DF-zRY7r.js";import{u as st}from"./use-merged-state-qU7pmKBX.js";function dt(e,r){const s=Oe(He,null);return N(()=>e.hljs||(s==null?void 0:s.mergedHljsRef.value))}function ct(e){const{textColor2:r,fontSize:s,fontWeightStrong:o,textColor3:u}=e;return{textColor:r,fontSize:s,fontWeightStrong:o,"mono-3":"#a0a1a7","hue-1":"#0184bb","hue-2":"#4078f2","hue-3":"#a626a4","hue-4":"#50a14f","hue-5":"#e45649","hue-5-2":"#c91243","hue-6":"#986801","hue-6-2":"#c18401",lineNumberTextColor:u}}const ut={common:Ce,self:ct};var ht=V([v("code",`
 font-size: var(--n-font-size);
 font-family: var(--n-font-family);
 `,[L("show-line-numbers",`
 display: flex;
 `),x("line-numbers",`
 user-select: none;
 padding-right: 12px;
 text-align: right;
 transition: color .3s var(--n-bezier);
 color: var(--n-line-number-text-color);
 `),L("word-wrap",[V("pre",`
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
 `)]),({props:e})=>{const r=`${e.bPrefix}code`;return[`${r} .hljs-comment,
 ${r} .hljs-quote {
 color: var(--n-mono-3);
 font-style: italic;
 }`,`${r} .hljs-doctag,
 ${r} .hljs-keyword,
 ${r} .hljs-formula {
 color: var(--n-hue-3);
 }`,`${r} .hljs-section,
 ${r} .hljs-name,
 ${r} .hljs-selector-tag,
 ${r} .hljs-deletion,
 ${r} .hljs-subst {
 color: var(--n-hue-5);
 }`,`${r} .hljs-literal {
 color: var(--n-hue-1);
 }`,`${r} .hljs-string,
 ${r} .hljs-regexp,
 ${r} .hljs-addition,
 ${r} .hljs-attribute,
 ${r} .hljs-meta-string {
 color: var(--n-hue-4);
 }`,`${r} .hljs-built_in,
 ${r} .hljs-class .hljs-title {
 color: var(--n-hue-6-2);
 }`,`${r} .hljs-attr,
 ${r} .hljs-variable,
 ${r} .hljs-template-variable,
 ${r} .hljs-type,
 ${r} .hljs-selector-class,
 ${r} .hljs-selector-attr,
 ${r} .hljs-selector-pseudo,
 ${r} .hljs-number {
 color: var(--n-hue-6);
 }`,`${r} .hljs-symbol,
 ${r} .hljs-bullet,
 ${r} .hljs-link,
 ${r} .hljs-meta,
 ${r} .hljs-selector-id,
 ${r} .hljs-title {
 color: var(--n-hue-2);
 }`,`${r} .hljs-emphasis {
 font-style: italic;
 }`,`${r} .hljs-strong {
 font-weight: var(--n-font-weight-strong);
 }`,`${r} .hljs-link {
 text-decoration: underline;
 }`]}]);const bt={...ee.props,language:String,code:{type:String,default:""},trim:{type:Boolean,default:!0},hljs:Object,uri:Boolean,inline:Boolean,wordWrap:Boolean,showLineNumbers:Boolean,internalFontSize:Number,internalNoHighlight:Boolean};var ft=ie({name:"Code",props:bt,setup(e,{slots:r}){const{internalNoHighlight:s}=e,{mergedClsPrefixRef:o,inlineThemeDisabled:u}=$e(),_=G(null),P=s?{value:void 0}:dt(e),$=(a,t,B)=>{const{value:n}=P;return!n||!(a&&n.getLanguage(a))?null:n.highlight(B?t.trim():t,{language:a}).value},S=N(()=>e.inline||e.wordWrap?!1:e.showLineNumbers),k=()=>{if(r.default)return;const{value:a}=_;if(!a)return;const{language:t}=e,B=e.uri?window.decodeURIComponent(e.code):e.code;if(t){const l=$(t,B,e.trim);if(l!==null){if(e.inline)a.innerHTML=l;else{const h=a.querySelector(".__code__");h&&a.removeChild(h);const j=document.createElement("pre");j.className="__code__",j.innerHTML=l,a.appendChild(j)}return}}if(e.inline){a.textContent=B;return}const n=a.querySelector(".__code__");if(n)n.textContent=B;else{const l=document.createElement("pre");l.className="__code__",l.textContent=B,a.innerHTML="",a.appendChild(l)}};Me(k),fe(_e(e,"language"),k),fe(_e(e,"code"),k),s||fe(P,k);const M=ee("Code","-code",ht,ut,e,o),m=N(()=>{const{common:{cubicBezierEaseInOut:a,fontFamilyMono:t},self:{textColor:B,fontSize:n,fontWeightStrong:l,lineNumberTextColor:h,"mono-3":j,"hue-1":T,"hue-2":E,"hue-3":K,"hue-4":O,"hue-5":D,"hue-5-2":f,"hue-6":F,"hue-6-2":I}}=M.value,{internalFontSize:W}=e;return{"--n-font-size":W?`${W}px`:n,"--n-font-family":t,"--n-font-weight-strong":l,"--n-bezier":a,"--n-text-color":B,"--n-mono-3":j,"--n-hue-1":T,"--n-hue-2":E,"--n-hue-3":K,"--n-hue-4":O,"--n-hue-5":D,"--n-hue-5-2":f,"--n-hue-6":F,"--n-hue-6-2":I,"--n-line-number-text-color":h}}),p=u?Se("code",N(()=>`${e.internalFontSize||"a"}`),m,e):void 0;return{mergedClsPrefix:o,codeRef:_,mergedShowLineNumbers:S,lineNumbers:N(()=>{let a=1;const t=[];let B=!1;for(const n of e.code)n===`
`?(B=!0,t.push(a++)):B=!1;return B||t.push(a++),t.join(`
`)}),cssVars:u?void 0:m,themeClass:p==null?void 0:p.themeClass,onRender:p==null?void 0:p.onRender}},render(){const{mergedClsPrefix:e,wordWrap:r,mergedShowLineNumbers:s,onRender:o}=this;return o==null||o(),g(),y("code",{class:w([`${e}-code`,this.themeClass,r&&`${e}-code--word-wrap`,s&&`${e}-code--show-line-numbers`]),style:H(this.cssVars),ref:"codeRef"},[s?(g(),y("pre",{key:0,class:w(`${e}-code__line-numbers`)},[z(()=>this.lineNumbers)],2)):z(()=>null),z(()=>{var u,_;return(_=(u=this.$slots).default)==null?void 0:_.call(u)})],6)}}),pt={thPaddingBorderedSmall:"8px 12px",thPaddingBorderedMedium:"12px 16px",thPaddingBorderedLarge:"16px 24px",thPaddingSmall:"0",thPaddingMedium:"0",thPaddingLarge:"0",tdPaddingBorderedSmall:"8px 12px",tdPaddingBorderedMedium:"12px 16px",tdPaddingBorderedLarge:"16px 24px",tdPaddingSmall:"0 0 8px 0",tdPaddingMedium:"0 0 12px 0",tdPaddingLarge:"0 0 16px 0"};function mt(e){const{tableHeaderColor:r,textColor2:s,textColor1:o,cardColor:u,modalColor:_,popoverColor:P,dividerColor:$,borderRadius:S,fontWeightStrong:k,lineHeight:M,fontSizeSmall:m,fontSizeMedium:p,fontSizeLarge:a}=e;return{...pt,lineHeight:M,fontSizeSmall:m,fontSizeMedium:p,fontSizeLarge:a,titleTextColor:o,thColor:Z(u,r),thColorModal:Z(_,r),thColorPopover:Z(P,r),thTextColor:o,thFontWeight:k,tdTextColor:s,tdColor:u,tdColorModal:_,tdColorPopover:P,borderColor:Z(u,$),borderColorModal:Z(_,$),borderColorPopover:Z(P,$),borderRadius:S}}const gt={common:Ce,self:mt};function je(e,r="default",s=[]){const{children:o}=e;if(o!==null&&typeof o=="object"&&!Array.isArray(o)){const u=o[r];if(typeof u=="function")return u()}return s}var vt=V([v("descriptions",{fontSize:"var(--n-font-size)"},[v("descriptions-separator",`
 display: inline-block;
 margin: 0 8px 0 2px;
 `),v("descriptions-table-wrapper",[v("descriptions-table",[v("descriptions-table-row",[v("descriptions-table-header",{padding:"var(--n-th-padding)"}),v("descriptions-table-content",{padding:"var(--n-td-padding)"})])])]),xe("bordered",[v("descriptions-table-wrapper",[v("descriptions-table",[v("descriptions-table-row",[V("&:last-child",[v("descriptions-table-content",{paddingBottom:0})])])])])]),L("left-label-placement",[v("descriptions-table-content",[V("> *",{verticalAlign:"top"})])]),L("left-label-align",[V("th",{textAlign:"left"})]),L("center-label-align",[V("th",{textAlign:"center"})]),L("right-label-align",[V("th",{textAlign:"right"})]),L("bordered",[v("descriptions-table-wrapper",`
 border-radius: var(--n-border-radius);
 overflow: hidden;
 background: var(--n-merged-td-color);
 border: 1px solid var(--n-merged-border-color);
 `,[v("descriptions-table",[v("descriptions-table-row",[V("&:not(:last-child)",[v("descriptions-table-content",{borderBottom:"1px solid var(--n-merged-border-color)"}),v("descriptions-table-header",{borderBottom:"1px solid var(--n-merged-border-color)"})]),v("descriptions-table-header",`
 font-weight: 400;
 background-clip: padding-box;
 background-color: var(--n-merged-th-color);
 `,[V("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})]),v("descriptions-table-content",[V("&:not(:last-child)",{borderRight:"1px solid var(--n-merged-border-color)"})])])])])]),v("descriptions-header",`
 font-weight: var(--n-th-font-weight);
 font-size: 18px;
 transition: color .3s var(--n-bezier);
 line-height: var(--n-line-height);
 margin-bottom: 16px;
 color: var(--n-title-text-color);
 `),v("descriptions-table-wrapper",`
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[v("descriptions-table",`
 width: 100%;
 border-collapse: separate;
 border-spacing: 0;
 box-sizing: border-box;
 `,[v("descriptions-table-row",`
 box-sizing: border-box;
 transition: border-color .3s var(--n-bezier);
 `,[v("descriptions-table-header",`
 font-weight: var(--n-th-font-weight);
 line-height: var(--n-line-height);
 display: table-cell;
 box-sizing: border-box;
 color: var(--n-th-text-color);
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),v("descriptions-table-content",`
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
 `)])])])]),v("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color);
 --n-merged-td-color: var(--n-td-color);
 --n-merged-border-color: var(--n-border-color);
 `),Ue(v("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-modal);
 --n-merged-td-color: var(--n-td-color-modal);
 --n-merged-border-color: var(--n-border-color-modal);
 `)),Ke(v("descriptions-table-wrapper",`
 --n-merged-th-color: var(--n-th-color-popover);
 --n-merged-td-color: var(--n-td-color-popover);
 --n-merged-border-color: var(--n-border-color-popover);
 `))]);const yt="DESCRIPTION_ITEM_FLAG";function _t(e){return typeof e=="object"&&e&&!Array.isArray(e)?e.type&&e.type.DESCRIPTION_ITEM_FLAG:!1}const xt=["colspan"],wt=["colspan"],Ct=["colspan"],$t=["colspan"],St={...ee.props,title:String,column:{type:Number,default:3},columns:Number,labelPlacement:{type:String,default:"top"},labelAlign:{type:String,default:"left"},separator:{type:String,default:":"},size:String,bordered:Boolean,labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var Re=ie({name:"Descriptions",props:St,slots:Object,setup(e){const{mergedClsPrefixRef:r,inlineThemeDisabled:s,mergedComponentPropsRef:o}=$e(e),u=N(()=>{var S,k;return e.size||((k=(S=o==null?void 0:o.value)==null?void 0:S.Descriptions)==null?void 0:k.size)||"medium"}),_=ee("Descriptions","-descriptions",vt,gt,e,r),P=N(()=>{const{bordered:S}=e,k=u.value,{common:{cubicBezierEaseInOut:M},self:{titleTextColor:m,thColor:p,thColorModal:a,thColorPopover:t,thTextColor:B,thFontWeight:n,tdTextColor:l,tdColor:h,tdColorModal:j,tdColorPopover:T,borderColor:E,borderColorModal:K,borderColorPopover:O,borderRadius:D,lineHeight:f,[U("fontSize",k)]:F,[U(S?"thPaddingBordered":"thPadding",k)]:I,[U(S?"tdPaddingBordered":"tdPadding",k)]:W}}=_.value;return{"--n-title-text-color":m,"--n-th-padding":I,"--n-td-padding":W,"--n-font-size":F,"--n-bezier":M,"--n-th-font-weight":n,"--n-line-height":f,"--n-th-text-color":B,"--n-td-text-color":l,"--n-th-color":p,"--n-th-color-modal":a,"--n-th-color-popover":t,"--n-td-color":h,"--n-td-color-modal":j,"--n-td-color-popover":T,"--n-border-radius":D,"--n-border-color":E,"--n-border-color-modal":K,"--n-border-color-popover":O}}),$=s?Se("descriptions",N(()=>{let S="";const{bordered:k}=e;return k&&(S+="a"),S+=u.value[0],S}),P,e):void 0;return{mergedClsPrefix:r,cssVars:s?void 0:P,themeClass:$==null?void 0:$.themeClass,onRender:$==null?void 0:$.onRender,compitableColumn:nt(e,["columns","column"]),inlineThemeDisabled:s,mergedSize:u}},render(){const e=this.$slots.default,r=e?qe(e()):[];r.length;const{contentClass:s,labelClass:o,compitableColumn:u,labelPlacement:_,labelAlign:P,mergedSize:$,bordered:S,title:k,cssVars:M,mergedClsPrefix:m,separator:p,onRender:a}=this;a==null||a();const t=r.filter(n=>_t(n)),B=t.reduce((n,l,h)=>{const j=l.props||{},T=t.length-1===h,E=["label"in j?j.label:je(l,"label")],K=[je(l)],O=j.span||1,D=n.span;n.span+=O;const f=j.labelStyle||j["label-style"]||this.labelStyle,F=j.contentStyle||j["content-style"]||this.contentStyle;if(_==="left")S?n.row.push((g(),y("th",{key:1,class:w([`${m}-descriptions-table-header`,o]),colspan:1,style:H(f)},[z(()=>E)],6)),(g(),y("td",{key:2,class:w([`${m}-descriptions-table-content`,s]),colspan:T?(u-D)*2+1:O*2-1,style:H(F)},[z(()=>K)],14,xt))):n.row.push((g(),y("td",{key:3,class:w(`${m}-descriptions-table-content`),colspan:T?(u-D)*2:O*2},[c("span",{class:w([`${m}-descriptions-table-content__label`,o]),style:H(f)},[z(()=>[...E,p&&(g(),y("span",{key:4,class:w(`${m}-descriptions-separator`)},[z(()=>p)],2))])],6),c("span",{class:w([`${m}-descriptions-table-content__content`,s]),style:H(F)},[z(()=>K)],6)],10,wt)));else{const I=T?(u-D)*2:O*2;n.row.push((g(),y("th",{key:5,class:w([`${m}-descriptions-table-header`,o]),colspan:I,style:H(f)},[z(()=>E)],14,Ct))),n.secondRow.push((g(),y("td",{key:6,class:w([`${m}-descriptions-table-content`,s]),colspan:I,style:H(F)},[z(()=>K)],14,$t)))}return(n.span>=u||T)&&(n.span=0,n.row.length&&(n.rows.push(n.row),n.row=[]),_!=="left"&&n.secondRow.length&&(n.rows.push(n.secondRow),n.secondRow=[])),n},{span:0,row:[],secondRow:[],rows:[]}).rows.map(n=>(g(),y("tr",{class:w(`${m}-descriptions-table-row`)},[z(()=>n)],2)));return g(),y("div",{style:H(M),class:w([`${m}-descriptions`,this.themeClass,`${m}-descriptions--${_}-label-placement`,`${m}-descriptions--${P}-label-align`,`${m}-descriptions--${$}-size`,S&&`${m}-descriptions--bordered`])},[k||this.$slots.header?(g(),y("div",{key:0,class:w(`${m}-descriptions-header`)},[z(()=>k||rt(this,"header"))],2)):z(()=>null),c("div",{class:w(`${m}-descriptions-table-wrapper`)},[c("table",{class:w(`${m}-descriptions-table`)},[c("tbody",null,[z(()=>_==="top"&&(g(),y("tr",{class:w(`${m}-descriptions-table-row`),style:{visibility:"collapse"}},[z(()=>Ge(u*2,(g(),y("td"))))],2))),z(()=>B)])],2)],2)],6)}});const kt={label:String,span:{type:Number,default:1},labelClass:String,labelStyle:[Object,String],contentClass:String,contentStyle:[Object,String]};var A=ie({name:"DescriptionsItem",[yt]:!0,props:kt,slots:Object,render(){return null}}),zt={buttonHeightSmall:"14px",buttonHeightMedium:"18px",buttonHeightLarge:"22px",buttonWidthSmall:"14px",buttonWidthMedium:"18px",buttonWidthLarge:"22px",buttonWidthPressedSmall:"20px",buttonWidthPressedMedium:"24px",buttonWidthPressedLarge:"28px",railHeightSmall:"18px",railHeightMedium:"22px",railHeightLarge:"26px",railWidthSmall:"32px",railWidthMedium:"40px",railWidthLarge:"48px"};function Bt(e){const{primaryColor:r,opacityDisabled:s,borderRadius:o,textColor3:u}=e;return{...zt,iconColor:u,textColor:"white",loadingColor:r,opacityDisabled:s,railColor:"rgba(0, 0, 0, .14)",railColorActive:r,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:o,railBorderRadiusMedium:o,railBorderRadiusLarge:o,buttonBorderRadiusSmall:o,buttonBorderRadiusMedium:o,buttonBorderRadiusLarge:o,boxShadowFocus:`0 0 0 2px ${Xe(r,{alpha:.2})}`}}const jt={common:Ce,self:Bt};var Rt=v("switch",`
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
 `),v("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[ke({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),x("checked, unchecked",`
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
 `),V("&:focus",[x("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),L("round",[x("rail","border-radius: calc(var(--n-rail-height) / 2);",[x("button","border-radius: calc(var(--n-button-height) / 2);")])]),xe("disabled",[xe("icon",[L("rubber-band",[L("pressed",[x("rail",[x("button","max-width: var(--n-button-width-pressed);")])]),x("rail",[V("&:active",[x("button","max-width: var(--n-button-width-pressed);")])]),L("active",[L("pressed",[x("rail",[x("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),x("rail",[V("&:active",[x("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),L("active",[x("rail",[x("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),x("rail",`
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
 `,[ke()]),x("button",`
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
 `)]),L("active",[x("rail","background-color: var(--n-rail-color-active);")]),L("loading",[x("rail",`
 cursor: wait;
 `)]),L("disabled",[x("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]);const Pt=["aria-checked","tabindex","onClick","onFocus","onBlur","onKeyup","onKeydown"],Mt={...ee.props,size:String,value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},spinProps:Object,onChange:[Function,Array]};let ae;var Pe=ie({name:"Switch",props:Mt,slots:Object,setup(e){ae===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?ae=CSS.supports("width","max(1px)"):ae=!1:ae=!0);const{mergedClsPrefixRef:r,inlineThemeDisabled:s,mergedComponentPropsRef:o}=$e(e),u=ee("Switch","-switch",Rt,jt,e,r),_=Ye(e,{mergedSize(f){var I,W;if(e.size!==void 0)return e.size;if(f)return f.mergedSize.value;const F=(W=(I=o==null?void 0:o.value)==null?void 0:I.Switch)==null?void 0:W.size;return F||"medium"}}),{mergedSizeRef:P,mergedDisabledRef:$}=_,S=G(e.defaultValue),k=_e(e,"value"),M=st(k,S),m=N(()=>M.value===e.checkedValue),p=G(!1),a=G(!1),t=N(()=>{const{railStyle:f}=e;if(f)return f({focused:a.value,checked:m.value})});function B(f){const{"onUpdate:value":F,onChange:I,onUpdateValue:W}=e,{nTriggerFormInput:de,nTriggerFormChange:ce}=_;F&&me(F,f),W&&me(W,f),I&&me(I,f),S.value=f,de(),ce()}function n(){const{nTriggerFormFocus:f}=_;f()}function l(){const{nTriggerFormBlur:f}=_;f()}function h(){e.loading||$.value||(M.value!==e.checkedValue?B(e.checkedValue):B(e.uncheckedValue))}function j(){a.value=!0,n()}function T(){a.value=!1,l(),p.value=!1}function E(f){e.loading||$.value||f.key===" "&&(M.value!==e.checkedValue?B(e.checkedValue):B(e.uncheckedValue),p.value=!1)}function K(f){e.loading||$.value||f.key===" "&&(f.preventDefault(),p.value=!0)}const O=N(()=>{const{value:f}=P,{self:{opacityDisabled:F,railColor:I,railColorActive:W,buttonBoxShadow:de,buttonColor:ce,boxShadowFocus:Te,loadingColor:Ve,textColor:Le,iconColor:Fe,[U("buttonHeight",f)]:X,[U("buttonWidth",f)]:Ae,[U("buttonWidthPressed",f)]:De,[U("railHeight",f)]:Y,[U("railWidth",f)]:te,[U("railBorderRadius",f)]:Ie,[U("buttonBorderRadius",f)]:Ne},common:{cubicBezierEaseInOut:Ee}}=u.value;let ue,he,be;return ae?(ue=`calc((${Y} - ${X}) / 2)`,he=`max(${Y}, ${X})`,be=`max(${te}, calc(${te} + ${X} - ${Y}))`):(ue=ge((q(Y)-q(X))/2),he=ge(Math.max(q(Y),q(X))),be=q(Y)>q(X)?te:ge(q(te)+q(X)-q(Y))),{"--n-bezier":Ee,"--n-button-border-radius":Ne,"--n-button-box-shadow":de,"--n-button-color":ce,"--n-button-width":Ae,"--n-button-width-pressed":De,"--n-button-height":X,"--n-height":he,"--n-offset":ue,"--n-opacity-disabled":F,"--n-rail-border-radius":Ie,"--n-rail-color":I,"--n-rail-color-active":W,"--n-rail-height":Y,"--n-rail-width":te,"--n-width":be,"--n-box-shadow-focus":Te,"--n-loading-color":Ve,"--n-text-color":Le,"--n-icon-color":Fe}}),D=s?Se("switch",N(()=>P.value[0]),O,e):void 0;return{handleClick:h,handleBlur:T,handleFocus:j,handleKeyup:E,handleKeydown:K,mergedRailStyle:t,pressed:p,mergedClsPrefix:r,mergedValue:M,checked:m,mergedDisabled:$,cssVars:s?void 0:O,themeClass:D==null?void 0:D.themeClass,onRender:D==null?void 0:D.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:r,checked:s,mergedRailStyle:o,onRender:u,$slots:_}=this;u==null||u();const{checked:P,unchecked:$,icon:S,"checked-icon":k,"unchecked-icon":M}=_,m=!(pe(S)&&pe(k)&&pe(M));return g(),y("div",{role:"switch","aria-checked":s,class:w([`${e}-switch`,this.themeClass,m&&`${e}-switch--icon`,s&&`${e}-switch--active`,r&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`]),tabindex:this.mergedDisabled?void 0:0,style:H(this.cssVars),onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},[c("div",{class:w(`${e}-switch__rail`),"aria-hidden":"true",style:H(o)},[z(()=>Q(P,p=>Q($,a=>p||a?(g(),y("div",{key:4,"aria-hidden":!0,class:w(`${e}-switch__children-placeholder`)},[c("div",{class:w(`${e}-switch__rail-placeholder`)},[c("div",{class:w(`${e}-switch__button-placeholder`)},null,2),z(()=>p)],2),c("div",{class:w(`${e}-switch__rail-placeholder`)},[c("div",{class:w(`${e}-switch__button-placeholder`)},null,2),z(()=>a)],2)],2)):null))),c("div",{class:w(`${e}-switch__button`)},[z(()=>Q(S,p=>Q(k,a=>Q(M,t=>(g(),we(Ze,null,{default:()=>this.loading?(g(),we(Je,Qe({key:"loading",clsPrefix:e,strokeWidth:20},this.spinProps),null,16,["clsPrefix"])):this.checked&&(a||p)?(g(),y("div",{class:w(`${e}-switch__button-icon`),key:a?"checked-icon":"icon"},[z(()=>a||p)],2)):!this.checked&&(t||p)?(g(),y("div",{class:w(`${e}-switch__button-icon`),key:t?"unchecked-icon":"icon"},[z(()=>t||p)],2)):null},1024)))))),z(()=>Q(P,p=>p&&(g(),y("div",{key:"checked",class:w(`${e}-switch__checked`)},[z(()=>p)],2)))),z(()=>Q($,p=>p&&(g(),y("div",{key:"unchecked",class:w(`${e}-switch__unchecked`)},[z(()=>p)],2))))],2)],6)],46,Pt)}});const Tt={class:"page"},Vt={class:"mono"},Lt={class:"dim"},Ft={class:"mono small"},At={class:"acts"},Dt={key:0,class:"tip"},It={key:0,class:"dim"},Nt={key:1,class:"ports"},Et={class:"mono"},Wt={class:"dim"},Ot={key:0,class:"badline"},Ht={class:"lbl"},Ut={class:"cap-name mono"},Kt={key:0,class:"dim"},qt={class:"footnote"},Gt=ie({__name:"System",setup(e){const r=at(),s=G(null),o=N(()=>ot.value),u=N(()=>{var a;return((a=o.value)==null?void 0:a.link.mode)==="mock"}),_=G(0),P=G(!1),$=G(!1),S=G(!1);async function k(){var t;s.value=await J.systemInfo();const a=(t=o.value)==null?void 0:t.link.fault_injection;a&&(_.value=Math.round(a.command_fail_rate*100),P.value=a.node_b_offline,$.value=a.node_c_offline)}async function M(a){await J.mockFaultRate(a/100),r.info(`命令失败率已设为 ${a}%`)}async function m(a,t){await J.mockOffline(a,t)}async function p(){var a;S.value=!0;try{const t=(a=o.value)!=null&&a.link.paused?await J.serialResume():await J.serialPause();r.info(t.message)}catch{r.error("操作失败，串口状态可能没有改变，请看诊断信息")}finally{S.value=!1}}return Me(k),(a,t)=>{var B;return g(),y("div",Tt,[t[20]||(t[20]=c("div",{class:"section-title"},"运行模式",-1)),d(i(le),{bordered:!1,class:"c"},{default:b(()=>{var n;return[d(i(Re),{column:1,"label-placement":"left",size:"small"},{default:b(()=>[d(i(A),{label:"设备模式"},{default:b(()=>[d(i(oe),{type:u.value?"warning":"success",size:"small",round:""},{default:b(()=>[R(C(u.value?"模拟设备 (DEVICE_MODE=mock)":"真实串口 (DEVICE_MODE=serial)"),1)]),_:1},8,["type"])]),_:1}),d(i(A),{label:"串口"},{default:b(()=>{var l,h;return[c("span",Vt,C((l=s.value)==null?void 0:l.configured_port)+" @ "+C((h=s.value)==null?void 0:h.configured_baud)+" 8N1",1)]}),_:1}),d(i(A),{label:"链路状态"},{default:b(()=>{var l,h,j;return[d(i(oe),{type:(l=o.value)!=null&&l.link.paused?"warning":(h=o.value)!=null&&h.link.connected?"success":"error",size:"small",round:""},{default:b(()=>{var T,E;return[R(C((T=o.value)!=null&&T.link.paused?"已暂停（烧录中）":(E=o.value)!=null&&E.link.connected?"已连接":"未连接"),1)]}),_:1},8,["type"]),c("span",Lt,"　最后收帧 "+C(i(tt)((j=o.value)==null?void 0:j.link.last_frame_at)),1)]}),_:1}),d(i(A),{label:"WebSocket"},{default:b(()=>[d(i(oe),{type:i(ze)?"success":"error",size:"small",round:""},{default:b(()=>[R(C(i(ze)?"已连接":"断开重连中"),1)]),_:1},8,["type"])]),_:1}),d(i(A),{label:"数据库"},{default:b(()=>{var l;return[c("span",Ft,C((l=s.value)==null?void 0:l.database),1)]}),_:1}),d(i(A),{label:"AI 助手"},{default:b(()=>{var l;return[d(i(oe),{type:(l=s.value)!=null&&l.llm.enabled?"success":"default",size:"small",round:""},{default:b(()=>{var h;return[R(C((h=s.value)!=null&&h.llm.enabled?`已配置 · ${s.value.llm.model}`:"未配置"),1)]}),_:1},8,["type"])]}),_:1})]),_:1}),c("div",At,[d(i(ne),{size:"small",onClick:k},{default:b(()=>[...t[8]||(t[8]=[R("刷新",-1)])]),_:1}),u.value?re("",!0):(g(),we(i(ne),{key:0,size:"small",type:(n=o.value)!=null&&n.link.paused?"primary":"default",loading:S.value,onClick:p},{default:b(()=>{var l;return[R(C((l=o.value)!=null&&l.link.paused?"恢复串口":"暂停串口（烧录前点这个）"),1)]}),_:1},8,["type","loading"]))]),u.value?re("",!0):(g(),y("div",Dt," 要用 STC-ISP 烧录板子时，先点上面「暂停串口」——串口独占，STC-ISP 和后端不能同时打开同一个口。烧完点「恢复串口」，网页全程不用刷新、不用重启后端。 "))]}),_:1}),t[21]||(t[21]=c("div",{class:"section-title"},"可用串口",-1)),d(i(le),{bordered:!1,class:"c"},{default:b(()=>{var n;return[(n=s.value)!=null&&n.available_ports.length?(g(),y("div",Nt,[(g(!0),y(ve,null,Be(s.value.available_ports,l=>(g(),y("div",{key:l.device,class:"port"},[c("b",Et,C(l.device),1),c("span",Wt,C(l.description),1)]))),128))])):(g(),y("div",It,"没有检测到串口设备。")),t[9]||(t[9]=c("div",{class:"tip"},[R(" 改用真实硬件：在 "),c("span",{class:"mono"},"backend/.env"),R(" 里把 "),c("span",{class:"mono"},"DEVICE_MODE"),R(" 改成 "),c("span",{class:"mono"},"serial"),R("， "),c("span",{class:"mono"},"SERIAL_PORT"),R(" 填 CH340 对应的口，然后重启后端。 ")],-1))]}),_:1}),t[22]||(t[22]=c("div",{class:"section-title"},"通信诊断",-1)),d(i(le),{bordered:!1,class:"c"},{default:b(()=>{var n;return[d(i(Re),{column:2,"label-placement":"top",size:"small"},{default:b(()=>[d(i(A),{label:"485 CRC 累计错误"},{default:b(()=>{var l,h;return[c("b",{class:se({bad:(((l=o.value)==null?void 0:l.diagnostics.crc_errors)??0)>0})},C(((h=o.value)==null?void 0:h.diagnostics.crc_errors)??0),3)]}),_:1}),d(i(A),{label:"已解析报文行"},{default:b(()=>{var l;return[R(C(((l=o.value)==null?void 0:l.diagnostics.frames_ok)??0),1)]}),_:1}),d(i(A),{label:"详细状态报文"},{default:b(()=>{var l;return[R(C(((l=o.value)==null?void 0:l.link.status_lines)??0),1)]}),_:1}),d(i(A),{label:"解析失败行"},{default:b(()=>{var l,h;return[c("b",{class:se({bad:(((l=o.value)==null?void 0:l.diagnostics.frames_bad)??0)>0})},C(((h=o.value)==null?void 0:h.diagnostics.frames_bad)??0),3)]}),_:1}),d(i(A),{label:"丢弃噪声字节"},{default:b(()=>{var l;return[R(C(((l=o.value)==null?void 0:l.link.bytes_dropped)??0),1)]}),_:1}),d(i(A),{label:"NodeA 每秒主循环"},{default:b(()=>{var l;return[R(C(((l=o.value)==null?void 0:l.diagnostics.main_loops)==null?"未知":o.value.diagnostics.main_loops),1)]}),_:1}),d(i(A),{label:"NodeA 调度遗漏"},{default:b(()=>{var l,h;return[c("b",{class:se({bad:(((l=o.value)==null?void 0:l.nodes.A.poll_miss)??0)>0})},C(((h=o.value)==null?void 0:h.nodes.A.poll_miss)==null?"未知":o.value.nodes.A.poll_miss),3)]}),_:1}),d(i(A),{label:"NodeB / NodeC 调度遗漏"},{default:b(()=>{var l,h;return[R(C(((l=o.value)==null?void 0:l.nodes.B.poll_miss)??"未知")+" / "+C(((h=o.value)==null?void 0:h.nodes.C.poll_miss)??"未知"),1)]}),_:1}),d(i(A),{label:"485 连续无应答 B / C"},{default:b(()=>{var l,h,j,T;return[c("b",{class:se({bad:(((l=o.value)==null?void 0:l.diagnostics.master_reply_miss_b)??0)>0||(((h=o.value)==null?void 0:h.diagnostics.master_reply_miss_c)??0)>0})},C(((j=o.value)==null?void 0:j.diagnostics.master_reply_miss_b)??"未知")+" / "+C(((T=o.value)==null?void 0:T.diagnostics.master_reply_miss_c)??"未知"),3)]}),_:1})]),_:1}),(n=o.value)!=null&&n.link.last_bad_line?(g(),y("div",Ot,[t[10]||(t[10]=R(" 最近一条无法解析的行： ",-1)),d(i(ft),{code:o.value.link.last_bad_line,"word-wrap":""},null,8,["code"])])):re("",!0),t[11]||(t[11]=c("div",{class:"tip"}," CRC 错误和调度遗漏应长期为 0，NodeA 每秒主循环应不低于 1000。 错误持续增长时先把三块板的 BUS_BAUD 一起降到 1200， 再检查 485 的 A/B 是否接反。 ",-1))]}),_:1}),u.value?(g(),y(ve,{key:0},[t[19]||(t[19]=c("div",{class:"section-title"},"故障注入（仅模拟模式）",-1)),d(i(le),{bordered:!1,class:"c"},{default:b(()=>[d(i(We),{type:"info",bordered:!1,style:{"margin-bottom":"16px"}},{default:b(()=>[...t[12]||(t[12]=[R(' 用来演示"命令失败/超时"和"节点掉线"这两类异常路径。默认全部关闭，保证演示可复现。 ',-1)])]),_:1}),d(i(ye),{vertical:"",size:"large"},{default:b(()=>[c("div",null,[c("div",Ht,"命令失败率："+C(_.value)+"%",1),d(i(it),{value:_.value,"onUpdate:value":[t[0]||(t[0]=n=>_.value=n),M],min:0,max:100,step:10},null,8,["value"])]),d(i(ye),{align:"center"},{default:b(()=>[t[13]||(t[13]=c("span",{class:"lbl"},"节点B 强制离线",-1)),d(i(Pe),{value:P.value,"onUpdate:value":[t[1]||(t[1]=n=>P.value=n),t[2]||(t[2]=n=>m("B",n))]},null,8,["value"]),t[14]||(t[14]=c("span",{class:"lbl",style:{"margin-left":"16px"}},"节点C 强制离线",-1)),d(i(Pe),{value:$.value,"onUpdate:value":[t[3]||(t[3]=n=>$.value=n),t[4]||(t[4]=n=>m("C",n))]},null,8,["value"])]),_:1}),d(i(ye),null,{default:b(()=>[d(i(ne),{size:"small",onClick:t[5]||(t[5]=n=>i(J).mockDoor(!0))},{default:b(()=>[...t[15]||(t[15]=[R("模拟开门",-1)])]),_:1}),d(i(ne),{size:"small",onClick:t[6]||(t[6]=n=>i(J).mockDoor(!1))},{default:b(()=>[...t[16]||(t[16]=[R("模拟关门",-1)])]),_:1}),d(i(ne),{size:"small",onClick:t[7]||(t[7]=n=>i(J).mockVibration())},{default:b(()=>[...t[17]||(t[17]=[R("模拟一次振动",-1)])]),_:1})]),_:1}),t[18]||(t[18]=c("div",{class:"tip"}," 布防状态下开门会立刻触发报警；振动需要在 2 秒窗口内累计 3 次才触发， 这两条规则都与 NodeC 固件一致。 ",-1))]),_:1})]),_:1})],64)):re("",!0),t[23]||(t[23]=c("div",{class:"section-title"},"固件能力",-1)),d(i(le),{bordered:!1,class:"c"},{default:b(()=>{var n;return[(g(!0),y(ve,null,Be((n=o.value)==null?void 0:n.capabilities,(l,h)=>(g(),y("div",{key:h,class:"cap"},[d(i(oe),{type:l.supported?"success":"warning",size:"small",round:""},{default:b(()=>[R(C(l.supported?"可用":"不可用"),1)]),_:2},1032,["type"]),c("span",Ut,C(h),1),l.reason?(g(),y("span",Kt,C(l.reason),1)):re("",!0)]))),128))]}),_:1}),c("div",qt," 状态时间戳 "+C(i(et)((B=o.value)==null?void 0:B.ts)),1)])}}}),lo=lt(Gt,[["__scopeId","data-v-fbbeed34"]]);export{lo as default};
