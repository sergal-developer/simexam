import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { AttemptAnswerDTO, AttemptDTO, AttemptState, GradeState, LogDTO, QuizAnswerDTO, QuizAnswerOptionDTO, QuizDTO, SettingsDTO, ThemeDTO, ThemePropertiesDTO, UserDTO, getAttemptDTO, getAttemptDTOValid, getGrade, getPermissionsDTO, getQuizDTOValid, getSettingsDTO, normalizeAttemptDTO, normalizeQuizDTO } from '../data/entities/dtos';
import { DatabaseService } from './database/sql.database.service';

@Injectable()
export class CommonServices {

  availableLangs = [{ name: 'English', value: 'en' }, { name: 'Español', value: 'es' }];
  currentLang = '';
  constructor(private _router: Router, private _services: DatabaseService) { }

  //#region PUBLIC METHODS

  //#region SETTINGS
  async getAllSettings(): Promise<SettingsDTO[]> {
    return await this._services.getAllSettings();
  }

  async getCurrentSettings(): Promise<SettingsDTO> {
    const data = await this.getAllSettings();
    if (data && data.length) {
      return await this.getSettingCompleteById(data[0].settingId);
    }
    return null;
  }

  async getSettingCompleteById(settingId: number = 0): Promise<SettingsDTO> {
    return await this._services.getSettingCompleteById(this.verifyNumber(settingId));
  }

  async saveSettings(data: SettingsDTO): Promise<SettingsDTO> {
    return await this._services.postSetting(data);
  }

  async deleteSettingById(id: number): Promise<any> {
    return await this._services.deleteSetting(this.verifyNumber(id));
  }
  //#endregion SETTINGS

  //#region THEMES
  async getThemes(): Promise<ThemeDTO[]> {
    return await this._services.getAllThemes();
  }

  async saveTheme(data: ThemeDTO): Promise<ThemeDTO> {
    return await this._services.postTheme(data);
  }
  //#endregion THEMES

  //#region USERS
  async getAllUsers() {
    return await this._services.getAllUsers();
  }

  async getUserById(userId: number) {
    return await this._services.getUserById(this.verifyNumber(this.verifyNumber(userId)));
  }

  async getCurrentUser(): Promise<UserDTO> {
    return await this._services.getCurrentUser();
  }

  async saveUser(user: UserDTO) {
    return await this._services.saveUser(user);
  }

  async deleteUser(userId: number) {
    let response = await this._services.deleteUser(this.verifyNumber(this.verifyNumber(userId)));
    return response && response.length ? response[0] : null;
  }
  //#endregion USERS

  //#region QUIZ
  async getAllQuizs(): Promise<QuizDTO[]> {
    let response: QuizDTO[] = await this._services.getAllQuizzes();
    return response;
  }

  async getQuizCompleteById(quizId: number): Promise<QuizDTO> {
    let quiz = await this._services.getQuizCompleteById(this.verifyNumber(quizId));
    return quiz ? normalizeQuizDTO(quiz) : null;
  }

  async saveAllQuiz(quiz: QuizDTO): Promise<QuizDTO> {
    // quiz = quiz || this.mockquiz();
    let data = getQuizDTOValid(quiz);

    // Guardar el quiz primero
    const responseQuiz: QuizDTO = await this._services.saveQuiz(data.quiz);
    quiz.quizId = responseQuiz.quizId;

    // Preparar nuevamente los datos con el quizId
    data = getQuizDTOValid(quiz);

    await Promise.all(
      quiz.answers.map(async (answer: QuizAnswerDTO) => {
        const responseAnswer = await this._services.saveAnswer(answer);
        answer.answerId = responseAnswer.answerId;

        // Guardar todas las opciones y esperar a que terminen
        await Promise.all(answer.options.map(async (option: QuizAnswerOptionDTO) => {
          option.answerId = answer.answerId;
          const responseOption = await this._services.saveQuizAnswerOption(option);
          option.optionId = responseOption.optionId;
        }))
      })
    );

    return normalizeQuizDTO(quiz);
  }

