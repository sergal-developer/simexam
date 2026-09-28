import { v4 as uuidv4 } from 'uuid';
import { AttemptState, GradeState, QuizType } from '../../enumerables/enumerables';
import { TransformData } from '../../utils/transformData';

const transform = new TransformData();

//#region INTERFACES
export interface QuestionnaireDTO {
  questionnaireId: number;
  uuid?: string;
  title: string;
  time: number;
  tags: string[] | string;
  type: QuizType;
  creationDate?: number;
  updatedDate?: number;

  // GENERATED
  questionsCount?: number;
  questions?: string | QuestionDTO[];

  // variables for UI and format
  _creationDate?: string;
  _updatedDate?: string;
}

export interface QuestionDTO {
  questionId?: number;
  question: string;
  answer?: string;
  explanation?: string;
  hint?: string;
  tags: string[];
  isCorrect?: boolean;

  // GENERATED
  answers?: AnswerDTO[];

  // variables for UI and format
  _answerSelected?: number;
  _isCorrect?: boolean;
}

export interface AnswerDTO {
  answerId?: number;
  answer: string;
  isCorrect: boolean;
  popular?: number;

  // GENERATED
  _selected?: boolean;
}

export interface AttemptQuestDTO extends QuestionnaireDTO {
  attemptId?: number;
  // questionnaireId: number; /** field into QuestionnaireDTO */
  userId: number;
  // title: string; /** field into QuestionnaireDTO */
  // time: number; /** field into QuestionnaireDTO */
  // tags: string[] | string; /** field into QuestionnaireDTO */
  // type: QuizType; /** field into QuestionnaireDTO */
  score: number;
  state: AttemptState;
  // creationDate?: number; /** field into QuestionnaireDTO */
  // updatedDate?: number; /** field into QuestionnaireDTO */
  // questionsCount?: number; /** field into QuestionnaireDTO */
  // questions?: string | QuestionDTO[]; /** field into QuestionnaireDTO */

  // variables for UI and format 
  // _creationDate?: string; /** field into QuestionnaireDTO */
  // _updatedDate?: string; /** field into QuestionnaireDTO */
  _correctQuestions?: number;
  _grade?: GradeState;
  _score?: string;
}
//#endregion INTERFACES

// #region INITIALIZE
export function getQuestionnaireDTO(title: string, time: number): QuestionnaireDTO {
  const item = {
    questionnaireId: null,
    uuid: uuidv4(),
    title: title,
    time: time,
    tags: [],
    creationDate: new Date().getTime(),
    updatedDate: new Date().getTime(),
    questionsCount: 0,
    questions: [],
    _creationDate: '',
    _updatedDate: '',
  };
  return item as QuestionnaireDTO;
}

export function getQuestionDTO(question: string, answer?: string, explanation?: string, hint?: string): QuestionDTO {
  const item = {
    questionId: null,
    question: question,
    answer: answer,
    explanation: explanation,
    hint: hint,
    tags: [],
    answers: [],
    _answerSelected: null,
    _isCorrect: null,
  };
  return item as QuestionDTO;
}

export function getAnswerDTO(answer: string, index: number, popular?: number): AnswerDTO {
  const item = {
    answerId: index,
    answer: answer,
    isCorrect: false,
    popular: popular,
    _selected: false
  };
  return item as AnswerDTO;
}

export function getAttemptQuestDTO(questionnaire: QuestionnaireDTO, userId: number): AttemptQuestDTO {
  if (typeof questionnaire.tags == 'string') {
    questionnaire.tags = JSON.parse(questionnaire.tags);
  }

  if (typeof questionnaire.questions == 'string') {
    questionnaire.questions = JSON.parse(questionnaire.questions);
  }

  const _questions = questionnaire.questions ? (questionnaire.questions as QuestionDTO[]).map(question => {
    let item: QuestionDTO = question;
    return item;
  }) : [];

  const item = {
    ...questionnaire,
    questionnaireId: questionnaire.questionnaireId,
    userId: userId,
    score: 0,
    state: AttemptState.new,
    _correctAnswers: null,
    _grade: GradeState.not_submitted,
    _score: ''
  };

  console.log('NEW.AttemptQuestDTO: ', item);
  return item as AttemptQuestDTO;
}

