import{i,s,k as n,q as r,l as o}from"./client-j9nNowi7.js";function p(e){return i({mutationFn:a=>n.put(`lc/campaigns/${e}`,a).then(t=>t.data),onSuccess:async()=>{await r.invalidateQueries({queryKey:o.campaigns.invalidateKey})},onError:a=>s(a)})}const m=""+new URL("email-campaign-tj20yXPm.svg",import.meta.url).href;export{m as c,p as u};
//# sourceMappingURL=email-campaign-DfobSeF-.js.map
