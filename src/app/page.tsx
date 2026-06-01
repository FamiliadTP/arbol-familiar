'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, Member, PendingEdit } from '../lib/supabase'
import { fullName, calcAge, fmtDate, monthNames } from '../lib/utils'

const SAMPLE_MEMBERS: Omit<Member, 'created_at'>[] = [
  { id:'g1m1', name:'José', surname1:'García', surname2:'López', born:'1920-03-15', died:'1995-08-20', gender:'M', generation:1, spouse_id:'g1f1', children_ids:['g2m1','g2f1'], external:false, email:null, bio_birthplace:'Sevilla, España', bio_education:'Primaria', bio_occupation:'Agricultor', bio_notes:null },
  { id:'g1f1', name:'Carmen', surname1:'Ruiz', surname2:'Mora', born:'1923-07-04', died:'2001-01-12', gender:'F', generation:1, spouse_id:'g1m1', children_ids:['g2m1','g2f1'], external:false, email:null, bio_birthplace:'Málaga, España', bio_education:'Primaria', bio_occupation:'Ama de casa', bio_notes:null },
  { id:'g2m1', name:'Antonio', surname1:'García', surname2:'Ruiz', born:'1950-06-22', died:null, gender:'M', generation:2, spouse_id:'g2f1', children_ids:['g3m1','g3f1'], external:false, email:'antonio@email.com', bio_birthplace:'Santiago, Chile', bio_education:'Universidad', bio_occupation:'Ingeniero', bio_notes:null },
  { id:'g2f1', name:'Elena', surname1:'Torres', surname2:'Martínez', born:'1953-09-10', died:null, gender:'F', generation:2, spouse_id:'g2m1', children_ids:['g3m1','g3f1'], external:false, email:'elena@email.com', bio_birthplace:'Valparaíso, Chile', bio_education:'Universidad', bio_occupation:'Profesora', bio_notes:null },
  { id:'g3m1', name:'Carlos', surname1:'García', surname2:'Torres', born:'1975-03-28', died:null, gender:'M', generation:3, spouse_id:null, children_ids:['g4m1'], external:false, email:'carlos@email.com', bio_birthplace:'Santiago, Chile', bio_education:'Universidad', bio_occupation:'Médico', bio_notes:null },
  { id:'g3f1', name:'María', surname1:'García', surname2:'Torres', born:'1978-11-02', died:null, gender:'F', generation:3, spouse_id:null, children_ids:[], external:false, email:null, bio_birthplace:'Santiago, Chile', bio_education:'Universidad', bio_occupation:'Diseñadora', bio_notes:null },
  { id:'g4m1', name:'Diego', surname1:'García', surname2:'Torres', born:'2002-10-14', died:null, gender:'M', generation:4, spouse_id:null, children_ids:[], external:false, email:null, bio_birthplace:null, bio_education:null, bio_occupation:null, bio_notes:null },
]

function Avatar({ p, size=40 }: { p: Member; size?: number }) {
  const bg = p.died ? '#64748b' : p.gender==='M' ? '#2563eb' : '#db2777'
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:size*0.36,fontWeight:700,border:p.external?'2px dashed #94a3b8':'2px solid #fff',flexShrink:0,opacity:p.died?0.7:1}}>
      {p.name[0]}{p.surname1[0]}
    </div>
  )
}

