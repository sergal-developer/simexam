import { v4 as uuidv4 } from 'uuid';
import { AttemptState, GradeState } from '../../enumerables/enumerables';
import { TransformData } from '../../utils/transformData';

const transform = new TransformData();

//#region INTERFACES
export interface QuizDTO {
  quizId: number;
  uuid?: string;
  title: string;
  time: number;
  creationDate?: number;
  updatedDate?: number;
  startDate?: number;

  // GENERATED
  answers?: QuizAnswerDTO[];

  // varaibles for UI and format
  _showDetails?: boolean;
  _status?: string;
  _current?: boolean;
  _creationDate?: string;
  _updatedDate?: string;
  _startDate?: string;
  _attemptsValue?: string;
  _bestTimeValue?: string;
}

export interface QuizAnswerDTO {
  answerId?: number;
  quizId?: number;
  title: string;
  updatedDate: number;

  // GENERATED
  options?: QuizAnswerOptionDTO[];
  _currentOption?: number | null;
  _answerText?: string | null;

  _selectedAnswer?: number | string;
  _isEvaluated?: boolean;
  _isCorrect?: boolean;
}

export interface QuizAnswerOptionDTO {
  optionId?: number;
  answerId: number;
  content: string;
  optionIndex: number;
  updatedDate: number;
  isCorrect: boolean;

  // GENERATED
  _selected?: boolean;
  _chosenAnswer?: boolean; // @Param: se eleciona cuando el usuario eluje la respuesta en la interfaz
}

export interface AttemptDTO extends QuizDTO {
  attemptId?: number;
  // quizId: number; the filed exist in QuizDTO
  userId: number;
  title: string;
  updatedDate: number;
  startDate?: number;
  score: number;
  state: AttemptState;
  time: number;
  answersLinked: string;

  // GENERATED
  answers?: AttemptAnswerDTO[];
  timeEnlapsed?: number;
  correctAnswers?: number;
  validTotalAnswers?: number;
  grade?: GradeState;
  _updatedDate?: string;
  _startDate?: string;
  _score?: string;
}

export interface AttemptAnswerDTO extends QuizAnswerDTO {
  answerAttemptId?: number;
  attemptId: number;
  //answerId: number; this field exist in QuizAnswerDTO
  selectedOptionId?: number;
  isCorrect: boolean;
  title: string;
  optionsLinked: string;

  // options?: QuizAnswerOptionDTO[]; this field exist in QuizAnswerDTO
}
//#endregion INTERFACES

// #region INITIALIZE
export function getQuizDTO(title: string, time: number): QuizDTO {
  return {
    quizId: null,
    uuid: uuidv4(),
    title: title,
    time: time,
    creationDate: new Date().getTime(),
    updatedDate: new Date().getTime(),
    startDate: new Date().getTime(),

    answers: [],
    _showDetails: false,
    _status: '',
    _current: false,
    _creationDate: '',
    _updatedDate: '',
    _startDate: '',
    _attemptsValue: '',
    _bestTimeValue: ''
  } as QuizDTO;
}

export function getQuizAnswerDTO(title: string): QuizAnswerDTO {
  return {
    answerId: null,
    quizId: null,
    title: title,
    updatedDate: new Date().getTime(),

    options: [],
    _currentOption: null,
    _answerText: null,
    _selectedAnswer: '',
    _isEvaluated: false,
    _isCorrect: false,
  } as QuizAnswerDTO;
}

export function getQuizAnswerOptionDTO(content: string, optionIndex: number): QuizAnswerOptionDTO {
  return {
    optionId: null,
    answerId: null,
    content: content,
    optionIndex: optionIndex,
    updatedDate: new Date().getTime(),
    isCorrect: false,

    _selected: false
  } as QuizAnswerOptionDTO;
}

