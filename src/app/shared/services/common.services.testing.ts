
import {
    QuizAnswerDTO,
    QuizAnswerOptionDTO,
    AttemptAnswerDTO,
    AttemptDTO,
    AttemptState,
    LanguageDTO,
    LogDTO,
    QuizDTO,
    SettingsDTO,
    ThemeDTO,
    UserDTO,
    getLogDTO,
    PermissionsDTO,
    getSettingsDTO,
    getPermissionsDTO,
    getUserDTO,
    getQuizDTO,
    getQuizAnswerOptionDTO,
    getQuizAnswerDTO,
    normalizeQuizDTO,
    getAttemptDTO
} from '../data/entities/dtos';
import { CommonServices } from './common.services';
import { v4 as uuidv4 } from 'uuid';


type Log = (message: string, data?: any) => void;

function createLogger(): Log {
    const calls: string[] = [];
    const log: Log = (message, data) => {
        const line = `${message}${data !== undefined ? ' -> ' + JSON.stringify(data) : ''}`;
        calls.push(line);
        if (data) {
            console.log('[T]', message, data);
        } else {
            console.log('[T]', line);
        }

        console.log('------------');
    };
    return log;
}

function toNumberId(value: any): number {
    return typeof value === 'number' ? value : Number(value ?? 0);
}

export class CommonServicesTesting {

    constructor(
        private commonServices: CommonServices
    ) { }

    private log: Log = createLogger();

    //#region SETTINGS
    async testSettings(): Promise<void> {

        const allSettings = await this.commonServices.getAllSettings();
        if (!allSettings.length) {
            await this.commonServices.saveDefaultData();
        }

        const currentSettings = await this.commonServices.getCurrentSettings();
        this.log('default settings', currentSettings);

        if (currentSettings && currentSettings.settingId == 0) {
            // si ya existe un default creado crea el test para uno nuevo;
            const newSettings: SettingsDTO = getSettingsDTO('es', 'dark', getPermissionsDTO(true, true, true, true, false));

            const saved = await this.commonServices.saveSettings(newSettings);
            this.log('new settings created', saved);
            this.log('new settingsID: ', saved.settingId);
            newSettings.settingId = saved.settingId;

            // update new settings 
            const updated = await this.commonServices.saveSettings({ ...newSettings, theme: 'light', language: 'en' });

            this.log('update a settingID: ', updated.settingId);
            this.log('update a setting values: ', updated);
        }

        const all = await this.commonServices.getAllSettings();
        this.log('Count all settings: ', all.length);
        this.log('all settings: ', all);

        if (all.length > 1) {
            await Promise.all(all.map(async (setting) => {
                if (setting.settingId != 0) {
                    const res = await this.commonServices.deleteSettingById(setting.settingId);
                    this.log('Remove dummy setting ', res);
                }
            }));
        }
    }
    //#endregion SETTINGS

    //#region THEMES
    async testThemes(): Promise<void> {
        const light = this.commonServices.defaultThemeLight;
        const dark = this.commonServices.defaultThemeDark;
        this.log('defaultThemeLight', light?.appBackground);
        this.log('defaultThemeDark', dark?.appBackground);

        const theme: ThemeDTO = { id: 'light', content: this.commonServices.defaultThemeLight as any };
        const saved = await this.commonServices.saveTheme(theme);
        this.log('saveTheme', saved);
        const themes = await this.commonServices.getThemes();
        this.log('getThemes', themes?.length);
    }
    //#endregion THEMES