function PersonCard({ person, members, onClose, onEdit, isAdmin }: { person:Member; members:Member[]; onClose:()=>void; onEdit:(p:Member)=>void; isAdmin:boolean }) {
  const spouse = members.find(m=>m.id===person.spouse_id)
  const children = members.filter(m=>person.children_ids?.includes(m.id))
  const parents = members.filter(m=>m.children_ids?.includes(person.id))
  // Parse previous marriages for display
  let prevMarriages: Array<{spouse_id:string|null,children_ids:string[]}> = []
  let bioText: string|null = person.bio_notes
  if (person.bio_notes) {
    try {
      const parsed = JSON.parse(person.bio_notes)
      if (Array.isArray(parsed)) { prevMarriages = parsed; bioText = null }
    } catch {}
  }
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
          {[['Nacimiento',fmtDate(person.born)],['Edad',`${calcAge(person.born,person.died)} años`],person.died?['Fallecimiento',fmtDate(person.died)]:null,spouse?['Cónyuge actual',fullName(spouse)]:null,person.bio_birthplace?['Lugar de nacimiento',person.bio_birthplace]:null,person.bio_occupation?['Ocupación',person.bio_occupation]:null].filter(Boolean).map(([l,v])=>(
            <div key={l as string} style={{background:'#f8fafc',borderRadius:8,padding:'8px 10px'}}>
              <div style={{fontSize:10,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600,color:'#1e293b',marginTop:2}}>{v}</div>
            </div>
          ))}
        </div>
        {prevMarriages.length>0&&<div style={{marginBottom:12}}>
          {prevMarriages.map((pm,i)=>{
            const pmSpouse=members.find(m=>m.id===pm.spouse_id)
            const pmChildren=members.filter(m=>pm.children_ids.includes(m.id))
            return <div key={i} style={{background:'#f8fafc',borderRadius:8,padding:'8px 10px',marginBottom:6}}>
              <div style={{fontSize:10,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1}}>1er matrimonio</div>
              {pmSpouse&&<div style={{fontSize:13,fontWeight:600,color:'#1e293b',marginTop:2}}>{fullName(pmSpouse)}</div>}
              {pmChildren.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>{pmChildren.map(c=><Chip key={c.id} p={c}/>)}</div>}
            </div>
          })}
        </div>}
        {bioText&&<div style={{background:'#faf5ff',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#4c1d95',marginBottom:14,fontStyle:'italic'}}>"{bioText}"</div>}
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
  return <div style={{background:p.gender==='M'?'#dbeafe':'#fce7f3',color:p.gender==='M'?'#1d4ed8':'#be185d',borderRadius:20,padding:'4px 10px',fontSize:12,fontWeight:600}}>{p.name} {p.surname1}</div>
}

function MiniCard({person,onSelect}:{person:Member;onSelect:(p:Member)=>void}){
  const isBlood = !person.external
  // Blood relatives: blue/pink bg + thick golden border + warm shadow
  // Political relatives: white/grey bg + thin dashed grey border
  const bg = isBlood
    ? (person.gender==='M' ? '#dbeafe' : '#fce7f3')
    : (person.gender==='M' ? '#f8fafc' : '#fdf4ff')
  const border = isBlood ? '#d97706' : '#94a3b8'
  const borderStyle = isBlood ? 'solid' : 'dashed'
  const borderWidth = isBlood ? '3px' : '1.5px'
  const shadow = isBlood ? '0 2px 10px rgba(217,119,6,0.3)' : '0 1px 4px rgba(0,0,0,0.06)'
  return (
    <div onClick={()=>onSelect(person)} style={{background:bg,border:`${borderWidth} ${borderStyle} ${border}`,borderRadius:12,padding:'10px 12px',cursor:'pointer',minWidth:100,textAlign:'center',opacity:person.died?0.75:1,boxShadow:shadow,transition:'transform 0.15s',position:'relative'}}
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

function sortByIds(members: Member[], ids: string[]): Member[] {
  return [...members].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
}

function getMarriages(person: Member, members: Member[]): Array<{spouse: Member|null, children: Member[], spouseOwnChildren: Member[]}> {
  const allChildren = sortByIds(members.filter(m => person.children_ids?.includes(m.id)), person.children_ids ?? [])
  const currentSpouse = members.find(m => m.id === person.spouse_id) ?? null
  let prevMarriages: Array<{spouse_id: string|null, children_ids: string[]}> = []
  console.log('getMarriages called for', person.id, 'bio_notes:', person.bio_notes, 'type:', typeof person.bio_notes)
  if (person.bio_notes) {
    try {
      let parsed: any = person.bio_notes
      if (typeof parsed === 'string') parsed = JSON.parse(parsed)
      if (Array.isArray(parsed) && parsed.length > 0) { prevMarriages = parsed; console.log('prevMarriages SET for', person.id, prevMarriages) }
      else console.log('bio_notes not array for', person.id, typeof parsed, parsed)
    } catch(e) { console.log('bio_notes parse error for', person.id, e) }
  }
  const getSpouseOwnChildren = (spouse: Member|null): Member[] => {
    if (!spouse) return []
    const own = members.filter(m => spouse.children_ids?.includes(m.id) && !person.children_ids?.includes(m.id))
    return sortByIds(own, spouse.children_ids ?? [])
  }
  if (prevMarriages.length === 0) {
    return [{ spouse: currentSpouse, children: allChildren, spouseOwnChildren: getSpouseOwnChildren(currentSpouse) }]
  }
  const usedChildIds = new Set<string>()
  const result: Array<{spouse: Member|null, children: Member[], spouseOwnChildren: Member[]}> = []
  for (const pm of prevMarriages) {
    const spouse = members.find(m => m.id === pm.spouse_id) ?? null
    const children = sortByIds(members.filter(m => pm.children_ids.includes(m.id)), pm.children_ids)
    children.forEach(c => usedChildIds.add(c.id))
    result.push({ spouse, children, spouseOwnChildren: getSpouseOwnChildren(spouse) })
  }
  const currentChildren = allChildren.filter(c => !usedChildIds.has(c.id))
  result.push({ spouse: currentSpouse, children: currentChildren, spouseOwnChildren: getSpouseOwnChildren(currentSpouse) })
  return result
}

// ── TREE RENDERING ───────────────────────────────────────────────────────────

const MARRY_COLOR = "#d97706"
const BLOOD_COLOR = "#475569"
const POLIT_COLOR = "#f59e0b"

function VLine({h, color=BLOOD_COLOR}: {h:number, color?:string}) {
  return <div style={{width:3, height:h, background:color, flexShrink:0, alignSelf:'center'}}/>
}

function UnknownParent() {
  return (
    <div style={{
      width:56, height:56, borderRadius:10, border:'2px dashed #94a3b8',
      background:'#f8fafc', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      color:'#94a3b8', fontSize:18, fontWeight:700, flexShrink:0
    }}>
      <div>?</div>
      <div style={{fontSize:8, marginTop:1}}>no registrado</div>
    </div>
  )
}

// Children with center-to-center horizontal bar
function Kids({list, members, onSelect, political=false}: {
  list:Member[], members:Member[], onSelect:(p:Member)=>void, political?:boolean
}) {
  if (!list.length) return null
  const color = political ? POLIT_COLOR : BLOOD_COLOR
  if (list.length === 1) return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      <VLine h={20} color={color}/>
      <TreeNode person={list[0]} members={members} onSelect={onSelect}/>
    </div>
  )
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      <VLine h={20} color={color}/>
      <div style={{display:'flex', alignItems:'flex-start'}}>
        {list.map((kid, i) => (
          <div key={kid.id} style={{display:'flex', flexDirection:'column', alignItems:'center', margin:'0 10px'}}>
            <div style={{display:'flex', alignItems:'center', width:'100%'}}>
              <div style={{flex:1, height:3, background: i===0 ? 'transparent' : color}}/>
              <VLine h={20} color={color}/>
              <div style={{flex:1, height:3, background: i===list.length-1 ? 'transparent' : color}}/>
            </div>
            <TreeNode person={kid} members={members} onSelect={onSelect}/>
          </div>
        ))}
      </div>
    </div>
  )
}

// THE key component: [Left]——[Right] with kids hanging from the JOIN POINT center
// Kids ALWAYS connect from between the two parents, never from one parent alone
function Pair({left, right, kids, members, onSelect}: {
  left:Member, right:Member|null, kids:Member[],
  members:Member[], onSelect:(p:Member)=>void
}) {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{display:'flex', alignItems:'center'}}>
        <MiniCard person={left} onSelect={onSelect}/>
        {right && <>
          <div style={{width:20, height:3, background:MARRY_COLOR, flexShrink:0}}/>
          <MiniCard person={right} onSelect={onSelect}/>
        </>}
      </div>
      <Kids list={kids} members={members} onSelect={onSelect}/>
    </div>
  )
}

// Spouse column with unknown-parent symbol and their own kids below
function SpouseWithUnknown({spouse, ownKids, members, onSelect}: {
  spouse:Member, ownKids:Member[], members:Member[], onSelect:(p:Member)=>void
}) {
  if (!ownKids.length) return <MiniCard person={spouse} onSelect={onSelect}/>
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      <MiniCard person={spouse} onSelect={onSelect}/>
      <VLine h={14} color={POLIT_COLOR}/>
      <div style={{display:'flex', alignItems:'center'}}>
        <div style={{width:20, height:2, borderTop:`2px dashed ${POLIT_COLOR}`}}/>
        <UnknownParent/>
      </div>
      <Kids list={ownKids} members={members} onSelect={onSelect} political={true}/>
    </div>
  )
}

