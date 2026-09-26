
import { v4 as uuidv4 } from 'uuid';

export interface UserDTO {
  userId?: number;
  uuid: string;
  userName: string;
  age?: number;
  avatarUrl?: string;
  avatarBody?: string;
  current: boolean | number;

  // GENERATED
}

export function getUserDTO(userName: string, age: number | null, avatarUrl: string | null): UserDTO {
  return {
    userId: null,
    uuid: uuidv4(),
    userName: userName,
    age: age,
    avatarUrl: avatarUrl,
    avatarBody: null,
    current: false,
  } as UserDTO;
}

export const user_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [user_table] (
        [userId] INTEGER PRIMARY KEY,
        [uuid] TEXT,
        [userName] TEXT NOT NULL,
        [age] INTEGER,
        [avatarUrl] TEXT,
        [avatarBody] TEXT,
        [current] BOOLEAN
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [user_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [user_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [user_table]
      WHERE [userId] = ?;
    `
  },

  selectByCurrent: {
    query: `
    SELECT * 
    FROM [user_table] 
    WHERE [current] = 1 LIMIT 1;`
  },

  filterBy: {
    query: `
      SELECT *
      FROM [user_table]
      WHERE [userName] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [user_table] (
        [uuid],
        [userName],
        [age],
        [avatarUrl],
        [avatarBody],
        [current]
      )
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [user_table] (
        [userId],
        [uuid],
        [userName],
        [age],
        [avatarUrl],
        [avatarBody],
        [current]
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
            [uuid] = excluded.uuid,
            [userName] = excluded.userName,
            [age] = excluded.age,
            [avatarUrl] = excluded.avatarUrl,
            [avatarBody] = excluded.avatarBody,
            [current] = excluded.current
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [user_table]
      WHERE [userId] = ?
      RETURNING *;
    `
  }
};
