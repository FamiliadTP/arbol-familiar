function TreeNode({person, members, onSelect}: {
  person:Member, members:Member[], onSelect:(p:Member)=>void
}) {
  const marriages = getMarriages(person, members)

  // ── SINGLE MARRIAGE ──────────────────────────────────────────────────────
  if (marriages.length === 1) {
    const {spouse, children, spouseOwnChildren} = marriages[0]

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

    const left  = !spouse || person.gender === 'M' ? person : spouse
    const right = (left === person ? spouse : person) ?? null
    return <Pair left={left} right={right} kids={children} members={members} onSelect={onSelect}/>
  }

  // ── MULTIPLE MARRIAGES ────────────────────────────────────────────────────
  const prev = marriages[0]
  const curr = marriages[marriages.length - 1]

  const currSpouseOtherParent = curr.spouseOwnChildren.length > 0 && curr.spouse
    ? members.find(m =>
        m.id !== curr.spouse!.id &&
        curr.spouseOwnChildren.every(c => m.children_ids?.includes(c.id))
      ) ?? null
    : null

  return (
    <div style={{display:'flex', alignItems:'flex-start', gap:16}}>

      {/* PAIR 1: [?]——[PrevSpouse]——[Person] — ? a la izquierda si tiene hijos propios */}
      {prev.spouse ? (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center'}}>
            {prev.spouseOwnChildren.length > 0 && (
              <>
                <UnknownParent/>
                <div style={{width:20, height:3, background:MARRY_COLOR, flexShrink:0}}/>
              </>
            )}
            <MiniCard person={prev.spouse} onSelect={onSelect}/>
            <div style={{width:20, height:3, background:MARRY_COLOR, flexShrink:0}}/>
            <MiniCard person={person} onSelect={onSelect}/>
          </div>
          {prev.spouseOwnChildren.length > 0 && (
            <Kids list={prev.spouseOwnChildren} members={members} onSelect={onSelect} political={true}/>
          )}
          <Kids list={prev.children} members={members} onSelect={onSelect}/>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
          <MiniCard person={person} onSelect={onSelect}/>
          <Kids list={prev.children} members={members} onSelect={onSelect}/>
        </div>
      )}

      {/* PAIR 2: [Person]——[CurrSpouse] */}
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

      {/* CurrSpouse hijos con otra pareja */}
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
