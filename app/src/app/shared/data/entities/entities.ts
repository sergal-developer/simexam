import { AttemptState, GradeState } from "../enumerables/enumerables";

export interface ProfileEntity {
  id?: string;
  userName: string;
  age?: number;
  avatar?: {
    url: string,
    body?: string,
  }
  current: boolean,
}

export interface SettingsEntity {
  id?: string;
  language: string;
  permissions: {
    create: boolean,
    duplicate: boolean,
    edit: boolean,
    delete: boolean,
    ai: boolean,
  }

  availableLanguages: LanguageEntity[];
  premium: boolean,
  colors?: Array<any>;
  theme?: string;
  themeProps: {
    light: ThemeProps,
    dark: ThemeProps
  }
}

export interface LanguageEntity {
  value: string;
  name: string;
}


export interface OptionEntity {
  id: number;
  text: string;
  letter?: string
  selected?: boolean
  correctAnswer?: boolean | null
}

export interface AnswerEntity {
  id?: number;
  question: string;
  options: OptionEntity[];
  correctAnswer?: number
  answerText: string | null;
  selectedAnswer?: number | string;
  isEvaluated?: boolean;
  isCorrect?: boolean;
}

export interface QuizEntity {
  id?: string;
  title: string;
  questions: AnswerEntity[];
  time: number;

  creationDate: number;
  updatedDate: number;
  startDate?: number;

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

export interface AttemptEntity extends QuizEntity {
  attemptId: string;
  state: AttemptState;
  score: number;

  _score?: string;
  timeEnlapsed?: number;
  grade?: GradeState;
  correctAnswers?: number;
  validTotalAnswers?: number;
}


export interface ThemeProps {
  appBackground?: String;
  appColor?: String;
  appFontSize?: String;
  textFontSize?: String;

  primary?: String;
  primaryBackground?: String;
  primaryBackgroundHover?: String;
  primaryColor?: String;

  secondary?: String;
  secondaryBackground?: String;
  secondaryBackgroundHover?: String;
  secondaryBackgroundAlterHover?: String;
  secondaryColor?: String;

  accent?: String;
  accentBackground?: String;
  accentBackgroundHover?: String;
  accentColor?: String;

  scrollColor?: String;
  scrollBackground?: String;

  formErrorColor?: String;
  formBackground?: String;
  formBackgroundSolid?: String;

  notificationColor?: String;
  notificationColorContrast?: String;
  notificationSuccess?: String;
  notificationWarning?: String;
  notificationError?: String;
  notificationInfo?: String;

  gradeBackgroundPassed?: String;
  gradeColorPassed?: String;
  gradeBackgroundFailed?: String;
  gradeColorFailed?: String;
  gradeBackgroundBarely?: String;
  gradeColorBarely?: String;

  gradePanelPassed?: String;
  gradePanelFailed?: String;
  gradePanelBarely?: String;


  pillBackground?: String;
  pillColor?: String;
  rootHeroBackground?: String;
  timerBarBackground?: String;
  timerBarContainerBackground?: String;
  statusBackground?: String;

  answerBorderColor?: String;
  answerSelectedColor?: String;
  answerSelectedBackground?: String;
  answerCorrectColor?: String;
  answerCorrectColorText?: String;
  answerCorrectBorderColor?: String;
  answerCorrectBackground?: String;
  answerIncorrectColor?: String;
  answerIncorrectBackground?: String;
  answerIncorrectBorderColor?: String;

  grayBackdropBackground?: String;
  borderColorTransparent?: String;
  matLabelBackground?: String;
  matLabelContrastBackground?: String;
  itemOptionBorder?: String;
  stadisticBackground?: String;

  zoomLevel?: String;
}

export interface LogEntity {
  id?: string;
  date?: number,
  content: any,
  type?: string
}