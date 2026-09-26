import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { AttemptEntity, LogEntity, ProfileEntity, QuizEntity, SettingsEntity, ThemeProps } from '../data/entities/entities';
import { Utils } from '../data/utils/utils';
import { DBLocal } from './storage/db-storage';
import { FileStorage } from './storage/file-storage';

@Injectable()
export class CommonServices {
  private utils = new Utils();
  private localDbName = 'simexamapp';
  private dbSettings = 'settings';
  private dbProfiles = 'profiles';
  private dbQuizs = 'quiz';
  private dbAttempts = 'attempts';
  private dbLogs = 'logs';

  private fileStorage = new FileStorage();
  private fileSettings = 'settings.json';
  private fileProfiles = 'profile.json';
  private fileQuizs = 'templateQuiz.json';
  private fileAttempts = 'attempts.json';
  private fileLogs = 'logs.json'; 
  private fileObject = { data: [] };

  constructor(private _router: Router) {
    this.dbSettings = this.fileSettings;
    this.dbProfiles = this.fileProfiles;
    this.dbQuizs = this.fileQuizs;
    this.dbAttempts = this.fileAttempts;
    this.dbLogs = this.fileLogs; 
  }

  //#region PUBLIC METHODS

  async checkFiles() {
    const settings = await this.fileStorage.checkFile(this.fileSettings);
    if (!settings) {
      this.fileStorage.saveFile(this.fileSettings, this.fileObject);
    }
    const profile = await this.fileStorage.checkFile(this.fileProfiles);
    if (!profile) {
      this.fileStorage.saveFile(this.fileProfiles, this.fileObject);
    }
    const quiz = await this.fileStorage.checkFile(this.fileQuizs);
    if (!quiz) {
      this.fileStorage.saveFile(this.fileQuizs, this.fileObject);
    }
    const attempts = await this.fileStorage.checkFile(this.fileAttempts);
    if (!attempts) {
      this.fileStorage.saveFile(this.fileAttempts, this.fileObject);
    }

  }

  async clearDB() {
    await this.fileStorage.deleteFile(this.fileSettings);
    await this.fileStorage.deleteFile(this.fileProfiles);
    await this.fileStorage.deleteFile(this.fileQuizs);
    await this.fileStorage.deleteFile(this.fileAttempts);
  }

  //#region SETTINGS
  getAllSettings(): Array<SettingsEntity> { return this.actionGetAll(this.dbSettings); }
  searchSetting(id: string, idfield = 'id'): SettingsEntity { return this.actionSearch(this.dbSettings, id, idfield); }
  filterSettings(id: string, idfield = 'id'): Array<SettingsEntity> { return this.actionFilter(this.dbSettings, id, idfield); }
  saveSetting(data: SettingsEntity) { return this.actionPost(this.dbSettings, data); }
  updateSetting(id: string, data: SettingsEntity, idfield = 'id') { return this.actionPut(this.dbSettings, id, data, idfield); }
  deleteSetting(id: string, idfield = 'id') { return this.actionDelete(this.dbSettings, id, idfield); }
  async getActiveSettings(): Promise<SettingsEntity> {
    const data: any = await this.getAllSettings();
    return data ? data[0] : null;
  }
  //#endregion SETTINGS

  //#region PROFILES
  getAllProfiles(): Array<ProfileEntity> { return this.actionGetAll(this.dbProfiles); }
  searchProfile(id: string, idfield = 'id'): ProfileEntity { return this.actionSearch(this.dbProfiles, id, idfield); }
  filterProfiles(id: string, idfield = 'id'): Array<ProfileEntity> { return this.actionFilter(this.dbProfiles, id, idfield); }
  saveProfile(data: ProfileEntity) { return this.actionPost(this.dbProfiles, data); }
  updateProfile(id: string, data: ProfileEntity, idfield = 'id') { return this.actionPut(this.dbProfiles, id, data, idfield); }
  deleteProfile(id: string, idfield = 'id') { return this.actionDelete(this.dbProfiles, id, idfield); }
  async getActiveProfile(): Promise<ProfileEntity> {
    const data: any = await this.getAllProfiles();
    return data ? data[0] : null;
  }
  //#endregion PROFILES

