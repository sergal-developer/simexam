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
  time: number;
  isCorrect?: boolean;

  // GENERATED
  answers?: AnswerDTO[];

  // variables for UI and format
  answerSelected?: number;

  // for cards and reading
  _flip?: boolean;
  _hasFlipped?: boolean;
  _startEditTime?: number;
  _endEditTime?: number;
  _totalTime?: logTimeDTO;
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

  // calculate for cards progress and read
  _solutionTimeIntervals?: any[],
  _startTotalTime?: number,
  _endTotalTime?: number,
  _totalTime?: logTimeDTO;
}

export interface logTimeDTO {
  days: number,
  hours: number,
  minutes: number,
  seconds: number,
  miliseconds: number,
  highestMs: string,
  format: string
}

//#endregion INTERFACES

// #region INITIALIZE
export function getNewQuestionary(title: string, type: string, options: {
  question: string, answer?: string, explanation?: string, hint?: string, time?: number,
  answerText: string
}): QuestionaryDTO {
  const answer = getAnswerDTO(options.answerText, 0, 0);
  const _question = getQuestionDTO(options.question, options.answer, options.explanation, options.hint, options.time);
  _question.answers.push(answer);
  const questionary = getQuestionaryDTO(title, type);

  (questionary.questions as QuestionDTO[]).push(_question);
  return normalizeQuestionaryDTO(questionary);
}