function TreeNode({person, members, onSelect}: {
  person:Member, members:Member[], onSelect:(p:Member)=>void
}) {
  const marriages = getMarriages(person, members)

  // ── SINGLE MARRIAGE ──────────────────────────────────────────────────────
  if (marriages.length === 1) {
    const {spouse, children, spouseOwnChildren} = marriages[0]

    // Spouse has own kids with unknown other parent
    if (spouseOwnChildren.length > 0 && spouse) {
      const spouseIsLeft = spouse.gender === 'M'
      return (
        <div style={{display:'flex', alignItems:'flex-start', gap:0}}>
          {spouseIsLeft ? <>
            <SpouseWithUnknown spouse={spouse} ownKids={spouseOwnChildren} members={members} onSelect={onSelect}/>
            <div style={{width:20, height:3, background:MARRY_COLOR, alignSelf:'flex-start', marginTop:28, flexShrink:0}}/>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
              <MiniCard person={person} onSelect={onSelect}/>
              <Kids list={children} members={members} onSelect={onSelect}/>
            </div>
          </> : <>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
              <MiniCard person={person} onSelect={onSelect}/>
              <Kids list={children} members={members} onSelect={onSelect}/>
            </div>
            <div style={{width:20, height:3, background:MARRY_COLOR, alignSelf:'flex-start', marginTop:28, flexShrink:0}}/>
            <SpouseWithUnknown spouse={spouse} ownKids={spouseOwnChildren} members={members} onSelect={onSelect}/>
          </>}
        </div>
      )
    }

    // Normal single marriage: M left, F right
    const left  = !spouse || person.gender === 'M' ? person : spouse
    const right = (left === person ? spouse : person) ?? null
    return <Pair left={left} right={right} kids={children} members={members} onSelect={onSelect}/>
  }

  // ── MULTIPLE MARRIAGES ────────────────────────────────────────────────────
  // Two Pair blocks side by side. Person appears in BOTH to guarantee correct
  // join points for kids in each marriage.
  //
  //  Pair1: [PrevSpouse]——[Person]    Pair2: [Person]——[CurrSpouse]
  //              prevKids↑                       currKids↑
  //
  // CurrSpouse own kids (e.g. Mascaró) shown as extra block to the right.

  const prev = marriages[0]
  const curr = marriages[marriages.length - 1]

  // Find other parent of curr spouse's own kids (e.g. Mascaró for María Teresa)
  const currSpouseOtherParent = curr.spouseOwnChildren.length > 0 && curr.spouse
    ? members.find(m =>
        m.id !== curr.spouse!.id &&
        curr.spouseOwnChildren.every(c => m.children_ids?.includes(c.id))
      ) ?? null
    : null

  return (
    <div style={{display:'flex', alignItems:'flex-start', gap:16}}>

      {/* FAR LEFT: PrevSpouse own kids with unknown parent — Angélica shown once in Pair1, only ? here */}
      {prev.spouseOwnChildren.length > 0 && prev.spouse && (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <UnknownParent/>
          <Kids list={prev.spouseOwnChildren} members={members} onSelect={onSelect} political={true}/>
        </div>
      )}

      {/* PAIR 1: [PrevSpouse]——[Person] — prevKids hang from this join */}
      {prev.spouse ? (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center'}}>
            <MiniCard person={prev.spouse} onSelect={onSelect}/>
            <div style={{width:20, height:3, background:MARRY_COLOR, flexShrink:0}}/>
            <MiniCard person={person} onSelect={onSelect}/>
          </div>
          <Kids list={prev.children} members={members} onSelect={onSelect}/>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <MiniCard person={person} onSelect={onSelect}/>
          <Kids list={prev.children} members={members} onSelect={onSelect}/>
        </div>
      )}

      {/* PAIR 2: [Person]——[CurrSpouse] — currKids hang from this join */}
      {curr.spouse && (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center'}}>
            <MiniCard person={person} onSelect={onSelect}/>
            <div style={{width:20, height:3, background:MARRY_COLOR, flexShrink:0}}/>
            <MiniCard person={curr.spouse} onSelect={onSelect}/>
          </div>
          <Kids list={curr.children} members={members} onSelect={onSelect}/>
        </div>
      )}

      {/* CurrSpouse own kids with their other partner (e.g. María Teresa + Mascaró) */}
      {curr.spouseOwnChildren.length > 0 && curr.spouse && (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center'}}>
            <MiniCard person={curr.spouse} onSelect={onSelect}/>
            <div style={{width:20, height:3, background:MARRY_COLOR, flexShrink:0}}/>
            {currSpouseOtherParent
              ? <MiniCard person={currSpouseOtherParent} onSelect={onSelect}/>
              : <UnknownParent/>
            }
          </div>
          <Kids list={curr.spouseOwnChildren} members={members} onSelect={onSelect}/>
        </div>
      )}

    </div>
  )
}



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

