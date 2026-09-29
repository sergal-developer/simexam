import { v4 as uuidv4 } from 'uuid';
import { AttemptState, GradeState, QuizType } from '../../enumerables/enumerables';
import { TransformData } from '../../utils/transformData';

const transform = new TransformData();

//#region INTERFACES
export interface QuestionnaireFile {
    name: string,
    path: string,
    type: string,
    url: string,
    size: number,
    modified: string,
    isEmpty: boolean,
    _name?: string
}

export interface QuestionaryDTO {
  questionaryId: number;
  uuid?: string;
  title: string;
  time: number;
  tags: string[] | string;
  type: QuizType;
  creationDate?: number;
  updatedDate?: number;

  // GENERATED
  questionsCount?: number;
  questions?: QuestionDTO[] | string;

  // variables for UI and format
  _creationDate?: string;
  _updatedDate?: string;

  _current?: boolean;
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

export interface AttemptDTO extends QuestionaryDTO {
  attemptId?: number;
  // questionaryId: number; /** field into QuestionaryDTO */
  userId: number;
  // title: string; /** field into QuestionaryDTO */
  // time: number; /** field into QuestionaryDTO */
  // tags: string[] | string; /** field into QuestionaryDTO */
  // type: QuizType; /** field into QuestionaryDTO */
  score: number;
  state: AttemptState;
  // creationDate?: number; /** field into QuestionaryDTO */
  // updatedDate?: number; /** field into QuestionaryDTO */
  // questionsCount?: number; /** field into QuestionaryDTO */
  // questions?: string | QuestionDTO[]; /** field into QuestionaryDTO */

  // variables for UI and format 
  // _creationDate?: string; /** field into QuestionaryDTO */
  // _updatedDate?: string; /** field into QuestionaryDTO */
  _correctQuestions?: number;
  _grade?: GradeState;
  _score?: string;

