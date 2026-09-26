import 'reflect-metadata';

// Llave única para almacenar los metadatos de la clase
const SQLITE_METADATA_KEY = Symbol('sqlite:column');
const SQLITE_RELATION_KEY = Symbol('sqlite:relation');
const SQLITE_JSON_KEY = Symbol('sqlite:json');

interface ColumnOptions {
  primaryKey?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  unique?: boolean;
  default?: any;
  customType?: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB';
}

interface ColumnMetadata extends ColumnOptions {
  propertyKey: string;
  propertyType: string;
}

interface RelationMetadata {
  propertyKey: string;
  targetEntity: Function;
  relationType: 'one-to-many';
  foreignKeyName?: string;
}

interface JsonColumnMetadata {
  propertyKey: string;
}

/**
 * Decorador de Propiedad: Marca una variable de la clase como columna de SQLite
 */
export function Column(options: ColumnOptions = {}): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    // Obtener el tipo de dato real de la propiedad usando Reflection incorporado de TS
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    const propertyType = type ? type.name.toLowerCase() : 'text';

    // Obtener columnas ya registradas en la clase
    const existingColumns: ColumnMetadata[] =
      Reflect.getMetadata(SQLITE_METADATA_KEY, target.constructor) || [];

    // Añadir la nueva columna
    existingColumns.push({
      propertyKey: propertyKey.toString(),
      propertyType,
      ...options
    });

    // Guardar los metadatos de vuelta en la clase
    Reflect.defineMetadata(SQLITE_METADATA_KEY, existingColumns, target.constructor);
  };
}

export function JsonColumn(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const existingJsonColumns: JsonColumnMetadata[] =
      Reflect.getMetadata(SQLITE_JSON_KEY, target.constructor) || [];

    existingJsonColumns.push({
      propertyKey: propertyKey.toString()
    });

    Reflect.defineMetadata(SQLITE_JSON_KEY, existingJsonColumns, target.constructor);
  };
}

export function OneToMany(targetEntity: () => Function, options?: { foreignKeyName?: string }): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const existingRelations: RelationMetadata[] =
      Reflect.getMetadata(SQLITE_RELATION_KEY, target.constructor) || [];

    existingRelations.push({
      propertyKey: propertyKey.toString(),
      targetEntity: targetEntity(),
      relationType: 'one-to-many',
      foreignKeyName: options?.foreignKeyName
    });

    Reflect.defineMetadata(SQLITE_RELATION_KEY, existingRelations, target.constructor);
  };
}

/**
 * Función Generadora: Recibe la Clase en la firma y escupe el Script SQL
 * @param targetClass La clase constructora (ej: Usuario)
 * @param tableName Nombre opcional para la tabla (si no se pasa, usa el nombre de la clase)
 */
export function generateTableFromClass(targetClass: Function, tableName?: string): string {
  const name = tableName || targetClass.name.toLowerCase() + 's';
  const columns: ColumnMetadata[] = Reflect.getMetadata(SQLITE_METADATA_KEY, targetClass) || [];
  const jsonColumns: JsonColumnMetadata[] = Reflect.getMetadata(SQLITE_JSON_KEY, targetClass) || [];

  if (columns.length === 0 && jsonColumns.length === 0) {
    throw new Error(`La clase ${targetClass.name} no tiene ninguna columna decorada`);
  }

  const columnsSQL: string[] = [];

  columns.forEach(col => {
    let sqliteType = 'TEXT';
    if (col.customType) {
      sqliteType = col.customType;
    } else if (col.propertyType === 'number') {
      sqliteType = Number.isInteger(col.default) || col.autoIncrement ? 'INTEGER' : 'REAL';
    } else if (col.propertyType === 'boolean') {
      sqliteType = 'INTEGER';
    }

    let sqlDefinition = `${col.propertyKey} ${sqliteType}`;

    if (col.primaryKey) sqlDefinition += ' PRIMARY KEY';
    if (col.autoIncrement && sqliteType === 'INTEGER') sqlDefinition += ' AUTOINCREMENT';
    if (col.notNull) sqlDefinition += ' NOT NULL';
    if (col.unique) sqlDefinition += ' UNIQUE';
    if (col.default !== undefined) {
      const defaultVal = typeof col.default === 'string' ? `'${col.default}'` : col.default;
      sqlDefinition += ` DEFAULT ${defaultVal}`;
    }

    columnsSQL.push(sqlDefinition);
  });

  jsonColumns.forEach(jsonCol => {
    columnsSQL.push(`${jsonCol.propertyKey} TEXT`);
  });

  return `CREATE TABLE IF NOT EXISTS ${name} (\n  ${columnsSQL.join(',\n  ')}\n);`;
}

