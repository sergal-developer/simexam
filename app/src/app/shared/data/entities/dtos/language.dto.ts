export interface LanguageDTO {
  value: string;
  name: string;
}

export function getLanguageDTO(name: string, value: string): LanguageDTO {
  return { name: name, value: value } as LanguageDTO;
}

export const language_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [language_table] (
        [value] TEXT PRIMARY KEY,
        [name] TEXT
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [language_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [language_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [language_table]
      WHERE [value] = ?;
    `
  },

  filterBy: {
    query: `
      SELECT *
      FROM [language_table]
      WHERE [name] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [language_table] (
        [value],
        [name]
      )
      VALUES (?, ?)
      ON CONFLICT(value) DO UPDATE SET 
          name = excluded.name
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [language_table] (
        [value],
        [name]
      )
      VALUES (?, ?)
      ON CONFLICT(value) DO UPDATE SET 
          name = excluded.name
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [language_table]
      WHERE [value] = ?;
    `
  }

};