function ListView({members,onSelect}:{members:Member[];onSelect:(p:Member)=>void}){
  const [filter,setFilter]=useState('all')
  const [search,setSearch]=useState('')
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
        {[['all','Todos'],['living','Vivos'],['deceased','Fallecidos'],['gen1','1ª Gen'],['gen2','2ª Gen'],['gen3','3ª Gen'],['gen4','4ª Gen']].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} style={{padding:'5px 12px',borderRadius:20,border:'none',cursor:'pointer',background:filter===v?'#1e293b':'#f1f5f9',color:filter===v?'#fff':'#64748b',fontWeight:600,fontSize:12}}>{l}</button>)}
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

function StatsView({members}:{members:Member[]}){
  const alive=members.filter(m=>!m.died)
  const avgAge=alive.length?Math.round(alive.reduce((s,m)=>s+calcAge(m.born,null),0)/alive.length):0
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
            <div style={{background:'#e2e8f0',borderRadius:4,height:8,overflow:'hidden'}}><div style={{width:`${members.length?(count/members.length)*100:0}%`,height:'100%',background:'#7c3aed',borderRadius:4}}/></div>
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
        {!isAdmin&&<div style={{background:'#fef3c7',border:'1px solid #fbbf24',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#92400e',marginBottom:14}}>⚠️ Tu propuesta será revisada por un administrador.</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          {([['name','Nombre'],['surname1','Primer apellido'],['surname2','Segundo apellido'],['email','Email'],['bio_birthplace','Lugar de nacimiento'],['bio_occupation','Ocupación'],['bio_education','Educación']] as [keyof Member,string][]).map(([k,l])=>(
            <label key={k} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600,gridColumn:k==='name'?'1 / -1':undefined}}>
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
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none',resize:'vertical'}}/>
        </label>}
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancelar</button>
          <button onClick={()=>onSubmit(form,note)} style={{flex:2,padding:'10px',background:'#1e293b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>{isAdmin?'💾 Guardar':'📤 Enviar'}</button>
        </div>
      </div>
    </div>
  )
}

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

function AdminPanel({ onChangePassword, onImportExcel, onAddMember, importing }: {
  onChangePassword: (oldPass: string, newPass: string) => void
  onImportExcel: (file: File) => void
  onAddMember: () => void
  importing: boolean
}) {
  const [tab, setTab] = useState<'tools'|'password'>('tools')
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [passError, setPassError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleChangePass = () => {
    if (newPass !== newPass2) { setPassError('Las contraseñas no coinciden'); return }
    if (newPass.length < 6) { setPassError('Mínimo 6 caracteres'); return }
    setPassError('')
    onChangePassword(oldPass, newPass)
    setOldPass(''); setNewPass(''); setNewPass2('')
  }

  return (
    <div style={{background:'#f8fafc',borderRadius:14,padding:20,marginBottom:20,border:'2px solid #e2e8f0'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <span style={{fontSize:20}}>👑</span>
        <div style={{fontWeight:800,fontSize:16,color:'#1e293b'}}>Panel de Administrador</div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['tools','🛠️ Herramientas'],['password','🔑 Contraseña']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t as any)} style={{padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',background:tab===t?'#1e293b':'#e2e8f0',color:tab===t?'#fff':'#64748b',fontWeight:600,fontSize:12}}>{l}</button>
        ))}
      </div>
      {tab==='tools'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button onClick={onAddMember} style={{padding:'12px 16px',background:'#16a34a',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:14,textAlign:'left'}}>
            ➕ Agregar nueva persona
          </button>
          <div style={{background:'#fff',borderRadius:10,padding:14,border:'2px dashed #cbd5e1'}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>📊 Cargar datos desde Excel</div>
            <div style={{fontSize:12,color:'#64748b',marginBottom:10}}>Sube el archivo Excel con los datos de tu familia.</div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={e=>e.target.files?.[0]&&onImportExcel(e.target.files[0])}/>
            <button onClick={()=>fileRef.current?.click()} disabled={importing} style={{padding:'10px 20px',background:importing?'#94a3b8':'#2563eb',color:'#fff',border:'none',borderRadius:8,cursor:importing?'not-allowed':'pointer',fontWeight:700,fontSize:13}}>
              {importing?'⏳ Importando...':'📁 Seleccionar archivo Excel'}
            </button>
          </div>
        </div>
      )}
      {tab==='password'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:320}}>
          <div style={{fontSize:13,color:'#64748b',marginBottom:4}}>Cambia la contraseña de administrador.</div>
          {[['Contraseña actual',oldPass,setOldPass],['Nueva contraseña',newPass,setNewPass],['Confirmar nueva contraseña',newPass2,setNewPass2]].map(([l,v,fn])=>(
            <label key={l as string} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600}}>
              {l as string}
              <input type="password" value={v as string} onChange={e=>(fn as any)(e.target.value)} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}/>
            </label>
          ))}
          {passError&&<div style={{fontSize:12,color:'#dc2626'}}>{passError}</div>}
          <button onClick={handleChangePass} style={{padding:'10px',background:'#1e293b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13,marginTop:4}}>💾 Cambiar contraseña</button>
          <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>⚠️ La contraseña se guarda en el navegador.</div>
        </div>
      )}
    </div>
  )
}