export function normalizeQuizDTO(quiz: QuizDTO): QuizDTO {
  quiz._attemptsValue = quiz._attemptsValue ?? '-';
  quiz._bestTimeValue = quiz._bestTimeValue ?? '-';
  quiz._creationDate = quiz.creationDate ? transform.toDate(new Date(quiz.creationDate), 'MMM/d/yy h:mm a') : '-';
  quiz._updatedDate = quiz.updatedDate ? transform.toDate(new Date(quiz.updatedDate), 'MMM/d/yy h:mm a') : '-';
  quiz._startDate = quiz.startDate ? transform.toDate(new Date(quiz.startDate), 'MMM/d/yy h:mm a') : '-';

  quiz.answers = quiz.answers || [];
  quiz.answers.map((answer, idxAnswer) => {
    answer.answerId = answer.answerId || null;
    answer.quizId = quiz.quizId || null;
    answer._answerText = `${idxAnswer + 1}`;
    answer.title = answer.title ? answer.title.trim() : '';

    answer.options = answer.options || [];
    answer.options.map((option, idxOptions) => {
      option.answerId = answer.answerId || null;
      option.optionId = option.optionId || null;
      option.optionIndex = idxOptions + 1;
      option.content = option.content ? option.content.trim() : '';
      option.isCorrect = option.isCorrect ? true : false;

      // Generated
      option._selected = option.isCorrect ? true : false;
    });
  });

  return quiz;
}

export function getQuizDTOValid(quiz: QuizDTO): { quiz: QuizDTO, answers: QuizAnswerDTO[], answerOptions: QuizAnswerOptionDTO[] } {
  const _quiz: QuizDTO = {
    quizId: quiz.quizId,
    uuid: quiz.uuid,
    title: quiz.title,
    time: quiz.time || 0,
    creationDate: quiz.creationDate,
    updatedDate: quiz.updatedDate,
    startDate: quiz.startDate || 0,
  };
  const answers = [];
  const answerOptions = [];

  quiz._attemptsValue = quiz._attemptsValue ?? '-';
  quiz._bestTimeValue = quiz._bestTimeValue ?? '-';
  quiz._creationDate = quiz.creationDate ? transform.toDate(new Date(quiz.creationDate), 'MMM/d/yy h:mm a') : '-';
  quiz._updatedDate = quiz.updatedDate ? transform.toDate(new Date(quiz.updatedDate), 'MMM/d/yy h:mm a') : '-';
  quiz._startDate = quiz.startDate ? transform.toDate(new Date(quiz.startDate), 'MMM/d/yy h:mm a') : '-';

  quiz.answers = quiz.answers || [];
  quiz.answers.map((answer, idxAnswer) => {
    answer.answerId = answer.answerId || null;
    answer.quizId = quiz.quizId || null;
    answer._answerText = `${idxAnswer + 1}`;
    answer.title = answer.title ? answer.title.trim() : '';
    if (answer.title != '') {
      answers.push(answer);
    }

    answer.options = answer.options || [];
    answer.options.map((option, idxOptions) => {
      option.answerId = answer.answerId || null;
      option.optionId = option.optionId || null;
      option.optionIndex = idxOptions + 1;
      option.content = option.content ? option.content.trim() : '';

      if (option.content != '') {
        answerOptions.push(option);
      }

    });
  });

  return { quiz: _quiz, answers: answers, answerOptions: answerOptions };
}

export function getAttemptDTO(quizId: number, userId: number, title: string, answers: QuizAnswerDTO[]): AttemptDTO {
  const attemptAnswers = answers ? answers.map(ans => {
    let item: AttemptAnswerDTO = getAttemptAnswerDTO(ans);
    return item;
  }) : [];

  return {
    attemptId: null,
    quizId: quizId,
    userId: userId,
    title: title,
    updatedDate: new Date().getTime(),
    startDate: new Date().getTime(),
    score: 0,
    state: AttemptState.new,
    time: 0,
    answers: attemptAnswers,
    answersLinked: JSON.stringify(attemptAnswers),
    timeEnlapsed: 0,
    correctAnswers: 0,
    validTotalAnswers: 0,
    grade: null,
    _updatedDate: '',
    _startDate: '',
  } as AttemptDTO;
}

