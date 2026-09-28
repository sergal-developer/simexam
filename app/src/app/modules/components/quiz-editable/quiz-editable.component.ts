import { Component, Input, OnInit, ViewEncapsulation, } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from 'lucide';
import { getQuestionDTO, getAnswerDTO, getQuestionaryDTO, normalizeQuestionaryDTO, QuestionDTO, AnswerDTO, QuestionaryDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
import { Utils } from 'src/app/shared/data/utils/utils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { UiServices } from 'src/app/shared/services/ui.services';

@Component({
  selector: 'quiz-editable',
  templateUrl: './quiz-editable.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizEditableComponent implements OnInit {
  @Input() quizId: number = null;

  //#region INTERNAL
  form: FormGroup;

  formQuestion: FormGroup = new FormGroup({
    answerId: new FormControl(null),
    quizId: new FormControl(null),
    title: new FormControl('', Validators.required),
    options: new FormControl([], Validators.required),
  })

  formIAGenerated: FormGroup = new FormGroup({
    topic: new FormControl('', Validators.required),
    answquestionserTitle: new FormControl(2, Validators.required),
    options: new FormControl(4, Validators.required),
  })

  options: any = [];
  quiz: QuestionaryDTO = null;
  currentAnswer: QuestionDTO = null;
  currentAnswerIndex = 0;

  translateLabels = {
    new_quiz: '',
    form_time: '',
    service_fail_generate: '',
    service_fail_get: '',
    service_sucess_save: '',
    generation_questions: '',
    service_sucess_generation: '',
    service_fail_update: '',
    generation_questions_questions: '',
    ia_subtitle: '',
    answer_text_default: '',
    answer_option_text_default: '',
    answer_option_correct_text_default: '',
  };

  durationFormShow = false;
  showIAForm = false;
  loadingDataAi = false;
  settings: SettingsDTO = null;
  isEdit = false;
  _helper = new Utils();

  luIcon = {
    language: icons.Globe,
    user: icons.UserRound,
    avatar: icons.SquareUserRound,
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    register: icons.UserPlus,
    back: icons.ArrowLeft,
    save: icons.SaveAll
  }
  //#endregion INTERNAL

  constructor(private commonServices: CommonServices,
    private uiServices: UiServices,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
  }

  async ngOnInit() {
    this.uiServices.showLoader(true);
    this.setupLanguage(() => {
      this.setupComponent();
    });
  }

  async setupLanguage(next) {
    this.settings = await this.commonServices.getCurrentSettings();
    this.translate.setDefaultLang(this.settings.language);
    const keys = Object.keys(this.translateLabels);
    this.translate.get(keys).subscribe((res) => {
      this.translateLabels = res;
      next();
    });
  }

  //#region DATA
  async setupComponent(injectData?: QuestionaryDTO) {
    this.currentAnswerIndex = 0;
    this.isEdit = this.quizId ? true : false;
    this.formIAGenerated = this.fb.group({
      topic: ['', Validators.required],
      questions: [2, Validators.required],
      options: [4, Validators.required],
    });

    this.form = this.fb.group({
      title: [this.translateLabels.new_quiz, Validators.required],
      time: [''],
    });

    this.durationFormShow = false;

    this.quiz = getQuestionaryDTO('', 0);
    this.quiz.questions = [this.getNewQuestionForm()];


    if (this.quizId) {
      const _quiz = await this.commonServices.getQuestionaryById(this.quizId);

      if (!this.quiz) {
        this.uiServices.notification(this.translateLabels.service_fail_get, { type: 'error', closeTimer: 3000 });
        this.uiServices.showLoader(false);
        return;
      }

      this.quiz = normalizeQuestionaryDTO(_quiz);
    }

    this.setCurrentAnswer();
    this.uiServices.showLoader(false);
  }

  setCurrentAnswer() {
    const answerItem = (this.quiz.questions[this.currentAnswerIndex] as QuestionDTO);

    const optionArray = [];
    answerItem.answers.map(opt => {
      optionArray.push(this.getNewOptionForm(opt))
    });

    const optionEmpty = answerItem.answers[answerItem.answers.length - 1].answer !== '';
    if (optionEmpty) {
      optionArray.push(this.getNewOptionForm())
    }

    this.formQuestion = this.fb.group({
      answerId: [answerItem.questionId],
      title: [answerItem.question],
      options: this.fb.array(optionArray)
    });
  }

  getFormOptions(): FormArray {
    return this.formQuestion.get('options') as FormArray;
  }

  get validActions(): boolean {
    const formValid = this.form.valid ?? false;
    const formQuestionValid = this.formQuestion.valid ?? false;
    const question: QuestionDTO = this.formQuestion.value;
    const questionsValid = question.answers.length >= 3;
    const selectedAwnser = question.answers.find(opt => opt._selected);
    return formValid && formQuestionValid && selectedAwnser && questionsValid;
  }

  async updateQuiz() {
    return new Promise(async (resolve, reject) => {
      this.uiServices.showLoader(true);
      // save the last changes
      (this.quiz.questions as QuestionDTO[])[this.currentAnswerIndex] = this.formQuestion.value;

      // refine request
      const quizRequest = this.quiz = this._quizRefined(true);
      const response = await this.commonServices.saveQuestionary(quizRequest);
      if (!response) {
        this.uiServices.notification(this.translateLabels.service_fail_update);
        this.uiServices.showLoader(false);
        resolve(false);
      }

      const _quiz = await this.commonServices.getQuestionaryById(response.questionaryId);
      this.quiz = normalizeQuestionaryDTO(_quiz);
      this.uiServices.showLoader(false);
      resolve(true);
    })
  }

  async getQuizData(id: number) {
    const data = await this.commonServices.getQuestionaryById(id);
    if (!data) {
      this.uiServices.notification(this.translateLabels.service_fail_get);
      return null;
    }
    return data;
  }

  finishCreation() {
    this.updateQuiz();
    this.gotoDashboard();
  }

  saveQuiz() {
    this.updateQuiz();
  }
  //#endregion DATA

  //#region EVENTS
  selectAnswerCorrect(option: FormGroup) {
    const _option = option.value as AnswerDTO;
    // reset all items
    this.formQuestion.value.answers.map((opt, index) => {
      this.getFormOptions().controls[index].get('_selected').setValue(false);
    });

    // assing correct
    if (_option.answer) {
      option.controls['_selected'].setValue(true);
    }
  }

  onOptionChange(event: { control: string, value: any }, option: FormGroup) {
    // if (event.value && option.controls['isCorrect'].value) {
    //   option.controls['_selected'].patchValue(false);
    //   setTimeout(() => {
    //     option.controls['_selected'].updateValueAndValidity();
    //   }, 100);
    // }

    const lastIndex = this.formQuestion.value.answers.length - 1;
    const lastValue = this.formQuestion.value.answers[lastIndex].content;
    if (lastIndex >= 0 && lastValue != '') {
      this.getFormOptions().push(this.getNewOptionForm());
    } else if (lastIndex > 0 && lastValue == '') {
      const optionLast = this.formQuestion.value.answers[lastIndex - 1];
      const postlastValue = optionLast.content;
      if (postlastValue == '') {
        this.getFormOptions().removeAt(lastIndex);
      }
    }
  }

  gotoDashboard() {
    this.commonServices.navigate('dashboard', this.quiz.questionaryId ? this.quiz.questionaryId.toString() : '');
  }

  async nextQuestion() {
    if (this.currentAnswerIndex <= this.quiz.questions.length - 1) {
      (this.quiz.questions as QuestionDTO[])[this.currentAnswerIndex] = this.formQuestion.value;

      await this.updateQuiz();

      this.currentAnswerIndex = this.currentAnswerIndex + 1;
      if (this.currentAnswerIndex > this.quiz.questions.length - 1) {
        (this.quiz.questions as QuestionDTO[]).push(this.getNewQuestionForm());
      }

      this.setCurrentAnswer();
      this._getQuizUpdated();
    }
  }

  async prevQuestion() {
    if (this.currentAnswerIndex != 0) {
      (this.quiz.questions as QuestionDTO[])[this.currentAnswerIndex] = this.formQuestion.value;
      this.currentAnswerIndex = this.currentAnswerIndex - 1;

      this.setCurrentAnswer();
      this._getQuizUpdated();
    }
  }

  editDuration() {
    this.durationFormShow = !this.durationFormShow;
    if (this.durationFormShow) {
      this.form.get('time').setValue([1]);
    }
  }

  onChangeDuration(event) {
    if (event.value == 0 || event.value == '') {
      this.editDuration();
    }
  }

  enableIA() {
    this.showIAForm = !this.showIAForm;
  }
  //#endregion EVENTS

  //#region CONVERTERS

  private _getQuizUpdated() {
    const answers = [];
    (this.quiz.questions as QuestionDTO[]).map(ans => {
      ans.answers.map(opt => {
        answers.push(opt);
      })
    });
  }

  private _quizRefined(cleanUnused = false): QuestionaryDTO {
    const _quiz = JSON.parse(JSON.stringify(this.quiz));

    const { title, time } = this.form.value;
    _quiz.title = title;
    _quiz.time = time;
    _quiz.updatedDate = new Date().getTime();

    _quiz.questions = JSON.parse(JSON.stringify(_quiz.questions)) || [];
    if (cleanUnused) {
      _quiz.questions = _quiz.questions.filter((opt: QuestionDTO) => opt.question !== '');
    }
    _quiz.questions.map((answer: QuestionDTO) => {
      if (cleanUnused) {
        answer.answers = answer.answers.filter((opt: AnswerDTO) => opt.answer !== '');
      }
      answer.answers.map(opt => {
        opt.isCorrect = opt._selected;
        return opt;
      });
      return answer;
    });
    return _quiz;
  }

  getletter(index) {
    const ascii = 64; // 65 es el código ASCII de 'A', 90 es el de 'Z'
    const asciiLimit = 90;
    const letter = ascii + index;
    return String.fromCharCode(letter)
  }

  getNewQuestionForm() {
    const question = getQuestionDTO(`${this.translateLabels.answer_text_default} #${this.currentAnswerIndex + 1}?`);
    const questions = [
      getAnswerDTO(`${this.translateLabels.answer_option_text_default} 1`, 1),
      getAnswerDTO(`${this.translateLabels.answer_option_text_default} 2`, 2),
      getAnswerDTO('', 3),
    ];

    question.answers.push(...questions);
    return question;
  }

  getNewOptionForm(optionValue?: AnswerDTO) {
    const question = (this.quiz.questions[this.currentAnswerIndex] as QuestionDTO);
    const option = getAnswerDTO('', question.answers.length + 1);

    if (!optionValue) {
      const length = this.formQuestion ? this.formQuestion.value.answers.length : 0;
      option.answerId = length + 1;
    } else {
      option.answerId = optionValue.answerId;
      option.answer = optionValue.answer;
      // GENERATED
      option.isCorrect = optionValue.isCorrect;
      option._selected = optionValue._selected;
    }
    return this.fb.group(option)
  }
  //#endregion CONVERTERS

}
