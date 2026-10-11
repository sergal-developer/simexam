import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation, } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from 'lucide';
import { AnswerDTO, AttemptDTO, getAnswerDTO, getQuestionDTO, normalizeQuestionaryDTO, QuestionaryDTO, QuestionDTO } from 'src/app/shared/data/entities/dtos';
import { UITypeStatus } from 'src/app/shared/data/entities/dtos/ui.dto';
import { QuizType } from 'src/app/shared/data/enumerables/enumerables';
import { DigitRange, Generator, MathOperators, MathQuestion } from 'src/app/shared/data/utils/generator.services';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'type-generic',
  templateUrl: './type-generic.html',
  encapsulation: ViewEncapsulation.None,
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypeGenericComponent implements OnInit {
  //#region INPUTS / OUTPUTS
  @Input() questionary: QuestionaryDTO = null;
  @Input() translateLabels: { [key: string]: string } = {};
  @Output() onChange = new EventEmitter();
  //#endregion INPUTS / OUTPUTS

  //#region INTERNAL
  index = 0;
  luIcon = {
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    register: icons.UserPlus,
    back: icons.ArrowLeft,
    save: icons.SaveAll,
    trash: icons.Trash,

    counter: icons.TableProperties,
    question: icons.Asterisk,
    questionCorrect: icons.CircleCheck,
    answer: icons.MessageCircleReply,
    explanation: icons.MessageSquareWarning,
    hint: icons.Info,
    time: icons.Timer,
    answers: icons.ListTodo,
    addAnswers: icons.MessageCirclePlus,
    check: icons.Check,

    operationPlus: icons.Plus,
    operationMinus: icons.Minus,
    operationDivide: icons.Divide,
    operationMultiplication: icons.X,
  };

  formQuestion: FormGroup = new FormGroup({
    question: new FormControl('', Validators.required),
    answer: new FormControl(''),
    explanation: new FormControl(''),
    hint: new FormControl(''),
    time: new FormControl(''),
    answers: new FormControl([]),
  });

  formMathQuest: FormGroup = new FormGroup({
    min: new FormControl(1, Validators.required),
    max: new FormControl(2, Validators.required),
    levels: new FormControl(10, Validators.required),
  });

  formControl = {
    showQuestion: false,
    showAnswer: false,
    showExplanation: false,
    showHint: false,
    showTime: false,
    showAnswers: false,
    showPopular: false,
  }

  _generator = new Generator()

  // varaibles only for math quests
  mathOperators: MathOperators = {
    plus: true,
    minus: true,
    divide: true,
    multiplication: true,
  };
  digitRange: DigitRange = {
    min: 1,
    max: 2,
  };
  mathLevels = 10;

  mathQuestions: MathQuestion = {
    operation: '',
    result: [],
    estimatedTime: 10,
  };

  //#endregion INTERNAL

  //#region LIFECICLE
  constructor(private commonServices: CommonServices,
    private uiServices: UiServices,
    private fb: FormBuilder,
    private translate: TranslateService) { }

  async ngOnInit() {
    this.init();
  }
  //#endregion LIFECICLE

  //#region DATA
  async init() {
    this.index = 0;
    console.log('this.index: ', this.index);
    this.setCurrentQuestion();
    this.setupQuestionaryType();
  }

  async setQuestionary(questionary: QuestionaryDTO) {
    this.questionary = questionary;
    this.setupQuestionaryType();
    this.setCurrentQuestion();
  }

  setCurrentQuestion() {
    const question = (this.questionary.questions[this.index] as QuestionDTO);
    this.formQuestion = this.fb.group({
      question: [question.question],
      answer: [question.answer],
      explanation: [question.explanation],
      hint: [question.hint],
      time: [question.time],
      answers: [],
    });
    this.setAnswersFormOfQuestion();
  }

  setAnswersFormOfQuestion() {
    const question = (this.questionary.questions[this.index] as QuestionDTO);
    const _answers = question.answers ? question.answers : [];

    /*
    if (this.questionary.type == QuizType['true-false']) {
      const _answersArray = [
        getAnswerDTO(this.translateLabels['form_value_true'], null),
        getAnswerDTO(this.translateLabels['form_value_false'], null),
      ]
      _answersArray[0].isCorrect = true;
      question.answers.push(..._answersArray);

    } else if (this.questionary.type == QuizType.popularity) {
      const _answersArray = [
        getAnswerDTO('', null, 100),
        getAnswerDTO('', null, 75),
        getAnswerDTO('', null, 30),
        getAnswerDTO('', null, 10),
        getAnswerDTO('', null, null)
      ]
      question.answers.push(..._answersArray);
    } else {
      question.answers.push(_answers);
    }
    */

    const answersArray = [];
    if (_answers.length) {
      _answers.map(answer => {
        answersArray.push(this.createNewAnswerForm(answer));
      })
    }
    this.formQuestion.setControl('answers', this.fb.array(answersArray));
  }

  setupQuestionaryType() {
    if (this.questionary.type == QuizType.trivia) {
      this.setFormControl({ question: true, answers: true });
    }
    if (this.questionary.type == QuizType.simple) {
      this.setFormControl({ question: true, answer: true })
    }
    if (this.questionary.type == QuizType['true-false']) {
      this.setFormControl({ question: true, answers: true });
    }
    if (this.questionary.type == QuizType.popularity) {
      this.setFormControl({ question: true, answers: true, popular: true, time: true });
    }
    if (this.questionary.type == QuizType.reading) {
      this.setFormControl({ explanation: true, time: true })
    }
    if (this.questionary.type == QuizType['math-quest']) {
      this.setFormControl({ question: true, answers: true, time: true });
    }
  }

  private async updateQuestionaryPosition(options: { updateData: boolean, finish: boolean }) {
    this.questionary.updatedDate = new Date().getTime();
    this.setCurrentQuestion();
    this.emitQuestionary(options.updateData);
  }

  private emitQuestionary(savedata: boolean) {
    console.log('emitQuestionary: ', savedata);
    const event: UITypeStatus = {
      index: this.index,
      questionary: normalizeQuestionaryDTO(this.questionary),
      savedata: savedata,
    }
    this.onChange.emit(event);
  }

  canEnableNext() {
    const values = this.formQuestion.value;
    let valid = false;
    let valueSelected = false

    if (this.questionary.type == QuizType.trivia || this.questionary.type == QuizType['true-false']) {
      valueSelected = values.answers.length ? values.answers.find((answer) => answer.isCorrect) : false;
      valid = (values.question && values.question.length) && valueSelected;

    } else if (this.questionary.type == QuizType.simple) {
      valid = (values.question && values.question.length) && (values.answer && values.answer.length);

    } else if (this.questionary.type == QuizType.popularity) {
      const popular = values.answers.length ? values.answers.find((answer) => answer.popular) : false;
      valid = (values.question && values.question.length) && popular;

    } else if (this.questionary.type == QuizType.reading) {
      valid = (values.explanation && values.explanation.length) && values.time != null;

    } else if (this.questionary.type == QuizType['math-quest']) {
      valueSelected = values.answers.length ? values.answers.find((answer) => answer.isCorrect) : false;
      valid = (values.question && values.question.length) && valueSelected && values.time != null;
    }

    // if return true disable button 
    return !valid;
  }

  canGenerateMathQuest() {
    let valid = false;

    const operatorsInvalid =
      !this.mathOperators.plus && !this.mathOperators.minus &&
      !this.mathOperators.divide && !this.mathOperators.multiplication;

    const digitInvalid = this.digitRange.min <= 0 || this.digitRange.max <= 0 || this.mathLevels <= 0;

    const digitEquivalencyInvalid = this.digitRange.max < this.digitRange.min;

    valid = operatorsInvalid || digitInvalid || digitEquivalencyInvalid;

    // if return true disable button 
    return valid;
  }

  getTotalQuestions() {
    return `${this.questionary.questions.length}`;
  }

  generateMathQuest() {
    const mathQuestions = this._generator.generateMathQuest(this.mathOperators, this.digitRange, this.mathLevels);

    const questions: QuestionDTO[] = [];
    mathQuestions.map(math => {
      const answers = [];
      math.result.map((res, idx) => {
        const answer = getAnswerDTO(`${res.value}`, idx + 1, null);
        answer.isCorrect = res.isCorrect;
        answers.push(answer);
      });

      const question = getQuestionDTO(math.operation, null, null, null, math.estimatedTime);
      question.answers = answers;
      questions.push(question);
    });

    const currentQuestion = (this.questionary.questions as QuestionDTO[])[this.index];
    if (currentQuestion.question == '') {
      (this.questionary.questions as QuestionDTO[]).pop();
    }

    (this.questionary.questions as QuestionDTO[]).push(...questions);
    this.questionary = normalizeQuestionaryDTO(this.questionary);
    this.setCurrentQuestion();
  }
  //#endregion DATA

  //#region EVENTS
  toogleFormControl(control: 'showQuestion' | 'showAnswer' | 'showExplanation' | 'showHint' | 'showTime' | 'showAnswers') {
    this.formControl[control] = !this.formControl[control];
  }

  resetQuestionary(index = 0) {
    this.index = index;
    this.questionary.questions = [];

    this.createNewQuestionForm();
    this.setCurrentQuestion();
  }

  prev() {
    if (this.index != 0) {
      this.index--;
      this.updateQuestionaryPosition({ finish: false, updateData: false });
    }
  }

  next() {
    this.index++;
    if (this.index >= this.questionary.questions.length) {
      this.createNewQuestionForm();
    }
    this.updateQuestionaryPosition({ finish: false, updateData: false });
  }

  saveData() {
    this.updateQuestionaryPosition({ finish: true, updateData: true });
  }

  onInputChange(evt: { control: string, value: any }, index: number = null) {
    this.synchronizeFormToQuestionary();
    if (evt.control == 'answer' && index != null) {
      const answers = (this.questionary.questions[this.index] as QuestionDTO).answers;
      const lastIndex = answers.length ? answers.length - 1 : null;
      if (lastIndex != null && answers[answers.length - 1].answer != '') {
        (this.questionary.questions[this.index] as QuestionDTO).answers.push(getAnswerDTO('', 0));
        this.getFormAnswers().push(this.createNewAnswerForm());
      }
    }
  }

  onInputChangeMathQuest(evt) {
    const value = this.formMathQuest.value;
    this.mathLevels = value.levels;
    this.digitRange.min = value.min;
    this.digitRange.max = value.max;
  }

  updateOperation(operator: 'plus' | 'minus' | 'divide' | 'multiplication') {
    this.mathOperators[operator] = !this.mathOperators[operator];
  }

  private getFormAnswers(): FormArray {
    return this.formQuestion.get('answers') as FormArray;
  }

  setCorrectAnswer(answer, index) {
    this.getFormAnswers().controls.map((ctrl, idx) => {
      ctrl.get('isCorrect').setValue(idx == index)
    });

    this.synchronizeFormToQuestionary();
  }

  deleteAnswer(index) {
    const controls = this.getFormAnswers().controls.filter((ctrl, idx) => {
      return idx != index;
    });
    this.formQuestion.setControl('answers', this.fb.array(controls));
  }
  //#endregion EVENTS

  //#region CONVERTERS
  createNewQuestionForm() {
    const _questions = (this.questionary.questions as QuestionDTO[]);
    const _answers = getAnswerDTO('', null);
    const question = getQuestionDTO('', '', '', '', null);

    if (this.questionary.type == QuizType['true-false']) {
      const _answersArray = [
        getAnswerDTO(this.translateLabels['form_value_true'], null),
        getAnswerDTO(this.translateLabels['form_value_false'], null),
      ]
      _answersArray[0].isCorrect = true;
      question.answers.push(..._answersArray);

    } else if (this.questionary.type == QuizType.popularity) {
      const _answersArray = [
        getAnswerDTO('', null, 100),
        getAnswerDTO('', null, 75),
        getAnswerDTO('', null, 30),
        getAnswerDTO('', null, 10),
        getAnswerDTO('', null, null)
      ]
      question.answers.push(..._answersArray);
    } else {
      question.answers.push(_answers);
    }

    _questions.push(question);
    // normalize values
    this.questionary = normalizeQuestionaryDTO(this.questionary);
  }

  createNewAnswerForm(answerValue?: AnswerDTO) {
    const question = (this.questionary.questions[this.index] as QuestionDTO);
    const _answer = getAnswerDTO('', question.answers.length + 1, null);

    if (!answerValue) {
      const length = this.formQuestion ? this.formQuestion.value.answers && this.formQuestion.value.answers.length : 0;
      _answer.answerId = length + 1;
    } else {
      _answer.answerId = answerValue.answerId;
      _answer.answer = answerValue.answer;
      _answer.popular = answerValue.popular;
      // GENERATED
      _answer.isCorrect = answerValue.isCorrect;
      _answer._selected = answerValue._selected;
    }
    return this.fb.group(_answer)
  }

  synchronizeFormToQuestionary() {
    const values = this.formQuestion.value;
    // get and save values of questonarie
    const join = { ...(this.questionary.questions[this.index] as QuestionDTO), ...values };
    (this.questionary.questions[this.index] as QuestionDTO) = join;
    this.questionary = normalizeQuestionaryDTO(this.questionary);
  }

  async setFormControl(options?:
    {
      question?: boolean, answer?: boolean, explanation?: boolean,
      hint?: boolean, time?: boolean, answers?: boolean, popular?: boolean
    }
  ) {
    if (options == undefined) {
      options = { question: false, answer: false, explanation: false, hint: false, time: false, answers: false, popular: false };
    }
    this.formControl.showQuestion = options.question ?? false;
    this.formControl.showAnswer = options.answer ?? false;
    this.formControl.showExplanation = options.explanation ?? false;
    this.formControl.showHint = options.hint ?? false;
    this.formControl.showTime = options.time ?? false;
    this.formControl.showAnswers = options.answers ?? false;
    this.formControl.showPopular = options.popular ?? false;
  }

  async wait(miliseconds: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, miliseconds);
    });
  }
  //#endregion CONVERTERS

}