    //#region USERS
    async testUsers(): Promise<void> {

        const currentUsers = await this.commonServices.getAllUsers();
        this.log('currentUsers', currentUsers);

        if (currentUsers && currentUsers.length) {
            // create dummy user 
            const dummyUser = getUserDTO('dummy user', 100, 'https://imagenpng.com/wp-content/uploads/2015/09/imagenes-png');
            console.log('dummyUser: ', dummyUser);
            this.log('saving dummy user', dummyUser);

            let dummyUserUpdated = await this.commonServices.saveUser(dummyUser);
            this.log('dummy User saved', dummyUserUpdated);

            // Update User

            dummyUserUpdated.age = 10;
            dummyUserUpdated.userName = 'Usuario editado dummy';
            dummyUserUpdated.avatarUrl = 'new url body';

            dummyUserUpdated = await this.commonServices.saveUser(dummyUserUpdated);
            this.log('dummy User updated', dummyUserUpdated);

            // check all users created 
            const allUsers = await this.commonServices.getAllUsers();
            this.log('Count all users: ', allUsers.length);
            this.log('all users: ', allUsers);

            if (allUsers.length > 1) {
                await Promise.all(allUsers.map(async (item) => {
                    if (item.userId != 1) {
                        const res = await this.commonServices.deleteUser(item.userId);
                        this.log('Remove dummy user ', res);
                    }
                }));
            }
        }

        const all = await this.commonServices.getAllUsers();
        this.log('getAllUsers', all?.length);

        const current = await this.commonServices.getCurrentUser();
        this.log('getCurrentUser', current);

    }
    //#endregion USERS

    //#region QUIZ

    private assignNewAnswers(answersCount = 3, optionsCount = 4): QuizAnswerDTO[] {
        const answers: QuizAnswerDTO[] = [];
        Array.from({ length: answersCount }).forEach((u, index) => {
            const _idx = index + 1;
            const answer = getQuizAnswerDTO(`¿pregunta #${_idx}?`);
            const options: QuizAnswerOptionDTO[] = [];
            Array.from({ length: optionsCount }).forEach((y, optionIndex) => {
                const _idxOption = optionIndex + 1;
                const option = getQuizAnswerOptionDTO(`option ${_idxOption}`, _idxOption);
                options.push(option)
            });
            const idxCorrect = Math.floor(Math.random() * options.length);
            options[idxCorrect].isCorrect = true;

            // enlazar opciones a las preguntas
            answer.options = options;
            answers.push(answer);
        });
        return answers;
    }

    private getRandomIndex(list: Array<any>): number {
        if (!list.length) {
            console.warn('La lista esta vacia');
            return null;
        };
        return Math.floor(Math.random() * list.length);
    }

    async wait(miliseconds = 1, func: Function) {
        const promise = new Promise((resolve, reject) => {
            const time = miliseconds;
            const timeLog = time / 1000;
            console.log(`Waiting... ${timeLog} sec.`)
            setTimeout(async () => {
                func(true);
                resolve(true);
            }, time);
        });

        await promise;
    }

    async testQuizes(): Promise<void> {
        const quizzes = await this.testQuizes_getAll();
        this.log('All Quiz count: ', quizzes.length);
        this.log('All Quiz: ', quizzes);

        // await Promise.all(quizzes.map(async (quiz) => {
        //     const quizDeleted = await this.testQuizes_deleteQuiz(quiz);
        //     this.log('QUIZ Deleted: ', quizDeleted);
        // }));

        const quiz = await this.testQuizes_createQuiz();
        this.log('QUIZ CREATED: ', quiz);

        const quizEdited = await this.testQuizes_editQuiz(quiz)
        this.log('QUIZ_EDITED: ', quizEdited);

        const quizAnswersOptions = await this.testQuizes_AnswersAndOptions(quizEdited);
        this.log('QUIZ, ANSWERS, OPTIONS: ', quizAnswersOptions);

        const quizDuplicated = await this.testQuizes_duplicateQuiz(quiz);
        this.log('QUIZ Origin, Duplicated ', quizDuplicated);

        const quizDeleted = await this.testQuizes_deleteQuiz(quizDuplicated.quiz);
        this.log('QUIZ ORIGINAL Deleted: ', quizDeleted);

        const quizDuplicatedDeleted = await this.testQuizes_deleteQuiz(quizDuplicated.duplicated);
        this.log('QUIZ DUPLICATED Deleted: ', quizDuplicatedDeleted);

        const quizzesU = await this.testQuizes_getAll();
        this.log('All Quiz: ', quizzesU);
    }

    private async testQuizes_getAll(): Promise<QuizDTO[]> {
        return await this.commonServices.getAllQuizs();
    }

