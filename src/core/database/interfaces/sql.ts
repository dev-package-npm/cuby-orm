type TType = TTypeText | TTypeNumeric | TTypeDate | TTypeSpatial;

type TTypeNumeric = 'INT' | 'TINYINT' | 'SMALLINT' | 'MEDIUMINT' | 'BIGINT' | 'DECIMAL' | 'FLOAT' | 'DOUBLE' | 'DOUBLE';
type TTypeText = 'VARCHAR' | 'TEXT' | 'CHAR' | 'TINTEXT' | 'BINARY' | 'VARBINARY' | 'TINYBLOB' | 'BLOB' | 'MEDIUMBLOB' | 'LONGBLOB' | 'MEDIUMTEXT' | 'LONGTEXT' | 'ENUM' | 'SET';
type TTypeDate = 'DATE' | 'TIME' | 'DATETIME' | 'TIMESTAMP' | 'YEAR';
type TTypeSpatial = 'GEOMETRY' | 'POINT' | 'LINESTRING' | 'MULTIPOLYGON' | 'MULTIPOINT' | 'MULTILINESTRING' | 'GEOMETRYCOLLECTION' | 'POLYGON';

type TSentence = 'DELETE' | 'CREATE' | 'UPDATE' | 'SELECT' | 'SHOW';
type TDatabase = 'COLUMN' | 'TABLE' | TDatabaseAttribute;
type TDatabaseAttribute = 'PRIMARY KEY' | 'NOT NULL' | 'UNIQUE' | 'AUTO_INCREMENT' | 'COMMENT' | 'DEFAULT';
// Rerence options in foreignKey
type TReferenceOptions = 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'SET DEFAULT';

export { TType, TSentence, TDatabase, TReferenceOptions };