export function getQuestionaryDTO(title: string, type: string): QuestionaryDTO {
  const item = {
    questionaryId: null,
    uuid: uuidv4(),
    title: title,
    type: type,
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

export function getQuestionDTO(question: string, answer?: string, explanation?: string, hint?: string, time?: number): QuestionDTO {
  const item = {
    questionId: null,
    question: question,
    answer: answer,
    explanation: explanation,
    hint: hint,
    tags: [],
    time: time,
    answerSelected: null,
    isCorrect: null,
    answers: [],
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
    question.answerSelected = null;
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

    question.answerSelected = question.answerSelected || null;
    question.isCorrect = question.isCorrect || null;

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
  if (data.state == AttemptState.new || data.state == AttemptState.progress) {
    data =
      data.type == QuizType['math-quest'] ? processAttemptTypeMathQuest(data) :
        data.type == QuizType.popularity ? processAttemptTypePopularity(data) :
          data.type == QuizType.reading ? processAttemptTypeReading(data) :
            data.type == QuizType.simple ? processAttemptTypeSimple(data) :
              data.type == QuizType.trivia ? processAttemptTypeTrivia(data) :
                data.type == QuizType['true-false'] ? processAttemptTypeTrueFalse(data) : data;
  }

  // prepare data for evalue
  if (data.state == AttemptState.completed) {
    data = data.type == QuizType.trivia ? evalueAttemptByTypeTrivia(data) :
      data.type == QuizType['math-quest'] ? evalueAttemptByTypeTrivia(data) :
        data.type == QuizType['true-false'] ? evalueAttemptByTypeTrivia(data) :
          data.type == QuizType.simple ? evalueAttemptByTypeSimple(data) :
            data.type == QuizType.reading ? evalueAttemptByTypeReading(data) :
              data.type == QuizType.popularity ? evalueAttemptByTypePopularity(data) : data;

  }

  return data;
}

// the nexts functions prepare data to show stadistics for each type
function processAttemptTypePopularity(data: AttemptDTO): AttemptDTO {
  const questionsSolved = (data.questions as QuestionDTO[]).filter(ans => ans.answerSelected != null);
  data._questionsSolved = questionsSolved.length;
  const progress = (data._questionsSolved * 100) / data.questionsCount;
  data._progress = `${Math.round(progress)}%`;
  return data;
}

function processAttemptTypeReading(data: AttemptDTO): AttemptDTO {
  const questionsSolved = (data.questions as QuestionDTO[]).filter(ans => ans.answerSelected != null);
  data._questionsSolved = questionsSolved.length;
  const progress = (data._questionsSolved * 100) / data.questionsCount;
  data._progress = `${Math.round(progress)}%`;
  return data;
}

function processAttemptTypeSimple(data: AttemptDTO): AttemptDTO {
  const questions = (data.questions as QuestionDTO[]);
  questions.map(question => {
    if (question._startEditTime && question._endEditTime) {
      question._totalTime = calculateDiffBetweenDates(question._startEditTime, question._endEditTime);
    }
  });

  const questionsSolved = questions.filter(question => question._hasFlipped == true);
  data._questionsSolved = questionsSolved.length;
  const progress = (data._questionsSolved * 100) / data.questionsCount;
  data._progress = `${Math.round(progress)}%`;


  return data;
}

function processAttemptTypeTrivia(data: AttemptDTO): AttemptDTO {
  const questionsSolved = (data.questions as QuestionDTO[]).filter(ans => ans.answerSelected != null);
  data._questionsSolved = questionsSolved.length;
  const progress = (data._questionsSolved * 100) / data.questionsCount;
  data._progress = `${Math.round(progress)}%`;
  return data;
}

function processAttemptTypeTrueFalse(data: AttemptDTO): AttemptDTO {
  return processAttemptTypeTrivia(data);
}

function processAttemptTypeMathQuest(data: AttemptDTO): AttemptDTO {
  return processAttemptTypeTrivia(data);
}

function evalueAttemptByTypeTrivia(attempt: AttemptDTO): AttemptDTO {
  let questions = (attempt.questions as QuestionDTO[]);
  questions = questions.map(question => {
    const _answer = question.answers.find(answer => answer._selected);
    question.isCorrect = _answer && _answer.isCorrect ? true : false;
    return question;
  });

  const correctQuestions = (attempt.questions as QuestionDTO[]).filter(ans => ans.isCorrect);
  attempt._correctQuestions = correctQuestions.length;
  attempt._grade = setGrade(attempt);
  attempt.score = getScoreAttempt(attempt);
  attempt._score = `${Math.round(attempt.score)}%`;
  return attempt;
}

function evalueAttemptByTypeSimple(attempt: AttemptDTO): AttemptDTO {
  const questions = (attempt.questions as QuestionDTO[]);
  const startTime = questions[0]._startEditTime;
  const endTime = questions[questions.length - 1]._endEditTime;
  questions.map(question => {
    if (question._startEditTime && question._endEditTime) {
      question._totalTime = calculateDiffBetweenDates(question._startEditTime, question._endEditTime);
    }
  });

  attempt._correctQuestions = questions.length;
  attempt._grade = GradeState.finished;
  attempt._score = `${Math.round(attempt.score)}%`;
  attempt._startTotalTime = startTime;
  attempt._endTotalTime = endTime;
  attempt._totalTime = startTime && endTime ? calculateDiffBetweenDates(startTime, endTime) : null;

  return attempt;
}

function evalueAttemptByTypeReading(attempt: AttemptDTO): AttemptDTO {
  attempt.state = AttemptState.completed;
  return attempt;
}

function evalueAttemptByTypePopularity(attempt: AttemptDTO): AttemptDTO {
  attempt.state = AttemptState.completed;
  return attempt;
}

function calculateDiffBetweenDates(startDate: number, endDate: number): logTimeDTO {
  const diffMs = endDate - startDate;
  const msSeconds = Math.floor(diffMs / 1000);
  const msMinutes = Math.floor(diffMs / (1000 * 60));
  const msHours = Math.floor(diffMs / (1000 * 60 * 60));
  const msDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const format = msDays != 0 ? `${msDays} d, ${msHours} h, ${msMinutes} min, ${msSeconds} seg` :
    msHours != 0 ? `${msHours} h, ${msMinutes} min, ${msSeconds} seg` :
      msMinutes != 0 ? `${msMinutes} min, ${msSeconds} seg` :
        msSeconds != 0 ? `${msSeconds} seg` : '-';

  const highestMs = msDays != 0 ? 'days' :
    msHours != 0 ? 'hours' :
      msMinutes != 0 ? 'minutes' :
        msSeconds != 0 ? 'seconds' : 'miliseconds';

  return {
    days: msDays,
    hours: msHours,
    minutes: msMinutes,
    seconds: msSeconds,
    miliseconds: diffMs,
    highestMs: highestMs,
    format: format
  }
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

function getScoreAttempt(attempt: AttemptDTO) {
  const total = attempt.questions.length;
  const correctAnswer = (attempt.questions as QuestionDTO[]).filter(ans => ans.isCorrect).length;
  return Math.round((correctAnswer / total) * 100);
}

function setGrade(attempt: AttemptDTO) {
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
      SELECT *
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
        [tags],
        [type],
        [creationDate],
        [updatedDate],
        [questionsCount],
        [questions]
      )
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [questionnaire_table] (
        [questionaryId],
        [uuid],
        [title],
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
        [tags],
        [type],
        [score],
        [state],
        [creationDate],
        [updatedDate],
        [questionsCount],
        [questions]
      )
      VALUES ( :questionaryId, :userId, :title, :tags, :type, :score, :state, :creationDate, :updatedDate, :questionsCount, :questions )
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
        [tags],
        [type],
        [score],
        [state],
        [creationDate],
        [updatedDate],
        [questionsCount],
        [questions]
      )
      VALUES ( :attemptId, :questionaryId, :userId, :title, :tags, :type, :score, :state, :creationDate, :updatedDate, :questionsCount, :questions )
      ON CONFLICT(attemptId) DO UPDATE SET
        questionaryId = excluded.[questionaryId], 
        userId = excluded.[userId], 
        title = excluded.[title],
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
