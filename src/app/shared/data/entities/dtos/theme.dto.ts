
export interface ThemeDTO {
  id: string;
  content: ThemePropertiesDTO | string
}

export interface ThemePropertiesDTO {
  appBackground?: String;
  appBackgroundTransparent?: String;
  appColor?: String;
  appFontSize?: String;
  textFontSize?: String;

  primary?: String;
  primaryBackground?: String;
  primaryBackgroundHover?: String;
  primaryColor?: String;

  secondary?: String;
  secondaryBackground?: String;
  secondaryBackgroundHover?: String;
  secondaryBackgroundAlterHover?: String;
  secondaryColor?: String;

  accent?: String;
  accentBackground?: String;
  accentBackgroundHover?: String;
  accentColor?: String;

  scrollColor?: String;
  scrollBackground?: String;

  formErrorColor?: String;
  formBackground?: String;
  formBackgroundSolid?: String;
  formBackgroundTransparent?: String;

  notificationColor?: String;
  notificationColorContrast?: String;
  notificationSuccess?: String;
  notificationWarning?: String;
  notificationError?: String;
  notificationInfo?: String;

  gradeBackgroundPassed?: String;
  gradeColorPassed?: String;
  gradeBackgroundFailed?: String;
  gradeColorFailed?: String;
  gradeBackgroundBarely?: String;
  gradeColorBarely?: String;

  gradePanelPassed?: String;
  gradePanelFailed?: String;
  gradePanelBarely?: String;


  pillBackground?: String;
  pillColor?: String;
  rootHeroBackground?: String;
  timerBarBackground?: String;
  timerBarContainerBackground?: String;
  statusBackground?: String;

  answerBorderColor?: String;
  answerSelectedColor?: String;
  answerSelectedBackground?: String;
  answerCorrectColor?: String;
  answerCorrectColorText?: String;
  answerCorrectBorderColor?: String;
  answerCorrectBackground?: String;
  answerIncorrectColor?: String;
  answerIncorrectBackground?: String;
  answerIncorrectBorderColor?: String;

  grayBackdropBackground?: String;
  borderColorTransparent?: String;
  matLabelBackground?: String;
  matLabelContrastBackground?: String;
  itemOptionBorder?: String;
  stadisticBackground?: String;

  zoomLevel?: String;
}

export function getThemeDTO(id: string, content: string): ThemeDTO {
  return {
    id: id,
    content: content
  } as ThemeDTO;
}


export const theme_table_querys = {

  createTable: {
    query: `
      CREATE TABLE IF NOT EXISTS [theme_table] (
        [id] TEXT PRIMARY KEY,
        [content] TEXT NOT NULL
      );
    `
  },

  deleteTable: {
    query: `
      DROP TABLE IF EXISTS [theme_table];
    `
  },

  selectAll: {
    query: `
      SELECT *
      FROM [theme_table];
    `
  },

  selectById: {
    query: `
      SELECT *
      FROM [theme_table]
      WHERE [id] = ?;
    `
  },

  filterBy: {
    query: `
      SELECT *
      FROM [theme_table]
      WHERE [id] = ?;
    `
  },

  post: {
    query: `
      INSERT INTO [theme_table] (
        [id],
        [content]
      )
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET 
          content = excluded.content
      RETURNING *;
    `
  },

  put: {
    query: `
      INSERT INTO [theme_table] (
        [id],
        [content]
      )
      VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET 
          content = excluded.content
      RETURNING *;
    `
  },

  deleteById: {
    query: `
      DELETE FROM [theme_table]
      WHERE [id] = :id;
    `
  }

};