    private async testQuizes_createQuiz(answers: number = 10, optionsByAnswer: number = 3): Promise<QuizDTO> {
        let quiz = getQuizDTO('dummy exam', 0);
        // Create answers and options 
        quiz.answers.push(...this.assignNewAnswers(answers, optionsByAnswer));
        quiz = normalizeQuizDTO(quiz);
        quiz = await this.commonServices.saveAllQuiz(quiz);
        return quiz;
    }

    private async testQuizes_editQuiz(quiz: QuizDTO): Promise<QuizDTO> {
        this.log('QUIZ ORIGINAL: ', quiz);

        let quizEdited = JSON.parse(JSON.stringify(quiz));
        quizEdited.title = `dummy exam #${quiz.quizId}`;
        quizEdited.answers.push(...this.assignNewAnswers(10, 4));
        quizEdited = await this.commonServices.saveAllQuiz(quizEdited);
        return quizEdited;
    }

    private async testQuizes_AnswersAndOptions(quiz: QuizDTO): Promise<{ quiz: QuizDTO, answers: QuizAnswerDTO[], options: QuizAnswerOptionDTO[] }> {
        this.log('QUIZ ORIGINAL: ', quiz);

        let _quiz: QuizDTO;
        let _quizAnswers: QuizAnswerDTO[];
        let _quizOptions: QuizAnswerOptionDTO[];

        // editar el titulo de todas las preguntas
        quiz.title = `nuevo examen editado`;
        quiz.answers = quiz.answers || [];
        quiz.answers.map((ans, idxAnswer) => {
            ans.title = `¿Pregunta #${idxAnswer} de quiz [${quiz.title}]?`;

            ans.options = ans.options || [];
            ans.options.map((op, idxOp) => {
                op.content = `Option #${idxOp}`;
            });
            return ans;
        });
        _quiz = await this.commonServices.saveAllQuiz(quiz);
        this.log('QUIZ NORMALIZED: ', _quiz);

        // ELIMINACION DE OPCIONES
        const idxQuizAnswer = this.getRandomIndex(quiz.answers);
        let quizAnswerOptions = await this.commonServices.getQuizAnswersOptionsByAnswerId(quiz.answers[idxQuizAnswer].answerId);
        this.log('QUIZ OPTIONS: ', quizAnswerOptions);

        let idxDeleteAt = this.getRandomIndex(quizAnswerOptions);
        this.log('OPTIONS delete AT: ', idxDeleteAt);

        await Promise.all(Array.from({ length: idxDeleteAt }).map(async (i, index) => {
            const id = quizAnswerOptions[index].optionId;
            const deleteItem = await this.commonServices.deleteQuizAnswerOption(id);
            this.log('delete OPTION: ', deleteItem);
        }));

        _quizOptions = await this.commonServices.getQuizAnswersOptionsByAnswerId(quiz.answers[idxQuizAnswer].answerId);
        this.log('QUIZ OPTIONS UPDATED: ', _quizOptions);

        // ELIMINACION DE PREGUNTAS
        let quizAnswers = await this.commonServices.getAnswersByQuiz(quiz.quizId);
        this.log('QUIZ ANSWERS: ', quizAnswers);

        idxDeleteAt = this.getRandomIndex(quizAnswers);
        this.log('ANSWERS delete AT: ', idxDeleteAt);

        await Promise.all(Array.from({ length: idxDeleteAt }).map(async (i, index) => {
            const id = quizAnswers[index].answerId;
            const deleteItem = await this.commonServices.deleteAnswer(id);
            this.log('delete ANSWER: ', deleteItem);
        }));

        _quizAnswers = await this.commonServices.getAnswersByQuiz(quiz.quizId);
        this.log('QUIZ ANSWERS UPDATED: ', _quizAnswers);

        return { quiz: _quiz, answers: _quizAnswers, options: _quizOptions };
    }

    private async testQuizes_duplicateQuiz(quiz: QuizDTO): Promise<{ quiz: QuizDTO, duplicated: QuizDTO }> {
        quiz = await this.commonServices.getQuizCompleteById(quiz.quizId);
        this.log('QUIZ ORIGINAL: ', quiz);

        let _quizDuplicated = await this.commonServices.duplicateQuiz(quiz.quizId);

        return { quiz: quiz, duplicated: _quizDuplicated };
    }

