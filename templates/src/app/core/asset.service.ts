import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

/** Un archivo registrado en `assets/asset-manifest.json`. */
export interface AssetFile {
  name: string
  /** Ruta relativa a `src/assets`, p. ej. `quiz/ingles-a1.json`. */
  path: string
  /** Ruta servida por el dev server, con los segmentos escapados. */
  url: string
  size: number
  /** Fecha de modificación ya formateada: '2026-09-24 09:03'. */
  modified: string
  /** `true` si el archivo tiene 0 bytes y no se puede leer como JSON. */
  isEmpty: boolean
}

export interface AssetManifest {
  generatedAt: string
  baseUrl: string
  count: number
  files: AssetFile[]
}

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly manifestUrl = 'assets/asset-manifest.json'

  constructor(private readonly http: HttpClient) {}

  /**
   * Descarga el manifiesto generado en build.
   *
   * @param bustCache agrega un parámetro aleatorio para saltar la caché del
   * navegador; útil tras regenerar el manifiesto con archivos nuevos.
   */
  loadManifest(bustCache = false): Observable<AssetManifest> {
    const url = bustCache ? `${this.manifestUrl}?t=${Date.now()}` : this.manifestUrl
    return this.http.get<AssetManifest>(url)
  }

  /** Lee y parsea uno de los archivos del manifiesto. */
  loadJson<T>(file: AssetFile): Observable<T> {
    return this.http.get<T>(file.url)
  }
}
