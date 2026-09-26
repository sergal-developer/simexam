export class DBLocal {
  databaseName: string = 'default';

  constructor(databaseName: string) {
    this.databaseName = databaseName;
    if (!localStorage.getItem(databaseName)) {
      localStorage.setItem(databaseName, JSON.stringify({}));
    }
  }

  private _getDB(): any {
    const db = localStorage.getItem(this.databaseName);
    return db ? JSON.parse(db) : {};
  }

  private _saveDb(data: any) {
    localStorage.setItem(this.databaseName, JSON.stringify(data))
  }

  get(key: string) {
    const data = this._getDB();
    return data[key] || null;
  }

  search(key: string, id: string, field = 'id') {
    const data = this._getDB();
    if (!data[key]) {
      console.error(`the item '${key}' not exist in storage `);
      return null;
    }
    const index = data[key].findIndex((i: any) => i[field] == id);
    if (index == -1) {
      console.error(`the item '${key}' not exist in storage `);
      return null;
    }
    return data[key][index];
  }

  filter(key: string, id: string, field = 'id') {
    const data = this._getDB();
    if (!data[key]) {
      console.error(`the item '${key}' not exist in storage `);
      return null;
    }
    const list = data[key].filter((i: any) => i[field] == id);
    if (!list) {
      console.error(`the item '${key}' not exist in storage `);
      return null;
    }
    return list;
  }

  save(key: string, value: any) {
    const data = this._getDB();
    if (!data[key]) {
      data[key] = [];
    }
    data[key].push(value);
    this._saveDb(data);
    return this.get(key);
  }

  update(key: string, id: string, newValue: any, field = 'id') {
    const data = this._getDB();
    if (!data[key]) {
      console.error(`the item '${key}' not exist in storage `);
      return null;
    }
    const index = data[key].findIndex((i: any) => i[field] == id);
    if (index == -1) {
      console.error(`the item '${key}' not exist in storage `);
      return null;
    }

    data[key][index] = newValue;
    this._saveDb(data);
    return this.get(key);
  }

  delete(key: string, id: string, field = 'id') {
    const data = this._getDB();
    if (!data[key]) {
      console.error(`the item '${key}' not exist in storage `);
      return null;
    }
    let filtered = data;
    filtered[key] = data[key].filter((i: any) => i[field] != id);
    this._saveDb(filtered);
    return this.get(key);
  }

  getAll() {
    const data = this._getDB();
    const keys = Object.keys(data);
    return keys.length ? data : null;
  }
}