    private async testQuizes_deleteQuiz(quiz: QuizDTO): Promise<QuizDTO> {
        quiz = await this.commonServices.getQuizCompleteById(quiz.quizId);
        this.log('QUIZ TO DELETE: ', quiz);

        // mostrar preguntas y opciones vinculados al questionario
        const answers = await this.commonServices.getAnswersByQuiz(quiz.quizId);
        this.log('Answers linked: ', answers);

        await Promise.all(answers.map(async (answer) => {
            const _options = await this.commonServices.getQuizAnswersOptionsByAnswerId(answer.answerId);
            this.log(`OPTIONS linked to Answer #${answer.answerId}: `, _options);
        }));

        const _quiz = await this.commonServices.deleteQuiz(quiz.quizId);
        this.log('QUIZ ELIMINADO: ', _quiz);

        // verificar que ya no existen las relaciones de las preguntas y opciones
        const _quizAnswers = await this.commonServices.getAnswersByQuiz(quiz.quizId);
        this.log('Answers linked: ', _quizAnswers);

        if (_quizAnswers) {
            await Promise.all(_quizAnswers.map(async (answer) => {
                const _options = await this.commonServices.getQuizAnswersOptionsByAnswerId(answer.answerId);
                this.log('_options vinculados a las preguntas: ', _options);
            }));
        }

        return _quiz;
    }
    //#endregion QUIZ

    //#region ATTEMPTS

    async testAttempts(): Promise<void> {

        // await Promise.all(quizzes.map(async (quiz) => {
        //     const quizDeleted = await this.testQuizes_deleteQuiz(quiz);
        //     this.log('QUIZ Deleted: ', quizDeleted);
        // }));

        let quizzes = await this.testQuizes_getAll();
        this.log('All Quiz: ', quizzes);

        if (!quizzes.length) {
            const quiz = await this.testQuizes_createQuiz(30, 5);
            this.log('QUIZ CREATED: ', quiz);

            quizzes = await this.testQuizes_getAll();
            this.log('All Quiz: ', quizzes);
        }

        const attempts = await this.commonServices.getAttemptByQuizId(quizzes[0].quizId);
        this.log('attempts: ', attempts);

        // await Promise.all(attempts.map(async (att) => {
        //     const attempt = await this.commonServices.getAttemptCompleteByAttemptId(att.attemptId);
        //     const attemptDeleted = await this.commonServices.deleteQuizAttempt(att.attemptId);
        //     this.log('ATTEMPT Deleted: ', attemptDeleted);
        // }));

        const attempt = await this.testAttempts_createAttempt(quizzes[0].quizId);
        this.log('ATTEMPT CREATED', attempt);

        const attemptEdited = await this.testAttempts_editAttempt(attempt.attemptId);
        this.log('ATTEMPT EDITED', attemptEdited);

        const attemptDelete = await this.testAttempts_deleteAttempt(attempt.attemptId);
        this.log('ATTEMPT DELETED', attemptDelete);

        const attemptSolved = await this.testAttempts_solveAttempts(quizzes[0].quizId);
        this.log('ATTEMPT SOLVED', attemptSolved);
    }

    private async testAttempts_createAttempt(quizId: number): Promise<AttemptDTO> {
        const attempt = await this.commonServices.createAttempt(quizId);
        const attemptSaved = await this.commonServices.getAttemptCompleteByAttemptId(attempt.attemptId);
        return attemptSaved;
    }

    private async testAttempts_editAttempt(attemptId: number): Promise<AttemptDTO> {
        const attempt = await this.commonServices.getAttemptCompleteByAttemptId(attemptId);
        attempt.title = `Attemp edited  ${new Date().getTime()}`;
        attempt.state = AttemptState.progress;
        attempt.updatedDate = new Date().getTime();

        attempt.answers.map((ans, index) => {
            ans.selectedOptionId = 100;
            ans.isCorrect = true;
            ans.options.map((opt, idx) => {
                opt.updatedDate = new Date().getTime();
                return opt;
            })
            return ans;
        })
        return await this.commonServices.saveAllAttempt(attempt);
    }

