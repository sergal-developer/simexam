/**
 * Genera `src/assets/asset-manifest.json`.
 *
 * El navegador no puede enumerar una carpeta servida por HTTP, asi que el
 * listado de archivos se resuelve en tiempo de build: este script recorre
 * `src/assets`, escribe el manifiesto y la app lo consume por HTTP al arrancar.
 *
 * Se ejecuta solo via los hooks `prebuild` / `prestart` de package.json.
 */
import { readdir, stat, writeFile } from 'node:fs/promises'
import { join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUTPUT_NAME = 'asset-manifest.json'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const assetsDir = join(projectRoot, 'src', 'assets')
const manifestFile = join(assetsDir, OUTPUT_NAME)

const pad = (n) => String(n).padStart(2, '0')

/**
 * 'YYYY-MM-DD HH:mm' en hora local. El componente `file-list` ordena por
 * fecha con `localeCompare`, y este formato ya ordena lexicograficamente.
 */
const formatDate = (date) =>
  [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') +
  ' ' +
  [pad(date.getHours()), pad(date.getMinutes())].join(':')

/** Convierte una ruta de Windows en una URL con separadores POSIX. */
const toUrl = (posixPath) =>
  `assets/${posixPath.split('/').map(encodeURIComponent).join('/')}`

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    // Nunca incluir el propio manifiesto, ni artefactos del editor.
    if (entry.name === OUTPUT_NAME || entry.name.startsWith('.')) continue

    const full = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
      continue
    }
    if (!entry.isFile()) continue

    const info = await stat(full)
    const posixPath = relative(assetsDir, full).split(sep).join(posix.sep)

    files.push({
      name: entry.name,
      /** Ruta relativa a `src/assets`, p. ej. `quiz/ingles-a1.json`. */
      path: posixPath,
      /** Ruta servida por el dev server, con cada segmento escapado. */
      url: toUrl(posixPath),
      size: info.size,
      modified: formatDate(info.mtime),
      /** `true` si el archivo tiene 0 bytes: no se puede parsear como JSON. */
      isEmpty: info.size === 0
    })
  }

  return files
}

const files = (await walk(assetsDir)).sort((a, b) => a.path.localeCompare(b.path, 'es'))

const manifest = {
  generatedAt: new Date().toISOString(),
  baseUrl: 'assets',
  count: files.length,
  files
}

await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

const empty = files.filter((file) => file.isEmpty).length
const summary = empty ? `, ${empty} vacio(s)` : ''

console.log(`[manifest] ${files.length} archivo(s) -> src/assets/${OUTPUT_NAME}${summary}`)
