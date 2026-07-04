import{n as i,z as n,k as s}from"./client-Oxz8h_2h.js";function o(e){return i({queryKey:["tags",e],queryFn:({signal:t})=>u(e,t),placeholderData:n})}async function u(e,t){return e.query&&await new Promise(a=>setTimeout(a,300)),s.get("tags",{params:{paginate:"simple",...e},signal:e.query?t:void 0}).then(a=>a.data)}export{o as u};
//# sourceMappingURL=use-tags-dIgQZQPR.js.map
