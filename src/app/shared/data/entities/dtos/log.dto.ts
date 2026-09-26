export interface LogDTO {
  id?: number;
  date?: number,
  content: any,
  type: string
}

export function getLogDTO(content: any, type: string): LogDTO {
  return {
    id: null,
    date: new Date().getTime(),
    content: content,
    type: type
  } as LogDTO;
}

export const log_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [log_table] (
        [id] INTEGER PRIMARY KEY AUTOINCREMENT,
        [date] INTEGER,
        [content] TEXT,
        [type] TEXT
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [log_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [log_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [log_table]
      WHERE [id] = ?;
    `
  },

  filterBy: {
    query: `
      SELECT *
      FROM [log_table]
      WHERE [type] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [log_table] (
        [date],
        [content],
        [type]
      )
      VALUES (?, ?, ?) 
      ON CONFLICT(id) DO UPDATE SET 
          date = excluded.[date], 
          content = excluded.[content], 
          type = excluded.[type]
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [log_table]
      WHERE [id] = :id;
    `
  }

};
