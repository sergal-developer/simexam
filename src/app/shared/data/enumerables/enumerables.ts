export enum EVENTS {
    CONFIG = 'config',
    SCREENS = 'screen'
}

export enum ScreenEnum {
    splash = 'splash',
    register = 'register',
    dashboard = 'dashboard',

    settings = 'settings',
    quiz = 'quiz',
    quizselection = 'quizselection',
    quizcreate = 'quizcreate',
    quizedit = 'quizedit',
    attemptevalue = 'attemptevalue',
    attemptreview = 'attemptreview',
    quizresults = 'quizresults',
    dbclient = 'dbclient',

    
    exam = 'exam',
    create = 'create',
    admin = 'admin',
    edit = 'edit',
    profile = 'profile',
    home = 'home',
    game = 'game',
}

export enum GamesEnum {
    ColorNumbers = 'ColorNumbers',
    Comparison = 'Comparison',
    ConnectDots = 'ConnectDots',
    Count = 'Count',
    FriendsNumbers = 'FriendsNumbers',
    Hanged = 'Hanged',
    MathematicsExam = 'MathematicsExam',
    Memory = 'Memory',
    Packages = 'Packages',
    Patterns = 'Patterns',
    Puzzle = 'Puzzle',
    ReadingSpeed = 'ReadingSpeed',
    WarOfWords = 'WarOfWords',
}

export enum OperationTypeEnum {
    addition = 'addition',
    subtraction = 'subtraction',
    multiplication = 'multiplication',
    division = 'division',
    mix = 'mix',
    words = 'words',
}

export enum GamesStatus {
    new = 'new',
    progress = 'progress',
    completed = 'completed',
}