export function getAttemptAnswerDTO(answer: QuizAnswerDTO): AttemptAnswerDTO {
  return {
    answerAttemptId: null,
    attemptId: null,
    answerId: answer.answerId,
    selectedOptionId: null,
    isCorrect: false,
    title: answer.title,
    options: answer.options,
    optionsLinked: JSON.stringify(answer.options),
  } as AttemptAnswerDTO;
}

export function getAttemptDTOValid(attempt: AttemptDTO): { attempt: AttemptDTO, answers: AttemptAnswerDTO[] } {
  const _attempt: AttemptDTO = {
    attemptId: attempt.attemptId,
    quizId: attempt.quizId,
    userId: attempt.userId,
    title: attempt.title,
    updatedDate: attempt.updatedDate,
    startDate: attempt.startDate || null,
    score: attempt.score || 0,
    state: attempt.state || AttemptState.new,
    time: attempt.time || 0,
    answersLinked: '',
  };
  const answers: AttemptAnswerDTO[] = [];

  // generated
  _attempt.timeEnlapsed = attempt.timeEnlapsed || 0,
    _attempt.correctAnswers = attempt.correctAnswers || 0,
    _attempt.validTotalAnswers = attempt.validTotalAnswers || 0,
    _attempt.grade = attempt.grade || attempt.state == AttemptState.new || _attempt.state == AttemptState.progress ? GradeState.not_submitted : null,
    _attempt._updatedDate = attempt.updatedDate ? transform.toDate(new Date(_attempt.updatedDate), 'MMM/d/yy h:mm a') : '-';
  _attempt._startDate = attempt.startDate ? transform.toDate(new Date(_attempt.startDate), 'MMM/d/yy h:mm a') : '-';

  _attempt.answers = attempt.answers || [],
    _attempt.answers.map((answer, idxAnswer) => {
      answer.answerAttemptId = answer.answerAttemptId || null;
      answer.attemptId = _attempt.attemptId || null;
      answer.answerId = answer.answerId;
      answer.selectedOptionId = answer.selectedOptionId || null;
      answer.isCorrect = answer.isCorrect || false;
      answer.title = answer.title ? answer.title.trim() : '';
      answer.optionsLinked = answer.optionsLinked || '';

      //Generated 
      answer.options = answer.options || answer.options;
      answer._answerText = `${idxAnswer + 1}`;
      if (answer.title != '') {
        answers.push(answer);
      }

      answer.optionsLinked = JSON.stringify(answer.options);
    });
  // _attempt.answersLinked = JSON.stringify(_attempt.answers);
  _attempt.answersLinked = '';

  return { attempt: _attempt, answers: answers };
}

export function normalizeAttemptDTO(attempt: AttemptDTO): AttemptDTO {
  attempt.timeEnlapsed = attempt.timeEnlapsed || 0;
  attempt.correctAnswers = attempt.correctAnswers || 0;
  attempt.validTotalAnswers = attempt.validTotalAnswers || 0;
  attempt.grade = attempt.grade || GradeState.not_submitted;

  attempt._updatedDate = attempt.updatedDate ? transform.toDate(new Date(attempt.updatedDate), 'MMM/d/yy h:mm a') : '-';
  attempt._startDate = attempt.startDate ? transform.toDate(new Date(attempt.startDate), 'MMM/d/yy h:mm a') : '-';

  attempt.answers = attempt.answers || [];
  attempt.answers.map((answer, idxAnswer) => {
    answer.answerAttemptId = answer.answerAttemptId || null;
    answer.attemptId = answer.attemptId || null;
    answer.answerId = answer.answerId || answer.answerId;
    answer.selectedOptionId = answer.selectedOptionId || null;
    answer.isCorrect = answer.isCorrect || false;
    answer.title = answer.title ? answer.title.trim() : '';
    answer._answerText = `${idxAnswer + 1}`;

    answer.options = answer.options || [];
    answer.options.map((option, idxOptions) => {
      option.answerId = answer.answerId || null;
      option.optionId = option.optionId || null;
      option.optionIndex = idxOptions + 1;
      option.content = option.content ? option.content.trim() : '';
    });
  });

  if (attempt.state == AttemptState.completed) {
    const correctAnswer = attempt.answers.filter(ans => ans.isCorrect);
    attempt.correctAnswers = correctAnswer.length;
    attempt.grade = getGrade(attempt);
  }

  return attempt;
}

