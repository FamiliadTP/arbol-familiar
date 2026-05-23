'use client'
import { useEffect, useState } from 'react'
import { supabase, Member, PendingEdit } from '../lib/supabase'
import { fullName, calcAge, fmtDate, monthNames } from '../lib/utils'

// ── SAMPLE DATA (loaded on first run if DB is empty) ──────────────────────────
const SAMPLE_MEMBERS: Omit<Member, 'created_at'>[] = [
  { id:'g1m1', name:'José', surname1:'García', surname2:'López', born:'1920-03-15', died:'1995-08-20', gender:'M', generation:1, spouse_id:'g1f1', children_ids:['g2m1','g2f1'], external:false, email:null, bio_birthplace:'Sevilla, España', bio_education:'Primaria', bio_occupation:'Agricultor', bio_notes:'Fundador de la familia en Chile.' },
  { id:'g1f1', name:'Carmen', surname1:'Ruiz', surname2:'Mora', born:'1923-07-04', died:'2001-01-12', gender:'F', generation:1, spouse_id:'g1m1', children_ids:['g2m1','g2f1'], external:false, email:null, bio_birthplace:'Málaga, España', bio_education:'Primaria', bio_occupation:'Ama de casa', bio_notes:null },
  { id:'g1m2', name:'Manuel', surname1:'Torres', surname2:'Vega', born:'1918-11-28', died:'1990-05-03', gender:'M', generation:1, spouse_id:'g1f2', children_ids:['g2f2'], external:false, email:null, bio_birthplace:'Santiago, Chile', bio_education:'Sin datos', bio_occupation:'Comerciante', bio_notes:null },
  { id:'g1f2', name:'Rosa', surname1:'Martínez', surname2:'Gil', born:'1922-02-14', died:'2010-09-30', gender:'F', generation:1, spouse_id:'g1m2', children_ids:['g2f2'], external:false, email:null, bio_birthplace:'Valparaíso, Chile', bio_education:'Sin datos', bio_occupation:'Ama de casa', bio_notes:null },
  { id:'g2m1', name:'Antonio', surname1:'García', surname2:'Ruiz', born:'1950-06-22', died:null, gender:'M', generation:2, spouse_id:'g2f2', children_ids:['g3m1','g3f1','g3m2'], external:false, email:'antonio@email.com', bio_birthplace:'Santiago, Chile', bio_education:'Universidad', bio_occupation:'Ingeniero', bio_notes:null },
  { id:'g2f2', name:'Elena', surname1:'Torres', surname2:'Martínez', born:'1953-09-10', died:null, gender:'F', generation:2, spouse_id:'g2m1', children_ids:['g3m1','g3f1','g3m2'], external:false, email:'elena@email.com', bio_birthplace:'Valparaíso, Chile', bio_education:'Universidad', bio_occupation:'Profesora', bio_notes:null },
  { id:'g2f1', name:'Lucía', surname1:'García', surname2:'Ruiz', born:'1955-12-05', died:null, gender:'F', generation:2, spouse_id:'g2ext1', children_ids:['g3f2'], external:false, email:null, bio_birthplace:'Santiago, Chile', bio_education:'Técnica', bio_occupation:'Enfermera', bio_notes:null },
  { id:'g2ext1', name:'Pedro', surname1:'Sánchez', surname2:'Ortiz', born:'1952-04-18', died:null, gender:'M', generation:2, spouse_id:'g2f1', children_ids:['g3f2'], external:true, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
  { id:'g3m1', name:'Carlos', surname1:'García', surname2:'Torres', born:'1975-03-28', died:null, gender:'M', generation:3, spouse_id:'g3ext1', children_ids:['g4m1','g4f1'], external:false, email:'carlos@email.com', bio_birthplace:'Santiago, Chile', bio_education:'Universidad', bio_occupation:'Médico', bio_notes:null },
  { id:'g3ext1', name:'Sofía', surname1:'Herrera', surname2:'Díaz', born:'1977-08-15', died:null, gender:'F', generation:3, spouse_id:'g3m1', children_ids:['g4m1','g4f1'], external:true, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
  { id:'g3f1', name:'María', surname1:'García', surname2:'Torres', born:'1978-11-02', died:null, gender:'F', generation:3, spouse_id:null, children_ids:[], external:false, email:null, bio_birthplace:'Santiago, Chile', bio_education:'Universidad', bio_occupation:'Diseñadora', bio_notes:null },
  { id:'g3m2', name:'Javier', surname1:'García', surname2:'Torres', born:'1982-07-19', died:null, gender:'M', generation:3, spouse_id:'g3ext2', children_ids:['g4m2'], external:false, email:null, bio_birthplace:'Santiago, Chile', bio_education:'Técnica', bio_occupation:'Emprendedor', bio_notes:null },
  { id:'g3ext2', name:'Natalia', surname1:'Romero', surname2:'Castro', born:'1984-01-25', died:null, gender:'F', generation:3, spouse_id:'g3m2', children_ids:['g4m2'], external:true, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
  { id:'g3f2', name:'Paula', surname1:'Sánchez', surname2:'García', born:'1985-05-09', died:null, gender:'F', generation:3, spouse_id:null, children_ids:[], external:false, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
  { id:'g4m1', name:'Diego', surname1:'García', surname2:'Herrera', born:'2002-10-14', died:null, gender:'M', generation:4, spouse_id:null, children_ids:[], external:false, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
  { id:'g4f1', name:'Valentina', surname1:'García', surname2:'Herrera', born:'2005-04-03', died:null, gender:'F', generation:4, spouse_id:null, children_ids:[], external:false, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
  { id:'g4m2', name:'Mateo', surname1:'García', surname2:'Romero', born:'2010-12-22', died:null, gender:'M', generation:4, spouse_id:null, children_ids:[], external:false, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
]

// ── AVATAR ────────────────────────────────────────────────────────────────────
function Avatar({ p, size=40 }: { p: Member; size?: number }) {
  const bg = p.died ? '#64748b' : p.gender==='M' ? '#2563eb' : '#db2777'
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:size*0.36,fontWeight:700,border:p.external?'2px dashed #94a3b8':'2px solid #fff',flexShrink:0,opacity:p.died?0.7:1}}>
      {p.name[0]}{p.surname1[0]}
    </div>
  )
}

// ── PERSON CARD ───────────────────────────────────────────────────────────────
function PersonCard({ person, members, onClose, onEdit, isAdmin }: { person:Member; members:Member[]; onClose:()=>void; onEdit:(p:Member)=>void; isAdmin:boolean }) {
  const spouse = members.find(m=>m.id===person.spouse_id)
  const children = members.filter(m=>person.children_ids?.includes(m.id))
  const parents = members.filter(m=>m.children_ids?.includes(person.id))
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:420,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',position:'relative',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:'absolute',top:12,right:14,background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#64748b'}}>×</button>
        <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:18}}>
          <Avatar p={person} size={56}/>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:'#1e293b'}}>{fullName(person)}</div>
            {person.died&&<div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>† In Memoriam</div>}
            {person.external&&<div style={{fontSize:12,color:'#f59e0b',marginTop:2}}>Ingresó por matrimonio</div>}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          {[['Nacimiento',fmtDate(person.born)],['Edad',`${calcAge(person.born,person.died)} años`],person.died?['Fallecimiento',fmtDate(person.died)]:null,spouse?['Cónyuge',fullName(spouse)]:null,person.bio_birthplace?['Lugar de nacimiento',person.bio_birthplace]:null,person.bio_occupation?['Ocupación',person.bio_occupation]:null].filter(Boolean).map(([l,v])=>(
            <div key={l as string} style={{background:'#f8fafc',borderRadius:8,padding:'8px 10px'}}>
              <div style={{fontSize:10,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600,color:'#1e293b',marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        {person.bio_notes&&<div style={{background:'#faf5ff',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#4c1d95',marginBottom:14,fontStyle:'italic'}}>"{person.bio_notes}"</div>}
        {parents.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:11,color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Padres</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{parents.map(p=><Chip key={p.id} p={p}/>)}</div></div>}
        {children.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:11,color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Hijos ({children.length})</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{children.map(p=><Chip key={p.id} p={p}/>)}</div></div>}
        <button onClick={()=>onEdit(person)} style={{marginTop:4,width:'100%',padding:'10px',background:'#1e293b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}}>
          {isAdmin?'✏️ Editar':'📝 Proponer cambio'}
        </button>
      </div>
    </div>
  )
}
function Chip({p}:{p:Member}){
  const bg=p.gender==='M'?'#dbeafe':'#fce7f3'
  const c=p.gender==='M'?'#1d4ed8':'#be185d'
  return <div style={{background:bg,color:c,borderRadius:20,padding:'4px 10px',fontSize:12,fontWeight:600}}>{p.name} {p.surname1}</div>
}

// ── TREE NODE ─────────────────────────────────────────────────────────────────
function MiniCard({person,onSelect}:{person:Member;onSelect:(p:Member)=>void}){
  const bg=person.gender==='M'?'#eff6ff':'#fdf2f8'
  const border=person.gender==='M'?'#93c5fd':'#f9a8d4'
  return (
    <div onClick={()=>onSelect(person)} style={{background:bg,border:`2px solid ${border}`,borderRadius:12,padding:'10px 12px',cursor:'pointer',minWidth:100,textAlign:'center',opacity:person.died?0.75:1,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',transition:'transform 0.15s',position:'relative'}}
      onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
      onMouseLeave={e=>(e.currentTarget.style.transform='')}>
      {person.died&&<div style={{position:'absolute',top:-6,right:-6,fontSize:11,background:'#64748b',color:'#fff',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>†</div>}
      {person.external&&<div style={{position:'absolute',top:-6,left:-6,fontSize:10,background:'#f59e0b',color:'#fff',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>★</div>}
      <Avatar p={person} size={34}/>
      <div style={{fontSize:11,fontWeight:700,color:'#1e293b',marginTop:4,lineHeight:1.2}}>{person.name}</div>
      <div style={{fontSize:10,color:'#64748b',marginTop:1}}>{person.born?.slice(0,4)}{person.died?`–${person.died.slice(0,4)}`:''}</div>
    </div>
  )
}
function TreeNode({person,members,onSelect}:{person:Member;members:Member[];onSelect:(p:Member)=>void}){
  const children=members.filter(m=>person.children_ids?.includes(m.id))
  const exSpouse=members.find(m=>m.id===person.spouse_id&&m.external)
  const mainSpouse=members.find(m=>m.id===person.spouse_id&&!m.external)
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:0}}>
        {exSpouse&&<><MiniCard person={exSpouse} onSelect={onSelect}/><div style={{width:20,height:2,borderTop:'2px dashed #94a3b8',margin:'0 2px'}}/></>}
        <MiniCard person={person} onSelect={onSelect}/>
        {mainSpouse&&<><div style={{width:20,height:2,background:'#94a3b8',margin:'0 2px'}}/><MiniCard person={mainSpouse} onSelect={onSelect}/></>}
      </div>
      {children.length>0&&(
        <><div style={{width:2,height:18,background:'#cbd5e1'}}/>
        <div style={{display:'flex',gap:12,borderTop:'2px solid #cbd5e1'}}>
          {children.map(child=>(
            <div key={child.id} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{width:2,height:16,background:'#cbd5e1'}}/>
              <TreeNode person={child} members={members} onSelect={onSelect}/>
            </div>
          ))}
        </div></>
      )}
    </div>
  )
}

// ── BIRTHDAY VIEW ─────────────────────────────────────────────────────────────
function BirthdayView({members,onSelect}:{members:Member[];onSelect:(p:Member)=>void}){
  const [sortBy,setSortBy]=useState<'date'|'name'>('date')
  const today=new Date()
  const todayMD=`${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const alive=members.filter(m=>!m.died)
  const sorted=[...alive].sort((a,b)=>sortBy==='name'?a.name.localeCompare(b.name,'es'):a.born.slice(5).localeCompare(b.born.slice(5)))
  const upcoming=sorted.filter(m=>m.born.slice(5)>=todayMD).slice(0,3)
  return (
    <div>
      {upcoming.length>0&&<div style={{background:'linear-gradient(135deg,#7c3aed,#db2777)',borderRadius:14,padding:16,marginBottom:20,color:'#fff'}}>
        <div style={{fontSize:12,fontWeight:700,opacity:0.8,marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>🎂 Próximos cumpleaños</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {upcoming.map(p=><div key={p.id} onClick={()=>onSelect(p)} style={{background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'8px 12px',cursor:'pointer'}}>
            <div style={{fontWeight:700,fontSize:13}}>{p.name} {p.surname1}</div>
            <div style={{fontSize:11,opacity:0.85}}>{p.born.slice(8)}/{p.born.slice(5,7)} · {calcAge(p.born,null)} años</div>
          </div>)}
        </div>
      </div>}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {(['date','name'] as const).map(s=><button key={s} onClick={()=>setSortBy(s)} style={{padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',background:sortBy===s?'#1e293b':'#f1f5f9',color:sortBy===s?'#fff':'#64748b',fontWeight:600,fontSize:12}}>{s==='date'?'📅 Por fecha':'🔤 Por nombre'}</button>)}
      </div>
      {sortBy==='date'?monthNames.map((mn,mi)=>{
        const inMonth=sorted.filter(m=>parseInt(m.born.slice(5,7))===mi+1)
        if(!inMonth.length)return null
        return <div key={mi} style={{marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:800,color:'#7c3aed',textTransform:'uppercase',letterSpacing:2,marginBottom:8,borderBottom:'2px solid #ede9fe',paddingBottom:4}}>{mn}</div>
          {inMonth.map(p=><BdayRow key={p.id} person={p} onSelect={onSelect}/>)}
        </div>
      }):<div>{sorted.map(p=><BdayRow key={p.id} person={p} onSelect={onSelect}/>)}</div>}
    </div>
  )
}
function BdayRow({person,onSelect}:{person:Member;onSelect:(p:Member)=>void}){
  const t=new Date()
  const isBDay=parseInt(person.born.slice(5,7))===t.getMonth()+1&&parseInt(person.born.slice(8))===t.getDate()
  return <div onClick={()=>onSelect(person)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:isBDay?'#fef9c3':'#f8fafc',borderRadius:10,cursor:'pointer',border:isBDay?'2px solid #fbbf24':'2px solid transparent',marginBottom:6}}>
    <Avatar p={person} size={34}/>
    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{fullName(person)}</div><div style={{fontSize:11,color:'#64748b'}}>Gen {person.generation}</div></div>
    <div style={{textAlign:'right'}}><div style={{fontSize:13,fontWeight:700,color:'#7c3aed'}}>{person.born.slice(8)}/{person.born.slice(5,7)}</div><div style={{fontSize:11,color:'#94a3b8'}}>{calcAge(person.born,null)} años</div></div>
    {isBDay&&<span>🎂</span>}
  </div>
}

// ── LIST VIEW ─────────────────────────────────────────────────────────────────
function ListView({members,onSelect}:{members:Member[];onSelect:(p:Member)=>void}){
  const [filter,setFilter]=useState('all')
  const [search,setSearch]=useState('')
  const filters=[['all','Todos'],['living','Vivos'],['deceased','Fallecidos'],['gen1','1ª Gen'],['gen2','2ª Gen'],['gen3','3ª Gen'],['gen4','4ª Gen']]
  const filtered=members.filter(m=>{
    if(filter==='living')return!m.died
    if(filter==='deceased')return!!m.died
    if(filter.startsWith('gen'))return m.generation===parseInt(filter[3])
    return true
  }).filter(m=>!search||fullName(m).toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <input placeholder="🔍 Buscar por nombre…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'2px solid #e2e8f0',fontSize:14,marginBottom:12,outline:'none',boxSizing:'border-box'}}/>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {filters.map(([v,l])=><button key={v} onClick={()=>setFilter(v)} style={{padding:'5px 12px',borderRadius:20,border:'none',cursor:'pointer',background:filter===v?'#1e293b':'#f1f5f9',color:filter===v?'#fff':'#64748b',fontWeight:600,fontSize:12}}>{l}</button>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:10}}>
        {filtered.map(p=><div key={p.id} onClick={()=>onSelect(p)} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:'#f8fafc',borderRadius:12,cursor:'pointer',border:'2px solid #e2e8f0',transition:'all 0.15s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#7c3aed';e.currentTarget.style.background='#faf5ff'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='#f8fafc'}}>
          <Avatar p={p} size={38}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{fullName(p)}</div>
            <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{fmtDate(p.born)}{p.died?` — ${fmtDate(p.died)}`:''} · Gen {p.generation}</div>
          </div>
          {p.died&&<span style={{fontSize:13,opacity:0.5}}>†</span>}
        </div>)}
      </div>
    </div>
  )
}

// ── STATS VIEW ────────────────────────────────────────────────────────────────
function StatsView({members}:{members:Member[]}){
  const alive=members.filter(m=>!m.died)
  const avgAge=Math.round(alive.reduce((s,m)=>s+calcAge(m.born,null),0)/alive.length)
  const oldest=[...alive].sort((a,b)=>a.born.localeCompare(b.born))[0]
  const youngest=[...alive].sort((a,b)=>b.born.localeCompare(a.born))[0]
  const gens=[1,2,3,4].map(g=>({g,count:members.filter(m=>m.generation===g).length}))
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:20}}>
        {[{l:'Total',v:members.length,i:'👨‍👩‍👧‍👦',bg:'#eff6ff',c:'#2563eb'},{l:'Vivos',v:alive.length,i:'💚',bg:'#f0fdf4',c:'#16a34a'},{l:'Fallecidos',v:members.filter(m=>m.died).length,i:'🕊️',bg:'#f8fafc',c:'#64748b'},{l:'Edad promedio',v:`${avgAge} años`,i:'🎂',bg:'#faf5ff',c:'#7c3aed'},{l:'Generaciones',v:4,i:'🌳',bg:'#fff7ed',c:'#ea580c'}].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:14,padding:'14px 12px',textAlign:'center'}}>
            <div style={{fontSize:24}}>{s.i}</div>
            <div style={{fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:'#64748b',fontWeight:600,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div style={{background:'#f8fafc',borderRadius:14,padding:16}}>
          <div style={{fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>Por generación</div>
          {gens.map(({g,count})=><div key={g} style={{marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}><span style={{fontWeight:600}}>Generación {g}</span><span style={{color:'#7c3aed',fontWeight:700}}>{count}</span></div>
            <div style={{background:'#e2e8f0',borderRadius:4,height:8,overflow:'hidden'}}><div style={{width:`${(count/members.length)*100}%`,height:'100%',background:'#7c3aed',borderRadius:4}}/></div>
          </div>)}
        </div>
        <div style={{background:'#f8fafc',borderRadius:14,padding:16}}>
          <div style={{fontSize:11,fontWeight:800,color:'#64748b',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>Destacados</div>
          {oldest&&<SI i="👴" l="El mayor" v={`${oldest.name} · ${calcAge(oldest.born,null)} años`}/>}
          {youngest&&<SI i="👶" l="El menor" v={`${youngest.name} · ${calcAge(youngest.born,null)} años`}/>}
          <SI i="♂️" l="Hombres" v={`${members.filter(m=>m.gender==='M').length}`}/>
          <SI i="♀️" l="Mujeres" v={`${members.filter(m=>m.gender==='F').length}`}/>
        </div>
      </div>
    </div>
  )
}
function SI({i,l,v}:{i:string;l:string;v:string}){
  return <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}><span style={{fontSize:18}}>{i}</span><div><div style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>{l}</div><div style={{fontSize:13,fontWeight:700}}>{v}</div></div></div>
}

// ── EDIT MODAL ────────────────────────────────────────────────────────────────
function EditModal({person,isAdmin,onClose,onSubmit}:{person:Member;isAdmin:boolean;onClose:()=>void;onSubmit:(p:Member,note:string)=>void}){
  const [form,setForm]=useState({...person})
  const [note,setNote]=useState('')
  const set=(k:keyof Member,v:any)=>setForm(f=>({...f,[k]:v}))
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:440,width:'100%',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontWeight:800,fontSize:17}}>{isAdmin?'✏️ Editar':'📝 Proponer cambio'}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#64748b'}}>×</button>
        </div>
        {!isAdmin&&<div style={{background:'#fef3c7',border:'1px solid #fbbf24',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#92400e',marginBottom:14}}>⚠️ Tu propuesta será revisada por un administrador antes de publicarse.</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          {([['name','Nombre'],['surname1','Primer apellido'],['surname2','Segundo apellido'],['email','Email'],['bio_birthplace','Lugar de nacimiento'],['bio_occupation','Ocupación'],['bio_education','Educación']] as [keyof Member,string][]).map(([k,l])=>(
            <label key={k} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600,gridColumn:k==='name'||k==='bio_notes'?'1 / -1':undefined}}>
              {l}<input value={(form[k]??'') as string} onChange={e=>set(k,e.target.value||null)} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}/>
            </label>
          ))}
          {([['born','Nacimiento'],['died','Fallecimiento (si aplica)']] as [keyof Member,string][]).map(([k,l])=>(
            <label key={k} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600}}>
              {l}<input type="date" value={(form[k]??'') as string} onChange={e=>set(k,e.target.value||null)} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}/>
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600,gridColumn:'1 / -1'}}>
            Nota biográfica
            <textarea value={(form.bio_notes??'') as string} onChange={e=>set('bio_notes',e.target.value||null)} rows={2} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none',resize:'vertical'}}/>
          </label>
        </div>
        {!isAdmin&&<label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600,marginBottom:12}}>
          Motivo del cambio
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none',resize:'vertical'}} placeholder="¿Por qué propones este cambio?"/>
        </label>}
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancelar</button>
          <button onClick={()=>onSubmit(form,note)} style={{flex:2,padding:'10px',background:'#1e293b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>{isAdmin?'💾 Guardar':'📤 Enviar'}</button>
        </div>
      </div>
    </div>
  )
}

// ── PENDING VIEW ──────────────────────────────────────────────────────────────
function PendingView({pending,onApprove,onReject}:{pending:PendingEdit[];onApprove:(id:string)=>void;onReject:(id:string)=>void}){
  if(!pending.length)return<div style={{textAlign:'center',padding:60,color:'#94a3b8'}}><div style={{fontSize:40}}>✅</div><div style={{marginTop:12,fontWeight:600}}>No hay cambios pendientes</div></div>
  return<div style={{display:'flex',flexDirection:'column',gap:12}}>
    {pending.map(e=><div key={e.id} style={{background:'#fffbeb',border:'2px solid #fbbf24',borderRadius:14,padding:18}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>Propuesto por: {e.proposed_by}</div>
      {e.note&&<div style={{fontSize:12,color:'#92400e',marginBottom:10,background:'#fef3c7',borderRadius:6,padding:'6px 10px'}}>💬 {e.note}</div>}
      <div style={{fontSize:12,color:'#64748b',marginBottom:12}}>{Object.entries(e.changes).map(([k,v])=><div key={k}>• <b>{k}</b>: {String(v)}</div>)}</div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>onApprove(e.id)} style={{padding:'8px 16px',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12}}>✓ Aprobar</button>
        <button onClick={()=>onReject(e.id)} style={{padding:'8px 16px',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12}}>✕ Rechazar</button>
      </div>
    </div>)}
  </div>
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<PendingEdit[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'tree'|'list'|'birthdays'|'stats'|'pending'>('tree')
  const [selected, setSelected] = useState<Member|null>(null)
  const [editTarget, setEditTarget] = useState<Member|null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null)
  const [usingDemo, setUsingDemo] = useState(false)

  const showToast = (msg:string, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  useEffect(()=>{
    loadData()
  },[])

  async function loadData() {
    try {
      const {data, error} = await supabase.from('members').select('*').order('generation')
      if (error || !data || data.length===0) {
        // DB not ready or empty → use demo data
        setMembers(SAMPLE_MEMBERS as Member[])
        setUsingDemo(true)
      } else {
        setMembers(data)
        setUsingDemo(false)
      }
      const {data: pData} = await supabase.from('pending_edits').select('*').eq('status','pending')
      if (pData) setPending(pData)
    } catch {
      setMembers(SAMPLE_MEMBERS as Member[])
      setUsingDemo(true)
    }
    setLoading(false)
  }

  async function handleEditSubmit(updated: Member, note: string) {
    if (usingDemo) {
      setMembers(m => m.map(x => x.id===updated.id ? updated : x))
      showToast('✅ Guardado (modo demo)')
    } else if (isAdmin) {
      const {error} = await supabase.from('members').upsert(updated)
      if (error) { showToast('❌ Error al guardar', 'error'); return }
      await loadData()
      showToast('✅ Cambios guardados')
    } else {
      const orig = members.find(m=>m.id===updated.id)!
      const changes: Partial<Member> = {}
      ;(Object.keys(updated) as (keyof Member)[]).forEach(k => { if (updated[k]!==orig[k]) (changes as any)[k]=updated[k] })
      const {error} = await supabase.from('pending_edits').insert({ member_id:updated.id, proposed_by:'visitante', changes, note, status:'pending' })
      if (error) { showToast('❌ Error al enviar', 'error'); return }
      showToast('📤 Propuesta enviada a administradores', 'info')
    }
    setEditTarget(null); setSelected(null)
  }

  async function handleApprove(id: string) {
    const edit = pending.find(p=>p.id===id)!
    await supabase.from('members').upsert(edit.changes)
    await supabase.from('pending_edits').update({status:'approved'}).eq('id',id)
    await loadData()
    showToast('✅ Cambio aprobado')
  }

  async function handleReject(id: string) {
    await supabase.from('pending_edits').update({status:'rejected'}).eq('id',id)
    setPending(p=>p.filter(x=>x.id!==id))
    showToast('🗑️ Propuesta rechazada', 'error')
  }

  const roots = members.filter(m=>m.generation===1&&!members.some(x=>x.children_ids?.includes(m.id)))
  const coupleRoots: Member[] = []
  const seen = new Set<string>()
  roots.forEach(r=>{ if(!seen.has(r.id)){ seen.add(r.id); if(r.spouse_id)seen.add(r.spouse_id); coupleRoots.push(r) }})

  const VIEWS = [
    {id:'tree',label:'🌳 Árbol'},{id:'list',label:'📋 Lista'},
    {id:'birthdays',label:'🎂 Cumpleaños'},{id:'stats',label:'📊 Stats'},
    ...(isAdmin?[{id:'pending',label:`⏳ Aprobar${pending.length>0?` (${pending.length})`:''}`}]:[]),
  ]

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:14,color:'#64748b'}}>Cargando árbol familiar…</div>

  return (
    <div style={{minHeight:'100vh',background:'#f1f5f9'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
        <div>
          <div style={{color:'#fff',fontSize:18,fontWeight:900,letterSpacing:-0.5}}>🌳 Árbol Familiar</div>
          <div style={{color:'#94a3b8',fontSize:11,marginTop:2}}>{members.length} miembros · 4 generaciones{usingDemo?' · modo demo':''}</div>
        </div>
        {isAdmin
          ?<button onClick={()=>setIsAdmin(false)} style={{padding:'6px 12px',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>👑 Admin</button>
          :<button onClick={()=>setShowLogin(true)} style={{padding:'6px 12px',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,cursor:'pointer',fontSize:12}}>🔐 Admin</button>}
      </div>

      {/* Nav */}
      <div style={{background:'#fff',borderBottom:'2px solid #e2e8f0',display:'flex',gap:0,overflowX:'auto'}}>
        {VIEWS.map(v=><button key={v.id} onClick={()=>setView(v.id as any)} style={{padding:'12px 14px',border:'none',background:'none',cursor:'pointer',fontWeight:700,fontSize:12,color:view===v.id?'#7c3aed':'#64748b',borderBottom:view===v.id?'3px solid #7c3aed':'3px solid transparent',whiteSpace:'nowrap'}}>{v.label}</button>)}
      </div>

      {/* Content */}
      <div style={{padding:'16px',maxWidth:1100,margin:'0 auto'}}>
        {view==='tree'&&<div style={{overflowX:'auto',paddingBottom:16}}>
          <div style={{display:'flex',gap:48,justifyContent:'center',padding:'10px 16px',minWidth:'max-content'}}>
            {coupleRoots.map(r=><TreeNode key={r.id} person={r} members={members} onSelect={setSelected}/>)}
          </div>
          <div style={{textAlign:'center',marginTop:12,fontSize:11,color:'#94a3b8'}}>★ ingresó por matrimonio · † fallecido · Toca para ver detalles</div>
        </div>}
        {view==='list'&&<ListView members={members} onSelect={setSelected}/>}
        {view==='birthdays'&&<BirthdayView members={members} onSelect={setSelected}/>}
        {view==='stats'&&<StatsView members={members}/>}
        {view==='pending'&&isAdmin&&<PendingView pending={pending} onApprove={handleApprove} onReject={handleReject}/>}
      </div>

      {selected&&<PersonCard person={selected} members={members} onClose={()=>setSelected(null)} onEdit={setEditTarget} isAdmin={isAdmin}/>}
      {editTarget&&<EditModal person={editTarget} isAdmin={isAdmin} onClose={()=>setEditTarget(null)} onSubmit={handleEditSubmit}/>}

      {/* Admin login */}
      {showLogin&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3000}} onClick={()=>setShowLogin(false)}>
        <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:320,width:'100%'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16}}>🔐 Acceso administrador</div>
          <input type="password" placeholder="Contraseña" value={adminPass} onChange={e=>setAdminPass(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'){if(adminPass==='familia2024'){setIsAdmin(true);setShowLogin(false);showToast('👑 Bienvenido, administrador')}else showToast('❌ Contraseña incorrecta','error');setAdminPass('')}}}
            style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:14,boxSizing:'border-box',outline:'none'}}/>
          <div style={{fontSize:11,color:'#94a3b8',marginTop:6,marginBottom:14}}>Contraseña demo: <b>familia2024</b></div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowLogin(false)} style={{flex:1,padding:10,background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancelar</button>
            <button onClick={()=>{if(adminPass==='familia2024'){setIsAdmin(true);setShowLogin(false);showToast('👑 Bienvenido')}else showToast('❌ Contraseña incorrecta','error');setAdminPass('')}} style={{flex:1,padding:10,background:'#1e293b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>Entrar</button>
          </div>
        </div>
      </div>}

      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:toast.type==='error'?'#dc2626':toast.type==='info'?'#2563eb':'#16a34a',color:'#fff',padding:'10px 20px',borderRadius:30,fontWeight:700,fontSize:13,boxShadow:'0 8px 25px rgba(0,0,0,0.2)',zIndex:5000,whiteSpace:'nowrap'}}>{toast.msg}</div>}
    </div>
  )
}
