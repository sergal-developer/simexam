import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'

/** Dato de entrada: un archivo o carpeta del disco. */
export interface FileListItem {
  name: string
  isDirectory: boolean
  size: number
  /** Fecha de modificación ya formateada, p. ej. '2026-09-24 09:03'. */
  modified: string
  /**
   * Ruta relativa a la raíz de assets, p. ej. `quiz/ingles-a1.json`.
   * Opcional: si falta se usa `name` como identidad de la fila.
   */
  path?: string
  /**
   * `true` si el archivo tiene 0 bytes. Opcional para no romper consumidores
   * que no lo provean; la tabla lo muestra con una insignia «vacío».
   */
  isEmpty?: boolean
}

export type FileSortKey = 'name' | 'ext' | 'size' | 'modified'
export type SortDirection = 'asc' | 'desc'

/** Fila precalculada que consume la plantilla. */
interface FileRow {
  file: FileListItem
  ext: string
  sizeLabel: string
  icon: string
  isSelected: boolean
}

interface ColumnDef {
  key: FileSortKey
  label: string
  class?: string
}

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileListComponent {
  // ============================== Inputs ==============================
  /** Lista de archivos y carpetas a mostrar. */
  @Input() files: FileListItem[] = []

  /** Ruta mostrada en el pie de la tabla. */
  @Input() folderPath = ''

  @Input() searchPlaceholder = 'Filtrar por nombre o extensión...'

  // ============================= Outputs =============================
  /** Se emite cuando el usuario pulsa «Recargar». */
  @Output() refresh = new EventEmitter<void>()

  /** Se emite al hacer clic en una fila. */
  @Output() fileSelected = new EventEmitter<FileListItem>()

  /** Se emite al hacer clic en la cabecera de una columna. */
  @Output() sortChanged = new EventEmitter<{ key: FileSortKey; direction: SortDirection }>()

  // ============================== Estado =============================
  sortKey: FileSortKey = 'name'
  sortDirection: SortDirection = 'asc'
  filter = ''
  selectedName: string | null = null

  readonly columns: ReadonlyArray<ColumnDef> = [
    { key: 'name', label: 'Nombre' },
    { key: 'ext', label: 'Tipo', class: 'col-type' },
    { key: 'size', label: 'Tamaño', class: 'col-size' },
    { key: 'modified', label: 'Modificado', class: 'col-date' }
  ]

  // ============================= Derivados ============================
  /** Filas filtradas, ordenadas y precalculadas para la plantilla. */
  get rows(): FileRow[] {
    const term = this.filter.trim().toLowerCase()
    const list = term ? this.files.filter((file) => this.matches(file, term)) : this.files.slice()

    return list
      .sort((a, b) => this.compare(a, b))
      .map((file) => ({
        file,
        ext: this.extOf(file),
        sizeLabel: this.formatSize(file.size),
        icon: this.iconOf(file),
        isSelected: this.selectedName === file.name
      }))
  }

  get fileCount(): number {
    return this.files.filter((file) => !file.isDirectory).length
  }

  get totalSizeLabel(): string {
    const total = this.files.reduce((acc, file) => acc + (file.isDirectory ? 0 : file.size), 0)
    return this.formatSize(total)
  }

  // ============================== Acciones ===========================
  sortBy(key: FileSortKey): void {
    if (this.sortKey === key) {
      this.toggleSortDirection()
      return
    }
    this.sortKey = key
    this.sortDirection = 'asc'
    this.emitSort()
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    this.emitSort()
  }

  onSearch(event: Event): void {
    this.filter = (event.target as HTMLInputElement).value
    this.selectedName = null
  }

  clearSearch(): void {
    this.filter = ''
    this.selectedName = null
  }

  selectRow(row: FileRow): void {
    this.selectedName = row.file.name
    this.fileSelected.emit(row.file)
  }

  trackByName(_index: number, row: FileRow): string {
    return row.file.name
  }

  ariaSort(key: FileSortKey): 'ascending' | 'descending' | null {
    if (this.sortKey !== key) return null
    return this.sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  // ============================== Internos ===========================
  /** Términos que, escritos en el buscador, traen los archivos vacíos. */
  private static readonly EMPTY_TOKENS: ReadonlyArray<string> = ['vacío', 'vacio', 'empty', '0']

  private matches(file: FileListItem, term: string): boolean {
    return (
      file.name.toLowerCase().includes(term) ||
      this.extOf(file).toLowerCase().includes(term) ||
      (!!file.isEmpty && FileListComponent.EMPTY_TOKENS.includes(term))
    )
  }

  private emitSort(): void {
    this.sortChanged.emit({ key: this.sortKey, direction: this.sortDirection })
  }

  private compare(a: FileListItem, b: FileListItem): number {
    // Las carpetas siempre primero
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1

    let result: number
    switch (this.sortKey) {
      case 'size':
        result = a.size - b.size
        break
      case 'modified':
        result = String(a.modified).localeCompare(String(b.modified))
        break
      case 'ext':
        result = this.extOf(a).localeCompare(this.extOf(b), 'es')
        break
      default:
        result = a.name.localeCompare(b.name, 'es', { numeric: true })
    }

    return this.sortDirection === 'asc' ? result : -result
  }

  private extOf(file: FileListItem): string {
    if (file.isDirectory) return '—'
    const parts = file.name.split('.')
    return parts.length > 1 ? parts.pop()!.toUpperCase() : 'sin ext.'
  }

  private iconOf(file: FileListItem): string {
    if (file.isDirectory) return 'folder'
    return file.isEmpty ? 'draft' : 'insert_drive_file'
  }

  private formatSize(bytes: number): string {
    if (!bytes) return '—'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / Math.pow(1024, i)
    return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
  }
}
