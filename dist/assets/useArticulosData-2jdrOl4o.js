import{a as h,u as g,r,s as b}from"./index-DPEqodnp.js";function p(){const{activeClub:t,loadingBranch:o}=h(),{session:c}=g(),[l,u]=r.useState([]),[f,e]=r.useState(!0),[d,i]=r.useState(null),a=r.useCallback(async()=>{if(!c||!t){o||(u([]),e(!1));return}try{e(!0);const{data:s,error:n}=await b.from("articulos").select(`
                    *,
                    categoria:categorias_articulos(id, nombre, descripcion, estado)
                `).eq("club_id",t.id).order("nombre");if(n)throw n;u(s||[]),i(null)}catch(s){console.error("Error fetching articulos:",s),i(s.message)}finally{e(!1)}},[t,c,o]);return r.useEffect(()=>{a()},[a]),{articulos:l,loading:f,error:d,refreshArticulos:a}}export{p as u};
