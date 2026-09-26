import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { AssetService, AssetFile } from './core/asset.service';
import { Quiz } from './core/quiz.model';
import { FileListItem } from './components/file-list/file-list.component';

/** Datos de la vista de detalle tras seleccionar un archivo. */
interface SelectedQuiz {
  file: AssetFile;
  quiz: Quiz;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'simexam-templates';

  /** Filas que consume `app-file-list`. */
  files: FileListItem[] = [];
  folderPath = 'src/assets';

  loadingList = false;
  /** Error al cargar el manifiesto, p. ej. si nunca se generó. */
  listError: string | null = null;
  manifestGeneratedAt: string | null = null;

  selected: SelectedQuiz | null = null;
  loadingQuiz = false;
  /** Archivo en curso de lectura, para nombrar el aviso de carga. */
  loadingFile: AssetFile | null = null;
  quizError: string | null = null;

  /**
   * Los archivos del manifiesto indexados por `path`. Permite resolver el
   * `AssetFile` real (con su `url`) a partir del item de la tabla sin
   * meterle datos de red a un componente presentacional.
   */
  private index = new Map<string, AssetFile>();

  constructor(private readonly assets: AssetService) {}

  ngOnInit(): void {
    this.reload();
  }

  /** Vuelve a pedir el manifiesto. `bustCache` fuerza a saltarse la caché. */
  reload(bustCache = false): void {
    this.loadingList = true;
    this.listError = null;
    this.clearSelection();

    this.assets.loadManifest(bustCache).subscribe({
      next: (manifest) => {
        this.index = new Map(manifest.files.map((file) => [file.path, file]));
        this.files = manifest.files.map<FileListItem>((file) => ({
          name: file.name,
          path: file.path,
          isDirectory: false,
          size: file.size,
          modified: file.modified,
          isEmpty: file.isEmpty
        }));
        this.folderPath = `src/assets (${manifest.count} archivos)`;
        this.manifestGeneratedAt = manifest.generatedAt;
        this.loadingList = false;
      },
      error: (err: HttpErrorResponse) => {
        this.files = [];
        this.listError =
          err.status === 0
            ? 'No se pudo cargar src/assets/asset-manifest.json. Ejecuta "npm run manifest".'
            : `Error ${err.status} al cargar el manifiesto de archivos.`;
        this.loadingList = false;
      }
    });
  }

  /** El botón «Recargar» de la tabla sí quiere saltarse la caché. */
  onRefresh(): void {
    this.reload(true);
  }

  onFileSelected(item: FileListItem): void {
    this.clearSelection();

    const file = this.index.get(item.path ?? item.name);
    if (!file) {
      this.quizError = `No se encontró «${item.name}» en el manifiesto.`;
      return;
    }

    // Un archivo de 0 bytes no se puede parsear como JSON: avisar en vez de fallar.
    if (file.isEmpty) {
      this.quizError = `«${file.name}» está vacío (0 bytes). No contiene un quiz.`;
      return;
    }

    this.loadingQuiz = true;
    this.loadingFile = file;

    this.assets.loadJson<Quiz>(file).subscribe({
      next: (quiz) => {
        this.selected = { file, quiz };
        this.loadingQuiz = false;
        this.loadingFile = null;
      },
      error: (err: HttpErrorResponse) => {
        this.quizError = `No se pudo leer «${file.name}» desde ${file.url} (HTTP ${err.status}).`;
        this.loadingQuiz = false;
        this.loadingFile = null;
      }
    });
  }

  /** Ruta que el componente de listado exhaustivo (el server) resuelve. */
  openRawJson(file: AssetFile): void {
    window.open(file.url, '_blank', 'noopener')
  }

  get questionCount(): number {
    return this.selected?.quiz.answers.length ?? 0
  }

  get correctOptionCount(): number {
    return this.selected?.quiz.answers.filter((a) => a.options.some((o) => o.isCorrect)).length ?? 0
  }

  private clearSelection(): void {
    this.selected = null;
    this.quizError = null;
    this.loadingQuiz = false;
    this.loadingFile = null;
  }
}