  async duplicateQuiz(quizId: number): Promise<QuizDTO> {
    const _quiz = await this._services.getQuizCompleteById(this.verifyNumber(quizId));

    // clean _quiz to save as new record
    _quiz.quizId = null;
    _quiz.title = `${_quiz.title}`;
    _quiz.updatedDate = new Date().getTime();
    _quiz.answers.forEach(answer => {
      answer.answerId = null;
      answer.updatedDate = new Date().getTime();
      answer.options.forEach(option => {
        option.optionId = null;
        option.updatedDate = new Date().getTime();
      })
    });

    return await this.saveAllQuiz(_quiz);
  }

  async deleteQuiz(quizId: number): Promise<QuizDTO> {
    let response = await this._services.deleteQuiz(this.verifyNumber(quizId));
    return response && response.length ? response[0] : null;
  }

  prepareQueryAnswersOptions(quiz: QuizDTO): { quiz: QuizDTO, answers: QuizAnswerDTO[], answerOptions: QuizAnswerOptionDTO[] } {
    const _quiz: QuizDTO = {
      quizId: quiz.quizId == -1 ? null : quiz.quizId,
      uuid: quiz.uuid || uuidv4(),
      title: quiz.title,
      time: quiz.time || 0,
      creationDate: quiz.creationDate,
      updatedDate: quiz.updatedDate,
      startDate: quiz.startDate || 0,
    };

    const answers = [];
    const answerOptions = [];

    quiz.answers.map(answer => {
      answer.answerId = answer.answerId == -1 ? null : answer.answerId;
      answer.quizId = quiz.quizId;
      if (answer.title != '') {
        answers.push(answer);
      }

      answer.options.map(option => {
        option.answerId = answer.answerId;
        option.optionId = option.optionId == -1 ? null : option.optionId;
        option.isCorrect = option._selected == true;

        if (answer.title != '' && option.content != '') {
          answerOptions.push(option);
        }
      });
    })

    return { quiz: _quiz, answers: answers, answerOptions: answerOptions };
  }
  //#endregion QUIZ

  //#region QUIZ_ANSWERS
  async getAllAnswers(): Promise<QuizAnswerDTO[]> {
    let response: QuizAnswerDTO[] = await this._services.getAllAnswers();
    return response;
  }

  async getAnswersByQuiz(quizId: number): Promise<QuizAnswerDTO[]> {
    return await this._services.getAnswersByQuiz(this.verifyNumber(quizId));
  }

  async saveAnswer(data: QuizAnswerDTO): Promise<QuizAnswerDTO> {
    return await this._services.saveAnswer(data);
  }

  async deleteAnswer(id: number): Promise<QuizAnswerDTO> {
    let response = await this._services.deleteAnswer(this.verifyNumber(id));
    return response && response.length ? response[0] : null;
  }
  //#endregion QUIZ_ANSWERS

  //#region QUIZ_ANSWER_OPTIONS
  async getQuizAnswersOptionsByAnswerId(answerId: number): Promise<QuizAnswerOptionDTO[]> {
    return await this._services.getQuizAnswersOptionsByAnswerId(this.verifyNumber(answerId));
  }

  async saveQuizAnswerOption(data: QuizAnswerOptionDTO): Promise<QuizAnswerOptionDTO> {
    return await this._services.saveQuizAnswerOption(data);
  }

  async deleteQuizAnswerOption(id: number): Promise<QuizAnswerOptionDTO> {
    let response = await this._services.deleteQuizAnswerOption(this.verifyNumber(id));
    return response && response.length ? response[0] : null;
  }
  //#endregion QUIZ_ANSWER_OPTIONS

  //#region ATTEMPTS
  async getAllAttempts(): Promise<AttemptDTO[]> {
    return await this._services.getAllAttempts();
  }

  async getAttemptByQuizId(quizId: number): Promise<AttemptDTO[]> {
    const attempts = await this._services.getAttemptByQuizId(this.verifyNumber(quizId));
    attempts.map(att => {
      return normalizeAttemptDTO(att);
    });
    return attempts;
  }

