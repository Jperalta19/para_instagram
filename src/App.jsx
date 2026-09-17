import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import { ChevronDown, CircleHelp, FileArchive, FileUp, Instagram, LoaderCircle, RotateCcw, UserRoundX, Users, X } from 'lucide-react'

const GROUP_SIZE = 100

function usernameKey(username) {
  return username.trim().replace(/^@/, '').toLocaleLowerCase()
}

function normalizeRelations(data) {
  const relations = data?.relationships_following ?? data?.relationships_followers ?? (Array.isArray(data) ? data : [])
  return relations
    .map((relation) => {
      const item = relation?.string_list_data?.[0] ?? relation
      const username = item?.value ?? relation?.title
      return username ? { username, href: item?.href ?? '' } : null
    })
    .filter(Boolean)
    .filter((user, index, users) => users.findIndex((candidate) => candidate.username === user.username) === index)
}

async function readJsonEntry(zip, fileName) {
  const entry = zip.file(fileName)
  if (!entry) return []
  return normalizeRelations(JSON.parse(await entry.async('text')))
}

async function readInstagramZip(file) {
  const zip = await JSZip.loadAsync(file)
  const jsonFiles = Object.keys(zip.files).filter((name) => name.toLowerCase().endsWith('.json'))
  const followerFile = jsonFiles.find((name) => /followers(?:_\d+)?\.json$/i.test(name))
  const followingFile = jsonFiles.find((name) => /following\.json$/i.test(name))
  if (!followerFile && !followingFile) {
    throw new Error('No se encontraron followers_*.json ni following.json dentro del ZIP.')
  }
  return {
    followers: followerFile ? await readJsonEntry(zip, followerFile) : [],
    following: followingFile ? await readJsonEntry(zip, followingFile) : [],
    files: { followerFile, followingFile },
  }
}