export function generateTablesWithRelations(targetClass: Function, tableName?: string): string[] {
  const name = tableName || targetClass.name.toLowerCase() + 's';
  const columns: ColumnMetadata[] = Reflect.getMetadata(SQLITE_METADATA_KEY, targetClass) || [];
  const relations: RelationMetadata[] = Reflect.getMetadata(SQLITE_RELATION_KEY, targetClass) || [];
  const sqlStatements: string[] = [];

  const processedClasses = new Set<string>();

  function processClass(cls: Function, parentTableName?: string, parentForeignKey?: string): void {
    const className = cls.name;
    if (processedClasses.has(className)) return;

    const currentTableName = cls.name.replace('Entity', '');
    const columns: ColumnMetadata[] = Reflect.getMetadata(SQLITE_METADATA_KEY, cls) || [];
    const jsonColumns: JsonColumnMetadata[] = Reflect.getMetadata(SQLITE_JSON_KEY, cls) || [];
    const childRelations: RelationMetadata[] = Reflect.getMetadata(SQLITE_RELATION_KEY, cls) || [];

    const columnsSQL: string[] = [];

    columns.forEach(col => {
      let sqliteType = mapTypeToSQLite(col.propertyType, col);
      let sqlDefinition = `${col.propertyKey} ${sqliteType}`;

      if (col.primaryKey) sqlDefinition += ' PRIMARY KEY';
      if (col.autoIncrement && sqliteType === 'INTEGER') sqlDefinition += ' AUTOINCREMENT';
      if (col.notNull) sqlDefinition += ' NOT NULL';
      if (col.unique) sqlDefinition += ' UNIQUE';
      if (col.default !== undefined) {
        const defaultVal = typeof col.default === 'string' ? `'${col.default}'` : col.default;
        sqlDefinition += ` DEFAULT ${defaultVal}`;
      }

      columnsSQL.push(sqlDefinition);
    });

    jsonColumns.forEach(jsonCol => {
      columnsSQL.push(`${jsonCol.propertyKey} TEXT`);
    });

    if (parentForeignKey && parentTableName) {
      columnsSQL.push(`${parentForeignKey} TEXT`);
      columnsSQL.push(`FOREIGN KEY (${parentForeignKey}) REFERENCES ${parentTableName}(id)`);
    }

    const tableSQL = `CREATE TABLE IF NOT EXISTS ${currentTableName} (\n  ${columnsSQL.join(',\n  ')}\n);`;
    sqlStatements.push(tableSQL);
    processedClasses.add(className);

    childRelations.forEach(relation => {
      const fkName = relation.foreignKeyName || `${currentTableName.toLowerCase()}Id`;
      processClass(relation.targetEntity, currentTableName, fkName);
    });
  }

  processClass(targetClass);

  return sqlStatements;
}

function mapTypeToSQLite(propertyType: string, col: ColumnMetadata): string {
  if (col.customType) return col.customType;
  if (propertyType === 'number') {
    return Number.isInteger(col.default) || col.autoIncrement ? 'INTEGER' : 'REAL';
  }
  if (propertyType === 'boolean') return 'INTEGER';
  return 'TEXT';
}