export function normalizeQuestionnaireDTO(data: QuestionnaireDTO): QuestionnaireDTO {
  data.creationDate = data.creationDate || new Date().getTime();
  data.updatedDate = data.updatedDate || new Date().getTime();
  data._creationDate = data.creationDate ? transform.toDate(new Date(data.creationDate), 'MMM/d/yy h:mm a') : '-';
  data._updatedDate = data.updatedDate ? transform.toDate(new Date(data.updatedDate), 'MMM/d/yy h:mm a') : '-';
  data.type = data.type || QuizType.questionaries;

  if (typeof data.tags == 'string') {
    data.tags = JSON.parse(data.tags);
  }

  if (typeof data.questions == 'string') {
    data.questions = JSON.parse(data.questions);
  }

  data.questions = data.questions || [];
  (data.questions as QuestionDTO[]).map((question, idxQuestion) => {

    question.questionId = question.questionId || (idxQuestion + 1);
    question.question = question.question ? question.question.trim() : '';
    question.explanation = question.explanation || '';
    question.hint = question.hint || '';
    question.answer = question.answer || null;
    question.tags = question.tags || [];
    question.hint = question.hint || '';

    question._answerSelected = question._answerSelected || null;
    question._isCorrect = question._isCorrect || null;

    question.answers = question.answers || [];
    question.answers.map((answers, idxAnswers) => {
      answers.answerId = answers.answerId || idxAnswers + 1;
      answers.answer = answers.answer || '';
      answers.isCorrect = answers.isCorrect ? true : false;
      answers.popular = answers.popular ? answers.popular : null;
      answers._selected = answers.isCorrect ? true : null;

      if (!answers.popular) { delete answers.popular; }
    });
  });

  data.questionsCount = data.questions.length;
  return data;
}

export function normalizeAttemptQuestDTO(data: AttemptQuestDTO): AttemptQuestDTO {
  data.creationDate = data.creationDate || new Date().getTime();
  data.updatedDate = data.updatedDate || new Date().getTime();
  data._creationDate = data.creationDate ? transform.toDate(new Date(data.creationDate), 'MMM/d/yy h:mm a') : '-';
  data._updatedDate = data.updatedDate ? transform.toDate(new Date(data.updatedDate), 'MMM/d/yy h:mm a') : '-';
  data.type = data.type || QuizType.questionaries;

  if (typeof data.tags == 'string') {
    data.tags = JSON.parse(data.tags);
  }

  if (typeof data.questions == 'string') {
    data.questions = JSON.parse(data.questions);
  }

  data.questions = data.questions || [];
  data.questionsCount = data.questions.length;
  data.questionnaireId = data.questionnaireId || null;
  data.userId = data.userId || null;
  data.score = data.score || 0;
  data.state = data.state || AttemptState.new;
  data._correctQuestions = data._correctQuestions || null;
  data._grade = data._grade || GradeState.not_submitted;
  data._score = data._score || '';

  if (data.state == AttemptState.completed) {
    const correctQuestions = (data.questions as QuestionDTO[]).filter(ans => ans.isCorrect);
    data._correctQuestions = correctQuestions.length;
    data._grade = setGrade(data);
  }

  return data;
}

export function queryQuestionnaireDTO(data: QuestionnaireDTO): QuestionnaireDTO {
  data = normalizeQuestionnaireDTO(data);
  data.uuid = data.uuid || uuidv4();
  data.questionnaireId = data.questionnaireId || null;
  data.tags = JSON.stringify(data.tags);
  data.questions = JSON.stringify(data.questions);
  return data;
}

export function queryAttemptQuestDTO(data: AttemptQuestDTO): AttemptQuestDTO {
  data = normalizeAttemptQuestDTO(data);
  data.attemptId = data.attemptId || null;
  data.tags = JSON.stringify(data.tags);
  data.questions = JSON.stringify(data.questions);
  return data;
}

export function setGrade(attempt: AttemptQuestDTO) {
  const total = attempt.questions.length;
  const failing = Math.round(total * 0.20);
  const passing = Math.round(total * 0.60);
  const passing_aceptable = Math.round(total * 0.80);
  const passing_perfect = Math.round(total * 1.00);

  const correctAnswer = (attempt.questions as QuestionDTO[]).filter(ans => ans.isCorrect).length;
  if (correctAnswer <= failing) {
    return GradeState.failed;
  } else if (correctAnswer <= passing) {
    return GradeState.barely_passed;
  } else if (correctAnswer <= passing_aceptable) {
    return GradeState.passed;
  } else if (correctAnswer <= passing_perfect) {
    return GradeState.passed;
  } else if (correctAnswer == passing_perfect) {
    return GradeState.perfect;
  }
  return GradeState.not_submitted;
}

// #endregion INITIALIZE