function NewMemberModal({onClose,onSave}:{onClose:()=>void;onSave:(m:Member)=>void}){
  const [form,setForm]=useState<Partial<Member>>({gender:'M',generation:3,external:false,children_ids:[]})
  const set=(k:keyof Member,v:any)=>setForm(f=>({...f,[k]:v}))
  const handleSave=()=>{
    if(!form.name||!form.surname1||!form.surname2||!form.born||!form.generation){alert('Completa los campos obligatorios');return}
    const id=`m${Date.now()}`
    onSave({...form,id,children_ids:form.children_ids||[],external:form.external||false,email:form.email||null,bio_birthplace:form.bio_birthplace||null,bio_education:form.bio_education||null,bio_occupation:form.bio_occupation||null,bio_notes:form.bio_notes||null,died:form.died||null,spouse_id:form.spouse_id||null} as Member)
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:20}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:480,width:'100%',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontWeight:800,fontSize:17}}>➕ Nueva persona</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#64748b'}}>×</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          {([['name','Nombre *'],['surname1','Primer apellido *'],['surname2','Segundo apellido *'],['email','Email'],['bio_birthplace','Lugar de nacimiento'],['bio_occupation','Ocupación'],['bio_education','Educación'],['spouse_id','ID Cónyuge']] as [keyof Member,string][]).map(([k,l])=>(
            <label key={k} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600,gridColumn:k==='name'?'1 / -1':undefined}}>
              {l}<input value={(form[k]??'') as string} onChange={e=>set(k,e.target.value||null)} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}/>
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600}}>
            Nacimiento *<input type="date" value={(form.born??'') as string} onChange={e=>set('born',e.target.value||null)} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}/>
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600}}>
            Fallecimiento<input type="date" value={(form.died??'') as string} onChange={e=>set('died',e.target.value||null)} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}/>
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600}}>
            Género *
            <select value={form.gender??'M'} onChange={e=>set('gender',e.target.value)} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600}}>
            Generación *
            <select value={form.generation??3} onChange={e=>set('generation',parseInt(e.target.value))} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none'}}>
              <option value={1}>1ª - Abuelos</option>
              <option value={2}>2ª - Padres</option>
              <option value={3}>3ª - Hijos</option>
              <option value={4}>4ª - Nietos</option>
            </select>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#64748b',fontWeight:600,gridColumn:'1 / -1'}}>
            <input type="checkbox" checked={form.external||false} onChange={e=>set('external',e.target.checked)}/> Ingresó por matrimonio
          </label>
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,color:'#64748b',fontWeight:600,gridColumn:'1 / -1'}}>
            Nota biográfica
            <textarea value={(form.bio_notes??'') as string} onChange={e=>set('bio_notes',e.target.value||null)} rows={2} style={{padding:'8px 10px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:13,outline:'none',resize:'vertical'}}/>
          </label>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancelar</button>
          <button onClick={handleSave} style={{flex:2,padding:'10px',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>💾 Guardar persona</button>
        </div>
      </div>
    </div>
  )
}

const ADMIN_PASS_KEY = 'arbol_admin_pass'
const getStoredPass = () => typeof window !== 'undefined' ? (localStorage.getItem(ADMIN_PASS_KEY)||'familia2024') : 'familia2024'

export default function Home() {
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<PendingEdit[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'tree'|'list'|'birthdays'|'stats'|'admin'|'pending'>('tree')
  const [selected, setSelected] = useState<Member|null>(null)
  const [editTarget, setEditTarget] = useState<Member|null>(null)
  const [showNewMember, setShowNewMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null)
  const [usingDemo, setUsingDemo] = useState(false)
  const [importing, setImporting] = useState(false)

  const showToast = (msg:string, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500) }

  useEffect(()=>{ loadData() },[])

  async function loadData() {
    try {
      const {data,error}=await supabase.from('members').select('*').order('generation')
      if(error||!data||data.length===0){ setMembers(SAMPLE_MEMBERS as Member[]); setUsingDemo(true) }
      else{ setMembers(data); setUsingDemo(false) }
      const {data:pData}=await supabase.from('pending_edits').select('*').eq('status','pending')
      if(pData)setPending(pData)
    } catch { setMembers(SAMPLE_MEMBERS as Member[]); setUsingDemo(true) }
    setLoading(false)
  }

  async function handleEditSubmit(updated:Member,note:string){
    if(usingDemo){ setMembers(m=>m.map(x=>x.id===updated.id?updated:x)); showToast('✅ Guardado (modo demo)') }
    else if(isAdmin){ const{error}=await supabase.from('members').upsert(updated); if(error){showToast('❌ Error al guardar','error');return}; await loadData(); showToast('✅ Cambios guardados') }
    else{ const orig=members.find(m=>m.id===updated.id)!; const changes:Partial<Member>={}; (Object.keys(updated) as (keyof Member)[]).forEach(k=>{if(updated[k]!==orig[k])(changes as any)[k]=updated[k]}); const{error}=await supabase.from('pending_edits').insert({member_id:updated.id,proposed_by:'visitante',changes,note,status:'pending'}); if(error){showToast('❌ Error al enviar','error');return}; showToast('📤 Propuesta enviada a administradores','info') }
    setEditTarget(null); setSelected(null)
  }

  async function handleNewMember(m:Member){
    if(usingDemo){ setMembers(prev=>[...prev,m]); showToast('✅ Persona agregada (modo demo)') }
    else{ const{error}=await supabase.from('members').insert(m); if(error){showToast('❌ Error al guardar','error');return}; await loadData(); showToast('✅ Persona agregada') }
    setShowNewMember(false)
  }

  async function handleImportExcel(file:File){
    setImporting(true)
    try{
      const XLSX=await import('xlsx')
      const buf=await file.arrayBuffer()
      const wb=XLSX.read(buf)
      const ws=wb.Sheets[wb.SheetNames[0]]
      const rows:any[]=XLSX.utils.sheet_to_json(ws,{defval:''})
      const dataRows=rows.filter((r:any)=>r.id&&r.id!=='id'&&!String(r.id).includes('Obligatorio')&&!String(r.id).includes('Opcional'))
      const mapped:Member[]=dataRows.map((r:any)=>({
        id:String(r.id||'').trim(),
        name:String(r.name||'').trim(),
        surname1:String(r.surname1||'').trim(),
        surname2:String(r.surname2||'').trim(),
        born:String(r.born||'').trim(),
        died:r.died?String(r.died).trim():null,
        gender:(String(r.gender||'M').trim().toUpperCase()==='F'?'F':'M') as 'M'|'F',
        generation:parseInt(String(r.generation||'1'))||1,
        spouse_id:r.spouse_id?String(r.spouse_id).trim():null,
        children_ids:r.children_ids?String(r.children_ids).split(',').map((s:string)=>s.trim()).filter(Boolean):[],
        external:String(r.external||'').toLowerCase()==='true',
        email:r.email?String(r.email).trim():null,
        bio_birthplace:r.bio_birthplace?String(r.bio_birthplace).trim():null,
        bio_education:r.bio_education?String(r.bio_education).trim():null,
        bio_occupation:r.bio_occupation?String(r.bio_occupation).trim():null,
        bio_notes:r.bio_notes?String(r.bio_notes).trim():null,
      })).filter((m:Member)=>m.id&&m.name&&m.born)
      if(!mapped.length){showToast('❌ No se encontraron datos válidos','error');setImporting(false);return}
      if(usingDemo){ setMembers(mapped); setUsingDemo(false); showToast(`✅ ${mapped.length} personas cargadas`) }
      else{
        for(const m of mapped){ await supabase.from('members').upsert(m) }
        await loadData()
        showToast(`✅ ${mapped.length} personas importadas`)
      }
    } catch(e){ console.error(e); showToast('❌ Error al leer el archivo','error') }
    setImporting(false)
  }

  async function handleApprove(id:string){ const edit=pending.find(p=>p.id===id)!; await supabase.from('members').upsert(edit.changes); await supabase.from('pending_edits').update({status:'approved'}).eq('id',id); await loadData(); showToast('✅ Cambio aprobado') }
  async function handleReject(id:string){ await supabase.from('pending_edits').update({status:'rejected'}).eq('id',id); setPending(p=>p.filter(x=>x.id!==id)); showToast('🗑️ Propuesta rechazada','error') }

  function handleChangePassword(oldPass:string,newPass:string){
    const current=getStoredPass()
    if(oldPass!==current){showToast('❌ Contraseña actual incorrecta','error');return}
    localStorage.setItem(ADMIN_PASS_KEY,newPass)
    showToast('✅ Contraseña actualizada')
  }

  const roots=members.filter(m=>m.generation===1&&!members.some(x=>x.children_ids?.includes(m.id)))
  const coupleRoots:Member[]=[]; const seen=new Set<string>()
  roots.forEach(r=>{if(!seen.has(r.id)){seen.add(r.id);if(r.spouse_id)seen.add(r.spouse_id);coupleRoots.push(r)}})

  const VIEWS=[
    {id:'tree',label:'🌳 Árbol'},{id:'list',label:'📋 Lista'},
    {id:'birthdays',label:'🎂 Cumpleaños'},{id:'stats',label:'📊 Stats'},
    ...(isAdmin?[{id:'admin',label:'👑 Admin'},{id:'pending',label:`⏳ Aprobar${pending.length>0?` (${pending.length})`:''}`}]:[]),
  ]

  if(loading)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:14,color:'#64748b'}}>Cargando árbol familiar…</div>

  return(
    <div style={{minHeight:'100vh',background:'#f1f5f9'}}>
      <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',padding:'16px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
        <div>
          <div style={{color:'#fff',fontSize:18,fontWeight:900,letterSpacing:-0.5}}>🌳 Árbol Familiar</div>
          <div style={{color:'#94a3b8',fontSize:11,marginTop:2}}>{members.length} miembros{usingDemo?' · modo demo':''}</div>
        </div>
        {isAdmin
          ?<button onClick={()=>setIsAdmin(false)} style={{padding:'6px 12px',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>👑 Admin activo</button>
          :<button onClick={()=>setShowLogin(true)} style={{padding:'6px 12px',background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,cursor:'pointer',fontSize:12}}>🔐 Admin</button>}
      </div>

      <div style={{background:'#fff',borderBottom:'2px solid #e2e8f0',display:'flex',gap:0,overflowX:'auto'}}>
        {VIEWS.map(v=><button key={v.id} onClick={()=>setView(v.id as any)} style={{padding:'12px 14px',border:'none',background:'none',cursor:'pointer',fontWeight:700,fontSize:12,color:view===v.id?'#7c3aed':'#64748b',borderBottom:view===v.id?'3px solid #7c3aed':'3px solid transparent',whiteSpace:'nowrap'}}>{v.label}</button>)}
      </div>

      <div style={{padding:'16px',maxWidth:1100,margin:'0 auto'}}>
        {view==='tree'&&<div style={{overflowX:'auto',paddingBottom:16}}>
          <div style={{display:'flex',gap:48,justifyContent:'center',padding:'10px 16px',minWidth:'max-content'}}>
            {coupleRoots.map(r=><TreeNode key={r.id} person={r} members={members} onSelect={setSelected}/>)}
          </div>
          <div style={{textAlign:'center',marginTop:12,fontSize:11,color:'#94a3b8'}}>
  <span style={{color:'#d97706',fontWeight:700}}>borde dorado</span> = línea de sangre &nbsp;·&nbsp; <span style={{fontWeight:700}}>★</span> = familiar político &nbsp;·&nbsp; † fallecido &nbsp;·&nbsp; <span style={{color:'#d97706'}}>— — —</span> matrimonio (línea continua) &nbsp;·&nbsp; Toca para ver detalles
</div>
        </div>}
        {view==='list'&&<ListView members={members} onSelect={setSelected}/>}
        {view==='birthdays'&&<BirthdayView members={members} onSelect={setSelected}/>}
        {view==='stats'&&<StatsView members={members}/>}
        {view==='admin'&&isAdmin&&<AdminPanel onChangePassword={handleChangePassword} onImportExcel={handleImportExcel} onAddMember={()=>setShowNewMember(true)} importing={importing}/>}
        {view==='pending'&&isAdmin&&<PendingView pending={pending} onApprove={handleApprove} onReject={handleReject}/>}
      </div>

      {selected&&<PersonCard person={selected} members={members} onClose={()=>setSelected(null)} onEdit={setEditTarget} isAdmin={isAdmin}/>}
      {editTarget&&<EditModal person={editTarget} isAdmin={isAdmin} onClose={()=>setEditTarget(null)} onSubmit={handleEditSubmit}/>}
      {showNewMember&&<NewMemberModal onClose={()=>setShowNewMember(false)} onSave={handleNewMember}/>}

      {showLogin&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3000}} onClick={()=>setShowLogin(false)}>
        <div style={{background:'#fff',borderRadius:16,padding:24,maxWidth:320,width:'100%'}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16}}>🔐 Acceso administrador</div>
          <input type="password" placeholder="Contraseña" value={adminPass} onChange={e=>setAdminPass(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'){if(adminPass===getStoredPass()){setIsAdmin(true);setShowLogin(false);setView('admin');showToast('👑 Bienvenido, administrador')}else showToast('❌ Contraseña incorrecta','error');setAdminPass('')}}}
            style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'2px solid #e2e8f0',fontSize:14,boxSizing:'border-box',outline:'none'}}/>
          <div style={{fontSize:11,color:'#94a3b8',marginTop:6,marginBottom:14}}>Contraseña inicial: <b>familia2024</b></div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setShowLogin(false)} style={{flex:1,padding:10,background:'#f1f5f9',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:13}}>Cancelar</button>
            <button onClick={()=>{if(adminPass===getStoredPass()){setIsAdmin(true);setShowLogin(false);setView('admin');showToast('👑 Bienvenido')}else showToast('❌ Contraseña incorrecta','error');setAdminPass('')}} style={{flex:1,padding:10,background:'#1e293b',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:13}}>Entrar</button>
          </div>
        </div>
      </div>}

      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:toast.type==='error'?'#dc2626':toast.type==='info'?'#2563eb':'#16a34a',color:'#fff',padding:'10px 20px',borderRadius:30,fontWeight:700,fontSize:13,boxShadow:'0 8px 25px rgba(0,0,0,0.2)',zIndex:5000,whiteSpace:'nowrap'}}>{toast.msg}</div>}
    </div>
  )
}
