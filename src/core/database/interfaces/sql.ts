type TType = TTypeText | TTypeNumeric | TTypeDate | TTypeSpatial;
//#region Type to data
type TTypeNumeric = 'INT' | 'TINYINT' | 'SMALLINT' | 'MEDIUMINT' | 'BIGINT' | 'DECIMAL' | 'FLOAT' | 'DOUBLE' | 'DOUBLE';
type TTypeText = 'VARCHAR' | 'TEXT' | 'CHAR' | 'TINTEXT' | 'BINARY' | 'VARBINARY' | 'TINYBLOB' | 'BLOB' | 'MEDIUMBLOB' | 'LONGBLOB' | 'MEDIUMTEXT' | 'LONGTEXT' | 'ENUM' | 'SET';
type TTypeDate = 'DATE' | 'TIME' | 'DATETIME' | 'TIMESTAMP' | 'YEAR';
type TTypeSpatial = 'GEOMETRY' | 'POINT' | 'LINESTRING' | 'MULTIPOLYGON' | 'MULTIPOINT' | 'MULTILINESTRING' | 'GEOMETRYCOLLECTION' | 'POLYGON';
//#endregion

type TSentence = 'DELETE' | 'CREATE' | 'UPDATE' | 'SELECT' | 'SHOW';
type TDatabase = 'COLUMN' | 'TABLE' | TDatabaseAttribute;
type TDatabaseAttribute = 'PRIMARY KEY' | 'NOT NULL' | 'UNIQUE' | 'AUTO_INCREMENT' | 'COMMENT' | 'DEFAULT' | 'CHARACTER SET' | 'COLLATE' | 'DEFAULT CHARSET' | 'ENGINE';
// Rerence options in foreignKey
type TReferenceOptions = 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'NO ACTION' | 'SET DEFAULT';

type TCharset = 'BIG5' | 'DEC8' | 'CP850' | 'HP8' | 'KOI8R' | 'LATIN1' | 'LATIN2' | 'SWE7' | 'ASCII' | 'UJIS' | 'SJIS' | 'HEBREW' | 'TIS620' | 'EUCKR' | 'KOI8U' | 'GB2312' | 'GREEK' | 'CP1250' | 'GBK' | 'LATIN5' | 'ARMSCII8' | 'UTF8' | 'UCS2' | 'CP866' | 'KEYBCS2' | 'MACCE' | 'MACROMAN' | 'CP852' | 'LATIN7' | 'UTF8MB4' | 'CP1251' | 'UTF16' | 'UTF16LE' | 'CP1256' | 'CP1257' | 'UTF32' | 'BINARY' | 'GEOSTD8' | 'CP932' | 'EUCJPMS';
type TEngine = 'InnoDB' | 'Aria' | 'CSV' | 'MEMORY' | 'MyISAM' | 'NDB' | 'BLACKHOLE' | 'ARCHIVE' | 'SEQUENCE' | 'MRG_MyISAM' | 'PERFORMANCE_SCHEMA';
//#region Collation
type TCollation = TCollationUtf8 | TCollationBig5;
type ICollation<T extends TCharset> = TCollationUtf8;

type TCollationUtf8 = 'UTF8_GENERAL_CI' | 'UTF8_BIN' | 'UTF8_UNICODE_CI' | 'UTF8_ICELANDIC_CI' | 'UTF8_LATVIAN_CI' | 'UTF8_ROMANIAN_CI' | 'UTF8_SLOVENIAN_CI' | 'UTF8_POLISH_CI' | 'UTF8_ESTONIAN_CI' | 'UTF8_SPANISH_CI' | 'UTF8_SWEDISH_CI' | 'UTF8_TURKISH_CI' | 'UTF8_CZECH_CI' | 'UTF8_DANISH_CI' | 'UTF8_LITHUANIAN_CI' | 'UTF8_SLOVAK_CI' | 'UTF8_SPANISH2_CI' | 'UTF8_ROMAN_CI' | 'UTF8_PERSIAN_CI' | 'UTF8_ESPERANTO_CI' | 'UTF8_HUNGARIAN_CI' | 'UTF8_SINHALA_CI' | 'UTF8_GERMAN2_CI' | 'UTF8_CROATIAN_MYSQL561_CI' | 'UTF8_UNICODE_520_CI' | 'UTF8_VIETNAMESE_CI' | 'UTF8_GENERAL_MYSQL500_CI' | 'UTF8_CROATIAN_CI' | 'UTF8_MYANMAR_CI' | 'UTF8_THAI_520_W2' | 'UTF8_GENERAL_NOPAD_CI' | 'UTF8_NOPAD_BIN' | 'UTF8_UNICODE_NOPAD_CI' | 'UTF8_UNICODE_520_NOPAD_CI';

type TCollationBig5 = 'BIG5_CHINESE_CI' | 'BIG5_BIN' | 'BIG5_CHINESE_NOPAD_CI' | 'BIG5_NOPAD_BIN';
//#endregion

export {
    TType,
    TSentence,
    TDatabase,
    TReferenceOptions,
    TCharset,
    ICollation,
    TCollation,
    TEngine
};