export const questionnaire_table_querys = {
  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [questionnaire_table] (
        [questionnaireId] INTEGER PRIMARY KEY AUTOINCREMENT,
        [uuid] TEXT,
        [title] TEXT,
        [time] INTEGER,
        [tags] TEXT,
        [type] TEXT,
        [creationDate] INTEGER,
        [updatedDate] INTEGER,
        [questionsCount] INTEGER,
        [questions] TEXT
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [questionnaire_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [questionnaire_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [questionnaire_table]
      WHERE [questionnaireId] = ?;
    `
  },

  selectByIdWithRelations: {
    query: `
      SELECT
        q.[questionnaireId],
        q.[uuid],
        q.[title],
        q.[time],
        q.[tags],
        q.[type],
        q.[creationDate],
        q.[updatedDate],
        q.[questionsCount],
        q.[questions]
      FROM [questionnaire_table] q
      WHERE q.[questionnaireId] = ?;
    `
  },

  filterBy: {
    query: `
      SELECT *
      FROM [questionnaire_table]
      WHERE [title] LIKE '%' || :title || '%';
    `
  },

  post: {
    query: `
      INSERT INTO [questionnaire_table] (
        [uuid],
        [title],
        [time],
        [tags],
        [type],
        [creationDate],
        [updatedDate],
        [questionsCount],
        [questions]
      )
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? )
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [questionnaire_table] (
        [questionnaireId],
        [uuid],
        [title],
        [time],
        [tags],
        [type],
        [creationDate],
        [updatedDate],
        [questionsCount],
        [questions]
      )
      VALUES (
        :questionnaireId,
        :uuid,
        :title,
        :time,
        :tags,
        :type,
        :creationDate,
        :updatedDate,
        :questionsCount,
        :questions
      )
      ON CONFLICT(questionnaireId) DO UPDATE SET
        uuid = excluded.[uuid],
        title = excluded.[title],
        time = excluded.[time],
        tags = excluded.[tags],
        type = excluded.[type],
        creationDate = excluded.[creationDate],
        updatedDate = excluded.[updatedDate],
        questionsCount = excluded.[questionsCount],
        questions = excluded.[questions]
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [questionnaire_table]
      WHERE [questionnaireId] = :questionnaireId
      RETURNING *;
    `
  },
};

export const questionnaire_attempts_table_querys = {
  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [questionnaire_attempts_table] (
        [attemptId] INTEGER PRIMARY KEY AUTOINCREMENT,
        [questionnaireId] INTEGER,
        [userId] INTEGER,
        [title] TEXT,
        [time] INTEGER,
        [tags] TEXT,
        [type] TEXT,
        [score] REAL,
        [state] TEXT,
        [creationDate] INTEGER,
        [updatedDate] INTEGER,
        [questionsCount] INTEGER,
        [questions] TEXT,
        FOREIGN KEY ([questionnaireId])
          REFERENCES [questionnaire_table] ([questionnaireId])
          ON DELETE CASCADE
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [questionnaire_attempts_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [questionnaire_attempts_table];
    `
  },

  selectByQuestionnaireId: {
    query: `
      SELECT *
      FROM [questionnaire_attempts_table]
      WHERE [attemptId] = ?;
    `
  },

  selectByAttemptId: {
    query: `
      SELECT *
      FROM [questionnaire_attempts_table]
      WHERE [attemptId] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [questionnaire_attempts_table] (
        [questionnaireId],
        [userId],
        [title],
        [time],
        [tags],
        [type],
        [score],
        [state],
        [creationDate],
        [updatedDate],
        [questionsCount],
        [questions]
      )
      VALUES ( :questionnaireId, :userId, :title, :time, :tags, :type, :score, :state, :creationDate, :updatedDate, :questionsCount, :questions )
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [questionnaire_attempts_table] (
        [attemptId],
        [questionnaireId],
        [userId],
        [title],
        [time],
        [tags],
        [type],
        [score],
        [state],
        [creationDate],
        [updatedDate],
        [questionsCount],
        [questions]
      )
      VALUES ( :attemptId, :questionnaireId, :userId, :title, :time, :tags, :type, :score, :state, :creationDate, :updatedDate, :questionsCount, :questions )
      ON CONFLICT(attemptId) DO UPDATE SET
        questionnaireId = excluded.[questionnaireId], 
        userId = excluded.[userId], 
        title = excluded.[title], 
        time = excluded.[time], 
        tags = excluded.[tags], 
        type = excluded.[type], 
        score = excluded.[score], 
        state = excluded.[state], 
        creationDate = excluded.[creationDate], 
        updatedDate = excluded.[updatedDate], 
        questionsCount = excluded.[questionsCount], 
        questions = excluded.[questions]
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [questionnaire_attempts_table]
      WHERE [attemptId] = :attemptId
      RETURNING *;
    `
  },
};
