import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { LanguageDTO, PermissionsDTO, ThemeDTO, UserDTO } from '../data/entities/dtos';
import { take } from 'rxjs';

export interface GlobalAppState {
  user: UserDTO | null;
  language: string;
  theme: string;
  permissions: PermissionsDTO | null;
  languagesAvailable: LanguageDTO[] | null;
  themes: ThemeDTO[] | null;
  colors: Array<any>[] | null;

  _languages?: LanguageDTO[],
  _themes?: ThemeDTO[],
  _colors?: Array<any>
}

@Injectable({
  providedIn: 'root' // <-- Esto lo hace GLOBAL y Singleton para toda la app
})
export class AppStateStore extends ComponentStore<GlobalAppState> {

  constructor() {
    super({
      user: null,
      language: 'es',
      theme: 'light',
      permissions: null,
      languagesAvailable: [],
      themes: [],
      colors: [],
    });
  }

  // ================= 1. SELECTORS Only reads data
  readonly user$ = this.select(state => state.user);
  readonly language$ = this.select(state => state.language);
  readonly theme$ = this.select(state => state.theme);
  readonly permissions$ = this.select(state => state.permissions);
  readonly languagesAvailable$ = this.select(state => state.languagesAvailable);
  readonly themes$ = this.select(state => state.themes);
  readonly colors$ = this.select(state => state.colors);
  readonly all$ = this.select(state => state);


  // ================= 2. UPDATERS Modify states in async
  readonly setUser = this.updater((state, user: UserDTO) => ({
    ...state, user
  }));

  readonly setLanguage = this.updater((state, language: string) => ({
    ...state, language
  }));

  readonly setTheme = this.updater((state, theme: string) => ({
    ...state, theme
  }));

  readonly setPermissions = this.updater((state, permissions: PermissionsDTO) => ({
    ...state, permissions
  }));

  readonly setLanguagesAvailable = this.updater((state, languagesAvailable: LanguageDTO[]) => ({
    ...state, languagesAvailable, _languages: languagesAvailable
  }));

  readonly setThemes = this.updater((state, themes: ThemeDTO[]) => ({
    ...state, themes, _themes: themes
  }));

  readonly setColors = this.updater((state, colors: Array<any>[]) => ({
    ...state, colors, _colors: colors
  }));

  private _getUser() {
    return new Promise((resolve, reject) => {
      this.theme$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }
  private _getLanguage() {
    return new Promise((resolve, reject) => {
      this.language$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }
  private _getTheme() {
    return new Promise((resolve, reject) => {
      this.theme$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }
  private _getPermissions() {
    return new Promise((resolve, reject) => {
      this.permissions$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }
  private _getLanguagesAvailable() {
    return new Promise((resolve, reject) => {
      this.languagesAvailable$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }
  private _getThemes() {
    return new Promise((resolve, reject) => {
      this.themes$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }
  private _getColors() {
    return new Promise((resolve, reject) => {
      this.colors$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }
  private _getAll() {
    return new Promise((resolve, reject) => {
      this.all$.pipe(take(1)).subscribe(data => {
        resolve(data);
        return data;
      });
    })
  }

  public async getUser() {
    return await this._getUser();
  }
  public async getLanguage() {
    return await this._getLanguage();
  }
  public async getTheme() {
    return await this._getTheme();
  }
  public async getPermissions() {
    return await this._getPermissions();
  }
  public async getLanguagesAvailable() {
    return await this._getLanguagesAvailable();
  }
  public async getThemes() {
    return await this._getThemes();
  }
  public async getColors() {
    return await this._getColors();
  }
  public async getAll(): Promise<GlobalAppState> {
    const response = await this._getAll();
    return response ? response as GlobalAppState : null;
  }
}