  //#region EXAMS
  getAllQuizs(): Array<QuizEntity> { return this.actionGetAll(this.dbQuizs); }
  searchQuiz(id: string, idfield = 'id'): QuizEntity { return this.actionSearch(this.dbQuizs, id, idfield); }
  filterQuizs(id: string, idfield = 'id'): Array<QuizEntity> { return this.actionFilter(this.dbQuizs, id, idfield); }
  saveQuiz(data: any) { return this.actionPost(this.dbQuizs, data); }
  updateQuiz(id: string, data: any, idfield = 'id') { return this.actionPut(this.dbQuizs, id, data, idfield); }
  deleteQuiz(id: string, idfield = 'id') { return this.actionDelete(this.dbQuizs, id, idfield); }
  //#endregion EXAMS

  //#region EXAMS_ATTEMPTS
  getAllAttempts(): Array<AttemptEntity> { return this.actionGetAll(this.dbAttempts); }
  searchAttempt(id: string, idfield = 'id'): AttemptEntity { return this.actionSearch(this.dbAttempts, id, idfield); }
  filterAttempts(id: string, idfield = 'id'): Array<AttemptEntity> { return this.actionFilter(this.dbAttempts, id, idfield); }
  saveAttempt(data: any) { return this.actionPost(this.dbAttempts, data); }
  updateAttempt(id: string, data: any, idfield = 'id') { return this.actionPut(this.dbAttempts, id, data, idfield); }
  deleteAttempt(id: string, idfield = 'id') { return this.actionDelete(this.dbAttempts, id, idfield); }
  //#endregion EXAMS_ATTEMPTS

    //#region LOGS
  getAllLogs(): Array<LogEntity> { return this.actionGetAll(this.dbLogs); }
  searchLog(id: string, idfield = 'id'): LogEntity { return this.actionSearch(this.dbLogs, id, idfield); }
  filterLogs(id: string, idfield = 'id'): Array<LogEntity> { return this.actionFilter(this.dbLogs, id, idfield); }
  saveLog(data: string, type = 'log') { 
    const log: LogEntity = { 
      date: new Date().getTime(),
      id: uuidv4(),
      content: data,
      type: type
    }
    return this.actionPost(this.dbLogs, log); }
  updateLog(id: string, data: any, idfield = 'id') { return this.actionPut(this.dbLogs, id, data, idfield); }
  deleteLog(id: string, idfield = 'id') { return this.actionDelete(this.dbLogs, id, idfield); }
  //#endregion LOGS

  //#region NAVIGATION
  navigate(section: string, action?: string, id?: string, props?: any ) {
    let params = [];
    props = props || {};
    props.action = action;
    props.id = id || null;

    if(props) {
      const keys = Object.keys(props);
      keys.map((key) => {
        if(props[key]) {
          params.push(`${key}=${props[key]}`);
        }
      })
    }

    if (!props.action) {
      this._router.navigateByUrl(`/${section}`);
    } else {
      let paramsUrl = '';
      params.map((param, index) => { 
        paramsUrl = index == 0 ?  `?${param}` : `${paramsUrl}&${param}`;
      });
      this._router.navigateByUrl(`/${section}${paramsUrl}`);
    }
  }
  //#endregion NAVIGATION

  //#endregion PUBLIC METHODS

