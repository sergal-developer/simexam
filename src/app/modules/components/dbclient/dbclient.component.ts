import { Component, OnInit, ViewEncapsulation, } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  attempt_answer_table_querys,
  quiz_answer_option_table_querys,
  quiz_answer_table_querys,
  language_table_querys,
  log_table_querys,
  attempt_table_querys,
  quiz_table_querys,
  settings_table_querys,
  theme_table_querys,
  user_table_querys
} from "../../../shared/data/entities/dtos";

import { Parser } from 'src/app/shared/data/utils/parseFields';
import { CommonServices } from 'src/app/shared/services/common.services';
import { runCommonServicesTests } from 'src/app/shared/services/common.services.testing';
import { DatabaseService } from 'src/app/shared/services/database/sql.database.service';
import { UiServices } from 'src/app/shared/services/ui.services';


@Component({
  selector: 'dbclient',
  templateUrl: './dbclient.html',
  encapsulation: ViewEncapsulation.None,
})
export class DbClientComponent implements OnInit {

  //#region INTERNAL VARS
  form: FormGroup;

  formClient: FormGroup = new FormGroup({
    nameQuery: new FormControl('default', Validators.required),
    query: new FormControl(`SELECT * FROM sqlite_master WHERE type='table';`)
  });

  formFunctions: FormGroup = new FormGroup({
    nameQuery: new FormControl('default', Validators.required),
    query: new FormControl(``),
    rawQuery: new FormControl(``)
  });

  errorMessages = '';
  response = '';

  listQuerys: Array<{ queryName: string, query: string }> = [];
  listFunctions: Array<{ queryName: string, query: string | null }> = [];

  view: 'sql' | 'functions' = 'sql';
  parser = new Parser();

  //#endregion INTERNAL VARS

  constructor(private commonServices: CommonServices,
    private services: DatabaseService,
    public uiServices: UiServices) { }

  async ngOnInit() {
    this.changeView('functions')
  }

  // #region DATA
  getAllAvailableQuerys() {
    const queryGroups = [
      { name: 'answer_attempt', data: attempt_answer_table_querys },
      { name: 'answer_option', data: quiz_answer_option_table_querys },
      { name: 'answer', data: quiz_answer_table_querys },
      { name: 'language', data: language_table_querys },
      { name: 'log', data: log_table_querys },
      { name: 'quiz_attempt', data: attempt_table_querys },
      { name: 'quiz', data: quiz_table_querys },
      { name: 'settings', data: settings_table_querys },
      { name: 'theme', data: theme_table_querys },
      { name: 'user', data: user_table_querys },
    ];

    this.listQuerys = this.buildQueryList(queryGroups);
  }

  getAllAvailableFunctions() {
    const functions = this.getMethods(CommonServices);
    functions.map(func => {
      this.listFunctions.push({ queryName: func.name, query: func.parameters ? '' : null });
    })
  }

  private buildQueryList(queryGroups: Array<any>) {
    const list: Array<{ queryName: string, query: string }> = [];
    queryGroups.flatMap(({ name, data }) => {
      Object.entries(data).flatMap(([groupName, queries]) => {
        Object.entries(queries).map(([queryName, query]) => {
          const item = { queryName: `${name}.${groupName}`, query: query };
          list.push(item);
        })
      });
    });
    return list;
  };
  //#endregion DATA

  //#region EVENTS
  gotoDashboard() {
    this.commonServices.navigate('dashboard');
  }

  async executeQuery() {
    if (this.view == 'sql') {
      this._executeSQL();
    }

    if (this.view == 'functions') {
      const { nameQuery, query, rawQuery } = this.formFunctions.value;

      if (rawQuery) {
        this._executeFunction();
      } else {
        const logs = await runCommonServicesTests(this.commonServices);
        console.log('logs: ', logs);
      }
    }
  }

  private async _executeSQL() {
    const { nameQuery, query } = this.formClient.value;
    if (!query) {
      this.errorMessages = 'query no exist';
      return;
    }

    const response = await this.services.executeInSQL(query, null, (log) => {
      this.errorMessages = log || '';
    });
    this.response = response ? JSON.stringify(response, null, 2) : '';
  }

  private async _executeFunction() {
    const { nameQuery, query, rawQuery } = this.formFunctions.value;
    let response: any = null;
    console.log('nameQuery', nameQuery, 'value', rawQuery);

    if (!nameQuery) {
      this.errorMessages = 'function no exist';
      return;
    }

    try {
      if (!query) {
        response = await this.commonServices[nameQuery]();
      } else {

        console.log('function: ', nameQuery, this.commonServices[nameQuery]);
        const params = JSON.parse(rawQuery);
        console.log('params: ', params);
        response = await this.commonServices[nameQuery](params);;
        console.log('response: ', response);
      }
    } catch (error) {
      console.log('error: ', error);
      this.errorMessages = error.toString();
    }

    this.response = response ? JSON.stringify(response, null, 2) : '';

    console.log('this.response: ', this.response);
  }

  onSelectAutocompleteSQL(data: { queryName: string, query: string }) {
    if (!data)
      return;

    this.formClient.get('query').setValue(data.query);
  }

  onSelectAutocompleteFn(data: { queryName: string, query: string | null }) {
    if (!data)
      return;

    this.formFunctions.get('nameQuery').setValue(data.queryName);

    if (data.query != null) {
      this.formFunctions.get('query').enable();
      this.formFunctions.get('query').setValue(data.query);

    } else {
      this.formFunctions.get('query').setValue(`la funcion ${data.queryName} no necesita parametros`);
      this.formFunctions.get('query').disable();
    }
  }

  changeView(view: 'sql' | 'functions') {
    this.view = view;

    if (this.view == 'sql') {
      this.getAllAvailableQuerys();
    }

    if (this.view == 'functions') {
      this.getAllAvailableFunctions();
    }

  }

  validateData(evt) {
    const { nameQuery, query } = this.formFunctions.value;
    if (query) {
      try {
        this.errorMessages = null;
        const isNumber = this.parser.parseNumber(query);
        if (!isNumber) {
          const parse = this.parser.parseFields(query);
          if (parse.invalidFields) {
            this.errorMessages += parse.invalidFields.map((i) => { return `${i.reason} | name: ${i.name}` }).join('\n ');
          }

          if (parse.json == '{}' || parse.fields.length == 0) {
            this.errorMessages += 'No hay campos que convertir. \n ';
          } else {
            this.formFunctions.get('rawQuery').setValue(parse.json)
          }
        } else {
          this.formFunctions.get('rawQuery').setValue(isNumber)
        }
      } catch (error) {
        this.errorMessages = error.toString();
      }
    }
  }

  //#endregion EVENTS

  //#region CONVERTERS
  getMethods(target: any): Array<{ name: string, parameters: number }> {
    const prototype = target.prototype;
    const list = Object.getOwnPropertyNames(prototype)
      .filter(name => name !== "constructor")
      .filter(name => typeof prototype[name] === "function")
      .map(name => {
        const fn = prototype[name];

        return {
          name,
          parameters: fn.length
        };
      });
    console.log('list: ', list);
    return list;

  }
  //#endregion CONVERTERS
}
