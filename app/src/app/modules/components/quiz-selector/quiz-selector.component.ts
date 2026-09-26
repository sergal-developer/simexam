import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from "lucide";
import { getQuizAnswerDTO, getQuizAnswerOptionDTO, getQuizDTO, QuizAnswerDTO, QuizDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
import { ScreenEnum } from 'src/app/shared/data/enumerables/enumerables';
import { Utils } from 'src/app/shared/data/utils/utils';
import { CommonServices } from 'src/app/shared/services/common.services';
import { DatabaseService } from 'src/app/shared/services/database/sql.database.service';
import { UiServices } from 'src/app/shared/services/ui.services';


@Component({
  selector: 'quiz-selector',
  templateUrl: './quiz-selector.html',
  encapsulation: ViewEncapsulation.None,
})
export class QuizSelectorComponent implements OnInit {
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
  settings: SettingsDTO = null;
  quiz: QuizDTO = null;
  currentAnswer: QuizAnswerDTO = null;
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
  isEdit = false;
  _helper = new Utils();

  luIcon = {
    left: icons.ChevronLeft,
    right: icons.ChevronRight,
    save: icons.SaveAll,
    cards: icons.PlayingCards,
    list: icons.ListTodo,
    random: icons.Dices,
    battle: icons.Swords,
    directions: icons.GamepadDirectional,
  }

  titleQuizSelection: string = 'Nuevo';
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
  async setupComponent(injectData?: QuizDTO) {
    this.currentAnswerIndex = 0;
    this.isEdit = false;
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

    this.quiz = getQuizDTO('', 0);
    this.quiz.answers = [this.getNewQuestionForm()];


    // this.setCurrentAnswer();
    this.uiServices.showLoader(false);
  }

  getNewQuestionForm() {
      const question = getQuizAnswerDTO(`${this.translateLabels.answer_text_default} #${this.currentAnswerIndex + 1}?`);
      const questions = [
        getQuizAnswerOptionDTO(`${this.translateLabels.answer_option_text_default} 1`, 1),
        getQuizAnswerOptionDTO(`${this.translateLabels.answer_option_text_default} 2`, 2),
        getQuizAnswerOptionDTO('', 3),
      ];
  
      question.options.push(...questions);
      return question;
    }
}
