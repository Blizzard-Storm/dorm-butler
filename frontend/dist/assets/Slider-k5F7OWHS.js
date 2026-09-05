import{bW as no,d as $e,H as ie,ap as io,o as c,a as v,F as O,Y as w,bX as lo,aa as A,O as x,J as Te,T as so,g as S,ao as co,bY as uo,aA as Se,E as ho,M as G,N as r,aj as b,ak as oe,aG as Re,bS as fo,bT as vo,bZ as mo,b as he,e as te,P as po,k as I,R as ze,af as go,an as Ce,aM as bo,U as ae,W as re,bp as ne,$ as xo,aF as wo,V as fe,a2 as yo}from"./index-2nvU8qd5.js";import{g as ko}from"./get-slot-VaplJ9hC.js";import{u as me,V as So,e as Ro,B as zo}from"./Follower-43Ga-Qaz.js";import{u as Co}from"./use-merged-state-ClOgiocA.js";var Bo={gapSmall:"4px 8px",gapMedium:"8px 12px",gapLarge:"12px 16px"};function Mo(){return Bo}const $o={self:Mo};let ve;function To(){if(!no)return!0;if(ve===void 0){const o=document.createElement("div");o.style.display="flex",o.style.flexDirection="column",o.style.rowGap="1px",o.appendChild(document.createElement("div")),o.appendChild(document.createElement("div")),document.body.appendChild(o);const h=o.scrollHeight===1;return document.body.removeChild(o),ve=h}return ve}const Do={...ie.props,align:String,justify:{type:String,default:"start"},inline:Boolean,vertical:Boolean,reverse:Boolean,size:[String,Number,Array],wrapItem:{type:Boolean,default:!0},itemClass:String,itemStyle:[String,Object],wrap:{type:Boolean,default:!0},internalUseGap:{type:Boolean,default:void 0}};var Oo=$e({name:"Space",props:Do,setup(o){const{mergedClsPrefixRef:h,mergedRtlRef:y,mergedComponentPropsRef:u}=Te(o),i=S(()=>{var s,z;return o.size??((z=(s=u==null?void 0:u.value)==null?void 0:s.Space)==null?void 0:z.size)??"medium"}),d=ie("Space","-space",void 0,$o,o,h),R=so("Space",y,h);return{useGap:To(),rtlEnabled:R,mergedClsPrefix:h,margin:S(()=>{const s=i.value;if(Array.isArray(s))return{horizontal:s[0],vertical:s[1]};if(typeof s=="number")return{horizontal:s,vertical:s};const{self:{[co("gap",s)]:z}}=d.value,{row:D,col:$}=uo(z);return{horizontal:Se($),vertical:Se(D)}})}},render(){const{vertical:o,reverse:h,align:y,inline:u,justify:i,itemClass:d,itemStyle:R,margin:s,wrap:z,mergedClsPrefix:D,rtlEnabled:$,useGap:C,wrapItem:j,internalUseGap:W}=this,V=io(ko(this),!1);if(!V.length)return null;const K=`${s.horizontal}px`,F=`${s.horizontal/2}px`,g=`${s.vertical}px`,T=`${s.vertical/2}px`,H=V.length-1,P=i.startsWith("space-");return c(),v("div",{role:"none",class:x([`${D}-space`,$&&`${D}-space--rtl`]),style:A({display:u?"inline-flex":"flex",flexDirection:o&&!h?"column":o&&h?"column-reverse":!o&&h?"row-reverse":"row",justifyContent:["start","end"].includes(i)?`flex-${i}`:i,flexWrap:!z||o?"nowrap":"wrap",marginTop:C||o?"":`-${T}`,marginBottom:C||o?"":`-${T}`,alignItems:y,gap:C?`${s.vertical}px ${s.horizontal}px`:""})},[!j&&(C||W)?(c(),v(O,{key:0},[w(()=>V)],64)):(c(),v(O,{key:1},[w(()=>V.map((m,B)=>m.type===lo?m:(c(),v("div",{key:1,role:"none",class:x(d),style:A([R,{maxWidth:"100%"},C?"":o?{marginBottom:B!==H?g:""}:$?{marginLeft:P?i==="space-between"&&B===H?"":F:B!==H?K:"",marginRight:P?i==="space-between"&&B===0?"":F:"",paddingTop:T,paddingBottom:T}:{marginRight:P?i==="space-between"&&B===H?"":F:B!==H?K:"",marginLeft:P?i==="space-between"&&B===0?"":F:"",paddingTop:T,paddingBottom:T}])},[w(()=>m)],6))))],64))],6)}}),Vo={railHeight:"4px",railWidthVertical:"4px",handleSize:"18px",dotHeight:"8px",dotWidth:"8px",dotBorderRadius:"4px"};function Fo(o){const h="rgba(0, 0, 0, .85)",y="0 2px 8px 0 rgba(0, 0, 0, 0.12)",{railColor:u,primaryColor:i,baseColor:d,cardColor:R,modalColor:s,popoverColor:z,borderRadius:D,fontSize:$,opacityDisabled:C}=o;return{...Vo,fontSize:$,markFontSize:$,railColor:u,railColorHover:u,fillColor:i,fillColorHover:i,opacityDisabled:C,handleColor:"#FFF",dotColor:R,dotColorModal:s,dotColorPopover:z,handleBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowHover:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowActive:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",handleBoxShadowFocus:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",indicatorColor:h,indicatorBoxShadow:y,indicatorTextColor:d,indicatorBorderRadius:D,dotBorder:`2px solid ${u}`,dotBorderActive:`2px solid ${i}`,dotBoxShadow:""}}const Eo={common:ho,self:Fo};var Io=G([r("slider",`
 display: block;
 padding: calc((var(--n-handle-size) - var(--n-rail-height)) / 2) 0;
 position: relative;
 z-index: 0;
 width: 100%;
 cursor: pointer;
 user-select: none;
 -webkit-user-select: none;
 `,[b("reverse",[r("slider-handles",[r("slider-handle-wrapper",`
 transform: translate(50%, -50%);
 `)]),r("slider-dots",[r("slider-dot",`
 transform: translateX(50%, -50%);
 `)]),b("vertical",[r("slider-handles",[r("slider-handle-wrapper",`
 transform: translate(-50%, -50%);
 `)]),r("slider-marks",[r("slider-mark",`
 transform: translateY(calc(-50% + var(--n-dot-height) / 2));
 `)]),r("slider-dots",[r("slider-dot",`
 transform: translateX(-50%) translateY(0);
 `)])])]),b("vertical",`
 box-sizing: content-box;
 padding: 0 calc((var(--n-handle-size) - var(--n-rail-height)) / 2);
 width: var(--n-rail-width-vertical);
 height: 100%;
 `,[r("slider-handles",`
 top: calc(var(--n-handle-size) / 2);
 right: 0;
 bottom: calc(var(--n-handle-size) / 2);
 left: 0;
 `,[r("slider-handle-wrapper",`
 top: unset;
 left: 50%;
 transform: translate(-50%, 50%);
 `)]),r("slider-rail",`
 height: 100%;
 `,[oe("fill",`
 top: unset;
 right: 0;
 bottom: unset;
 left: 0;
 `)]),b("with-mark",`
 width: var(--n-rail-width-vertical);
 margin: 0 32px 0 8px;
 `),r("slider-marks",`
 top: calc(var(--n-handle-size) / 2);
 right: unset;
 bottom: calc(var(--n-handle-size) / 2);
 left: 22px;
 font-size: var(--n-mark-font-size);
 `,[r("slider-mark",`
 transform: translateY(50%);
 white-space: nowrap;
 `)]),r("slider-dots",`
 top: calc(var(--n-handle-size) / 2);
 right: unset;
 bottom: calc(var(--n-handle-size) / 2);
 left: 50%;
 `,[r("slider-dot",`
 transform: translateX(-50%) translateY(50%);
 `)])]),b("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `,[r("slider-handle",`
 cursor: not-allowed;
 `)]),b("with-mark",`
 width: 100%;
 margin: 8px 0 32px 0;
 `),G("&:hover",[r("slider-rail",{backgroundColor:"var(--n-rail-color-hover)"},[oe("fill",{backgroundColor:"var(--n-fill-color-hover)"})]),r("slider-handle",{boxShadow:"var(--n-handle-box-shadow-hover)"})]),b("active",[r("slider-rail",{backgroundColor:"var(--n-rail-color-hover)"},[oe("fill",{backgroundColor:"var(--n-fill-color-hover)"})]),r("slider-handle",{boxShadow:"var(--n-handle-box-shadow-hover)"})]),r("slider-marks",`
 position: absolute;
 top: 18px;
 left: calc(var(--n-handle-size) / 2);
 right: calc(var(--n-handle-size) / 2);
 `,[r("slider-mark",`
 position: absolute;
 transform: translateX(-50%);
 white-space: nowrap;
 `)]),r("slider-rail",`
 width: 100%;
 position: relative;
 height: var(--n-rail-height);
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 border-radius: calc(var(--n-rail-height) / 2);
 `,[oe("fill",`
 position: absolute;
 top: 0;
 bottom: 0;
 border-radius: calc(var(--n-rail-height) / 2);
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-fill-color);
 `)]),r("slider-handles",`
 position: absolute;
 top: 0;
 right: calc(var(--n-handle-size) / 2);
 bottom: 0;
 left: calc(var(--n-handle-size) / 2);
 `,[r("slider-handle-wrapper",`
 outline: none;
 position: absolute;
 top: 50%;
 transform: translate(-50%, -50%);
 cursor: pointer;
 display: flex;
 `,[r("slider-handle",`
 height: var(--n-handle-size);
 width: var(--n-handle-size);
 border-radius: 50%;
 overflow: hidden;
 transition: box-shadow .2s var(--n-bezier), background-color .3s var(--n-bezier);
 background-color: var(--n-handle-color);
 box-shadow: var(--n-handle-box-shadow);
 `,[G("&:hover",`
 box-shadow: var(--n-handle-box-shadow-hover);
 `)]),G("&:focus",[r("slider-handle",`
 box-shadow: var(--n-handle-box-shadow-focus);
 `,[G("&:hover",`
 box-shadow: var(--n-handle-box-shadow-active);
 `)])])])]),r("slider-dots",`
 position: absolute;
 top: 50%;
 left: calc(var(--n-handle-size) / 2);
 right: calc(var(--n-handle-size) / 2);
 `,[b("transition-disabled",[r("slider-dot","transition: none;")]),r("slider-dot",`
 transition:
 border-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 transform: translate(-50%, -50%);
 height: var(--n-dot-height);
 width: var(--n-dot-width);
 border-radius: var(--n-dot-border-radius);
 overflow: hidden;
 box-sizing: border-box;
 border: var(--n-dot-border);
 background-color: var(--n-dot-color);
 `,[b("active","border: var(--n-dot-border-active);")])])]),r("slider-handle-indicator",`
 font-size: var(--n-font-size);
 padding: 6px 10px;
 border-radius: var(--n-indicator-border-radius);
 color: var(--n-indicator-text-color);
 background-color: var(--n-indicator-color);
 box-shadow: var(--n-indicator-box-shadow);
 `,[Re()]),r("slider-handle-indicator",`
 font-size: var(--n-font-size);
 padding: 6px 10px;
 border-radius: var(--n-indicator-border-radius);
 color: var(--n-indicator-text-color);
 background-color: var(--n-indicator-color);
 box-shadow: var(--n-indicator-box-shadow);
 `,[b("top",`
 margin-bottom: 12px;
 `),b("right",`
 margin-left: 12px;
 `),b("bottom",`
 margin-top: 12px;
 `),b("left",`
 margin-right: 12px;
 `),Re()]),fo(r("slider",[r("slider-dot","background-color: var(--n-dot-color-modal);")])),vo(r("slider",[r("slider-dot","background-color: var(--n-dot-color-popover);")]))]);function Be(o){return window.TouchEvent&&o instanceof window.TouchEvent}function Me(){const o=new Map,h=y=>u=>{o.set(y,u)};return mo(()=>{o.clear()}),[o,h]}const Ao=["tabindex","aria-valuenow","aria-valuemin","aria-valuemax","aria-orientation","aria-disabled","onFocus","onBlur","onMouseenter","onMouseleave"],Ho=["onKeydown","onMousedown","onTouchstart"],Po=0,No={...ie.props,to:me.propTo,defaultValue:{type:[Number,Array],default:0},marks:Object,disabled:{type:Boolean,default:void 0},formatTooltip:Function,keyboard:{type:Boolean,default:!0},min:{type:Number,default:0},max:{type:Number,default:100},step:{type:[Number,String],default:1},range:Boolean,value:[Number,Array],placement:String,showTooltip:{type:Boolean,default:void 0},tooltip:{type:Boolean,default:!0},vertical:Boolean,reverse:Boolean,"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onDragstart:[Function],onDragend:[Function]};var Go=$e({name:"Slider",props:No,slots:Object,setup(o){const{mergedClsPrefixRef:h,namespaceRef:y,inlineThemeDisabled:u}=Te(o),i=ie("Slider","-slider",Io,Eo,o,h),d=I(null),[R,s]=Me(),[z,D]=Me(),$=I(new Set),C=po(o),{mergedDisabledRef:j}=C,W=S(()=>{const{step:e}=o;if(Number(e)<=0||e==="mark")return 0;const t=e.toString();let a=0;return t.includes(".")&&(a=t.length-t.indexOf(".")-1),a}),V=I(o.defaultValue),K=yo(o,"value"),F=Co(K,V),g=S(()=>{const{value:e}=F;return(o.range?e:[e]).map(xe)}),T=S(()=>g.value.length>2),H=S(()=>o.placement===void 0?o.vertical?"right":"top":o.placement),P=S(()=>{const{marks:e}=o;return e?Object.keys(e).map(Number.parseFloat):null}),m=I(-1),B=I(-1),N=I(-1),_=I(!1),Y=I(!1),le=S(()=>{const{vertical:e,reverse:t}=o;return e?t?"top":"bottom":t?"right":"left"}),De=S(()=>{if(T.value)return;const e=g.value,t=X(o.range?Math.min(...e):o.min),a=X(o.range?Math.max(...e):e[0]),{value:n}=le;return o.vertical?{[n]:`${t}%`,height:`${a-t}%`}:{[n]:`${t}%`,width:`${a-t}%`}}),Ve=S(()=>{const e=[],{marks:t}=o;if(t){const a=g.value.slice();a.sort((p,f)=>p-f);const{value:n}=le,{value:l}=T,{range:k}=o,M=l?()=>!1:p=>k?p>=a[0]&&p<=a[a.length-1]:p<=a[0];for(const p of Object.keys(t)){const f=Number(p);e.push({active:M(f),key:f,label:t[p],style:{[n]:`${X(f)}%`}})}}return e});function Fe(e,t){const a=X(e),{value:n}=le;return{[n]:`${a}%`,zIndex:t===m.value?1:0}}function pe(e){return o.showTooltip||N.value===e||m.value===e&&_.value}function Ee(e){return _.value?!(m.value===e&&B.value===e):!0}function Ie(e){var t;~e&&(m.value=e,(t=R.get(e))==null||t.focus())}function Ae(){z.forEach((e,t)=>{pe(t)&&e.syncPosition()})}function ge(e){const{"onUpdate:value":t,onUpdateValue:a}=o,{nTriggerFormInput:n,nTriggerFormChange:l}=C;a&&ae(a,e),t&&ae(t,e),V.value=e,n(),l()}function be(e){const{range:t}=o;if(t){if(Array.isArray(e)){const{value:a}=g;e.join()!==a.join()&&ge(e)}}else Array.isArray(e)||g.value[0]!==e&&ge(e)}function se(e,t){if(o.range){const a=g.value.slice();a.splice(t,1,e),be(a)}else be(e)}function de(e,t,a){const n=a!==void 0;a||(a=e-t>0?1:-1);const l=P.value||[],{step:k}=o;if(k==="mark"){const f=J(e,l.concat(t),n?a:void 0);return f?f.value:t}if(k<=0)return t;const{value:M}=W;let p;if(n){const f=Number((t/k).toFixed(M)),E=Math.floor(f),ce=f>E?E:E-1,ue=f<E?E:E+1;p=J(t,[Number((ce*k).toFixed(M)),Number((ue*k).toFixed(M)),...l],a)}else{const f=Pe(e);p=J(e,[...l,f])}return p?xe(p.value):t}function xe(e){return Math.min(o.max,Math.max(o.min,e))}function X(e){const{max:t,min:a}=o;return(e-a)/(t-a)*100}function He(e){const{max:t,min:a}=o;return a+(t-a)*e}function Pe(e){const{step:t,min:a}=o;if(Number(t)<=0||t==="mark")return e;const n=Math.round((e-a)/t)*t+a;return Number(n.toFixed(W.value))}function J(e,t=P.value,a){if(!(t!=null&&t.length))return null;let n=null,l=-1;for(;++l<t.length;){const k=t[l]-e,M=Math.abs(k);(a===void 0||k*a>0)&&(n===null||M<n.distance)&&(n={index:l,distance:M,value:t[l]})}return n}function we(e){const t=d.value;if(!t)return;const a=Be(e)?e.touches[0]:e,n=t.getBoundingClientRect();let l;return o.vertical?l=(n.bottom-a.clientY)/n.height:l=(a.clientX-n.left)/n.width,o.reverse&&(l=1-l),He(l)}function Ne(e){if(j.value||!o.keyboard)return;const{vertical:t,reverse:a}=o;switch(e.key){case"ArrowUp":e.preventDefault(),Z(t&&a?-1:1);break;case"ArrowRight":e.preventDefault(),Z(!t&&a?-1:1);break;case"ArrowDown":e.preventDefault(),Z(t&&a?1:-1);break;case"ArrowLeft":e.preventDefault(),Z(!t&&a?1:-1)}}function Z(e){const t=m.value;if(t===-1)return;const{step:a}=o,n=g.value[t];se(de(Number(a)<=0||a==="mark"?n:n+a*e,n,e>0?1:-1),t)}function _e(e){var l;if(j.value||!Be(e)&&e.button!==Po)return;const t=we(e);if(t===void 0)return;const a=g.value.slice(),n=o.range?((l=J(t,a))==null?void 0:l.index)??-1:0;n!==-1&&(e.preventDefault(),Ie(n),je(),se(de(t,g.value[n]),n))}function je(){_.value||(_.value=!0,o.onDragstart&&ae(o.onDragstart),re("touchend",document,ee),re("mouseup",document,ee),re("touchmove",document,Q),re("mousemove",document,Q))}function q(){_.value&&(_.value=!1,o.onDragend&&ae(o.onDragend),ne("touchend",document,ee),ne("mouseup",document,ee),ne("touchmove",document,Q),ne("mousemove",document,Q))}function Q(e){const{value:t}=m;if(!_.value||t===-1){q();return}const a=we(e);a!==void 0&&se(de(a,g.value[t]),t)}function ee(){q()}function Ue(e){m.value=e,j.value||(N.value=e)}function Le(e){m.value===e&&(m.value=-1,q()),N.value===e&&(N.value=-1)}function Oe(e){N.value=e}function Ge(e){N.value===e&&(N.value=-1)}ze(m,(e,t)=>void fe(()=>B.value=t)),ze(F,()=>{if(o.marks){if(Y.value)return;Y.value=!0,fe(()=>{Y.value=!1})}fe(Ae)}),go(()=>{q()});const ye=S(()=>{const{self:{markFontSize:e,railColor:t,railColorHover:a,fillColor:n,fillColorHover:l,handleColor:k,opacityDisabled:M,dotColor:p,dotColorModal:f,handleBoxShadow:E,handleBoxShadowHover:ce,handleBoxShadowActive:ue,handleBoxShadowFocus:We,dotBorder:Ke,dotBoxShadow:Ye,railHeight:Xe,railWidthVertical:Je,handleSize:Ze,dotHeight:qe,dotWidth:Qe,dotBorderRadius:eo,fontSize:oo,dotBorderActive:to,dotColorPopover:ao},common:{cubicBezierEaseInOut:ro}}=i.value;return{"--n-bezier":ro,"--n-dot-border":Ke,"--n-dot-border-active":to,"--n-dot-border-radius":eo,"--n-dot-box-shadow":Ye,"--n-dot-color":p,"--n-dot-color-modal":f,"--n-dot-color-popover":ao,"--n-dot-height":qe,"--n-dot-width":Qe,"--n-fill-color":n,"--n-fill-color-hover":l,"--n-font-size":oo,"--n-handle-box-shadow":E,"--n-handle-box-shadow-active":ue,"--n-handle-box-shadow-focus":We,"--n-handle-box-shadow-hover":ce,"--n-handle-color":k,"--n-handle-size":Ze,"--n-opacity-disabled":M,"--n-rail-color":t,"--n-rail-color-hover":a,"--n-rail-height":Xe,"--n-rail-width-vertical":Je,"--n-mark-font-size":e}}),U=u?Ce("slider",void 0,ye,o):void 0,ke=S(()=>{const{self:{fontSize:e,indicatorColor:t,indicatorBoxShadow:a,indicatorTextColor:n,indicatorBorderRadius:l}}=i.value;return{"--n-font-size":e,"--n-indicator-border-radius":l,"--n-indicator-box-shadow":a,"--n-indicator-color":t,"--n-indicator-text-color":n}}),L=u?Ce("slider-indicator",void 0,ke,o):void 0;return{mergedClsPrefix:h,namespace:y,uncontrolledValue:V,mergedValue:F,mergedDisabled:j,mergedPlacement:H,isMounted:bo(),adjustedTo:me(o),dotTransitionDisabled:Y,markInfos:Ve,isShowTooltip:pe,shouldKeepTooltipTransition:Ee,handleRailRef:d,setHandleRefs:s,setFollowerRefs:D,fillStyle:De,getHandleStyle:Fe,activeIndex:m,arrifiedValues:g,followerEnabledIndexSet:$,handleRailMouseDown:_e,handleHandleFocus:Ue,handleHandleBlur:Le,handleHandleMouseEnter:Oe,handleHandleMouseLeave:Ge,handleRailKeyDown:Ne,indicatorCssVars:u?void 0:ke,indicatorThemeClass:L==null?void 0:L.themeClass,indicatorOnRender:L==null?void 0:L.onRender,cssVars:u?void 0:ye,themeClass:U==null?void 0:U.themeClass,onRender:U==null?void 0:U.onRender}},render(){var u;const{mergedClsPrefix:o,themeClass:h,formatTooltip:y}=this;return(u=this.onRender)==null||u.call(this),c(),v("div",{class:x([`${o}-slider`,h,{[`${o}-slider--disabled`]:this.mergedDisabled,[`${o}-slider--active`]:this.activeIndex!==-1,[`${o}-slider--with-mark`]:this.marks,[`${o}-slider--vertical`]:this.vertical,[`${o}-slider--reverse`]:this.reverse}]),style:A(this.cssVars),onKeydown:this.handleRailKeyDown,onMousedown:this.handleRailMouseDown,onTouchstart:this.handleRailMouseDown},[he("div",{class:x(`${o}-slider-rail`)},[he("div",{class:x(`${o}-slider-rail__fill`),style:A(this.fillStyle)},null,6),this.marks?(c(),v("div",{key:0,class:x([`${o}-slider-dots`,this.dotTransitionDisabled&&`${o}-slider-dots--transition-disabled`])},[w(()=>this.markInfos.map(i=>(c(),v("div",{key:i.key,class:x([`${o}-slider-dot`,{[`${o}-slider-dot--active`]:i.active}]),style:A(i.style)},null,6))))],2)):w(()=>null),he("div",{ref:"handleRailRef",class:x(`${o}-slider-handles`)},[w(()=>this.arrifiedValues.map((i,d)=>{const R=this.isShowTooltip(d);return c(),te(zo,null,{default:()=>[(c(),te(So,null,{default:()=>(c(),v("div",{ref:this.setHandleRefs(d),class:x(`${o}-slider-handle-wrapper`),tabindex:this.mergedDisabled?-1:0,role:"slider","aria-valuenow":i,"aria-valuemin":this.min,"aria-valuemax":this.max,"aria-orientation":this.vertical?"vertical":"horizontal","aria-disabled":this.disabled,style:A(this.getHandleStyle(i,d)),onFocus:()=>{this.handleHandleFocus(d)},onBlur:()=>{this.handleHandleBlur(d)},onMouseenter:()=>{this.handleHandleMouseEnter(d)},onMouseleave:()=>{this.handleHandleMouseLeave(d)}},[w(()=>xo(this.$slots.thumb,()=>[(c(),v("div",{class:x(`${o}-slider-handle`)},null,2))]))],46,Ao))},1024)),this.tooltip&&(c(),te(Ro,{ref:this.setFollowerRefs(d),show:R,to:this.adjustedTo,enabled:this.showTooltip&&!this.range||this.followerEnabledIndexSet.has(d),teleportDisabled:this.adjustedTo===me.tdkey,placement:this.mergedPlacement,containerClass:this.namespace},{default:()=>(c(),te(wo,{name:"fade-in-scale-up-transition",appear:this.isMounted,css:this.shouldKeepTooltipTransition(d),onEnter:()=>{this.followerEnabledIndexSet.add(d)},onAfterLeave:()=>{this.followerEnabledIndexSet.delete(d)}},{default:()=>{var s;return R?((s=this.indicatorOnRender)==null||s.call(this),c(),v("div",{key:1,class:x([`${o}-slider-handle-indicator`,this.indicatorThemeClass,`${o}-slider-handle-indicator--${this.mergedPlacement}`]),style:A(this.indicatorCssVars)},[typeof y=="function"?(c(),v(O,{key:0},[w(()=>y(i))],64)):(c(),v(O,{key:1},[w(()=>i)],64))],6)):null}},1032,["appear","css","onEnter","onAfterLeave"]))},1032,["show","to","enabled","teleportDisabled","placement","containerClass"]))]},1024)}))],2),this.marks?(c(),v("div",{key:2,class:x(`${o}-slider-marks`)},[w(()=>this.markInfos.map(i=>(c(),v("div",{key:i.key,class:x(`${o}-slider-mark`),style:A(i.style)},[typeof i.label=="function"?(c(),v(O,{key:0},[w(()=>i.label())],64)):(c(),v(O,{key:1},[w(()=>i.label)],64))],6))))],2)):w(()=>null)],2)],46,Ho)}});export{Oo as S,Go as a};