  async getAttemptCompleteByAttemptId(attemptId: number): Promise<AttemptDTO> {
    const attempt = await this._services.getAttemptCompleteByAttemptId(this.verifyNumber(attemptId));
    return normalizeAttemptDTO(attempt);
  }

  async createAttempt(quizId: number): Promise<AttemptDTO> {
    const quiz = await this.getQuizCompleteById(this.verifyNumber(quizId));
    const _attempt = getAttemptDTO(this.verifyNumber(quizId), 1, quiz.title, quiz.answers);
    const attempt = await this.saveAllAttempt(_attempt);
    return normalizeAttemptDTO(attempt);
  }

  async saveAllAttempt(attempt: AttemptDTO): Promise<AttemptDTO> {
    let data = getAttemptDTOValid(attempt);
    attempt = data.attempt;

    // Guardar el attempt primero
    const responseQuiz: AttemptDTO = await this._services.saveAttempt(attempt);
    attempt.attemptId = responseQuiz.attemptId;

    // Preparar nuevamente los datos con el attemptId
    data = getAttemptDTOValid(attempt);
    attempt = data.attempt;

    await Promise.all(
      attempt.answers.map(async (answer: AttemptAnswerDTO) => {
        const responseAnswer = await this._services.saveAttemptAnswers(answer);
        answer.answerAttemptId = responseAnswer.answerAttemptId;
      })
    );

    attempt.answers = data.answers;
    data = getAttemptDTOValid(attempt);
    attempt = data.attempt;
    return normalizeAttemptDTO(attempt)
  }

  async evalueAttemptById(attemptId: number): Promise<AttemptDTO> {
    let attempt = await this.getAttemptCompleteByAttemptId(this.verifyNumber(attemptId));

    attempt.answers.map(ans => {
      const optCorrect = ans.options.find(opt => opt.isCorrect);
      ans.isCorrect = optCorrect ? ans.selectedOptionId == optCorrect.optionId : false;
      return ans;
    });

    const total = attempt.answers.length;
    const correctAnswers = attempt.answers.filter(ans => ans.isCorrect);

    attempt.score = (correctAnswers.length * 100) / total;
    attempt.state = AttemptState.completed;
    attempt.grade = getGrade(attempt);
    console.log('attempt: ', attempt);

    attempt = await this.saveAllAttempt(attempt);
    return normalizeAttemptDTO(attempt);
  }

  async deleteQuizAttempt(attemptId: number): Promise<AttemptDTO> {
    return await this._services.deleteQuizAttempt(this.verifyNumber(attemptId));
  }
  //#endregion ATTEMPTS

  //#region ANSWERS_ATTEMPTS
  async getAttemptAnswersByAttemptId(attemptId: number): Promise<AttemptAnswerDTO[]> {
    return await this._services.getAttemptAnswersByAttemptId(this.verifyNumber(attemptId));
  }

  async saveAttemptAnswers(data: AttemptAnswerDTO): Promise<AttemptAnswerDTO> {
    return await this._services.saveAttemptAnswers(data);
  }
  //#endregion ANSWERS_ATTEMPTS

  //#region LOGS
  async getAllLogs(): Promise<LogDTO[]> {
    return await this._services.getAllLogs();
  }

  async getLogById(id: number): Promise<LogDTO> {
    const response = await this._services.getLogById(this.verifyNumber(id));
    return response && response.length ? response[0] : null;
  }

  async postLog(data: LogDTO): Promise<LogDTO> {
    return await this._services.postLog(data);
  }

  async deleteLog(id: number): Promise<LogDTO[]> {
    return await this._services.deleteLog(this.verifyNumber(id));
  }
  //#endregion LOGS