  //#region GENERIC
  private promiseMock(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(data);
      }, 200);
    });
  }


  private actionGetAllOld(tableName: string): any {
    const db = new DBLocal(this.localDbName);
    const response = db.get(tableName);
    return this.promiseMock(response);
  }

  private actionSearchOld(tableName: string, id: any, idfield = 'id'): any {
    const db = new DBLocal(this.localDbName);
    const response = db.search(tableName, id, idfield);
    return this.promiseMock(response);
  }

  private actionFilterOld(tableName: string, id: any, idfield = 'id'): any {
    const db = new DBLocal(this.localDbName);
    const response = db.filter(tableName, id, idfield);
    return this.promiseMock(response);
  }

  private actionPostOld(tableName: string, data: any): any {
    data.id = data.id ?? uuidv4();
    const db = new DBLocal(this.localDbName);
    const response = db.save(tableName, data);
    return this.promiseMock(response);
  }

  private actionPutOld(tableName: string, id: any, data: any, idfield = 'id'): any {
    const db = new DBLocal(this.localDbName);
    const response = db.update(tableName, id, data, idfield);
    return this.promiseMock(response);
  }

  private actionDeleteOld(tableName: string, id: any, idfield = 'id'): any {
    const db = new DBLocal(this.localDbName);
    const response = db.delete(tableName, id, idfield);
    return this.promiseMock(response);
  }


  private actionGetAll(fileName: string): any {
    return new Promise(async (resolve) => {
      try {
        const data = await this.fileStorage.readFile(fileName);
        if (data) {
          resolve(data.data.length ? data.data : null);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.warn(error)
        resolve(null);
      }
    });
  }

  private actionSearch(fileName: string, id: any, idfield = 'id'): any {
    return new Promise(async (resolve) => {
      try {
        const data = await this.actionGetAll(fileName);
        if (data) {
          const search = this.fileStorage.search(data, id, idfield);
          resolve(search);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.warn(error)
        resolve(null);
      }
    });
  }

  private actionFilter(fileName: string, id: any, idfield = 'id'): any {
    return new Promise(async (resolve) => {
      try {
        const data = await this.actionGetAll(fileName);
        if (data) {
          const search = this.fileStorage.filter(data, id, idfield);
          resolve(search);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.warn(error)
        resolve(null);
      }
    });
  }

  private actionPost(fileName: string, data: any): any {
    data.id = data.id ?? uuidv4();
    return new Promise(async (resolve) => {
      try {
        const db = await this.actionGetAll(fileName);
        const fileObject = JSON.parse(JSON.stringify(this.fileObject));
        if (db) { fileObject.data = db; }
        fileObject.data.push(data);
        await this.fileStorage.saveFile(fileName, fileObject);
        resolve(data);

      } catch (error) {
        console.warn(error)
        resolve(null);
      }
    });
  }

  private actionPut(fileName: string, id: any, data: any, idfield = 'id'): any {
    return new Promise(async (resolve) => {
      try {
        const db = await this.actionGetAll(fileName);
        const fileObject = JSON.parse(JSON.stringify(this.fileObject));
        if (db) { fileObject.data = db; }
        fileObject.data = this.fileStorage.update(fileObject.data, id, data, idfield);
        await this.fileStorage.saveFile(fileName, fileObject);
        resolve(data);

      } catch (error) {
        console.warn(error)
        resolve(null);
      }
    });
  }

  private actionDelete(fileName: string, id: any, idfield = 'id'): any {
    return new Promise(async (resolve) => {
      try {
        const db = await this.actionGetAll(fileName);
        const fileObject = JSON.parse(JSON.stringify(this.fileObject));
        if (db) { fileObject.data = db; }
        fileObject.data = this.fileStorage.delete(db, id, idfield);
        await this.fileStorage.saveFile(fileName, fileObject);
        resolve(true);
      } catch (error) {
        console.warn(error)
        resolve(null);
      }
    });
  }
  //#endregion GENERIC

  async initializData() {
    const setting: SettingsEntity = {
      language: 'es',
      permissions: {
        create: true,
        delete: false,
        duplicate: false,
        edit: true,
        ai: true
      },
      availableLanguages: [
        { name: 'Español', value: 'es' },
        { name: 'English', value: 'en' }
      ],
      theme: 'dark',
      themeProps: {
        light: this.defaultThemeLight,
        dark: this.defaultThemeDark
      },
      premium: false
    }
    return await this.saveSetting(setting);
  }

  defaultThemeLight: ThemeProps = {
    appBackground: '#bebebe',
    appColor: '#2d2d2d',
    appFontSize: '16px',
    textFontSize: '16px',
    primary: '#174FA1',
    primaryBackground: '#174FA1',
    primaryBackgroundHover: '#346ec5',
    primaryColor: '#ffffff',
    secondary: '#B30ECF',
    secondaryBackground: '#d47ce3',
    secondaryBackgroundHover: '#be29d8',
    secondaryBackgroundAlterHover: '#bdbdbd',
    secondaryColor: '#000000',
    accent: '#826713',
    accentBackground: '#B30ECF',
    accentBackgroundHover: '#be29d8',
    accentColor: '#444444',
    scrollColor: '#919191',
    scrollBackground: '#940d82',
    formErrorColor: '#a70019',
    formBackground: 'rgba(222, 222, 222, 0.7)',
    formBackgroundSolid: '#494949',
    notificationColor: '#d0d0d0',
    notificationColorContrast: '#000000',
    notificationSuccess: '#8e9f0f',
    notificationWarning: '#edc464',
    notificationError: '#c12323',
    notificationInfo: '#a6cce3',
    gradeBackgroundPassed: '#E1ECE4',
    gradeColorPassed: '#074b07',
    gradeBackgroundFailed: '#FFE5E7',
    gradeColorFailed: '#620e15',
    gradeBackgroundBarely: '#F6EDC8',
    gradeColorBarely: '#453a0b',
    gradePanelPassed: 'rgba(69, 83, 65, 0.5)',
    gradePanelFailed: 'rgba(204, 166, 166, 0.5)',
    gradePanelBarely: 'rgba(89, 89, 20, 0.5)',
    pillBackground: '#d4d4d4',
    pillColor: '#9b9b9b',
    rootHeroBackground: '#2b2b2b',
    timerBarBackground: '#81b181',
    timerBarContainerBackground: 'rgb(200, 200, 200)',
    statusBackground: '#9c9898',
    answerBorderColor: '#919191',
    answerSelectedColor: '#3a3a3a',
    answerSelectedBackground: '#a9c8e7',
    answerCorrectColor: '#ffffff',
    answerCorrectColorText: '#06700b',
    answerCorrectBorderColor: '#b8ded4',
    answerCorrectBackground: '#3e8246',
    answerIncorrectColor: '#e5acac',
    answerIncorrectBackground: '#630f2b',
    answerIncorrectBorderColor: '#c34c74',
    grayBackdropBackground: 'rgba(225, 225, 225, 0.4)',
    borderColorTransparent: 'rgba(0, 0, 0, 0.5)',
    matLabelBackground: 'rgba(238, 238, 238, 0.7)',
    matLabelContrastBackground: 'rgba(76, 76, 76, 0.7)',
    itemOptionBorder: 'rgba(64, 64, 64, 0.5)',
    stadisticBackground: 'rgba(193, 191, 191, 0.5)'
  };

  defaultThemeDark: ThemeProps = {
    appBackground: '#000000',
    appColor: '#d0d0d0',
    appFontSize: '16px',
    textFontSize: '16px',
    primary: '#174FA1',
    primaryBackground: '#174FA1',
    primaryBackgroundHover: '#346ec5',
    primaryColor: '#FFFCFF',
    secondary: '#B30ECF',
    secondaryBackground: '#B30ECF',
    secondaryBackgroundHover: '#be29d8',
    secondaryBackgroundAlterHover: '#251725',
    secondaryColor: '#e4e4e4',
    accent: '#FFD477',
    accentBackground: '#FFD477',
    accentBackgroundHover: '#d1aa56',
    accentColor: '#444444',
    scrollColor: '#919191',
    scrollBackground: '#940d82',
    formErrorColor: '#f08d9c',
    formBackground: 'rgba(33, 33, 33, 0.7)',
    formBackgroundSolid: '#494949',
    notificationColor: '#d0d0d0',
    notificationColorContrast: '#000000',
    notificationSuccess: '#8e9f0f',
    notificationWarning: '#edc464',
    notificationError: '#c12323',
    notificationInfo: '#a6cce3',
    gradeBackgroundPassed: '#E1ECE4',
    gradeColorPassed: '#074b07',
    gradeBackgroundFailed: '#FFE5E7',
    gradeColorFailed: '#620e15',
    gradeBackgroundBarely: '#F6EDC8',
    gradeColorBarely: '#453a0b',
    gradePanelPassed: 'rgba(69, 83, 65, 0.5)',
    gradePanelFailed: 'rgba(43, 11, 17, 0.5)',
    gradePanelBarely: 'rgba(89, 89, 20, 0.5)',
    pillBackground: '#3d3d3d',
    pillColor: '#585858',
    rootHeroBackground: '#2b2b2b',
    timerBarBackground: '#0c770c',
    timerBarContainerBackground: 'rgb(200, 200, 200)',
    statusBackground: '#323232',
    answerBorderColor: '#919191',
    answerSelectedColor: '#ebebeb',
    answerSelectedBackground: '#4287cf',
    answerCorrectColor: '#ffffff',
    answerCorrectColorText: '#06700b',
    answerCorrectBorderColor: '#b8ded4',
    answerCorrectBackground: '#2E5248',
    answerIncorrectColor: '#e5acac',
    answerIncorrectBackground: '#630f2b',
    answerIncorrectBorderColor: '#c34c74',
    grayBackdropBackground: 'rgba(50, 50, 50, 0.7)',
    borderColorTransparent: 'rgba(0, 0, 0, 0.5)',
    matLabelBackground: 'rgba(61, 61, 61, 0.7)',
    matLabelContrastBackground: 'rgba(76, 76, 76, 0.7)',
    itemOptionBorder: 'rgba(64, 64, 64, 0.5)',
    stadisticBackground: 'rgba(0, 0, 0, 0.5)'
  };

  //#region IA GEMINI
  async geminiGenerate(data: { topic: string, questions: number, options: number, language: string }) {
    const apiKey = atob('QUl6YVN5QktXS3RGX2ttMm81TWZDSzRFeGJ6OHVPOEpKWTBuZ2pZ');
    const model = 'gemini-2.0-flash';
    const prompt = `Genera un cuestionario sobre el tema "${data.topic}" de ${data.questions} preguntas en total, en cada pregunta debe tener de 2 a ${data.options} opciones de respuesta, donde solo debe de existir una respuesta correcta, el resultado debe de seguir el sigueinte patron json:
    { questions: [{ "question": "pregunta a realizar", 
     "options": [{ "id": "indice del array", "text": ""posible respuesta" }], 
     "correctAnswer": "numero del id de la opcion correcta"
    }]}, si en la primer respuesta no se generan todas las preguntas envia un json valido donde este la mayor cantidad solicitada, ademas que los valores deben de estar en el idioma ${ data.language }`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const postData = {
      contents:
        [{
          "parts": [{ "text": prompt }]
        }]
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al llamar a la API de Gemini:', errorData);
        throw new Error(`Error al comunicarse con la API de Gemini: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      // Procesar la respuesta
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        this.saveLog(data.candidates[0].content.parts[0].text);
        const generatedText = this.normalizeResponse(data.candidates[0].content.parts[0].text);

        try {
          const cuestionarioJSON = JSON.parse(generatedText);
          return cuestionarioJSON;
        } catch (error) {
          console.error('Error al parsear la respuesta de Gemini:', error);
          throw new Error('Error al procesar la respuesta de Gemini.');
        }
      } else {
        console.error('Respuesta inesperada de la API de Gemini:', data);
        // throw new Error('Respuesta inesperada de la API de Gemini.');
        return null;
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      // throw error;
      return null;
    }
  }

  normalizeResponse(code: string) {
    let codeResult = code.replace('```json', '');
    codeResult = codeResult.replace('```', '')
    codeResult = codeResult.replace('\n', '');
    return codeResult;
  }
  //#endregion IA GEMINI
}
