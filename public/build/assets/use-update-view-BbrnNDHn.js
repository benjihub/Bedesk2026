import{i as r,s as i,k as o,q as n,l as u}from"./client-Oxz8h_2h.js";import{o as p}from"./custom-menu-CB7o51hn.js";function y(a,t){return r({mutationFn:e=>o.put(`helpdesk/views/${a}`,e).then(s=>s.data),onSuccess:async()=>{await n.invalidateQueries({queryKey:u.views.invalidateKey})},onError:e=>t?p(e,t,[],!0):i(e)})}export{y as u};
//# sourceMappingURL=use-update-view-BbrnNDHn.js.map