    private async testAttempts_solveAttempts(quizId: number): Promise<any> {
        // explore questions
        let quiz = await this.commonServices.getQuizCompleteById(quizId);
        const attemptsSolved: AttemptDTO[] = [];

        const total = quiz.answers.length;
        const failing = Math.round(total * 0.20);
        const passing = Math.round(total * 0.60);
        const passing_aceptable = Math.round(total * 0.80);
        const passing_perfect = Math.round(total * 1.00);

        // Solve attempt randomly
        const attemptRandom = await this._solveAttemptByQuizId(quizId, 0);
        attemptsSolved.push(attemptRandom);

        // Solve at failing
        const attemptFailing = await this._solveAttemptByQuizId(quizId, failing);
        attemptsSolved.push(attemptFailing);

        // Solve at passing
        const attemptPassing = await this._solveAttemptByQuizId(quizId, passing);
        attemptsSolved.push(attemptPassing);

        // Solve at passing_aceptable
        const attemptPassingAceptable = await this._solveAttemptByQuizId(quizId, passing_aceptable);
        attemptsSolved.push(attemptPassingAceptable);

        // Solve at passing_perfect
        const attemptPassingPerfect = await this._solveAttemptByQuizId(quizId, passing_perfect);
        attemptsSolved.push(attemptPassingPerfect);

        return attemptsSolved;
    }

    private async _solveAttemptByQuizId(quizId: number, successes: number): Promise<AttemptDTO> {
        const resolveRandom = successes === 0;
        const correctQuestions = [];
        const attempt = await this.testAttempts_createAttempt(quizId);
        attempt.state = AttemptState.progress;
        attempt.answers.map(ans => {
            if (resolveRandom) {
                const idxOpt = this.getRandomIndex(ans.options);
                ans.selectedOptionId = ans.options[idxOpt].optionId;
            } else {
                const correct = ans.options.find(opt => opt.isCorrect);
                const incorrect = ans.options.find(opt => !opt.isCorrect);

                if(correctQuestions.length < successes) {
                    ans.selectedOptionId = correct.optionId;
                    correctQuestions.push(ans);
                } else {
                    ans.selectedOptionId = incorrect.optionId;
                }
            }
            return ans;
        });
        let attemptUpdated = await this.commonServices.saveAllAttempt(attempt);
        return await this.commonServices.evalueAttemptById(attemptUpdated.attemptId);
    }

    private async testAttempts_deleteAttempt(attemptId: number): Promise<AttemptDTO> {
        return await this.commonServices.deleteQuizAttempt(attemptId);
    }
    //#endregion ATTEMPTS

    //#region LOGS
    async testLogs(): Promise<void> {
        const log = getLogDTO('Log test', 'info');
        const created = await this.commonServices.postLog(log);
        this.log('postLog', created);
        const id = toNumberId(created?.id);
        if (id) {
            const byId = await this.commonServices.getLogById(id);
            this.log('getLogById', byId);
            await this.commonServices.deleteLog(id);
            this.log('deleteLog -> done', id);
        }
        const all = await this.commonServices.getAllLogs();
        this.log('getAllLogs', all?.length);
    }
    //#endregion LOGS

    //#region STRUCTURE
    async testStructure(): Promise<void> {
        const structure = await this.commonServices.getStructure();
        const tables = Array.isArray(structure) ? structure.map((s: any) => s.name).filter(Boolean) : structure;
        this.log('getStructure', tables);
    }

    //#endregion STRUCTURE

    //#region NAVIGATION
    async testNavigate(): Promise<void> {
        this.commonServices.navigate('dashboard');
        this.commonServices.navigate('quiz', 'edit', '42', { title: 'Mi examen' });
        this.commonServices.navigate('settings', 'theme');
        this.log('navigate -> done');
    }
    //#endregion NAVIGATION

    async runAll(): Promise<void> {
        this.log('=== BEGIN COMMON SERVICES TEST ===');
        await this.testStructure();
        await this.testLogs();
        await this.testThemes();
        await this.testSettings();
        await this.testUsers();
        await this.testQuizes();
        await this.testAttempts();

        // await this.testNavigate();
        this.log('=== END COMMON SERVICES TEST ===');
    }
}

export async function runCommonServicesTests(commonServices: CommonServices): Promise<void> {
    const runner = new CommonServicesTesting(commonServices);
    await runner.runAll();
}