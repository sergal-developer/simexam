import { Component, Input, OnInit, ViewEncapsulation, } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { icons } from 'lucide';
import { getQuizAnswerDTO, getQuizAnswerOptionDTO, getQuizDTO, normalizeQuizDTO, QuizAnswerDTO, QuizAnswerOptionDTO, QuizDTO, SettingsDTO } from 'src/app/shared/data/entities/dtos';
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
  async setupComponent(injectData?: QuizDTO) {
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

    this.quiz = getQuizDTO('', 0);
    this.quiz.answers = [this.getNewQuestionForm()];


    if (this.quizId) {
      const _quiz = await this.commonServices.getQuizCompleteById(this.quizId);

      if (!this.quiz) {
        this.uiServices.notification(this.translateLabels.service_fail_get, { type: 'error', closeTimer: 3000 });
        this.uiServices.showLoader(false);
        return;
      }

      this.quiz = normalizeQuizDTO(_quiz);
    }

    this.setCurrentAnswer();
    this.uiServices.showLoader(false);
  }

  setCurrentAnswer() {
    const answerItem = this.quiz.answers[this.currentAnswerIndex];

    const optionArray = [];
    answerItem.options.map(opt => {
      optionArray.push(this.getNewOptionForm(opt))
    });

    const optionEmpty = answerItem.options[answerItem.options.length - 1].content !== '';
    if (optionEmpty) {
      optionArray.push(this.getNewOptionForm())
    }

    this.formQuestion = this.fb.group({
      answerId: [answerItem.answerId],
      quizId: [answerItem.quizId],
      title: [answerItem.title],
      updatedDate: [answerItem.updatedDate],
      options: this.fb.array(optionArray)
    });
  }

  getFormOptions(): FormArray {
    return this.formQuestion.get('options') as FormArray;
  }

  get validActions(): boolean {
    const formValid = this.form.valid ?? false;
    const formQuestionValid = this.formQuestion.valid ?? false;
    const question: QuizAnswerDTO = this.formQuestion.value;
    const questionsValid = question.options.length >= 3;
    const selectedAwnser = question.options.find(opt => opt._selected);
    return formValid && formQuestionValid && selectedAwnser && questionsValid;
  }

  async updateQuiz() {
    return new Promise(async (resolve, reject) => {
      this.uiServices.showLoader(true);
      // save the last changes
      this.quiz.answers[this.currentAnswerIndex] = this.formQuestion.value;

      // refine request
      const quizRequest = this.quiz = this._quizRefined(true);
      const response = await this.commonServices.saveAllQuiz(quizRequest);
      if (!response) {
        this.uiServices.notification(this.translateLabels.service_fail_update);
        this.uiServices.showLoader(false);
        resolve(false);
      }

      const _quiz = await this.commonServices.getQuizCompleteById(response.quizId);
      this.quiz = normalizeQuizDTO(_quiz);
      this.uiServices.showLoader(false);
      resolve(true);
    })
  }

  async getQuizData(id: number) {
    const data = await this.commonServices.getQuizCompleteById(id);
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
    const _option = option.value as QuizAnswerOptionDTO;
    // reset all items
    this.formQuestion.value.options.map((opt, index) => {
      this.getFormOptions().controls[index].get('_selected').setValue(false);
    });

    // assing correct
    if (_option.content) {
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

    const lastIndex = this.formQuestion.value.options.length - 1;
    const lastValue = this.formQuestion.value.options[lastIndex].content;
    if (lastIndex >= 0 && lastValue != '') {
      this.getFormOptions().push(this.getNewOptionForm());
    } else if (lastIndex > 0 && lastValue == '') {
      const optionLast = this.formQuestion.value.options[lastIndex - 1];
      const postlastValue = optionLast.content;
      if (postlastValue == '') {
        this.getFormOptions().removeAt(lastIndex);
      }
    }
  }

  gotoDashboard() {
    this.commonServices.navigate('dashboard', this.quiz.quizId ? this.quiz.quizId.toString() : '');
  }

  async nextQuestion() {
    if (this.currentAnswerIndex <= this.quiz.answers.length - 1) {
      this.quiz.answers[this.currentAnswerIndex] = this.formQuestion.value;

      await this.updateQuiz();

      this.currentAnswerIndex = this.currentAnswerIndex + 1;
      if (this.currentAnswerIndex > this.quiz.answers.length - 1) {
        this.quiz.answers.push(this.getNewQuestionForm());
      }

      this.setCurrentAnswer();
      this._getQuizUpdated();
    }
  }

  async prevQuestion() {
    if (this.currentAnswerIndex != 0) {
      this.quiz.answers[this.currentAnswerIndex] = this.formQuestion.value;
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

  async generateQuiz() {
    if (this.loadingDataAi) { return; }
    this.loadingDataAi = true;
    const data: { topic: string, questions: number, options: number, language: string } = this.formIAGenerated.value;
    data.language = this.settings.language == 'es' ? 'español' : 'ingles';


    this.uiServices.notification(`<h3><span class="material-icons">auto_awesome</span> ${this.translateLabels.generation_questions}</h3> <br> <p>${this.translateLabels.ia_subtitle}</p>`, { closeTimer: -1, type: 'full-IA' });
    // const response: any = await this.mockDataAI();
    const response: any = await this.commonServices.geminiGenerate(data);

    if (!response) {
      this.uiServices.notification(this.translateLabels.service_fail_generate, { type: 'error', closeTimer: 3000 });
    } else {
      this.uiServices.notification(`${this.translateLabels.service_sucess_generation} ${response.questions.length} ${this.translateLabels.generation_questions_questions}.`, { closeTimer: 2500 });

      setTimeout(() => {
        const quiz: QuizDTO = {
          quizId: -1,
          title: data.topic,
          time: 0,
          answers: response.questions,
          creationDate: new Date().getTime(),
          updatedDate: new Date().getTime()
        }
        this.setupComponent(quiz);

        if (!this.isEdit) {
          this.finishCreation();
        }
      }, 1000);
    }

    this.loadingDataAi = false;
  }

  async mockDataAI() {
    const data = {
      "questions": [
        {
          "question": "¿Cuál es la capital de México?",
          "options": [
            {
              "id": 0,
              "text": "Guadalajara"
            },
            {
              "id": 1,
              "text": "Ciudad de México"
            },
            {
              "id": 2,
              "text": "Monterrey"
            },
            {
              "id": 3,
              "text": "Tijuana"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Quién es el autor de 'Cien años de soledad'?",
          "options": [
            {
              "id": 0,
              "text": "Gabriel García Márquez"
            },
            {
              "id": 1,
              "text": "Jorge Luis Borges"
            },
            {
              "id": 2,
              "text": "Mario Vargas Llosa"
            },
            {
              "id": 3,
              "text": "Julio Cortázar"
            }
          ],
          "correctAnswer": 0
        },
        {
          "question": "¿Cuál es el antónimo de 'grande'?",
          "options": [
            {
              "id": 0,
              "text": "Enorme"
            },
            {
              "id": 1,
              "text": "Pequeño"
            },
            {
              "id": 2,
              "text": "Ancho"
            },
            {
              "id": 3,
              "text": "Alto"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es la conjugación correcta del verbo 'comer' en pretérito perfecto simple para 'yo'?",
          "options": [
            {
              "id": 0,
              "text": "Comería"
            },
            {
              "id": 1,
              "text": "Comeré"
            },
            {
              "id": 2,
              "text": "Comí"
            },
            {
              "id": 3,
              "text": "Como"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "Identifica el adjetivo en la siguiente oración: 'El coche rojo es rápido.'",
          "options": [
            {
              "id": 0,
              "text": "Coche"
            },
            {
              "id": 1,
              "text": "Es"
            },
            {
              "id": 2,
              "text": "Rojo"
            },
            {
              "id": 3,
              "text": "Rápido"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es el resultado de 15 x 8?",
          "options": [
            {
              "id": 0,
              "text": "100"
            },
            {
              "id": 1,
              "text": "120"
            },
            {
              "id": 2,
              "text": "110"
            },
            {
              "id": 3,
              "text": "130"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es el valor de pi (π) aproximadamente?",
          "options": [
            {
              "id": 0,
              "text": "3.1416"
            },
            {
              "id": 1,
              "text": "2.7182"
            },
            {
              "id": 2,
              "text": "1.6180"
            },
            {
              "id": 3,
              "text": "3.0"
            }
          ],
          "correctAnswer": 0
        },
        {
          "question": "¿Cuál es el área de un cuadrado cuyo lado mide 5 cm?",
          "options": [
            {
              "id": 0,
              "text": "10 cm²"
            },
            {
              "id": 1,
              "text": "20 cm²"
            },
            {
              "id": 2,
              "text": "25 cm²"
            },
            {
              "id": 3,
              "text": "30 cm²"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es la raíz cuadrada de 81?",
          "options": [
            {
              "id": 0,
              "text": "7"
            },
            {
              "id": 1,
              "text": "8"
            },
            {
              "id": 2,
              "text": "9"
            },
            {
              "id": 3,
              "text": "10"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es el resultado de 2 + 2 x 2?",
          "options": [
            {
              "id": 0,
              "text": "8"
            },
            {
              "id": 1,
              "text": "6"
            },
            {
              "id": 2,
              "text": "4"
            },
            {
              "id": 3,
              "text": "10"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es el proceso por el cual las plantas producen su propio alimento?",
          "options": [
            {
              "id": 0,
              "text": "Respiración"
            },
            {
              "id": 1,
              "text": "Fotosíntesis"
            },
            {
              "id": 2,
              "text": "Transpiración"
            },
            {
              "id": 3,
              "text": "Digestión"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es el nombre del planeta en el que vivimos?",
          "options": [
            {
              "id": 0,
              "text": "Marte"
            },
            {
              "id": 1,
              "text": "Venus"
            },
            {
              "id": 2,
              "text": "Tierra"
            },
            {
              "id": 3,
              "text": "Júpiter"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es el gas que respiramos?",
          "options": [
            {
              "id": 0,
              "text": "Dióxido de carbono"
            },
            {
              "id": 1,
              "text": "Nitrógeno"
            },
            {
              "id": 2,
              "text": "Oxígeno"
            },
            {
              "id": 3,
              "text": "Hidrógeno"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es el órgano principal del sistema circulatorio?",
          "options": [
            {
              "id": 0,
              "text": "Pulmón"
            },
            {
              "id": 1,
              "text": "Cerebro"
            },
            {
              "id": 2,
              "text": "Hígado"
            },
            {
              "id": 3,
              "text": "Corazón"
            }
          ],
          "correctAnswer": 3
        },
        {
          "question": "¿Qué proceso describe el cambio de estado de líquido a gaseoso?",
          "options": [
            {
              "id": 0,
              "text": "Fusión"
            },
            {
              "id": 1,
              "text": "Solidificación"
            },
            {
              "id": 2,
              "text": "Evaporación"
            },
            {
              "id": 3,
              "text": "Condensación"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿En qué año comenzó la Revolución Mexicana?",
          "options": [
            {
              "id": 0,
              "text": "1810"
            },
            {
              "id": 1,
              "text": "1910"
            },
            {
              "id": 2,
              "text": "1821"
            },
            {
              "id": 3,
              "text": "1947"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Quién fue el primer presidente de México?",
          "options": [
            {
              "id": 0,
              "text": "Benito Juárez"
            },
            {
              "id": 1,
              "text": "Miguel Hidalgo"
            },
            {
              "id": 2,
              "text": "Guadalupe Victoria"
            },
            {
              "id": 3,
              "text": "Porfirio Díaz"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Qué cultura prehispánica construyó Teotihuacán?",
          "options": [
            {
              "id": 0,
              "text": "Maya"
            },
            {
              "id": 1,
              "text": "Azteca"
            },
            {
              "id": 2,
              "text": "Teotihuacana"
            },
            {
              "id": 3,
              "text": "Olmeca"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Qué tratado puso fin a la guerra entre México y Estados Unidos en 1848?",
          "options": [
            {
              "id": 0,
              "text": "Tratado de Guadalupe Hidalgo"
            },
            {
              "id": 1,
              "text": "Tratado de Córdoba"
            },
            {
              "id": 2,
              "text": "Tratado de Tordesillas"
            },
            {
              "id": 3,
              "text": "Plan de Iguala"
            }
          ],
          "correctAnswer": 0
        },
        {
          "question": "¿Quién fue el líder de la Independencia de México?",
          "options": [
            {
              "id": 0,
              "text": "Francisco I. Madero"
            },
            {
              "id": 1,
              "text": "José María Morelos y Pavón"
            },
            {
              "id": 2,
              "text": "Miguel Hidalgo y Costilla"
            },
            {
              "id": 3,
              "text": "Venustiano Carranza"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Qué valor cívico implica respetar las opiniones de los demás?",
          "options": [
            {
              "id": 0,
              "text": "Justicia"
            },
            {
              "id": 1,
              "text": "Libertad"
            },
            {
              "id": 2,
              "text": "Tolerancia"
            },
            {
              "id": 3,
              "text": "Igualdad"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es el documento que establece las leyes fundamentales de México?",
          "options": [
            {
              "id": 0,
              "text": "Plan de Ayala"
            },
            {
              "id": 1,
              "text": "Constitución Política de los Estados Unidos Mexicanos"
            },
            {
              "id": 2,
              "text": "Declaración de los Derechos Humanos"
            },
            {
              "id": 3,
              "text": "Código Penal Federal"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Qué es la democracia?",
          "options": [
            {
              "id": 0,
              "text": "Un sistema de gobierno donde una sola persona tiene todo el poder."
            },
            {
              "id": 1,
              "text": "Un sistema de gobierno donde el poder reside en el pueblo."
            },
            {
              "id": 2,
              "text": "Un sistema de gobierno donde el poder es hereditario."
            },
            {
              "id": 3,
              "text": "Un sistema de gobierno donde el poder lo tiene el ejército."
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es la función principal del gobierno?",
          "options": [
            {
              "id": 0,
              "text": "Enriquecer a los gobernantes"
            },
            {
              "id": 1,
              "text": "Mantener el orden y proteger los derechos de los ciudadanos"
            },
            {
              "id": 2,
              "text": "Promover la guerra"
            },
            {
              "id": 3,
              "text": "Controlar la información"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Qué significa la palabra 'soberanía'?",
          "options": [
            {
              "id": 0,
              "text": "Dependencia de otro país"
            },
            {
              "id": 1,
              "text": "Derecho a la autodeterminación y no intervención externa"
            },
            {
              "id": 2,
              "text": "Sumisión a una dictadura"
            },
            {
              "id": 3,
              "text": "Falta de leyes"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es la función principal de los pulmones?",
          "options": [
            {
              "id": 0,
              "text": "Bombear la sangre"
            },
            {
              "id": 1,
              "text": "Filtrar la sangre"
            },
            {
              "id": 2,
              "text": "Intercambiar oxígeno y dióxido de carbono"
            },
            {
              "id": 3,
              "text": "Digerir los alimentos"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Qué es una célula?",
          "options": [
            {
              "id": 0,
              "text": "Un órgano del cuerpo"
            },
            {
              "id": 1,
              "text": "La unidad básica de la vida"
            },
            {
              "id": 2,
              "text": "Un hueso del cuerpo"
            },
            {
              "id": 3,
              "text": "Una molécula de agua"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Qué es un sinónimo de 'alegría'?",
          "options": [
            {
              "id": 0,
              "text": "Tristeza"
            },
            {
              "id": 1,
              "text": "Felicidad"
            },
            {
              "id": 2,
              "text": "Enojo"
            },
            {
              "id": 3,
              "text": "Miedo"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es el sujeto en la oración 'El perro ladra fuerte'?",
          "options": [
            {
              "id": 0,
              "text": "Ladra"
            },
            {
              "id": 1,
              "text": "Fuerte"
            },
            {
              "id": 2,
              "text": "El perro"
            },
            {
              "id": 3,
              "text": "Ninguno"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es el resultado de 7 x 7?",
          "options": [
            {
              "id": 0,
              "text": "48"
            },
            {
              "id": 1,
              "text": "49"
            },
            {
              "id": 2,
              "text": "50"
            },
            {
              "id": 3,
              "text": "51"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es el resultado de 100 / 5?",
          "options": [
            {
              "id": 0,
              "text": "10"
            },
            {
              "id": 1,
              "text": "20"
            },
            {
              "id": 2,
              "text": "30"
            },
            {
              "id": 3,
              "text": "40"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Quién fue un importante líder durante la Revolución Mexicana?",
          "options": [
            {
              "id": 0,
              "text": "Hernán Cortés"
            },
            {
              "id": 1,
              "text": "Napoleón Bonaparte"
            },
            {
              "id": 2,
              "text": "Emiliano Zapata"
            },
            {
              "id": 3,
              "text": "Cristóbal Colón"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿En qué año se consumó la Independencia de México?",
          "options": [
            {
              "id": 0,
              "text": "1810"
            },
            {
              "id": 1,
              "text": "1821"
            },
            {
              "id": 2,
              "text": "1910"
            },
            {
              "id": 3,
              "text": "1854"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "La división de poderes en México incluye:",
          "options": [
            {
              "id": 0,
              "text": "Ejecutivo, Legislativo y Militar"
            },
            {
              "id": 1,
              "text": "Ejecutivo, Legislativo y Judicial"
            },
            {
              "id": 2,
              "text": "Judicial, Militar y Eclesiástico"
            },
            {
              "id": 3,
              "text": "Legislativo, Eclesiástico y Ejecutivo"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Que es la democracia?",
          "options": [
            {
              "id": 0,
              "text": "Regimen donde la ciudadania no tiene poder sobre sus gobernantes"
            },
            {
              "id": 1,
              "text": "Regimen donde la ciudadania tiene poder sobre sus gobernantes"
            },
            {
              "id": 2,
              "text": "Regimen donde los militares son los que gobiernan"
            },
            {
              "id": 3,
              "text": "Regimen donde solo los ricos gobiernan"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿En que año se fundo la UNAM?",
          "options": [
            {
              "id": 0,
              "text": "1810"
            },
            {
              "id": 1,
              "text": "1910"
            },
            {
              "id": 2,
              "text": "1821"
            },
            {
              "id": 3,
              "text": "1947"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es el antónimo de 'fácil'?",
          "options": [
            {
              "id": 0,
              "text": "Sencillo"
            },
            {
              "id": 1,
              "text": "Difícil"
            },
            {
              "id": 2,
              "text": "Simple"
            },
            {
              "id": 3,
              "text": "Complejo"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "Si un objeto se mueve a 20 m/s durante 5 segundos, ¿qué distancia recorre?",
          "options": [
            {
              "id": 0,
              "text": "50 metros"
            },
            {
              "id": 1,
              "text": "100 metros"
            },
            {
              "id": 2,
              "text": "150 metros"
            },
            {
              "id": 3,
              "text": "200 metros"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuál es la hormona responsable de regular el azúcar en la sangre?",
          "options": [
            {
              "id": 0,
              "text": "Adrenalina"
            },
            {
              "id": 1,
              "text": "Insulina"
            },
            {
              "id": 2,
              "text": "Testosterona"
            },
            {
              "id": 3,
              "text": "Estrogeno"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "¿Cuantos estados tiene la republica mexicana?",
          "options": [
            {
              "id": 0,
              "text": "30"
            },
            {
              "id": 1,
              "text": "31"
            },
            {
              "id": 2,
              "text": "32"
            },
            {
              "id": 3,
              "text": "33"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿A que poder pertenece el presidente de Mexico?",
          "options": [
            {
              "id": 0,
              "text": "Poder Judicial"
            },
            {
              "id": 1,
              "text": "Poder Legislativo"
            },
            {
              "id": 2,
              "text": "Poder Ejecutivo"
            },
            {
              "id": 3,
              "text": "Poder Militar"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cual es el gentilicio de las personas nacidas en Guanajuato?",
          "options": [
            {
              "id": 0,
              "text": "Jalisciense"
            },
            {
              "id": 1,
              "text": "Guanajuatense"
            },
            {
              "id": 2,
              "text": "Potosino"
            },
            {
              "id": 3,
              "text": "Regiomontano"
            }
          ],
          "correctAnswer": 1
        },
        {
          "question": "Indica cual de las siguientes opciones es una palabra esdrújula",
          "options": [
            {
              "id": 0,
              "text": "Corazón"
            },
            {
              "id": 1,
              "text": "Árbol"
            },
            {
              "id": 2,
              "text": "México"
            },
            {
              "id": 3,
              "text": "Cafe"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Cuál es el resultado de 12 + 3 x 4 - 2?",
          "options": [
            {
              "id": 0,
              "text": "22"
            },
            {
              "id": 1,
              "text": "28"
            },
            {
              "id": 2,
              "text": "26"
            },
            {
              "id": 3,
              "text": "30"
            }
          ],
          "correctAnswer": 0
        },
        {
          "question": "¿Qué tipo de energía produce el sol?",
          "options": [
            {
              "id": 0,
              "text": "Energía eólica"
            },
            {
              "id": 1,
              "text": "Energía geotérmica"
            },
            {
              "id": 2,
              "text": "Energía solar"
            },
            {
              "id": 3,
              "text": "Energía hidráulica"
            }
          ],
          "correctAnswer": 2
        },
        {
          "question": "¿Qué conflicto bélico se desarrollo entre 1914 y 1918?",
          "options": [
            {
              "id": 0,
              "text": "Primera Guerra Mundial"
            },
            {
              "id": 1,
              "text": "Segunda Guerra Mundial"
            },
            {
              "id": 2,
              "text": "Guerra de Vietnam"
            },
            {
              "id": 3,
              "text": "Guerra de los Balcanes"
            }
          ],
          "correctAnswer": 0
        }
      ]
    };
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(data);
      }, 1000);
    });
  }
  //#endregion EVENTS

  //#region CONVERTERS

  private _getQuizUpdated() {
    const options = [];
    this.quiz.answers.map(ans => {
      ans.options.map(opt => {
        options.push(opt);
      })
    });
  }

  private _quizRefined(cleanUnused = false): QuizDTO {
    const _quiz = JSON.parse(JSON.stringify(this.quiz));

    const { title, time } = this.form.value;
    _quiz.title = title;
    _quiz.time = time;
    _quiz.updatedDate = new Date().getTime();

    _quiz.answers = JSON.parse(JSON.stringify(_quiz.answers)) || [];
    if (cleanUnused) {
      _quiz.answers = _quiz.answers.filter((opt: QuizAnswerDTO) => opt.title !== '');
    }
    _quiz.answers.map((answer: QuizAnswerDTO) => {
      if (cleanUnused) {
        answer.options = answer.options.filter((opt: QuizAnswerOptionDTO) => opt.content !== '');
      }
      answer.options.map(opt => {
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
    const question = getQuizAnswerDTO(`${this.translateLabels.answer_text_default} #${this.currentAnswerIndex + 1}?`);
    const questions = [
      getQuizAnswerOptionDTO(`${this.translateLabels.answer_option_text_default} 1`, 1),
      getQuizAnswerOptionDTO(`${this.translateLabels.answer_option_text_default} 2`, 2),
      getQuizAnswerOptionDTO('', 3),
    ];

    question.options.push(...questions);
    return question;
  }

  getNewOptionForm(optionValue?: QuizAnswerOptionDTO) {
    const question = this.quiz.answers[this.currentAnswerIndex];
    const option = getQuizAnswerOptionDTO('', question.options.length + 1);

    if (!optionValue) {
      const length = this.formQuestion ? this.formQuestion.value.options.length : 0;
      option.optionIndex = length + 1;
    } else {
      option.answerId = optionValue.answerId;
      option.content = optionValue.content;
      option.optionId = optionValue.optionId;
      option.optionIndex = optionValue.optionIndex;
      option.updatedDate = optionValue.updatedDate;
      // GENERATED
      option.isCorrect = optionValue.isCorrect;
      option._selected = optionValue._selected;
    }
    return this.fb.group(option)
  }
  //#endregion CONVERTERS

}