  //#region NAVIGATION
  navigate(section: string, action?: string, id?: string, props?: any) {
    let params = [];
    props = props || {};
    props.action = action;
    props.id = id || null;

    if (props) {
      const keys = Object.keys(props);
      keys.map((key) => {
        if (props[key]) {
          params.push(`${key}=${props[key]}`);
        }
      })
    }

    if (!props.action) {
      this._router.navigateByUrl(`/${section}`);
    } else {
      let paramsUrl = '';
      params.map((param, index) => {
        paramsUrl = index == 0 ? `?${param}` : `${paramsUrl}&${param}`;
      });
      this._router.navigateByUrl(`/${section}${paramsUrl}`);
    }
  }
  //#endregion NAVIGATION

  //#endregion PUBLIC METHODS

  //#region DEFAULT_DATA

  verifyNumber(id: any): number {
    let num: number = null;
    if (id != null) {
      if (typeof id === 'string') {
        num = parseInt(id);
        console.warn(`El id {${id}} es de tipo cadena.`)
      } else {
        num = id;
      }
    }
    return num;
  }

  defaultThemeLight: ThemePropertiesDTO = {
    appBackground: '#bebebe',
    appBackgroundTransparent: '#bebebe50',
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
    formBackgroundTransparent: '#49494973',
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

  defaultThemeDark: ThemePropertiesDTO = {
    appBackground: '#000000',
    appBackgroundTransparent: '#00000050',
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
    formBackgroundTransparent: '#49494973',
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

  async getStructure() {
    return await this._services.getStructure();
  }

  async saveDefaultData(): Promise<SettingsDTO> {
    let settings = await this._services.getSettingCompleteById(0);

    if (!settings) {
      await this._services.postLanguage({ name: 'Español', value: 'es' });
      await this._services.postLanguage({ name: 'English', value: 'en' });
      await this._services.postTheme({ id: 'light', content: this.defaultThemeLight });
      await this._services.postTheme({ id: 'dark', content: this.defaultThemeDark });

      const permissions = {
        create: true,
        delete: false,
        duplicate: true,
        edit: true,
        ai: false
      };

      await this._services.postSetting({ settingId: 0, language: 'en', theme: 'dark', permissions: permissions });
      settings = await this._services.getSettingCompleteById(0);
    }
    return settings;
  }

  async setupDefaultData(existDatabaseStructure = false) {
    if (existDatabaseStructure) {
      const setting = await this.getCurrentSettings();
      if (setting) {
        const languages = [];
        setting._languages.map((lan) => {
          languages.push(lan.value);
        });
        return setting;
      }
    }

    return this.setDefaultSettings();
  }

  private setDefaultSettings(): SettingsDTO {
    const languages = []
    this.availableLangs.map((lan) => {
      languages.push(lan);
    });

    const setting = getSettingsDTO(this.availableLangs[0].value, 'dark', getPermissionsDTO(true, true, true, false, false));

    setting._languages = languages;
    setting._themes = [
      { id: 'light', content: this.defaultThemeLight },
      { id: 'dark', content: this.defaultThemeDark },
    ];
    setting._colors = [];

    return setting;
  }
  //#endregion DEFAULT_DATA

  //#region IA GEMINI
  async geminiGenerate(data: { topic: string, questions: number, options: number, language: string }) {
    const apiKey = atob('QUl6YVN5QktXS3RGX2ttMm81TWZDSzRFeGJ6OHVPOEpKWTBuZ2pZ');
    const model = 'gemini-2.0-flash';
    const prompt = `Genera un cuestionario sobre el tema "${data.topic}" de ${data.questions} preguntas en total, en cada pregunta debe tener de 2 a ${data.options} opciones de respuesta, donde solo debe de existir una respuesta correcta, el resultado debe de seguir el sigueinte patron json:
    { questions: [{ "question": "pregunta a realizar", 
     "options": [{ "id": "indice del array", "text": ""posible respuesta" }], 
     "correctAnswer": "numero del id de la opcion correcta"
    }]}, si en la primer respuesta no se generan todas las preguntas envia un json valido donde este la mayor cantidad solicitada, ademas que los valores deben de estar en el idioma ${data.language}`;

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
        // this.saveLog(data.candidates[0].content.parts[0].text);
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