function RelationPanel({ title, eyebrow, icon: Icon, users, accent }) {
  const [open, setOpen] = useState(true)
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(users.length / GROUP_SIZE))
  const visibleUsers = users.slice(page * GROUP_SIZE, (page + 1) * GROUP_SIZE)

  return (
    <section className={`relation-panel ${accent}`}>
      <button className="panel-heading" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="panel-icon"><Icon size={20} strokeWidth={1.8} /></span>
        <span className="panel-title-wrap">
          <span className="panel-eyebrow">{eyebrow}</span>
          <span className="panel-title">{title}</span>
        </span>
        <span className="panel-count">{users.length.toLocaleString('es-ES')}</span>
        <ChevronDown className={`panel-chevron ${open ? 'is-open' : ''}`} size={22} />
      </button>
      {open && (
        <div className="panel-body">
          {users.length === 0 ? (
            <div className="empty-panel">Este grupo no está disponible en el archivo cargado.</div>
          ) : (
            <>
              <div className="user-grid">
                {visibleUsers.map((user, index) => (
                  <a className="user-card" href={user.href || `https://instagram.com/${user.username}`} target="_blank" rel="noreferrer" key={`${user.username}-${index}`}>
                    <span className="user-number">{page * GROUP_SIZE + index + 1}</span>
                    <span className="user-name">@{user.username}</span>
                  </a>
                ))}
              </div>
              <div className="pagination-row">
                <span>Grupo {page + 1} de {totalPages}</span>
                <div className="pagination-buttons">
                  <button type="button" className="page-button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Anterior</button>
                  <button type="button" className="page-button page-button-dark" disabled={page === totalPages - 1} onClick={() => setPage((value) => value + 1)}>Siguiente</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function HelpModal({ onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="help-modal-header">
          <div>
            <p className="kicker">Guía rápida</p>
            <h2 id="help-title">Cómo usar Relations</h2>
          </div>
          <button type="button" className="modal-close" aria-label="Cerrar ayuda" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="help-content">
          <ol className="help-steps">
            <li>En Instagram, entra en <strong>Centro de cuentas → Tu información y permisos → Descargar tu información</strong>.</li>
            <li>En la opcion de informacion selecciona solo <strong>Seguidores y seguidos</strong> para que el archivo sea más ligero. No necesitas descargar mensajes, fotos, vídeos ni comentarios.</li>
            <li>Elige descargar en el dispositivo, selecciona el formato <strong>JSON</strong> y el intervalo <strong>Todo el tiempo</strong>.</li>
            <li>Cuando Instagram prepare el archivo, descarga el <strong>.zip</strong> y suéltalo en la pantalla inicial o selecciónalo desde tu dispositivo.</li>
          </ol>
          <div className="help-note">La app necesita las dos listas: usa “Siguiendo” para compararla con “Seguidores” y detectar quién no te sigue de vuelta. Todo se procesa localmente en tu navegador.</div>
          <div className="help-results">
            <span><strong>Seguidores</strong> Cuentas que te siguen</span>
            <span><strong>Siguiendo</strong> Cuentas que sigues</span>
            <span><strong>No te siguen</strong> Cuentas que sigues y no aparecen entre tus seguidores</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function App() {
  const inputRef = useRef(null)
  const [relations, setRelations] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const notFollowingBack = relations
    ? relations.following.filter((user) => !relations.followers.some((follower) => usernameKey(follower.username) === usernameKey(user.username)))
    : []

  async function handleFile(file) {
    if (!file) return
    setStatus('loading')
    setError('')
    try {
      const result = await readInstagramZip(file)
      setRelations(result)
      setFileName(file.name)
      setStatus('ready')
    } catch (fileError) {
      setRelations(null)
      setStatus('error')
      setError(fileError.message || 'No se pudo leer el archivo.')
    }
  }

  function reset() {
    setRelations(null)
    setFileName('')
    setError('')
    setStatus('idle')
    setShowHelp(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Instagram size={18} /></span>RELATIONS</div>
        <div className="topbar-actions">
          <button type="button" className="help-button" onClick={() => setShowHelp(true)}><CircleHelp size={15} /> Ayuda</button>
          {relations && (
            <button type="button" className="reset-button" onClick={reset}><RotateCcw size={15} /> Cargar otro</button>
          )}
        </div>
      </header>

      <div className="content-wrap">
        <div className="intro-grid">
          <div>
            <p className="kicker">Instagram data reader</p>
            <h1>Tu red,<br /><em>en orden.</em></h1>
          </div>
          <div className="intro-copy">
            <p>Explora tus conexiones de Instagram sin enviar tus datos a ningún servidor.</p>
            <span className="local-note"><span className="status-dot" /> Procesamiento local en tu navegador</span>
          </div>
        </div>

        {!relations && (
          <label className={`upload-zone ${status === 'error' ? 'upload-error' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]) }}>
            <input ref={inputRef} type="file" accept=".zip,application/zip" onChange={(event) => handleFile(event.target.files[0])} />
            {status === 'loading' ? <LoaderCircle className="spin" size={30} /> : <FileUp size={30} strokeWidth={1.5} />}
            <span className="upload-title">{status === 'loading' ? 'Leyendo archivo...' : 'Suelta tu archivo de Instagram aquí'}</span>
            <span className="upload-subtitle">o haz clic para buscar un archivo .zip</span>
            {error && <span className="error-message">{error}</span>}
          </label>
        )}

        {relations && (
          <>
            <div className="file-summary">
              <div className="file-summary-icon"><FileArchive size={22} /></div>
              <div><span className="file-label">Archivo cargado</span><strong>{fileName}</strong></div>
              <span className="summary-ready">Listo</span>
            </div>
            <div className="stats-row">
              <div><span>Seguidores</span><strong>{relations.followers.length.toLocaleString('es-ES')}</strong></div>
              <div><span>Siguiendo</span><strong>{relations.following.length.toLocaleString('es-ES')}</strong></div>
              <div><span>No te siguen</span><strong>{notFollowingBack.length.toLocaleString('es-ES')}</strong></div>
            </div>
            <div className="relations-stack">
              <RelationPanel title="Seguidores" eyebrow="People who follow you" icon={Users} users={relations.followers} accent="panel-coral" />
              <RelationPanel title="Siguiendo" eyebrow="People you follow" icon={Users} users={relations.following} accent="panel-teal" />
              <RelationPanel title="No te siguen de vuelta" eyebrow="You follow, they don't follow you" icon={UserRoundX} users={notFollowingBack} accent="panel-amber" />
            </div>
          </>
        )}

        {!relations && status === 'idle' && <p className="format-note">Compatible con la descarga de información de Instagram en formato JSON.</p>}
      </div>
      <footer><span>LOCAL TOOL</span><span>NO DATA LEAVES THIS DEVICE</span></footer>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </main>
  )
}

export default App