  _questionsSolved?: number;
  _progress?: string;
}
//#endregion INTERFACES

// #region INITIALIZE
export function getQuestionaryDTO(title: string, time: number): QuestionaryDTO {
  const item = {
    questionaryId: null,
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
  return item as QuestionaryDTO;
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

export function getNewAttemptDTO(questionnaire: QuestionaryDTO, userId: number): AttemptDTO {
  if (typeof questionnaire.tags == 'string') {
    questionnaire.tags = JSON.parse(questionnaire.tags);
  }

  if (typeof questionnaire.questions == 'string') {
    questionnaire.questions = JSON.parse(questionnaire.questions);
  }

  const item = {
    ...questionnaire,
    questionaryId: questionnaire.questionaryId,
    userId: userId,
    score: 0,
    state: AttemptState.new,
    _correctAnswers: null,
    _grade: GradeState.not_submitted,
    _score: ''
  };

  // clean unused values
   item.questions ? (item.questions as QuestionDTO[]).map((question, idxquestion) => {
    question.questionId = idxquestion + 1;
    question._isCorrect = null;
    question._answerSelected = null;
    question.isCorrect = null;
    question.answers.map((ans, idxans) => {
      ans._selected = null;
      ans.answerId = idxans + 1;
      return ans;
    });
    return item;
  }) : [];


  return item as AttemptDTO;
}

export function normalizeQuestionaryDTO(data: QuestionaryDTO): QuestionaryDTO {
  data.creationDate = data.creationDate || new Date().getTime();
  data.updatedDate = data.updatedDate || new Date().getTime();
  data._creationDate = data.creationDate ? transform.toDate(new Date(data.creationDate), 'MMM/d/yy h:mm a') : '-';
  data._updatedDate = data.updatedDate ? transform.toDate(new Date(data.updatedDate), 'MMM/d/yy h:mm a') : '-';
  data.type = data.type || QuizType.trivia;

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

export function normalizeAttemptDTO(data: AttemptDTO): AttemptDTO {
  // transform data for show most frendly in UI
  data.creationDate = data.creationDate || new Date().getTime();
  data.updatedDate = data.updatedDate || new Date().getTime();
  data._creationDate = data.creationDate ? transform.toDate(new Date(data.creationDate), 'MMM/d/yy h:mm a') : '-';
  data._updatedDate = data.updatedDate ? transform.toDate(new Date(data.updatedDate), 'MMM/d/yy h:mm a') : '-';

  data.type = data.type || QuizType.trivia;

  if (typeof data.tags == 'string') {
    data.tags = JSON.parse(data.tags);
  }

  if (typeof data.questions == 'string') {
    data.questions = JSON.parse(data.questions);
  }

  data.questions = data.questions || [];
  data.questionsCount = data.questions.length;
  data.questionaryId = data.questionaryId || null;
  data.userId = data.userId || null;
  data.score = data.score || 0;
  data.state = data.state || AttemptState.new;
  data._correctQuestions = data._correctQuestions || null;
  data._grade = data._grade || GradeState.not_submitted;
  data._score = data._score || '';

  // prepare data for show stadistics in progress
  if (data.state == AttemptState.progress) { 
    const questionsSolved = (data.questions as QuestionDTO[]).filter(ans => ans._answerSelected != null);
    data._questionsSolved = questionsSolved.length;
    const progress = (data._questionsSolved * 100) / data.questionsCount;
    data._progress = `${Math.round( progress )}%`
  }

  // prepare data for evalue
  if (data.state == AttemptState.completed) {
    const questionsSolved = (data.questions as QuestionDTO[]).filter(ans => ans._answerSelected != null);
    data._questionsSolved = questionsSolved.length;
    const progress = (data._questionsSolved * 100) / data.questionsCount;
    data._progress = `${Math.round( progress )}%`
    
    const correctQuestions = (data.questions as QuestionDTO[]).filter(ans => ans.isCorrect);
    data._correctQuestions = correctQuestions.length;
    data._grade = setGrade(data);
    data._score = `${ Math.round(data.score) }%`
  }

  return data;
}

export function queryQuestionaryDTO(data: QuestionaryDTO): QuestionaryDTO {
  data = normalizeQuestionaryDTO(data);
  data.uuid = data.uuid || uuidv4();
  data.questionaryId = data.questionaryId || null;
  data.tags = JSON.stringify(data.tags);
  data.questions = JSON.stringify(data.questions);
  return data;
}

export function queryAttemptDTO(data: AttemptDTO): AttemptDTO {
  data = normalizeAttemptDTO(data);
  data.attemptId = data.attemptId || null;
  data.tags = JSON.stringify(data.tags);
  const _questions = JSON.stringify(data.questions);  
  data.questions = _questions;
  return data;
}

export function setGrade(attempt: AttemptDTO) {
  const total = attempt.questions.length;
  const failing = Math.round(total * 0.60);
  const passing = Math.round(total * 0.70);
  const passing_aceptable = Math.round(total * 0.80);
  const passing_perfect = Math.round(total * 1.00);

  console.log('grades: ', failing, passing, passing_aceptable, passing_perfect);

  const correctAnswer = (attempt.questions as QuestionDTO[]).filter(ans => ans.isCorrect).length;
  if (correctAnswer > 0 && correctAnswer <= failing) {
    return GradeState.failed;
  } else if (correctAnswer > failing && correctAnswer <= passing) {
    return GradeState.barely_passed;
  } else if (correctAnswer > passing && correctAnswer <= passing_aceptable) {
    return GradeState.passed;
  } else if (correctAnswer > passing_aceptable && correctAnswer < passing_perfect) {
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
        [questionaryId] INTEGER PRIMARY KEY AUTOINCREMENT,
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
      WHERE [questionaryId] = ?;
    `
  },

  selectByIdWithRelations: {
    query: `
      SELECT
        q.[questionaryId],
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
      WHERE q.[questionaryId] = ?;
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
        [questionaryId],
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
        :questionaryId,
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
      ON CONFLICT(questionaryId) DO UPDATE SET
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
      WHERE [questionaryId] = :questionaryId
      RETURNING *;
    `
  },
};

export const questionnaire_attempts_table_querys = {
  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [questionnaire_attempts_table] (
        [attemptId] INTEGER PRIMARY KEY AUTOINCREMENT,
        [questionaryId] INTEGER,
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
        FOREIGN KEY ([questionaryId])
          REFERENCES [questionnaire_table] ([questionaryId])
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

  selectAttemptByQuestionaryId: {
    query: `
      SELECT *
      FROM [questionnaire_attempts_table]
      WHERE [questionaryId] = ?;
    `
  },

  selectAttemptById: {
    query: `
      SELECT *
      FROM [questionnaire_attempts_table]
      WHERE [attemptId] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [questionnaire_attempts_table] (
        [questionaryId],
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
      VALUES ( :questionaryId, :userId, :title, :time, :tags, :type, :score, :state, :creationDate, :updatedDate, :questionsCount, :questions )
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [questionnaire_attempts_table] (
        [attemptId],
        [questionaryId],
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
      VALUES ( :attemptId, :questionaryId, :userId, :title, :time, :tags, :type, :score, :state, :creationDate, :updatedDate, :questionsCount, :questions )
      ON CONFLICT(attemptId) DO UPDATE SET
        questionaryId = excluded.[questionaryId], 
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
