
/**
 * Genera `src/assets/asset-manifest.json`.
 *
 * Recorre `src/assets/resources`, obtiene los metadatos de cada archivo
 * y, para archivos JSON, extrae:
 * - tags
 * - questionsCount
 *
 * Se ejecuta mediante los hooks `prebuild` / `prestart` de package.json.
 */

import { readdir, stat, readFile, writeFile } from 'node:fs/promises'
import { join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUTPUT_NAME = 'asset-manifest.json'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const assetsDir = join(projectRoot, 'src', 'assets');
const resourcesDir = join(assetsDir, 'resources');
const manifestFile = join(assetsDir, OUTPUT_NAME)

const pad = (n) => String(n).padStart(2, '0')

/**
 * YYYY-MM-DD HH:mm en hora local.
 */
const formatDate = (date) =>
  [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') +
  ' ' +
  [pad(date.getHours()), pad(date.getMinutes())].join(':')

/**
 * Convierte una ruta relativa en una URL con separadores POSIX.
 */
const toUrl = (posixPath) =>
  `assets/${posixPath.split('/').map(encodeURIComponent).join('/')}`

/**
 * Obtiene los metadatos internos de un archivo JSON.
 */
async function getJsonMetadata(filePath) {
  try {
    const content = await readFile(filePath, 'utf8')

    if (!content.trim()) {
      return {
        tags: [],
        questionsCount: 0
      }
    }

    const json = JSON.parse(content)

    return {
      tags: Array.isArray(json.tags) ? json.tags : [],
      questionsCount: Array.isArray(json.questions)
        ? json.questions.length
        : 0
    }
  } catch (error) {
    console.warn(
      `[manifest] No se pudo leer el JSON: ${filePath}`,
      error.message
    )

    return {
      tags: [],
      questionsCount: 0
    }
  }
}

/**
 * Recorre recursivamente una carpeta y obtiene los archivos.
 */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    // Excluir el manifiesto y archivos ocultos.
    if (entry.name === OUTPUT_NAME || entry.name.startsWith('.')) continue

    const full = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
      continue
    }

    if (!entry.isFile()) continue

    const info = await stat(full)

    const posixPath = relative(assetsDir, full)
      .split(sep)
      .join(posix.sep)

    const pathSegments = posixPath.split('/')
    const type = pathSegments[1] ?? ''

    // Metadatos generales.
    const fileData = {
      name: entry.name,
      path: posixPath,
      type,
      url: toUrl(posixPath),
      size: info.size,
      modified: formatDate(info.mtime)
    }

    // Extraer información adicional de los JSON.
    if (entry.name.toLowerCase().endsWith('.json')) {
      const metadata = await getJsonMetadata(full)

      fileData.tags = metadata.tags
      fileData.questionsCount = metadata.questionsCount
    }

    // Determinar si el archivo está vacío.
    fileData.isEmpty = info.size === 0

    files.push(fileData)
  }

  return files
}

// Generar listado ordenado.
const files = (await walk(resourcesDir)).sort((a, b) =>
  a.path.localeCompare(b.path, 'es')
)

// Construir manifiesto.
const manifest = {
  generatedAt: new Date().toISOString(),
  baseUrl: 'assets',
  count: files.length,
  files
}

// Escribir manifiesto.
await writeFile(
  manifestFile,
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8'
)

// Resumen.
const empty = files.filter((file) => file.isEmpty).length
const summary = empty ? `, ${empty} vacio(s)` : ''

console.log(
  `[manifest] ${files.length} archivo(s) -> src/assets/${OUTPUT_NAME}${summary}`
)