export function getGrade(attempt: AttemptDTO) {
  const total = attempt.answers.length;
  const failing = Math.round(total * 0.20);
  const passing = Math.round(total * 0.60);
  const passing_aceptable = Math.round(total * 0.80);
  const passing_perfect = Math.round(total * 1.00);

  const correctAnswer = attempt.answers.filter(ans => ans.isCorrect).length;
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

export const quiz_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [quiz_table] (
        [quizId] INTEGER PRIMARY KEY AUTOINCREMENT,
        [uuid] TEXT,
        [title] TEXT,
        [time] INTEGER,
        [creationDate] INTEGER,
        [updatedDate] INTEGER,
        [startDate] INTEGER
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [quiz_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [quiz_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [quiz_table]
      WHERE [quizId] = ?;
    `
  },

  selectByIdWithRelations: {
    query: `
      SELECT
        q.[quizId],
        q.[uuid],
        q.[title],
        q.[time],
        q.[creationDate],
        q.[updatedDate],
        q.[startDate],

        COALESCE(
          (
            SELECT json_group_array(
              json_object(
                'answerId', a.[answerId],
                'quizId', a.[quizId],
                'title', a.[title],
                'updatedDate', a.[updatedDate],

                'options',
                COALESCE(
                  (
                    SELECT json_group_array(
                      json_object(
                        'optionId', ao.[optionId],
                        'answerId', ao.[answerId],
                        'content', ao.[content],
                        'optionIndex', ao.[optionIndex],
                        'updatedDate', ao.[updatedDate],
                        'isCorrect', ao.[isCorrect]
                      )
                    )
                    FROM [quiz_answer_option_table] ao
                    WHERE ao.[answerId] = a.[answerId]
                  ),
                  json('[]')
                )
              )
            )
            FROM [quiz_answer_table] a
            WHERE a.[quizId] = q.[quizId]
          ),
          json('[]')
        ) AS [answers]

      FROM [quiz_table] q

      WHERE q.[quizId] = ?;
    `
  },

  filterBy: {
    query: `
      SELECT *
      FROM [quiz_table]
      WHERE [title] LIKE '%' || :title || '%';
    `
  },

  post: {
    query: `
      INSERT INTO [quiz_table] (
        [uuid],
        [title],
        [time],
        [creationDate],
        [updatedDate],
        [startDate]
      )
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [quiz_table] (
        [quizId],
        [uuid],
        [title],
        [time],
        [creationDate],
        [updatedDate],
        [startDate]
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(quizId) DO UPDATE SET 
            uuid = excluded.uuid,
            title = excluded.title, 
            time = excluded.time, 
            creationDate = excluded.creationDate, 
            updatedDate = excluded.updatedDate, 
            startDate = excluded.startDate
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [quiz_table]
      WHERE [quizId] = :quizId
      RETURNING *;
    `
  },
};

export const quiz_answer_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [quiz_answer_table] (
        [answerId] INTEGER PRIMARY KEY,
        [quizId] INTEGER,
        [title] TEXT,
        [updatedDate] INTEGER,
        FOREIGN KEY ([quizId])
          REFERENCES [quiz_table] ([quizId])
          ON DELETE CASCADE
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [quiz_answer_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [quiz_answer_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [quiz_answer_table]
      WHERE [answerId] = :answerId;
    `
  },

  selectByQuizId: {
    query: `
      SELECT *
      FROM [quiz_answer_table]
      WHERE [quizId] = :quizId;
    `
  },

  post: {
    query: `
      INSERT INTO [quiz_answer_table] (
        [quizId],
        [title],
        [updatedDate]
      )
      VALUES (?, ?, ?)
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [quiz_answer_table] (
        [answerId],
        [quizId],
        [title],
        [updatedDate]
      ) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(answerId) DO UPDATE SET 
        [quizId] = excluded.quizId,
        [title] = excluded.title,
        [updatedDate] = excluded.updatedDate
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [quiz_answer_table]
      WHERE [answerId] = ?
      RETURNING *;
    `
  }

};

export const quiz_answer_option_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [quiz_answer_option_table] (
        [optionId] INTEGER PRIMARY KEY,
        [answerId] INTEGER,
        [content] TEXT,
        [optionIndex] INTEGER,
        [updatedDate] INTEGER,
        [isCorrect] BOOLEAN,
        FOREIGN KEY ([answerId])
          REFERENCES [quiz_answer_table] ([answerId])
          ON DELETE CASCADE
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [quiz_answer_option_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [quiz_answer_option_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [quiz_answer_option_table]
      WHERE [optionId] = ?;
    `
  },

  selectByAnswerId: {
    query: `
      SELECT *
      FROM [quiz_answer_option_table]
      WHERE [answerId] = ?
      ORDER BY optionIndex ASC;
    `
  },

  filterBy: {
    query: `
      SELECT *
      FROM [quiz_answer_option_table]
      WHERE [answerId] = :answerId;
    `
  },

  post: {
    query: `
      INSERT INTO [quiz_answer_option_table] (
        [answerId],
        [content],
        [optionIndex],
        [updatedDate],
        [isCorrect]
      )
      VALUES ( ?, ?, ?, ?, ?)
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [quiz_answer_option_table] (
          [optionId],
          [answerId],
          [content],
          [optionIndex],
          [updatedDate],
          [isCorrect]
      )
      VALUES ( ?, ?, ?, ?, ?, ?)
      ON CONFLICT(optionId) DO UPDATE SET 
          answerId = excluded.answerId, 
          content = excluded.content, 
          optionIndex = excluded.optionIndex, 
          updatedDate = excluded.updatedDate, 
          isCorrect = excluded.isCorrect
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [quiz_answer_option_table]
      WHERE [optionId] = :optionId
      RETURNING *;
    `
  }

};

export const attempt_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [attempt_table] (
        [attemptId] INTEGER PRIMARY KEY AUTOINCREMENT,
        [quizId] INTEGER,
        [userId] INTEGER,
        [title] TEXT,
        [updatedDate] INTEGER,
        [startDate] INTEGER,
        [score] REAL,
        [state] TEXT,
        [time] INTEGER,
        [answersLinked] TEXT,
        FOREIGN KEY ([quizId])
          REFERENCES [quiz_table] ([quizId])
          ON DELETE CASCADE
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [attempt_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [attempt_table];
    `
  },

  selectByQuizId: {
    query: `
      SELECT
        att.[attemptId],
        att.[quizId],
        att.[userId],
        att.[title],
        att.[updatedDate],
        att.[startDate],
        att.[score],
        att.[state],
        att.[time],
        att.[answersLinked],

        COALESCE(
          (
            SELECT json_group_array(
              json_object(
                'answerAttemptId', attans.[answerAttemptId],
                'attemptId', attans.[attemptId],
                'answerId', attans.[answerId],
                'selectedOptionId', attans.[selectedOptionId],
                'isCorrect', attans.[isCorrect],
                'title', attans.[title],
                'optionsLinked', attans.[optionsLinked]
              )
            )
            FROM [attempt_answer_table] attans
            WHERE attans.[attemptId] = att.[attemptId]
          ),
          json('[]')
        ) AS [answers]

      FROM [attempt_table] att
      WHERE att.[quizId] = ?;
    `
  },

  selectByIdWithRelations: {
    query: `
      SELECT
        att.[attemptId],
        att.[quizId],
        att.[userId],
        att.[title],
        att.[updatedDate],
        att.[startDate],
        att.[score],
        att.[state],
        att.[time],
        att.[answersLinked],

        COALESCE(
          (
            SELECT json_group_array(
              json_object(
                'answerAttemptId', attans.[answerAttemptId],
                'attemptId', attans.[attemptId],
                'answerId', attans.[answerId],
                'selectedOptionId', attans.[selectedOptionId],
                'isCorrect', attans.[isCorrect],
                'title', attans.[title],
                'optionsLinked', attans.[optionsLinked]
              )
            )
            FROM [attempt_answer_table] attans
            WHERE attans.[attemptId] = att.[attemptId]
          ),
          json('[]')
        ) AS [answers]

      FROM [attempt_table] att
      WHERE att.[attemptId] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [attempt_table] (
        [quizId],
        [userId],
        [title],
        [updatedDate],
        [startDate],
        [score],
        [state],
        [time],
        [answersLinked]
      )
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? )
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [attempt_table] (
          [attemptId],
          [quizId],
          [userId],
          [title],
          [updatedDate],
          [startDate],
          [score],
          [state],
          [time],
          [answersLinked]
      )
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
      ON CONFLICT(attemptId) DO UPDATE SET 
            [quizId] = excluded.[quizId], 
            [userId] = excluded.[userId],
            [title] = excluded.[title],
            [updatedDate] = excluded.[updatedDate], 
            [startDate] = excluded.[startDate], 
            [score] = excluded.[score],
            [state] = excluded.[state],
            [time] = excluded.[time],
            [answersLinked] = excluded.[answersLinked]
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [attempt_table]
      WHERE [attemptId] = :attemptId
      RETURNING *;
    `
  },
};

export const attempt_answer_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [attempt_answer_table] (
        [answerAttemptId] INTEGER PRIMARY KEY AUTOINCREMENT,
        [attemptId] INTEGER,
        [answerId] INTEGER,
        [selectedOptionId] INTEGER,
        [isCorrect] BOOLEAN,
        [title] TEXT,
        [optionsLinked] TEXT,

        FOREIGN KEY ([attemptId])
          REFERENCES [attempt_table] ([attemptId])
          ON DELETE CASCADE,

        FOREIGN KEY ([answerId])
          REFERENCES [quiz_answer_table] ([answerId]),

        FOREIGN KEY ([selectedOptionId])
          REFERENCES [quiz_answer_option_table] ([optionId])
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [attempt_answer_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [attempt_answer_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [attempt_answer_table]
      WHERE [answerAttemptId] = ?;
    `
  },

  selectByAttemptId: {
    query: `
      SELECT *
      FROM [attempt_answer_table]
      WHERE [attemptId] = ?;
    `
  },

  filterBy: {
    query: `
      SELECT *
      FROM [attempt_answer_table]
      WHERE [attemptId] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [attempt_answer_table] (
        [attemptId],
        [answerId],
        [selectedOptionId],
        [isCorrect],
        [title],
        [optionsLinked]
      )
      VALUES (:attemptId, :answerId, :selectedOptionId, :isCorrect, :title, :optionsLinked)
      ON CONFLICT(answerAttemptId) DO UPDATE SET 
            [attemptId] = excluded.[attemptId], 
            [answerId] = excluded.[answerId], 
            [selectedOptionId] = excluded.[selectedOptionId], 
            [isCorrect] = excluded.[isCorrect],
            [optionsLinked] = excluded.[optionsLinked]
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [attempt_answer_table] (
        [answerAttemptId],
        [attemptId],
        [answerId],
        [selectedOptionId],
        [isCorrect],
        [title],
        [optionsLinked]
      )
      VALUES (:attempt_answer_table, :attemptId, :answerId, :selectedOptionId, :isCorrect, :title, :optionsLinked)
      ON CONFLICT(answerAttemptId) DO UPDATE SET 
            [attemptId] = excluded.[attemptId], 
            [answerId] = excluded.[answerId], 
            [selectedOptionId] = excluded.[selectedOptionId], 
            [isCorrect] = excluded.[isCorrect],
            [title] = excluded.[title],
            [optionsLinked] = excluded.[optionsLinked]
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [attempt_answer_table]
      WHERE [answerAttemptId] = ?
      RETURNING *;
    `
  }

};
