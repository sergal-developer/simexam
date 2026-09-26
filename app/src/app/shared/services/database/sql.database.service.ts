import { Injectable } from "@angular/core";
import { CapacitorSQLite, DBSQLiteValues, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import {
    attempt_answer_table_querys,
    attempt_table_querys,
    AttemptAnswerDTO,
    AttemptDTO,
    language_table_querys,
    LanguageDTO,
    log_table_querys,
    LogDTO,
    quiz_answer_option_table_querys,
    quiz_answer_table_querys,
    quiz_table_querys,
    QuizAnswerDTO,
    QuizAnswerOptionDTO,
    QuizDTO,
    settings_table_querys,
    SettingsDTO,
    theme_table_querys,
    ThemeDTO,
    user_table_querys,
    UserDTO
} from "../../data/entities/dtos";
import { UiServices } from "../ui.services";

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {

    private dbName = 'sinexamSQL_temp';
    private isAndroid: boolean = false;

    private db: SQLiteDBConnection;
    private sqliteConnection!: SQLiteConnection;

    origin: string = '';

    constructor(
        private uiServices: UiServices,
    ) {
        this.isAndroid = Capacitor.getPlatform() === 'android';
        this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
    }

    //#region CONFIG
    private async _initWebStore(): Promise<boolean> {
        try {
            if (!this.isAndroid) {
                const jeepEl = document.querySelector('jeep-sqlite');
                if (jeepEl) {
                    await this.sqliteConnection.initWebStore();
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch (err: any) {
            return Promise.reject(`initWebStore: ${err}`);
        }
    }

    private async _openDatabaseCreate(dbName: string, encrypted: boolean = false, mode: string = 'no-encryption', version: number = 1, readonly: boolean = false): Promise<any> {
        const isConn = (await this.sqliteConnection.isConnection(dbName, readonly)).result;
        if (isConn) {
            this.db = await this.sqliteConnection.retrieveConnection(dbName, readonly);
        } else {
            this.db = await this.sqliteConnection.createConnection(dbName, encrypted, mode, version, readonly);
        }
        await this.db.open();
        return this.db;
    }

    async initDataBase(): Promise<any> {
        await this._initWebStore().then(async (webConnection) => {
            this.db = await this._openDatabaseCreate(this.dbName);
            if (!this.isAndroid) {
                await this.sqliteConnection.saveToStore(this.dbName);
            }
        });
        return this.db;
    }

    /**
     * Divide un script SQL en sentencias individuales.
     * En Android el plugin nativo usa ";\n" como separador, por lo que
     * las sentencias deben ejecutarse una a una.
     */
    splitStatements(statementSql: string): string[] {
        if (!statementSql) return [];
        return statementSql
            .split(';')
            .map(s => s.replace(/\n+/g, '\n').trim())
            .filter(s => s.length > 0)
            .map(s => (s.endsWith(';') ? s : s + ';'));
    }

    /**
     * Ejecuta un conjunto de sentencia SQL directamente contra la base de datos.
     * sus usos son para creacion de tablas o batchs
     *
     * @param statementSql Sentencia SQL que se desea ejecutar.
     * @returns El resultado de la ejecución de la sentencia.
     */
    async executeSQL(statementSql: string): Promise<any> {
        try {
            this.db = await this.initDataBase();
            let request;
            if (this.isAndroid) {
                // El plugin nativo de Android divide las sentencias por ";\n".
                // Si el script contiene varias sentencias, se ejecutan una a una.
                const statements = this.splitStatements(statementSql);
                let changes = 0;
                for (const stmt of statements) {
                    const res = await this.db.execute(stmt);
                    if (res && res.changes && res.changes.changes) {
                        changes += res.changes.changes;
                    }
                }
                request = { changes: { changes } };
            } else {
                request = await this.db.execute(statementSql);
                await this.sqliteConnection.saveToStore(this.dbName);
            }
            return request;
        } catch (error) {
            console.info(`ERROR:${this.origin}:`, error);
            this.uiServices.notification(`ERROR:${this.origin}: ${error.toString()}`)
            return null
        }
    }

    /**
     * Ejecuta una sentencia de accion (post,put,delete) en SQL parametrizada contra la base de datos.
     *
     * @param statementSql Sentencia SQL con placeholders para los parámetros (?, ?).
     * @param parameters Valores que serán utilizados para reemplazar los placeholders.
     * @returns retorna un Arrglo de datos o un nulo si no hay valores
     */
    async executeActionSQL(statementSql: string, parameters: any[] = []): Promise<any> {
        try {
            this.db = await this.initDataBase();
            const statements = this.splitStatements(statementSql);
            const request: DBSQLiteValues = await this.db.query(statementSql, parameters);
            if (!this.isAndroid) {
                await this.sqliteConnection.saveToStore(this.dbName);
            }
            return request && request.values ? request.values : null;
        } catch (error) {
            console.warn(`ERROR:${this.origin}:`, error);
            this.uiServices.notification(`ERROR:${this.origin}: ${error.toString()}`)
            return null
        }
    }

    /**
     * Ejecuta una sentencia SQL de consulta (GET) parametrizada y devuelve los registros
     * obtenidos.
     *
     * @param statementSql Sentencia SQL SELECT con placeholders para los parámetros (?, ?).
     * @param parameters Valores que serán utilizados para reemplazar los placeholders.
     * @returns retorna un Arrglo de datos o un nulo si no hay valores
     */
    async executeInSQL(statementSql: string, parameters: any[] = [], log: Function = null): Promise<any> {
        let _log = '';
        try {
            this.db = await this.initDataBase();
            const request = await this.db.query(statementSql, parameters);
            if (!this.isAndroid) {
                await this.sqliteConnection.saveToStore(this.dbName);
            }

            if (log) {
                log(null);
            }
            return request && request.values ? request.values : null;
        } catch (error) {
            console.info(`ERROR:${this.origin}:`, error);
            this.uiServices.notification(`ERROR:${this.origin}: ${error.toString()}`)

            if (log) {
                log(error);
            }
            return null
        }
    }

    async initialDatabase() {
        await this.createDataStructure();
        const structure = await this.getStructure()
        if (!structure) {
            this.uiServices.notification("Error al establecer conexion SQL.", { type: 'error', closeTimer: 0 })
        }
        return structure ? true : false;
    }

    async createDataStructure() {
        try {
            await this.executeSQL('PRAGMA foreign_keys = ON;');

            const tableScripts = [
                log_table_querys.createTable.query,
                language_table_querys.createTable.query,
                user_table_querys.createTable.query,
                settings_table_querys.createTable.query,
                theme_table_querys.createTable.query,
                quiz_table_querys.createTable.query,
                quiz_answer_table_querys.createTable.query,
                quiz_answer_option_table_querys.createTable.query,
                attempt_table_querys.createTable.query,
                attempt_answer_table_querys.createTable.query,
            ];

            for (const script of tableScripts) {
                const result = await this.executeSQL(script);
                if (result === null) {
                    return null;
                }
            }
            return true;

        } catch (error) {
            console.info(`ERROR:${this.origin}:`, error);
            return null;
        }
    }

    async getStructure() {
        const query = `SELECT * FROM sqlite_master WHERE type='table';`;
        const data = await this.executeActionSQL(query);
        return data;
    }

    async deleteStructure() {
        try {

            const tableScripts = [
                attempt_answer_table_querys.deleteTable.query,
                attempt_table_querys.deleteTable.query,
                quiz_answer_option_table_querys.deleteTable.query,
                quiz_answer_table_querys.deleteTable.query,
                quiz_table_querys.deleteTable.query,
                language_table_querys.deleteTable.query,
                theme_table_querys.deleteTable.query,
                settings_table_querys.deleteTable.query,
                user_table_querys.deleteTable.query,
                log_table_querys.deleteTable.query,
            ];

            for (const script of tableScripts) {
                const result = await this.executeSQL(script);
                if (result === null) {
                    return null;
                }
            }
            return true;

        } catch (error) {
            console.info(`ERROR:${this.origin}:`, error);
            return null;
        }

    }
    //#endregion CONFIG

    //#region CRUDS

    //#region Logs (log_table)
    async getAllLogs(): Promise<LogDTO[]> {
        this.origin = `getAllLogs()`;
        return await this.executeActionSQL(log_table_querys.selectAll.query);
    }

    async getLogById(id: number): Promise<LogDTO[]> {
        this.origin = `getLogById(${id}})`;
        return await this.executeActionSQL(log_table_querys.selectById.query, [id]);
    }

    async postLog(log: LogDTO): Promise<LogDTO> {
        this.origin = `postLog(${JSON.stringify(log)})`;
        const response = await this.executeActionSQL(log_table_querys.post.query, [log.date, log.content, log.type]);
        return response && response.length ? response[0] : null;
    }

    async deleteLog(id: number): Promise<LogDTO[]> {
        this.origin = `deleteLog(${id})`;
        return await this.executeActionSQL(log_table_querys.deleteById.query, [id]);
    }
    //#endregion

    //#region Languages (language_table)
    async getAllLanguages(): Promise<LanguageDTO[]> {
        this.origin = `getAllLanguages()`;
        return await this.executeActionSQL(language_table_querys.selectAll.query);
    }

    async getLanguageByValue(value: string): Promise<LanguageDTO> {
        this.origin = `getLanguageByValue(${value})`;
        const response = await this.executeActionSQL(language_table_querys.selectById.query, [value]);
        return response && response.length ? response[0] : null;
    }

    async postLanguage(lang: LanguageDTO): Promise<LanguageDTO[]> {
        this.origin = `postLanguage(${JSON.stringify(lang)})`;
        const response = await this.executeActionSQL(language_table_querys.post.query, [lang.value, lang.name]);
        return response && response.length ? response[0] : null;
    }

    async deleteLanguage(value: string): Promise<LanguageDTO[]> {
        this.origin = `deleteLanguage(${value})`;
        return await this.executeActionSQL(language_table_querys.deleteById.query, [value]);
    }
    //#endregion

    //#region Users (user_table)
    async getAllUsers(): Promise<UserDTO[]> {
        this.origin = `getAllUsers()`;
        return await this.executeActionSQL(user_table_querys.selectAll.query);
    }

    async getUserById(userId: number): Promise<UserDTO> {
        this.origin = `getUserById(${userId}})`;
        const response = await this.executeActionSQL(user_table_querys.selectById.query, [userId]);
        return response && response.length ? response[0] : null;
    }

    async getCurrentUser(): Promise<UserDTO> {
        this.origin = `getCurrentUser()`;
        const response = await this.executeActionSQL(user_table_querys.selectByCurrent.query);
        return response && response.length ? response[0] : null;
    }

    async saveUser(user: UserDTO): Promise<UserDTO> {
        this.origin = `saveUser(${JSON.stringify(user)})`;
        let response: UserDTO = null;
        if (!user.userId) {
            response = await this._postUser(user);
        } else {
            response = await this._putUser(user);
        }
        return response;
    }

    private async _postUser(user: UserDTO): Promise<UserDTO> {
        this.origin = `_postUser(${JSON.stringify(user)})`;
        const values = [
            user.uuid ?? null,
            user.userName,
            user.age ?? null,
            user.avatarUrl ?? null,                 // Evita el undefined
            user.avatarBody ? JSON.stringify(user.avatarBody) : null, // Por si es objeto
            user.current ? 1 : 0                    // Booleano a Entero (1 o 0)
        ];

        const response = await this.executeActionSQL(user_table_querys.post.query, values);
        return response && response.length ? response[0] : null;
    }

    private async _putUser(user: UserDTO): Promise<UserDTO> {
        this.origin = `_putUser(${JSON.stringify(user)})`;
        const values = [
            user.userId ?? null,
            user.uuid ?? null,
            user.userName,
            user.age ?? null,
            user.avatarUrl ?? null,                 // Evita el undefined
            user.avatarBody ? JSON.stringify(user.avatarBody) : null, // Por si es objeto
            user.current ? 1 : 0                    // Booleano a Entero (1 o 0)
        ];

        const response = await this.executeActionSQL(user_table_querys.put.query, values);
        return response && response.length ? response[0] : null;
    }

    async deleteUser(userId: number): Promise<UserDTO[]> {
        this.origin = `deleteUser(${userId})`;
        return await this.executeActionSQL(user_table_querys.deleteById.query, [userId]);
    }
    //#endregion

    //#region Settings (settings_table)
    private normalizeSettings(datalist: Array<any>) {
        if (datalist && datalist.length) {
            datalist.map(x => {
                x.permissions = x.permissions ? this.stringToObject(x.permissions) : {};
                x._languages = x._languages ? this.stringToObject(x._languages) : [];
                x._themes = x._themes ? this.stringToObject(x._themes) : [];

                if (x._themes.length) {
                    x._themes.map(y => {
                        y.content = y.content ? this.stringToObject(y.content) : [];
                    })
                }
            });
        }
        return datalist;

    }

    async getAllSettings(): Promise<SettingsDTO[]> {
        this.origin = `getAllSettings()`;
        const response = await this.executeActionSQL(settings_table_querys.selectAll.query);
        return this.normalizeSettings(response);
    }

    async getSettingCompleteById(settingId: number): Promise<SettingsDTO> {
        this.origin = `getSettingCompleteById(${settingId})`;
        let response = await this.executeActionSQL(settings_table_querys.selectByIdWithRelations.query, [settingId]);
        response = this.normalizeSettings(response);
        return response && response.length ? response[0] : null;
    }

    async postSetting(setting: SettingsDTO): Promise<SettingsDTO> {
        this.origin = `postSetting(${JSON.stringify(setting)})`;
        setting.permissions = typeof setting.permissions !== 'string' ? this.objectToString(setting.permissions) : setting.permissions;
        const response = await this.executeActionSQL(settings_table_querys.post.query, [setting.settingId ?? null, setting.language, setting.permissions, setting.theme]);
        return response && response.length ? response[0] : null;
    }

    async deleteSetting(settingId: number): Promise<SettingsDTO> {
        this.origin = `deleteSetting(${settingId})`;
        let response = await this.executeActionSQL(settings_table_querys.deleteById.query, [settingId]);
        response = this.normalizeSettings(response);
        return response && response.length ? response[0] : null;
    }
    //#endregion

    //#region Themes (theme_table)
    async getAllThemes(): Promise<ThemeDTO[]> {
        this.origin = `getAllThemes()`;
        return await this.executeActionSQL(theme_table_querys.selectAll.query);
    }

    async getTheme(id: string): Promise<ThemeDTO> {
        this.origin = `getTheme(${id}) `;
        const response = await this.executeActionSQL(theme_table_querys.selectById.query, [id]);
        return response && response.length ? response[0] : null;
    }

    async postTheme(theme: ThemeDTO): Promise<ThemeDTO> {
        this.origin = `postTheme(${JSON.stringify(theme)})`;
        theme.content = this.objectToString(theme.content);
        const response = await this.executeActionSQL(theme_table_querys.post.query, [theme.id, theme.content]);
        return response && response.length ? response[0] : null;
    }

    async deleteTheme(id: string): Promise<ThemeDTO[]> {
        this.origin = `deleteTheme(${id})`;
        return await this.executeActionSQL(theme_table_querys.deleteById.query, [id]);
    }
    //#endregion

    //#region Quizzes (quiz_table)
    async getAllQuizzes(): Promise<QuizDTO[]> {
        this.origin = `getAllQuizzes()`;
        return await this.executeActionSQL(quiz_table_querys.selectAll.query);
    }

    async getQuizCompleteById(quizId: number): Promise<QuizDTO> {
        this.origin = `getQuizCompleteById(${quizId})`;
        try {
            const result = await this.executeActionSQL(quiz_table_querys.selectByIdWithRelations.query, [quizId]);

            if (result && result.length > 0) {
                const quiz = result[0];
                // Como SQLite devuelve los grupos JSON como cadenas de texto, 
                // los parseamos para que vuelvan a ser arrays/objetos de JavaScript nativos.
                if (typeof quiz.answers === 'string') {
                    quiz.answers = JSON.parse(quiz.answers);
                }
                return quiz;
            }
            return null;
        } catch (error) {
            console.error('Error al mapear el Quiz completo:', error);
            return null;
        }
    }

    async saveQuiz(quiz: QuizDTO): Promise<QuizDTO> {
        this.origin = `saveQuiz(${JSON.stringify(quiz)})`;
        let response: QuizDTO = null;
        if (!quiz.quizId) {
            response = await this._postQuiz(quiz);
        } else {
            response = await this._putQuiz(quiz);
        }
        return response;
    }

    private async _postQuiz(quiz: QuizDTO): Promise<QuizDTO> {
        this.origin = `_postQuiz(${JSON.stringify(quiz)})`;
        const response = await this.executeActionSQL(quiz_table_querys.post.query, [quiz.uuid, quiz.title, quiz.time, quiz.creationDate, quiz.updatedDate, quiz.startDate]);
        return response && response.length ? response[0] : null;
    }

    private async _putQuiz(quiz: QuizDTO): Promise<QuizDTO> {
        this.origin = `_putQuiz(${JSON.stringify(quiz)})`;
        const response = await this.executeActionSQL(quiz_table_querys.put.query, [quiz.quizId ?? null, quiz.uuid, quiz.title, quiz.time, quiz.creationDate, quiz.updatedDate, quiz.startDate]);
        return response && response.length ? response[0] : null;
    }

    async deleteQuiz(quizId: number): Promise<QuizDTO[]> {
        this.origin = `deleteQuiz(${quizId})`;
        return await this.executeActionSQL(quiz_table_querys.deleteById.query, [quizId]);
    }
    //#endregion

    //#region Answers (answer_table)
    async getAllAnswers(): Promise<QuizAnswerDTO[]> {
        this.origin = `getAllAnswers()`;
        return await this.executeActionSQL(quiz_answer_table_querys.selectAll.query);
    }

    async getAnswersByQuiz(quizId: number): Promise<QuizAnswerDTO[]> {
        this.origin = `getAnswersByQuiz(${quizId})`;
        const response = await this.executeActionSQL(quiz_answer_table_querys.selectByQuizId.query, [quizId]);
        return response && response.length ? response : null;
    }

    async saveAnswer(answer: QuizAnswerDTO): Promise<QuizAnswerDTO> {
        this.origin = `saveAnswer(${JSON.stringify(answer)})`;
        let response: QuizAnswerDTO = null;
        if (!answer.answerId) {
            response = await this._postAnswer(answer);
        } else {
            response = await this._putAnswer(answer);
        }
        return response;
    }

    private async _postAnswer(answer: QuizAnswerDTO): Promise<QuizAnswerDTO> {
        this.origin = `_postAnswer(${JSON.stringify(answer)})`;
        const response = await this.executeActionSQL(quiz_answer_table_querys.post.query, [answer.quizId, answer.title, answer.updatedDate]);
        return response && response.length ? response[0] : null;
    }

    private async _putAnswer(answer: QuizAnswerDTO): Promise<QuizAnswerDTO> {
        this.origin = `_putAnswer(${JSON.stringify(answer)})`;
        const response = await this.executeActionSQL(quiz_answer_table_querys.put.query, [answer.answerId ?? null, answer.quizId, answer.title, answer.updatedDate]);
        return response && response.length ? response[0] : null;
    }

    async deleteAnswer(answerId: number): Promise<QuizAnswerDTO[]> {
        this.origin = `deleteAnswer(${answerId})`;
        const query = ``;
        return await this.executeActionSQL(quiz_answer_table_querys.deleteById.query, [answerId]);
    }
    //#endregion

    //#region Answer Options (answer_option_table)
    async getQuizAnswersOptionsByAnswerId(answerId: number): Promise<QuizAnswerOptionDTO[]> {
        this.origin = `getQuizAnswersOptionsByAnswerId(${answerId})`;
        return await this.executeActionSQL(quiz_answer_option_table_querys.selectByAnswerId.query, [answerId]);
    }

    async saveQuizAnswerOption(option: QuizAnswerOptionDTO): Promise<QuizAnswerOptionDTO> {
        this.origin = `saveQuizAnswerOption(${JSON.stringify(option)})`;
        let response: QuizAnswerOptionDTO = null;
        if (!option.optionId) {
            response = await this._postAnswerOption(option);
        } else {
            response = await this._putAnswerOption(option);
        }
        return response;
    }

    private async _postAnswerOption(option: QuizAnswerOptionDTO): Promise<QuizAnswerOptionDTO> {
        this.origin = `_postAnswerOption(${JSON.stringify(option)})`;
        const correctVal = option.isCorrect ? 1 : 0;
        const response = await this.executeActionSQL(quiz_answer_option_table_querys.post.query, [option.answerId, option.content, option.optionIndex, option.updatedDate, correctVal]);
        return response && response.length ? response[0] : null;
    }

    private async _putAnswerOption(option: QuizAnswerOptionDTO): Promise<QuizAnswerOptionDTO> {
        this.origin = `_putAnswerOption(${JSON.stringify(option)})`;
        const correctVal = option.isCorrect ? 1 : 0;
        const response = await this.executeActionSQL(quiz_answer_option_table_querys.put.query, [option.optionId ?? null, option.answerId, option.content, option.optionIndex, option.updatedDate, correctVal]);
        return response && response.length ? response[0] : null;
    }

    async deleteQuizAnswerOption(optionId: number): Promise<QuizAnswerOptionDTO[]> {
        this.origin = `deleteQuizAnswerOption(${optionId})`;
        return await this.executeActionSQL(quiz_answer_option_table_querys.deleteById.query, [optionId]);
    }
    //#endregion

    //#region Quiz Attempts (quiz_attempt_table)
    async getAllAttempts(): Promise<AttemptDTO[]> {
        this.origin = `getAllAttempts()`;
        return await this.executeActionSQL(attempt_table_querys.selectAll.query);
    }

    async getAttemptByQuizId(quizId: number): Promise<Array<AttemptDTO>> {
        this.origin = `getAttemptByQuizId(${quizId})`;
        const response = await this.executeActionSQL(attempt_table_querys.selectByQuizId.query, [quizId]);
        if (response && response.length > 0) {
            const dataCollection = response;
            dataCollection.map((data) => {
                if (typeof data.answers === 'string') {
                    data.answers = JSON.parse(data.answers);

                    if (data.answers && data.answers.length) {
                        data.answers.map(ans => {
                            ans.options = [];
                            if (typeof ans.optionsLinked === 'string') {
                                ans.options = JSON.parse(ans.optionsLinked);
                            }
                            return ans;
                        });
                    }
                }
                return data;
            });
            return dataCollection;
        }
        return [];
    }

    async getAttemptCompleteByAttemptId(attemptId: number): Promise<AttemptDTO> {
        this.origin = `getAttemptCompleteById(${attemptId})`;
        const response = await this.executeActionSQL(attempt_table_querys.selectByIdWithRelations.query, [attemptId]);

        if (response && response.length > 0) {
            const data = response[0];
            if (typeof data.answers === 'string') {
                data.answers = JSON.parse(data.answers);

                if (data.answers && data.answers.length) {
                    data.answers.map(ans => {
                        ans.options = [];
                        if (typeof ans.optionsLinked === 'string') {
                            ans.options = JSON.parse(ans.optionsLinked);
                        }
                        return ans;
                    });
                }
            }

            return data;
        }
        return null;
    }

    async saveAllAttempt(attempt: AttemptDTO): Promise<AttemptDTO> {

        return attempt;
    }

    async saveAttempt(attempt: AttemptDTO): Promise<AttemptDTO> {
        this.origin = `saveAttempt(${JSON.stringify(attempt)})`;
        let response: AttemptDTO = null;
        if (!attempt.attemptId) {
            response = await this._postAttempt(attempt);
        } else {
            response = await this._putAttempt(attempt);
        }
        return response;
    }

    private async _postAttempt(attempt: AttemptDTO): Promise<AttemptDTO> {
        this.origin = `_postAttempt(${JSON.stringify(attempt)})`;
        const response = await this.executeActionSQL(attempt_table_querys.post.query, [attempt.quizId, attempt.userId, attempt.title, attempt.updatedDate, attempt.startDate, attempt.score, attempt.state, attempt.time, attempt.answersLinked]);
        return response && response.length ? response[0] : null;
    }

    private async _putAttempt(attempt: AttemptDTO): Promise<AttemptDTO> {
        this.origin = `_putAttempt(${JSON.stringify(attempt)})`;
        const response = await this.executeActionSQL(attempt_table_querys.put.query, [attempt.attemptId ?? null, attempt.quizId, attempt.userId, attempt.title, attempt.updatedDate, attempt.startDate, attempt.score, attempt.state, attempt.time, attempt.answersLinked]);
        return response && response.length ? response[0] : null;
    }

    async deleteQuizAttempt(attemptId: number): Promise<AttemptDTO> {
        this.origin = `deleteQuizAttempt(${attemptId})`;
        return await this.executeActionSQL(attempt_table_querys.deleteById.query, [attemptId]);
    }
    //#endregion

    //#region Answer Attempts (answer_attempt_table)
    async getAttemptAnswersByAttemptId(attemptId: number): Promise<AttemptAnswerDTO[]> {
        this.origin = `getAttemptAnswersByAttemptId(${attemptId})`;
        return await this.executeActionSQL(attempt_answer_table_querys.selectByAttemptId.query, [attemptId]);
    }

    async saveAttemptAnswers(ansAttempt: AttemptAnswerDTO): Promise<AttemptAnswerDTO> {
        this.origin = `saveAttemptAnswers(${JSON.stringify(ansAttempt, null, 2)})`;
        let response: AttemptAnswerDTO = null;
        if (!ansAttempt.answerAttemptId) {
            response = await this._postAnswerAttempt(ansAttempt);
        } else {
            response = await this._putAnswerAttempt(ansAttempt);
        }
        return response;
    }

    private async _postAnswerAttempt(ansAttempt: AttemptAnswerDTO): Promise<AttemptAnswerDTO> {
        this.origin = `_postAnswerAttempt(${JSON.stringify(ansAttempt)})`;
        const correctVal = ansAttempt.isCorrect ? 1 : 0;
        const response = await this.executeActionSQL(attempt_answer_table_querys.post.query, [ansAttempt.attemptId, ansAttempt.answerId, ansAttempt.selectedOptionId, correctVal, ansAttempt.title, ansAttempt.optionsLinked]);
        return response && response.length ? response[0] : null;
    }

    private async _putAnswerAttempt(ansAttempt: AttemptAnswerDTO): Promise<AttemptAnswerDTO> {
        this.origin = `_putAnswerAttempt(${JSON.stringify(ansAttempt)})`;
        const correctVal = ansAttempt.isCorrect ? 1 : 0;
        const response = await this.executeActionSQL(attempt_answer_table_querys.put.query, [ansAttempt.answerAttemptId ?? null, ansAttempt.attemptId, ansAttempt.answerId, ansAttempt.selectedOptionId, correctVal, ansAttempt.title, ansAttempt.optionsLinked]);
        return response && response.length ? response[0] : null;
    }

    async deleteAnswerAttemptById(attemptId: number): Promise<AttemptDTO[]> {
        this.origin = `deleteAnswerAttemptById(${attemptId})`;
        return await this.executeActionSQL(attempt_answer_table_querys.deleteById.query, [attemptId]);
    }
    //#endregion

    //#endregion CRUDS


    //#region CONVERTERS
    objectToString(obj: any): string {
        return JSON.stringify(obj)
    }

    stringToObject(obj: string): any {
        return JSON.parse(obj)
    }
    //#endregion CONVERTERS

}
