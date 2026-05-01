"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/postgres-array@3.0.4/node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "../../node_modules/.pnpm/postgres-array@3.0.4/node_modules/postgres-array/index.js"(exports2) {
    "use strict";
    var BACKSLASH = "\\";
    var DQUOT = '"';
    var LBRACE = "{";
    var RBRACE = "}";
    var LBRACKET = "[";
    var EQUALS = "=";
    var COMMA = ",";
    var NULL_STRING = "NULL";
    function makeParseArrayWithTransform(transform) {
      const haveTransform = transform != null;
      return function parseArray3(str) {
        const rbraceIndex = str.length - 1;
        if (rbraceIndex === 1) {
          return [];
        }
        if (str[rbraceIndex] !== RBRACE) {
          throw new Error("Invalid array text - must end with }");
        }
        let position = 0;
        if (str[position] === LBRACKET) {
          position = str.indexOf(EQUALS) + 1;
        }
        if (str[position++] !== LBRACE) {
          throw new Error("Invalid array text - must start with {");
        }
        const output = [];
        let current = output;
        const stack = [];
        let currentStringStart = position;
        let currentString = "";
        let expectValue = true;
        for (; position < rbraceIndex; ++position) {
          let char = str[position];
          if (char === DQUOT) {
            currentStringStart = ++position;
            let dquot = str.indexOf(DQUOT, currentStringStart);
            let backSlash = str.indexOf(BACKSLASH, currentStringStart);
            while (backSlash !== -1 && backSlash < dquot) {
              position = backSlash;
              const part2 = str.slice(currentStringStart, position);
              currentString += part2;
              currentStringStart = ++position;
              if (dquot === position++) {
                dquot = str.indexOf(DQUOT, position);
              }
              backSlash = str.indexOf(BACKSLASH, position);
            }
            position = dquot;
            const part = str.slice(currentStringStart, position);
            currentString += part;
            current.push(haveTransform ? transform(currentString) : currentString);
            currentString = "";
            expectValue = false;
          } else if (char === LBRACE) {
            const newArray = [];
            current.push(newArray);
            stack.push(current);
            current = newArray;
            currentStringStart = position + 1;
            expectValue = true;
          } else if (char === COMMA) {
            expectValue = true;
          } else if (char === RBRACE) {
            expectValue = false;
            const arr = stack.pop();
            if (arr === void 0) {
              throw new Error("Invalid array text - too many '}'");
            }
            current = arr;
          } else if (expectValue) {
            currentStringStart = position;
            while ((char = str[position]) !== COMMA && char !== RBRACE && position < rbraceIndex) {
              ++position;
            }
            const part = str.slice(currentStringStart, position--);
            current.push(
              part === NULL_STRING ? null : haveTransform ? transform(part) : part
            );
            expectValue = false;
          } else {
            throw new Error("Was expecting delimeter");
          }
        }
        return output;
      };
    }
    var parseArray2 = makeParseArrayWithTransform();
    exports2.parse = (source, transform) => transform != null ? makeParseArrayWithTransform(transform)(source) : parseArray2(source);
  }
});

// src/seed.ts
var import_config = require("dotenv/config");

// ../../node_modules/.pnpm/@prisma+debug@7.2.0/node_modules/@prisma/debug/dist/index.mjs
var __defProp2 = Object.defineProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp2(target, name2, { get: all[name2], enumerable: true });
};
var colors_exports = {};
__export(colors_exports, {
  $: () => $,
  bgBlack: () => bgBlack,
  bgBlue: () => bgBlue,
  bgCyan: () => bgCyan,
  bgGreen: () => bgGreen,
  bgMagenta: () => bgMagenta,
  bgRed: () => bgRed,
  bgWhite: () => bgWhite,
  bgYellow: () => bgYellow,
  black: () => black,
  blue: () => blue,
  bold: () => bold,
  cyan: () => cyan,
  dim: () => dim,
  gray: () => gray,
  green: () => green,
  grey: () => grey,
  hidden: () => hidden,
  inverse: () => inverse,
  italic: () => italic,
  magenta: () => magenta,
  red: () => red,
  reset: () => reset,
  strikethrough: () => strikethrough,
  underline: () => underline,
  white: () => white,
  yellow: () => yellow
});
var FORCE_COLOR;
var NODE_DISABLE_COLORS;
var NO_COLOR;
var TERM;
var isTTY = true;
if (typeof process !== "undefined") {
  ({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env || {});
  isTTY = process.stdout && process.stdout.isTTY;
}
var $ = {
  enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY)
};
function init(x, y) {
  let rgx = new RegExp(`\\x1b\\[${y}m`, "g");
  let open = `\x1B[${x}m`, close = `\x1B[${y}m`;
  return function(txt) {
    if (!$.enabled || txt == null) return txt;
    return open + (!!~("" + txt).indexOf(close) ? txt.replace(rgx, close + open) : txt) + close;
  };
}
var reset = init(0, 0);
var bold = init(1, 22);
var dim = init(2, 22);
var italic = init(3, 23);
var underline = init(4, 24);
var inverse = init(7, 27);
var hidden = init(8, 28);
var strikethrough = init(9, 29);
var black = init(30, 39);
var red = init(31, 39);
var green = init(32, 39);
var yellow = init(33, 39);
var blue = init(34, 39);
var magenta = init(35, 39);
var cyan = init(36, 39);
var white = init(37, 39);
var gray = init(90, 39);
var grey = init(90, 39);
var bgBlack = init(40, 49);
var bgRed = init(41, 49);
var bgGreen = init(42, 49);
var bgYellow = init(43, 49);
var bgBlue = init(44, 49);
var bgMagenta = init(45, 49);
var bgCyan = init(46, 49);
var bgWhite = init(47, 49);
var MAX_ARGS_HISTORY = 100;
var COLORS = ["green", "yellow", "blue", "magenta", "cyan", "red"];
var argsHistory = [];
var lastTimestamp = Date.now();
var lastColor = 0;
var processEnv = typeof process !== "undefined" ? process.env : {};
globalThis.DEBUG ??= processEnv.DEBUG ?? "";
globalThis.DEBUG_COLORS ??= processEnv.DEBUG_COLORS ? processEnv.DEBUG_COLORS === "true" : true;
var topProps = {
  enable(namespace) {
    if (typeof namespace === "string") {
      globalThis.DEBUG = namespace;
    }
  },
  disable() {
    const prev = globalThis.DEBUG;
    globalThis.DEBUG = "";
    return prev;
  },
  // this is the core logic to check if logging should happen or not
  enabled(namespace) {
    const listenedNamespaces = globalThis.DEBUG.split(",").map((s) => {
      return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    });
    const isListened = listenedNamespaces.some((listenedNamespace) => {
      if (listenedNamespace === "" || listenedNamespace[0] === "-") return false;
      return namespace.match(RegExp(listenedNamespace.split("*").join(".*") + "$"));
    });
    const isExcluded = listenedNamespaces.some((listenedNamespace) => {
      if (listenedNamespace === "" || listenedNamespace[0] !== "-") return false;
      return namespace.match(RegExp(listenedNamespace.slice(1).split("*").join(".*") + "$"));
    });
    return isListened && !isExcluded;
  },
  log: (...args) => {
    const [namespace, format, ...rest] = args;
    const logWithFormatting = console.warn ?? console.log;
    logWithFormatting(`${namespace} ${format}`, ...rest);
  },
  formatters: {}
  // not implemented
};
function debugCreate(namespace) {
  const instanceProps = {
    color: COLORS[lastColor++ % COLORS.length],
    enabled: topProps.enabled(namespace),
    namespace,
    log: topProps.log,
    extend: () => {
    }
    // not implemented
  };
  const debugCall = (...args) => {
    const { enabled, namespace: namespace2, color, log } = instanceProps;
    if (args.length !== 0) {
      argsHistory.push([namespace2, ...args]);
    }
    if (argsHistory.length > MAX_ARGS_HISTORY) {
      argsHistory.shift();
    }
    if (topProps.enabled(namespace2) || enabled) {
      const stringArgs = args.map((arg) => {
        if (typeof arg === "string") {
          return arg;
        }
        return safeStringify(arg);
      });
      const ms = `+${Date.now() - lastTimestamp}ms`;
      lastTimestamp = Date.now();
      if (globalThis.DEBUG_COLORS) {
        log(colors_exports[color](bold(namespace2)), ...stringArgs, colors_exports[color](ms));
      } else {
        log(namespace2, ...stringArgs, ms);
      }
    }
  };
  return new Proxy(debugCall, {
    get: (_, prop) => instanceProps[prop],
    set: (_, prop, value) => instanceProps[prop] = value
  });
}
var Debug = new Proxy(debugCreate, {
  get: (_, prop) => topProps[prop],
  set: (_, prop, value) => topProps[prop] = value
});
function safeStringify(value, indent = 2) {
  const cache = /* @__PURE__ */ new Set();
  return JSON.stringify(
    value,
    (key, value2) => {
      if (typeof value2 === "object" && value2 !== null) {
        if (cache.has(value2)) {
          return `[Circular *]`;
        }
        cache.add(value2);
      } else if (typeof value2 === "bigint") {
        return value2.toString();
      }
      return value2;
    },
    indent
  );
}

// ../../node_modules/.pnpm/@prisma+driver-adapter-utils@7.2.0/node_modules/@prisma/driver-adapter-utils/dist/index.mjs
var DriverAdapterError = class extends Error {
  name = "DriverAdapterError";
  cause;
  constructor(payload) {
    super(typeof payload["message"] === "string" ? payload["message"] : payload.kind);
    this.cause = payload;
  }
};
var debug = Debug("driver-adapter-utils");
var ColumnTypeEnum = {
  // Scalars
  Int32: 0,
  Int64: 1,
  Float: 2,
  Double: 3,
  Numeric: 4,
  Boolean: 5,
  Character: 6,
  Text: 7,
  Date: 8,
  Time: 9,
  DateTime: 10,
  Json: 11,
  Enum: 12,
  Bytes: 13,
  Set: 14,
  Uuid: 15,
  // Arrays
  Int32Array: 64,
  Int64Array: 65,
  FloatArray: 66,
  DoubleArray: 67,
  NumericArray: 68,
  BooleanArray: 69,
  CharacterArray: 70,
  TextArray: 71,
  DateArray: 72,
  TimeArray: 73,
  DateTimeArray: 74,
  JsonArray: 75,
  EnumArray: 76,
  BytesArray: 77,
  UuidArray: 78,
  // Custom
  UnknownNumber: 128
};
var mockAdapterErrors = {
  queryRaw: new Error("Not implemented: queryRaw"),
  executeRaw: new Error("Not implemented: executeRaw"),
  startTransaction: new Error("Not implemented: startTransaction"),
  executeScript: new Error("Not implemented: executeScript"),
  dispose: new Error("Not implemented: dispose")
};

// ../../node_modules/.pnpm/@prisma+adapter-pg@7.2.0/node_modules/@prisma/adapter-pg/dist/index.mjs
var import_pg = __toESM(require("pg"), 1);
var import_pg2 = __toESM(require("pg"), 1);
var import_postgres_array = __toESM(require_postgres_array(), 1);
var name = "@prisma/adapter-pg";
var FIRST_NORMAL_OBJECT_ID = 16384;
var { types } = import_pg2.default;
var { builtins: ScalarColumnType, getTypeParser } = types;
var AdditionalScalarColumnType = {
  NAME: 19
};
var ArrayColumnType = {
  BIT_ARRAY: 1561,
  BOOL_ARRAY: 1e3,
  BYTEA_ARRAY: 1001,
  BPCHAR_ARRAY: 1014,
  CHAR_ARRAY: 1002,
  CIDR_ARRAY: 651,
  DATE_ARRAY: 1182,
  FLOAT4_ARRAY: 1021,
  FLOAT8_ARRAY: 1022,
  INET_ARRAY: 1041,
  INT2_ARRAY: 1005,
  INT4_ARRAY: 1007,
  INT8_ARRAY: 1016,
  JSONB_ARRAY: 3807,
  JSON_ARRAY: 199,
  MONEY_ARRAY: 791,
  NUMERIC_ARRAY: 1231,
  OID_ARRAY: 1028,
  TEXT_ARRAY: 1009,
  TIMESTAMP_ARRAY: 1115,
  TIMESTAMPTZ_ARRAY: 1185,
  TIME_ARRAY: 1183,
  UUID_ARRAY: 2951,
  VARBIT_ARRAY: 1563,
  VARCHAR_ARRAY: 1015,
  XML_ARRAY: 143
};
var UnsupportedNativeDataType = class _UnsupportedNativeDataType extends Error {
  // map of type codes to type names
  static typeNames = {
    16: "bool",
    17: "bytea",
    18: "char",
    19: "name",
    20: "int8",
    21: "int2",
    22: "int2vector",
    23: "int4",
    24: "regproc",
    25: "text",
    26: "oid",
    27: "tid",
    28: "xid",
    29: "cid",
    30: "oidvector",
    32: "pg_ddl_command",
    71: "pg_type",
    75: "pg_attribute",
    81: "pg_proc",
    83: "pg_class",
    114: "json",
    142: "xml",
    194: "pg_node_tree",
    269: "table_am_handler",
    325: "index_am_handler",
    600: "point",
    601: "lseg",
    602: "path",
    603: "box",
    604: "polygon",
    628: "line",
    650: "cidr",
    700: "float4",
    701: "float8",
    705: "unknown",
    718: "circle",
    774: "macaddr8",
    790: "money",
    829: "macaddr",
    869: "inet",
    1033: "aclitem",
    1042: "bpchar",
    1043: "varchar",
    1082: "date",
    1083: "time",
    1114: "timestamp",
    1184: "timestamptz",
    1186: "interval",
    1266: "timetz",
    1560: "bit",
    1562: "varbit",
    1700: "numeric",
    1790: "refcursor",
    2202: "regprocedure",
    2203: "regoper",
    2204: "regoperator",
    2205: "regclass",
    2206: "regtype",
    2249: "record",
    2275: "cstring",
    2276: "any",
    2277: "anyarray",
    2278: "void",
    2279: "trigger",
    2280: "language_handler",
    2281: "internal",
    2283: "anyelement",
    2287: "_record",
    2776: "anynonarray",
    2950: "uuid",
    2970: "txid_snapshot",
    3115: "fdw_handler",
    3220: "pg_lsn",
    3310: "tsm_handler",
    3361: "pg_ndistinct",
    3402: "pg_dependencies",
    3500: "anyenum",
    3614: "tsvector",
    3615: "tsquery",
    3642: "gtsvector",
    3734: "regconfig",
    3769: "regdictionary",
    3802: "jsonb",
    3831: "anyrange",
    3838: "event_trigger",
    3904: "int4range",
    3906: "numrange",
    3908: "tsrange",
    3910: "tstzrange",
    3912: "daterange",
    3926: "int8range",
    4072: "jsonpath",
    4089: "regnamespace",
    4096: "regrole",
    4191: "regcollation",
    4451: "int4multirange",
    4532: "nummultirange",
    4533: "tsmultirange",
    4534: "tstzmultirange",
    4535: "datemultirange",
    4536: "int8multirange",
    4537: "anymultirange",
    4538: "anycompatiblemultirange",
    4600: "pg_brin_bloom_summary",
    4601: "pg_brin_minmax_multi_summary",
    5017: "pg_mcv_list",
    5038: "pg_snapshot",
    5069: "xid8",
    5077: "anycompatible",
    5078: "anycompatiblearray",
    5079: "anycompatiblenonarray",
    5080: "anycompatiblerange"
  };
  type;
  constructor(code) {
    super();
    this.type = _UnsupportedNativeDataType.typeNames[code] || "Unknown";
    this.message = `Unsupported column type ${this.type}`;
  }
};
function fieldToColumnType(fieldTypeId) {
  switch (fieldTypeId) {
    case ScalarColumnType.INT2:
    case ScalarColumnType.INT4:
      return ColumnTypeEnum.Int32;
    case ScalarColumnType.INT8:
      return ColumnTypeEnum.Int64;
    case ScalarColumnType.FLOAT4:
      return ColumnTypeEnum.Float;
    case ScalarColumnType.FLOAT8:
      return ColumnTypeEnum.Double;
    case ScalarColumnType.BOOL:
      return ColumnTypeEnum.Boolean;
    case ScalarColumnType.DATE:
      return ColumnTypeEnum.Date;
    case ScalarColumnType.TIME:
    case ScalarColumnType.TIMETZ:
      return ColumnTypeEnum.Time;
    case ScalarColumnType.TIMESTAMP:
    case ScalarColumnType.TIMESTAMPTZ:
      return ColumnTypeEnum.DateTime;
    case ScalarColumnType.NUMERIC:
    case ScalarColumnType.MONEY:
      return ColumnTypeEnum.Numeric;
    case ScalarColumnType.JSON:
    case ScalarColumnType.JSONB:
      return ColumnTypeEnum.Json;
    case ScalarColumnType.UUID:
      return ColumnTypeEnum.Uuid;
    case ScalarColumnType.OID:
      return ColumnTypeEnum.Int64;
    case ScalarColumnType.BPCHAR:
    case ScalarColumnType.TEXT:
    case ScalarColumnType.VARCHAR:
    case ScalarColumnType.BIT:
    case ScalarColumnType.VARBIT:
    case ScalarColumnType.INET:
    case ScalarColumnType.CIDR:
    case ScalarColumnType.XML:
    case AdditionalScalarColumnType.NAME:
      return ColumnTypeEnum.Text;
    case ScalarColumnType.BYTEA:
      return ColumnTypeEnum.Bytes;
    case ArrayColumnType.INT2_ARRAY:
    case ArrayColumnType.INT4_ARRAY:
      return ColumnTypeEnum.Int32Array;
    case ArrayColumnType.FLOAT4_ARRAY:
      return ColumnTypeEnum.FloatArray;
    case ArrayColumnType.FLOAT8_ARRAY:
      return ColumnTypeEnum.DoubleArray;
    case ArrayColumnType.NUMERIC_ARRAY:
    case ArrayColumnType.MONEY_ARRAY:
      return ColumnTypeEnum.NumericArray;
    case ArrayColumnType.BOOL_ARRAY:
      return ColumnTypeEnum.BooleanArray;
    case ArrayColumnType.CHAR_ARRAY:
      return ColumnTypeEnum.CharacterArray;
    case ArrayColumnType.BPCHAR_ARRAY:
    case ArrayColumnType.TEXT_ARRAY:
    case ArrayColumnType.VARCHAR_ARRAY:
    case ArrayColumnType.VARBIT_ARRAY:
    case ArrayColumnType.BIT_ARRAY:
    case ArrayColumnType.INET_ARRAY:
    case ArrayColumnType.CIDR_ARRAY:
    case ArrayColumnType.XML_ARRAY:
      return ColumnTypeEnum.TextArray;
    case ArrayColumnType.DATE_ARRAY:
      return ColumnTypeEnum.DateArray;
    case ArrayColumnType.TIME_ARRAY:
      return ColumnTypeEnum.TimeArray;
    case ArrayColumnType.TIMESTAMP_ARRAY:
      return ColumnTypeEnum.DateTimeArray;
    case ArrayColumnType.TIMESTAMPTZ_ARRAY:
      return ColumnTypeEnum.DateTimeArray;
    case ArrayColumnType.JSON_ARRAY:
    case ArrayColumnType.JSONB_ARRAY:
      return ColumnTypeEnum.JsonArray;
    case ArrayColumnType.BYTEA_ARRAY:
      return ColumnTypeEnum.BytesArray;
    case ArrayColumnType.UUID_ARRAY:
      return ColumnTypeEnum.UuidArray;
    case ArrayColumnType.INT8_ARRAY:
    case ArrayColumnType.OID_ARRAY:
      return ColumnTypeEnum.Int64Array;
    default:
      if (fieldTypeId >= FIRST_NORMAL_OBJECT_ID) {
        return ColumnTypeEnum.Text;
      }
      throw new UnsupportedNativeDataType(fieldTypeId);
  }
}
function normalize_array(element_normalizer) {
  return (str) => (0, import_postgres_array.parse)(str, element_normalizer);
}
function normalize_numeric(numeric) {
  return numeric;
}
function normalize_date(date) {
  return date;
}
function normalize_timestamp(time) {
  return `${time.replace(" ", "T")}+00:00`;
}
function normalize_timestamptz(time) {
  return time.replace(" ", "T").replace(/[+-]\d{2}(:\d{2})?$/, "+00:00");
}
function normalize_time(time) {
  return time;
}
function normalize_timez(time) {
  return time.replace(/[+-]\d{2}(:\d{2})?$/, "");
}
function normalize_money(money) {
  return money.slice(1);
}
function normalize_xml(xml) {
  return xml;
}
function toJson(json) {
  return json;
}
var parsePgBytes = getTypeParser(ScalarColumnType.BYTEA);
var normalizeByteaArray = getTypeParser(ArrayColumnType.BYTEA_ARRAY);
function convertBytes(serializedBytes) {
  return parsePgBytes(serializedBytes);
}
function normalizeBit(bit) {
  return bit;
}
var customParsers = {
  [ScalarColumnType.NUMERIC]: normalize_numeric,
  [ArrayColumnType.NUMERIC_ARRAY]: normalize_array(normalize_numeric),
  [ScalarColumnType.TIME]: normalize_time,
  [ArrayColumnType.TIME_ARRAY]: normalize_array(normalize_time),
  [ScalarColumnType.TIMETZ]: normalize_timez,
  [ScalarColumnType.DATE]: normalize_date,
  [ArrayColumnType.DATE_ARRAY]: normalize_array(normalize_date),
  [ScalarColumnType.TIMESTAMP]: normalize_timestamp,
  [ArrayColumnType.TIMESTAMP_ARRAY]: normalize_array(normalize_timestamp),
  [ScalarColumnType.TIMESTAMPTZ]: normalize_timestamptz,
  [ArrayColumnType.TIMESTAMPTZ_ARRAY]: normalize_array(normalize_timestamptz),
  [ScalarColumnType.MONEY]: normalize_money,
  [ArrayColumnType.MONEY_ARRAY]: normalize_array(normalize_money),
  [ScalarColumnType.JSON]: toJson,
  [ArrayColumnType.JSON_ARRAY]: normalize_array(toJson),
  [ScalarColumnType.JSONB]: toJson,
  [ArrayColumnType.JSONB_ARRAY]: normalize_array(toJson),
  [ScalarColumnType.BYTEA]: convertBytes,
  [ArrayColumnType.BYTEA_ARRAY]: normalizeByteaArray,
  [ArrayColumnType.BIT_ARRAY]: normalize_array(normalizeBit),
  [ArrayColumnType.VARBIT_ARRAY]: normalize_array(normalizeBit),
  [ArrayColumnType.XML_ARRAY]: normalize_array(normalize_xml)
};
function mapArg(arg, argType) {
  if (arg === null) {
    return null;
  }
  if (Array.isArray(arg) && argType.arity === "list") {
    return arg.map((value) => mapArg(value, argType));
  }
  if (typeof arg === "string" && argType.scalarType === "datetime") {
    arg = new Date(arg);
  }
  if (arg instanceof Date) {
    switch (argType.dbType) {
      case "TIME":
      case "TIMETZ":
        return formatTime(arg);
      case "DATE":
        return formatDate(arg);
      default:
        return formatDateTime(arg);
    }
  }
  if (typeof arg === "string" && argType.scalarType === "bytes") {
    return Buffer.from(arg, "base64");
  }
  if (ArrayBuffer.isView(arg)) {
    return new Uint8Array(arg.buffer, arg.byteOffset, arg.byteLength);
  }
  return arg;
}
function formatDateTime(date) {
  const pad = (n, z = 2) => String(n).padStart(z, "0");
  const ms = date.getUTCMilliseconds();
  return pad(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()) + " " + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + (ms ? "." + String(ms).padStart(3, "0") : "");
}
function formatDate(date) {
  const pad = (n, z = 2) => String(n).padStart(z, "0");
  return pad(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate());
}
function formatTime(date) {
  const pad = (n, z = 2) => String(n).padStart(z, "0");
  const ms = date.getUTCMilliseconds();
  return pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":" + pad(date.getUTCSeconds()) + (ms ? "." + String(ms).padStart(3, "0") : "");
}
var TLS_ERRORS = /* @__PURE__ */ new Set([
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_CRL",
  "UNABLE_TO_DECRYPT_CERT_SIGNATURE",
  "UNABLE_TO_DECRYPT_CRL_SIGNATURE",
  "UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY",
  "CERT_SIGNATURE_FAILURE",
  "CRL_SIGNATURE_FAILURE",
  "CERT_NOT_YET_VALID",
  "CERT_HAS_EXPIRED",
  "CRL_NOT_YET_VALID",
  "CRL_HAS_EXPIRED",
  "ERROR_IN_CERT_NOT_BEFORE_FIELD",
  "ERROR_IN_CERT_NOT_AFTER_FIELD",
  "ERROR_IN_CRL_LAST_UPDATE_FIELD",
  "ERROR_IN_CRL_NEXT_UPDATE_FIELD",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "CERT_CHAIN_TOO_LONG",
  "CERT_REVOKED",
  "INVALID_CA",
  "INVALID_PURPOSE",
  "CERT_UNTRUSTED",
  "CERT_REJECTED",
  "HOSTNAME_MISMATCH",
  "ERR_TLS_CERT_ALTNAME_FORMAT",
  "ERR_TLS_CERT_ALTNAME_INVALID"
]);
var SOCKET_ERRORS = /* @__PURE__ */ new Set(["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT"]);
function convertDriverError(error) {
  if (isSocketError(error)) {
    return mapSocketError(error);
  }
  if (isTlsError(error)) {
    return {
      kind: "TlsConnectionError",
      reason: error.message
    };
  }
  if (isDriverError(error)) {
    return {
      originalCode: error.code,
      originalMessage: error.message,
      ...mapDriverError(error)
    };
  }
  throw error;
}
function mapDriverError(error) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  switch (error.code) {
    case "22001":
      return {
        kind: "LengthMismatch",
        column: error.column
      };
    case "22003":
      return {
        kind: "ValueOutOfRange",
        cause: error.message
      };
    case "22P02":
      return {
        kind: "InvalidInputValue",
        message: error.message
      };
    case "23505": {
      const fields = (_c = (_b = (_a = error.detail) == null ? void 0 : _a.match(/Key \(([^)]+)\)/)) == null ? void 0 : _b.at(1)) == null ? void 0 : _c.split(", ");
      return {
        kind: "UniqueConstraintViolation",
        constraint: fields !== void 0 ? { fields } : void 0
      };
    }
    case "23502": {
      const fields = (_f = (_e = (_d = error.detail) == null ? void 0 : _d.match(/Key \(([^)]+)\)/)) == null ? void 0 : _e.at(1)) == null ? void 0 : _f.split(", ");
      return {
        kind: "NullConstraintViolation",
        constraint: fields !== void 0 ? { fields } : void 0
      };
    }
    case "23503": {
      let constraint;
      if (error.column) {
        constraint = { fields: [error.column] };
      } else if (error.constraint) {
        constraint = { index: error.constraint };
      }
      return {
        kind: "ForeignKeyConstraintViolation",
        constraint
      };
    }
    case "3D000":
      return {
        kind: "DatabaseDoesNotExist",
        db: (_g = error.message.split(" ").at(1)) == null ? void 0 : _g.split('"').at(1)
      };
    case "28000":
      return {
        kind: "DatabaseAccessDenied",
        db: (_h = error.message.split(",").find((s) => s.startsWith(" database"))) == null ? void 0 : _h.split('"').at(1)
      };
    case "28P01":
      return {
        kind: "AuthenticationFailed",
        user: (_i = error.message.split(" ").pop()) == null ? void 0 : _i.split('"').at(1)
      };
    case "40001":
      return {
        kind: "TransactionWriteConflict"
      };
    case "42P01":
      return {
        kind: "TableDoesNotExist",
        table: (_j = error.message.split(" ").at(1)) == null ? void 0 : _j.split('"').at(1)
      };
    case "42703":
      return {
        kind: "ColumnNotFound",
        column: (_k = error.message.split(" ").at(1)) == null ? void 0 : _k.split('"').at(1)
      };
    case "42P04":
      return {
        kind: "DatabaseAlreadyExists",
        db: (_l = error.message.split(" ").at(1)) == null ? void 0 : _l.split('"').at(1)
      };
    case "53300":
      return {
        kind: "TooManyConnections",
        cause: error.message
      };
    default:
      return {
        kind: "postgres",
        code: error.code ?? "N/A",
        severity: error.severity ?? "N/A",
        message: error.message,
        detail: error.detail,
        column: error.column,
        hint: error.hint
      };
  }
}
function isDriverError(error) {
  return typeof error.code === "string" && typeof error.message === "string" && typeof error.severity === "string" && (typeof error.detail === "string" || error.detail === void 0) && (typeof error.column === "string" || error.column === void 0) && (typeof error.hint === "string" || error.hint === void 0);
}
function mapSocketError(error) {
  switch (error.code) {
    case "ENOTFOUND":
    case "ECONNREFUSED":
      return {
        kind: "DatabaseNotReachable",
        host: error.address ?? error.hostname,
        port: error.port
      };
    case "ECONNRESET":
      return {
        kind: "ConnectionClosed"
      };
    case "ETIMEDOUT":
      return {
        kind: "SocketTimeout"
      };
  }
}
function isSocketError(error) {
  return typeof error.code === "string" && typeof error.syscall === "string" && typeof error.errno === "number" && SOCKET_ERRORS.has(error.code);
}
function isTlsError(error) {
  if (typeof error.code === "string") {
    return TLS_ERRORS.has(error.code);
  }
  switch (error.message) {
    case "The server does not support SSL connections":
    case "There was an error establishing an SSL connection":
      return true;
  }
  return false;
}
var types2 = import_pg.default.types;
var debug2 = Debug("prisma:driver-adapter:pg");
var PgQueryable = class {
  constructor(client, pgOptions) {
    this.client = client;
    this.pgOptions = pgOptions;
  }
  provider = "postgres";
  adapterName = name;
  /**
   * Execute a query given as SQL, interpolating the given parameters.
   */
  async queryRaw(query) {
    var _a;
    const tag = "[js::query_raw]";
    debug2(`${tag} %O`, query);
    const { fields, rows } = await this.performIO(query);
    const columnNames = fields.map((field) => field.name);
    let columnTypes = [];
    try {
      columnTypes = fields.map((field) => fieldToColumnType(field.dataTypeID));
    } catch (e) {
      if (e instanceof UnsupportedNativeDataType) {
        throw new DriverAdapterError({
          kind: "UnsupportedNativeDataType",
          type: e.type
        });
      }
      throw e;
    }
    const udtParser = (_a = this.pgOptions) == null ? void 0 : _a.userDefinedTypeParser;
    if (udtParser) {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (field.dataTypeID >= FIRST_NORMAL_OBJECT_ID && !Object.hasOwn(customParsers, field.dataTypeID)) {
          for (let j = 0; j < rows.length; j++) {
            rows[j][i] = await udtParser(field.dataTypeID, rows[j][i], this);
          }
        }
      }
    }
    return {
      columnNames,
      columnTypes,
      rows
    };
  }
  /**
   * Execute a query given as SQL, interpolating the given parameters and
   * returning the number of affected rows.
   * Note: Queryable expects a u64, but napi.rs only supports u32.
   */
  async executeRaw(query) {
    const tag = "[js::execute_raw]";
    debug2(`${tag} %O`, query);
    return (await this.performIO(query)).rowCount ?? 0;
  }
  /**
   * Run a query against the database, returning the result set.
   * Should the query fail due to a connection error, the connection is
   * marked as unhealthy.
   */
  async performIO(query) {
    const { sql, args } = query;
    const values = args.map((arg, i) => mapArg(arg, query.argTypes[i]));
    try {
      const result = await this.client.query(
        {
          text: sql,
          values,
          rowMode: "array",
          types: {
            // This is the error expected:
            // No overload matches this call.
            // The last overload gave the following error.
            // Type '(oid: number, format?: any) => (json: string) => unknown' is not assignable to type '{ <T>(oid: number): TypeParser<string, string | T>; <T>(oid: number, format: "text"): TypeParser<string, string | T>; <T>(oid: number, format: "binary"): TypeParser<...>; }'.
            //   Type '(json: string) => unknown' is not assignable to type 'TypeParser<Buffer, any>'.
            //     Types of parameters 'json' and 'value' are incompatible.
            //       Type 'Buffer' is not assignable to type 'string'.ts(2769)
            //
            // Because pg-types types expect us to handle both binary and text protocol versions,
            // where as far we can see, pg will ever pass only text version.
            //
            // @ts-expect-error
            getTypeParser: (oid, format) => {
              if (format === "text" && customParsers[oid]) {
                return customParsers[oid];
              }
              return types2.getTypeParser(oid, format);
            }
          }
        },
        values
      );
      return result;
    } catch (e) {
      this.onError(e);
    }
  }
  onError(error) {
    debug2("Error in performIO: %O", error);
    throw new DriverAdapterError(convertDriverError(error));
  }
};
var PgTransaction = class extends PgQueryable {
  constructor(client, options, pgOptions, cleanup) {
    super(client, pgOptions);
    this.options = options;
    this.pgOptions = pgOptions;
    this.cleanup = cleanup;
  }
  async commit() {
    var _a;
    debug2(`[js::commit]`);
    (_a = this.cleanup) == null ? void 0 : _a.call(this);
    this.client.release();
  }
  async rollback() {
    var _a;
    debug2(`[js::rollback]`);
    (_a = this.cleanup) == null ? void 0 : _a.call(this);
    this.client.release();
  }
};
var PrismaPgAdapter = class extends PgQueryable {
  constructor(client, pgOptions, release) {
    super(client);
    this.pgOptions = pgOptions;
    this.release = release;
  }
  async startTransaction(isolationLevel) {
    const options = {
      usePhantomQuery: false
    };
    const tag = "[js::startTransaction]";
    debug2("%s options: %O", tag, options);
    const conn = await this.client.connect().catch((error) => this.onError(error));
    const onError = (err) => {
      var _a, _b;
      debug2(`Error from pool connection: ${err.message} %O`, err);
      (_b = (_a = this.pgOptions) == null ? void 0 : _a.onConnectionError) == null ? void 0 : _b.call(_a, err);
    };
    conn.on("error", onError);
    const cleanup = () => {
      conn.removeListener("error", onError);
    };
    try {
      const tx = new PgTransaction(conn, options, this.pgOptions, cleanup);
      await tx.executeRaw({ sql: "BEGIN", args: [], argTypes: [] });
      if (isolationLevel) {
        await tx.executeRaw({
          sql: `SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`,
          args: [],
          argTypes: []
        });
      }
      return tx;
    } catch (error) {
      cleanup();
      conn.release(error);
      this.onError(error);
    }
  }
  async executeScript(script) {
    const statements = script.split(";").map((stmt) => stmt.trim()).filter((stmt) => stmt.length > 0);
    for (const stmt of statements) {
      try {
        await this.client.query(stmt);
      } catch (error) {
        this.onError(error);
      }
    }
  }
  getConnectionInfo() {
    var _a;
    return {
      schemaName: (_a = this.pgOptions) == null ? void 0 : _a.schema,
      supportsRelationJoins: true
    };
  }
  async dispose() {
    var _a;
    return (_a = this.release) == null ? void 0 : _a.call(this);
  }
  underlyingDriver() {
    return this.client;
  }
};
var PrismaPgAdapterFactory = class {
  constructor(poolOrConfig, options) {
    this.options = options;
    if (poolOrConfig instanceof import_pg.default.Pool) {
      this.externalPool = poolOrConfig;
      this.config = poolOrConfig.options;
    } else {
      this.externalPool = null;
      this.config = poolOrConfig;
    }
  }
  provider = "postgres";
  adapterName = name;
  config;
  externalPool;
  async connect() {
    const client = this.externalPool ?? new import_pg.default.Pool(this.config);
    const onIdleClientError = (err) => {
      var _a, _b;
      debug2(`Error from idle pool client: ${err.message} %O`, err);
      (_b = (_a = this.options) == null ? void 0 : _a.onPoolError) == null ? void 0 : _b.call(_a, err);
    };
    client.on("error", onIdleClientError);
    return new PrismaPgAdapter(client, this.options, async () => {
      var _a;
      if (this.externalPool) {
        if ((_a = this.options) == null ? void 0 : _a.disposeExternalPool) {
          await this.externalPool.end();
          this.externalPool = null;
        } else {
          this.externalPool.removeListener("error", onIdleClientError);
        }
      } else {
        await client.end();
      }
    });
  }
  async connectToShadowDb() {
    const conn = await this.connect();
    const database = `prisma_migrate_shadow_db_${globalThis.crypto.randomUUID()}`;
    await conn.executeScript(`CREATE DATABASE "${database}"`);
    const client = new import_pg.default.Pool({ ...this.config, database });
    return new PrismaPgAdapter(client, void 0, async () => {
      await conn.executeScript(`DROP DATABASE "${database}"`);
      await client.end();
    });
  }
};

// src/client.ts
var import_pg3 = require("pg");

// src/generated/prisma/client.ts
var path = __toESM(require("path"));
var import_node_url = require("url");

// src/generated/prisma/internal/class.ts
var runtime = __toESM(require("@prisma/client/runtime/client"));
var config = {
  "previewFeatures": [],
  "clientVersion": "7.8.0",
  "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
  "activeProvider": "postgresql",
  "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ndatasource db {\n  provider = "postgresql"\n}\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\nmodel User {\n  id        String     @id @default(uuid())\n  email     String     @unique\n  name      String\n  wallets   Wallet[]\n  orders    Order[]\n  balances  Balances[]\n  createdAt DateTime   @default(now())\n  updatedAt DateTime   @updatedAt\n}\n\nmodel Wallet {\n  id        String   @id @default(uuid())\n  address   String   @unique\n  userId    String\n  user      User     @relation(fields: [userId], references: [id])\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nmodel Balances {\n  id           String   @id @default(uuid())\n  userId       String\n  user         User     @relation(fields: [userId], references: [id])\n  asset        String // e.g. USDC, SOL\n  reserved     Decimal // reserved balance\n  available    Decimal // available balance for trading\n  userId_asset String   @unique @map("userId_asset") // composite unique key to ensure one record per user per asset; map to the actual column name in the database\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n}\n\nmodel Market {\n  id                  String                @id @default(uuid())\n  symbol              String                @unique\n  baseAsset           String //e.g. Sol\n  quoteAsset          String //e.g. USDC\n  status              MarketStatus\n  tickSize            Decimal // minimum price increment()\n  lotSize             Decimal // minimum trade size increment(quantity)\n  minOrderSize        Decimal // minimum order size\n  pricePrecision      Int // number of decimal places for price\n  sizePrecision       Int // number of decimal places for size\n  makerFeeRate        Decimal // fee rate for makers (e.g. 0.001 for 0.1%)\n  takerFeeRate        Decimal // fee rate for takers (e.g. 0.002 for 0.2%)\n  orders              Order[]\n  trades              Trade[]\n  protectionDecisions ProtectionDecisions[]\n  createdAt           DateTime              @default(now())\n  updatedAt           DateTime              @updatedAt\n}\n\nmodel Order {\n  id                       String                @id @default(uuid())\n  side                     OrderSide\n  price                    Decimal?\n  size                     Decimal\n  remainingSize            Decimal\n  type                     OrderType\n  status                   OrderStatus\n  userId                   String\n  user                     User                  @relation(fields: [userId], references: [id])\n  marketId                 String\n  market                   Market                @relation(fields: [marketId], references: [id])\n  tradesMaker              Trade[]               @relation("makerOrder")\n  tradesTaker              Trade[]               @relation("takerOrder")\n  protectionDecisionsTaker ProtectionDecisions[] @relation("takerOrder")\n  protectionDecisions      ProtectionDecisions[]\n  createdAt                DateTime              @default(now())\n  updatedAt                DateTime              @updatedAt\n}\n\n// todo\nmodel Trade {\n  id           String   @id @default(uuid())\n  price        Decimal // quote per 1 base\n  size         Decimal // amount of base asset traded\n  makerOrderId String\n  makerOrder   Order    @relation("makerOrder", fields: [makerOrderId], references: [id])\n  takerOrderId String\n  takerOrder   Order    @relation("takerOrder", fields: [takerOrderId], references: [id])\n  marketId     String\n  market       Market   @relation(fields: [marketId], references: [id])\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n}\n\nmodel ProtectionDecisions {\n  id             String           @id @default(uuid())\n  takerOrderId   String\n  takerOrder     Order            @relation("takerOrder", fields: [takerOrderId], references: [id])\n  decision       DecisionType\n  reason         ProtectionReason\n  priceDeviation Decimal? // how much % the order price deviates from the fair price\n  quotePrice     Decimal? // the quote price at the time of decision\n  quoteAgeMs     Int? // how old the quote price is in milliseconds, decisionTime - orderLastUpdatedAt\n  orderId        String\n  order          Order            @relation(fields: [orderId], references: [id])\n  marketId       String\n  market         Market           @relation(fields: [marketId], references: [id])\n  createdAt      DateTime         @default(now())\n  updatedAt      DateTime         @updatedAt\n}\n\nenum OrderSide {\n  BUY\n  SELL\n}\n\nenum OrderType {\n  LIMIT\n  MARKET\n}\n\nenum OrderStatus {\n  ACCEPTED\n  OPEN\n  PARTIALLY_FILLED\n  FILLED\n  CANCELLED\n}\n\nenum MarketStatus {\n  ACTIVE\n  PAUSED\n  DISABLED\n}\n\nenum DecisionType {\n  ALLOW\n  CANCEL\n}\n\n// todo\nenum ProtectionReason {\n  LARGE_ORDER\n  SUSPICIOUS_ACCOUNT\n  OTHER\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"wallets","kind":"object","type":"Wallet","relationName":"UserToWallet"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"balances","kind":"object","type":"Balances","relationName":"BalancesToUser"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Wallet":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"UserToWallet"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Balances":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"BalancesToUser"},{"name":"asset","kind":"scalar","type":"String"},{"name":"reserved","kind":"scalar","type":"Decimal"},{"name":"available","kind":"scalar","type":"Decimal"},{"name":"userId_asset","kind":"scalar","type":"String","dbName":"userId_asset"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Market":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"symbol","kind":"scalar","type":"String"},{"name":"baseAsset","kind":"scalar","type":"String"},{"name":"quoteAsset","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"MarketStatus"},{"name":"tickSize","kind":"scalar","type":"Decimal"},{"name":"lotSize","kind":"scalar","type":"Decimal"},{"name":"minOrderSize","kind":"scalar","type":"Decimal"},{"name":"pricePrecision","kind":"scalar","type":"Int"},{"name":"sizePrecision","kind":"scalar","type":"Int"},{"name":"makerFeeRate","kind":"scalar","type":"Decimal"},{"name":"takerFeeRate","kind":"scalar","type":"Decimal"},{"name":"orders","kind":"object","type":"Order","relationName":"MarketToOrder"},{"name":"trades","kind":"object","type":"Trade","relationName":"MarketToTrade"},{"name":"protectionDecisions","kind":"object","type":"ProtectionDecisions","relationName":"MarketToProtectionDecisions"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"side","kind":"enum","type":"OrderSide"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"size","kind":"scalar","type":"Decimal"},{"name":"remainingSize","kind":"scalar","type":"Decimal"},{"name":"type","kind":"enum","type":"OrderType"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"marketId","kind":"scalar","type":"String"},{"name":"market","kind":"object","type":"Market","relationName":"MarketToOrder"},{"name":"tradesMaker","kind":"object","type":"Trade","relationName":"makerOrder"},{"name":"tradesTaker","kind":"object","type":"Trade","relationName":"takerOrder"},{"name":"protectionDecisionsTaker","kind":"object","type":"ProtectionDecisions","relationName":"takerOrder"},{"name":"protectionDecisions","kind":"object","type":"ProtectionDecisions","relationName":"OrderToProtectionDecisions"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Trade":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"size","kind":"scalar","type":"Decimal"},{"name":"makerOrderId","kind":"scalar","type":"String"},{"name":"makerOrder","kind":"object","type":"Order","relationName":"makerOrder"},{"name":"takerOrderId","kind":"scalar","type":"String"},{"name":"takerOrder","kind":"object","type":"Order","relationName":"takerOrder"},{"name":"marketId","kind":"scalar","type":"String"},{"name":"market","kind":"object","type":"Market","relationName":"MarketToTrade"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"ProtectionDecisions":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"takerOrderId","kind":"scalar","type":"String"},{"name":"takerOrder","kind":"object","type":"Order","relationName":"takerOrder"},{"name":"decision","kind":"enum","type":"DecisionType"},{"name":"reason","kind":"enum","type":"ProtectionReason"},{"name":"priceDeviation","kind":"scalar","type":"Decimal"},{"name":"quotePrice","kind":"scalar","type":"Decimal"},{"name":"quoteAgeMs","kind":"scalar","type":"Int"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToProtectionDecisions"},{"name":"marketId","kind":"scalar","type":"String"},{"name":"market","kind":"object","type":"Market","relationName":"MarketToProtectionDecisions"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","wallets","orders","makerOrder","takerOrder","market","trades","order","protectionDecisions","_count","tradesMaker","tradesTaker","protectionDecisionsTaker","balances","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_min","_max","User.groupBy","User.aggregate","Wallet.findUnique","Wallet.findUniqueOrThrow","Wallet.findFirst","Wallet.findFirstOrThrow","Wallet.findMany","Wallet.createOne","Wallet.createMany","Wallet.createManyAndReturn","Wallet.updateOne","Wallet.updateMany","Wallet.updateManyAndReturn","Wallet.upsertOne","Wallet.deleteOne","Wallet.deleteMany","Wallet.groupBy","Wallet.aggregate","Balances.findUnique","Balances.findUniqueOrThrow","Balances.findFirst","Balances.findFirstOrThrow","Balances.findMany","Balances.createOne","Balances.createMany","Balances.createManyAndReturn","Balances.updateOne","Balances.updateMany","Balances.updateManyAndReturn","Balances.upsertOne","Balances.deleteOne","Balances.deleteMany","_avg","_sum","Balances.groupBy","Balances.aggregate","Market.findUnique","Market.findUniqueOrThrow","Market.findFirst","Market.findFirstOrThrow","Market.findMany","Market.createOne","Market.createMany","Market.createManyAndReturn","Market.updateOne","Market.updateMany","Market.updateManyAndReturn","Market.upsertOne","Market.deleteOne","Market.deleteMany","Market.groupBy","Market.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","Trade.findUnique","Trade.findUniqueOrThrow","Trade.findFirst","Trade.findFirstOrThrow","Trade.findMany","Trade.createOne","Trade.createMany","Trade.createManyAndReturn","Trade.updateOne","Trade.updateMany","Trade.updateManyAndReturn","Trade.upsertOne","Trade.deleteOne","Trade.deleteMany","Trade.groupBy","Trade.aggregate","ProtectionDecisions.findUnique","ProtectionDecisions.findUniqueOrThrow","ProtectionDecisions.findFirst","ProtectionDecisions.findFirstOrThrow","ProtectionDecisions.findMany","ProtectionDecisions.createOne","ProtectionDecisions.createMany","ProtectionDecisions.createManyAndReturn","ProtectionDecisions.updateOne","ProtectionDecisions.updateMany","ProtectionDecisions.updateManyAndReturn","ProtectionDecisions.upsertOne","ProtectionDecisions.deleteOne","ProtectionDecisions.deleteMany","ProtectionDecisions.groupBy","ProtectionDecisions.aggregate","AND","OR","NOT","id","takerOrderId","DecisionType","decision","ProtectionReason","reason","priceDeviation","quotePrice","quoteAgeMs","orderId","marketId","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","price","size","makerOrderId","OrderSide","side","remainingSize","OrderType","type","OrderStatus","status","userId","symbol","baseAsset","quoteAsset","MarketStatus","tickSize","lotSize","minOrderSize","pricePrecision","sizePrecision","makerFeeRate","takerFeeRate","every","some","none","asset","reserved","available","userId_asset","address","email","name","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "jARGcAsEAAD7AQAgBQAA9AEAIBAAAPwBACCJAQAA-gEAMIoBAAAnABCLAQAA-gEAMIwBAQAAAAGXAUAA8wEAIZgBQADzAQAhwgEBAAAAAcMBAQDvAQAhAQAAAAEAIAkDAAD-AQAgiQEAAIsCADCKAQAAAwAQiwEAAIsCADCMAQEA7wEAIZcBQADzAQAhmAFAAPMBACGuAQEA7wEAIcEBAQDvAQAhAQMAAM4DACAJAwAA_gEAIIkBAACLAgAwigEAAAMAEIsBAACLAgAwjAEBAAAAAZcBQADzAQAhmAFAAPMBACGuAQEA7wEAIcEBAQAAAAEDAAAAAwAgAQAABAAwAgAABQAgFAMAAP4BACAIAACFAgAgCwAA9gEAIA0AAPUBACAOAAD1AQAgDwAA9gEAIIkBAACHAgAwigEAAAcAEIsBAACHAgAwjAEBAO8BACGWAQEA7wEAIZcBQADzAQAhmAFAAPMBACGkARAAggIAIaUBEADxAQAhqAEAAIgCqAEiqQEQAPEBACGrAQAAiQKrASKtAQAAigKtASKuAQEA7wEAIQcDAADOAwAgCAAA0AMAIAsAAJUDACANAACUAwAgDgAAlAMAIA8AAJUDACCkAQAAjAIAIBQDAAD-AQAgCAAAhQIAIAsAAPYBACANAAD1AQAgDgAA9QEAIA8AAPYBACCJAQAAhwIAMIoBAAAHABCLAQAAhwIAMIwBAQAAAAGWAQEA7wEAIZcBQADzAQAhmAFAAPMBACGkARAAggIAIaUBEADxAQAhqAEAAIgCqAEiqQEQAPEBACGrAQAAiQKrASKtAQAAigKtASKuAQEA7wEAIQMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgDgYAAIQCACAHAACEAgAgCAAAhQIAIIkBAACGAgAwigEAAAwAEIsBAACGAgAwjAEBAO8BACGNAQEA7wEAIZYBAQDvAQAhlwFAAPMBACGYAUAA8wEAIaQBEADxAQAhpQEQAPEBACGmAQEA7wEAIQMGAADPAwAgBwAAzwMAIAgAANADACAOBgAAhAIAIAcAAIQCACAIAACFAgAgiQEAAIYCADCKAQAADAAQiwEAAIYCADCMAQEAAAABjQEBAO8BACGWAQEA7wEAIZcBQADzAQAhmAFAAPMBACGkARAA8QEAIaUBEADxAQAhpgEBAO8BACEDAAAADAAgAQAADQAwAgAADgAgEQcAAIQCACAIAACFAgAgCgAAhAIAIIkBAAD_AQAwigEAABAAEIsBAAD_AQAwjAEBAO8BACGNAQEA7wEAIY8BAACAAo8BIpEBAACBApEBIpIBEACCAgAhkwEQAIICACGUAQIAgwIAIZUBAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhBgcAAM8DACAIAADQAwAgCgAAzwMAIJIBAACMAgAgkwEAAIwCACCUAQAAjAIAIBEHAACEAgAgCAAAhQIAIAoAAIQCACCJAQAA_wEAMIoBAAAQABCLAQAA_wEAMIwBAQAAAAGNAQEA7wEAIY8BAACAAo8BIpEBAACBApEBIpIBEACCAgAhkwEQAIICACGUAQIAgwIAIZUBAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhAwAAABAAIAEAABEAMAIAABIAIAEAAAAHACABAAAADAAgAQAAABAAIAMAAAAMACABAAANADACAAAOACADAAAADAAgAQAADQAwAgAADgAgAwAAABAAIAEAABEAMAIAABIAIAMAAAAQACABAAARADACAAASACABAAAADAAgAQAAAAwAIAEAAAAQACABAAAAEAAgDAMAAP4BACCJAQAA_QEAMIoBAAAfABCLAQAA_QEAMIwBAQDvAQAhlwFAAPMBACGYAUAA8wEAIa4BAQDvAQAhvQEBAO8BACG-ARAA8QEAIb8BEADxAQAhwAEBAO8BACEBAwAAzgMAIAwDAAD-AQAgiQEAAP0BADCKAQAAHwAQiwEAAP0BADCMAQEAAAABlwFAAPMBACGYAUAA8wEAIa4BAQDvAQAhvQEBAO8BACG-ARAA8QEAIb8BEADxAQAhwAEBAAAAAQMAAAAfACABAAAgADACAAAhACABAAAAAwAgAQAAAAcAIAEAAAAfACABAAAAAQAgCwQAAPsBACAFAAD0AQAgEAAA_AEAIIkBAAD6AQAwigEAACcAEIsBAAD6AQAwjAEBAO8BACGXAUAA8wEAIZgBQADzAQAhwgEBAO8BACHDAQEA7wEAIQMEAADMAwAgBQAAkwMAIBAAAM0DACADAAAAJwAgAQAAKAAwAgAAAQAgAwAAACcAIAEAACgAMAIAAAEAIAMAAAAnACABAAAoADACAAABACAIBAAAyQMAIAUAAMoDACAQAADLAwAgjAEBAAAAAZcBQAAAAAGYAUAAAAABwgEBAAAAAcMBAQAAAAEBFgAALAAgBYwBAQAAAAGXAUAAAAABmAFAAAAAAcIBAQAAAAHDAQEAAAABARYAAC4AMAEWAAAuADAIBAAApQMAIAUAAKYDACAQAACnAwAgjAEBAJICACGXAUAAlwIAIZgBQACXAgAhwgEBAJICACHDAQEAkgIAIQIAAAABACAWAAAxACAFjAEBAJICACGXAUAAlwIAIZgBQACXAgAhwgEBAJICACHDAQEAkgIAIQIAAAAnACAWAAAzACACAAAAJwAgFgAAMwAgAwAAAAEAIB0AACwAIB4AADEAIAEAAAABACABAAAAJwAgAwwAAKIDACAjAACkAwAgJAAAowMAIAiJAQAA-QEAMIoBAAA6ABCLAQAA-QEAMIwBAQDFAQAhlwFAAMoBACGYAUAAygEAIcIBAQDFAQAhwwEBAMUBACEDAAAAJwAgAQAAOQAwIgAAOgAgAwAAACcAIAEAACgAMAIAAAEAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgBgMAAKEDACCMAQEAAAABlwFAAAAAAZgBQAAAAAGuAQEAAAABwQEBAAAAAQEWAABCACAFjAEBAAAAAZcBQAAAAAGYAUAAAAABrgEBAAAAAcEBAQAAAAEBFgAARAAwARYAAEQAMAYDAACgAwAgjAEBAJICACGXAUAAlwIAIZgBQACXAgAhrgEBAJICACHBAQEAkgIAIQIAAAAFACAWAABHACAFjAEBAJICACGXAUAAlwIAIZgBQACXAgAhrgEBAJICACHBAQEAkgIAIQIAAAADACAWAABJACACAAAAAwAgFgAASQAgAwAAAAUAIB0AAEIAIB4AAEcAIAEAAAAFACABAAAAAwAgAwwAAJ0DACAjAACfAwAgJAAAngMAIAiJAQAA-AEAMIoBAABQABCLAQAA-AEAMIwBAQDFAQAhlwFAAMoBACGYAUAAygEAIa4BAQDFAQAhwQEBAMUBACEDAAAAAwAgAQAATwAwIgAAUAAgAwAAAAMAIAEAAAQAMAIAAAUAIAEAAAAhACABAAAAIQAgAwAAAB8AIAEAACAAMAIAACEAIAMAAAAfACABAAAgADACAAAhACADAAAAHwAgAQAAIAAwAgAAIQAgCQMAAJwDACCMAQEAAAABlwFAAAAAAZgBQAAAAAGuAQEAAAABvQEBAAAAAb4BEAAAAAG_ARAAAAABwAEBAAAAAQEWAABYACAIjAEBAAAAAZcBQAAAAAGYAUAAAAABrgEBAAAAAb0BAQAAAAG-ARAAAAABvwEQAAAAAcABAQAAAAEBFgAAWgAwARYAAFoAMAkDAACbAwAgjAEBAJICACGXAUAAlwIAIZgBQACXAgAhrgEBAJICACG9AQEAkgIAIb4BEACjAgAhvwEQAKMCACHAAQEAkgIAIQIAAAAhACAWAABdACAIjAEBAJICACGXAUAAlwIAIZgBQACXAgAhrgEBAJICACG9AQEAkgIAIb4BEACjAgAhvwEQAKMCACHAAQEAkgIAIQIAAAAfACAWAABfACACAAAAHwAgFgAAXwAgAwAAACEAIB0AAFgAIB4AAF0AIAEAAAAhACABAAAAHwAgBQwAAJYDACAjAACZAwAgJAAAmAMAIEUAAJcDACBGAACaAwAgC4kBAAD3AQAwigEAAGYAEIsBAAD3AQAwjAEBAMUBACGXAUAAygEAIZgBQADKAQAhrgEBAMUBACG9AQEAxQEAIb4BEADaAQAhvwEQANoBACHAAQEAxQEAIQMAAAAfACABAABlADAiAABmACADAAAAHwAgAQAAIAAwAgAAIQAgFAUAAPQBACAJAAD1AQAgCwAA9gEAIIkBAADuAQAwigEAAGwAEIsBAADuAQAwjAEBAAAAAZcBQADzAQAhmAFAAPMBACGtAQAA8AGzASKvAQEAAAABsAEBAO8BACGxAQEA7wEAIbMBEADxAQAhtAEQAPEBACG1ARAA8QEAIbYBAgDyAQAhtwECAPIBACG4ARAA8QEAIbkBEADxAQAhAQAAAGkAIAEAAABpACAUBQAA9AEAIAkAAPUBACALAAD2AQAgiQEAAO4BADCKAQAAbAAQiwEAAO4BADCMAQEA7wEAIZcBQADzAQAhmAFAAPMBACGtAQAA8AGzASKvAQEA7wEAIbABAQDvAQAhsQEBAO8BACGzARAA8QEAIbQBEADxAQAhtQEQAPEBACG2AQIA8gEAIbcBAgDyAQAhuAEQAPEBACG5ARAA8QEAIQMFAACTAwAgCQAAlAMAIAsAAJUDACADAAAAbAAgAQAAbQAwAgAAaQAgAwAAAGwAIAEAAG0AMAIAAGkAIAMAAABsACABAABtADACAABpACARBQAAkAMAIAkAAJEDACALAACSAwAgjAEBAAAAAZcBQAAAAAGYAUAAAAABrQEAAACzAQKvAQEAAAABsAEBAAAAAbEBAQAAAAGzARAAAAABtAEQAAAAAbUBEAAAAAG2AQIAAAABtwECAAAAAbgBEAAAAAG5ARAAAAABARYAAHEAIA6MAQEAAAABlwFAAAAAAZgBQAAAAAGtAQAAALMBAq8BAQAAAAGwAQEAAAABsQEBAAAAAbMBEAAAAAG0ARAAAAABtQEQAAAAAbYBAgAAAAG3AQIAAAABuAEQAAAAAbkBEAAAAAEBFgAAcwAwARYAAHMAMBEFAADvAgAgCQAA8AIAIAsAAPECACCMAQEAkgIAIZcBQACXAgAhmAFAAJcCACGtAQAA7QKzASKvAQEAkgIAIbABAQCSAgAhsQEBAJICACGzARAAowIAIbQBEACjAgAhtQEQAKMCACG2AQIA7gIAIbcBAgDuAgAhuAEQAKMCACG5ARAAowIAIQIAAABpACAWAAB2ACAOjAEBAJICACGXAUAAlwIAIZgBQACXAgAhrQEAAO0CswEirwEBAJICACGwAQEAkgIAIbEBAQCSAgAhswEQAKMCACG0ARAAowIAIbUBEACjAgAhtgECAO4CACG3AQIA7gIAIbgBEACjAgAhuQEQAKMCACECAAAAbAAgFgAAeAAgAgAAAGwAIBYAAHgAIAMAAABpACAdAABxACAeAAB2ACABAAAAaQAgAQAAAGwAIAUMAADoAgAgIwAA6wIAICQAAOoCACBFAADpAgAgRgAA7AIAIBGJAQAA5wEAMIoBAAB_ABCLAQAA5wEAMIwBAQDFAQAhlwFAAMoBACGYAUAAygEAIa0BAADoAbMBIq8BAQDFAQAhsAEBAMUBACGxAQEAxQEAIbMBEADaAQAhtAEQANoBACG1ARAA2gEAIbYBAgDpAQAhtwECAOkBACG4ARAA2gEAIbkBEADaAQAhAwAAAGwAIAEAAH4AMCIAAH8AIAMAAABsACABAABtADACAABpACABAAAACQAgAQAAAAkAIAMAAAAHACABAAAIADACAAAJACADAAAABwAgAQAACAAwAgAACQAgAwAAAAcAIAEAAAgAMAIAAAkAIBEDAADiAgAgCAAA4wIAIAsAAOcCACANAADkAgAgDgAA5QIAIA8AAOYCACCMAQEAAAABlgEBAAAAAZcBQAAAAAGYAUAAAAABpAEQAAAAAaUBEAAAAAGoAQAAAKgBAqkBEAAAAAGrAQAAAKsBAq0BAAAArQECrgEBAAAAAQEWAACHAQAgC4wBAQAAAAGWAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAagBAAAAqAECqQEQAAAAAasBAAAAqwECrQEAAACtAQKuAQEAAAABARYAAIkBADABFgAAiQEAMBEDAACyAgAgCAAAswIAIAsAALcCACANAAC0AgAgDgAAtQIAIA8AALYCACCMAQEAkgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACVAgAhpQEQAKMCACGoAQAArwKoASKpARAAowIAIasBAACwAqsBIq0BAACxAq0BIq4BAQCSAgAhAgAAAAkAIBYAAIwBACALjAEBAJICACGWAQEAkgIAIZcBQACXAgAhmAFAAJcCACGkARAAlQIAIaUBEACjAgAhqAEAAK8CqAEiqQEQAKMCACGrAQAAsAKrASKtAQAAsQKtASKuAQEAkgIAIQIAAAAHACAWAACOAQAgAgAAAAcAIBYAAI4BACADAAAACQAgHQAAhwEAIB4AAIwBACABAAAACQAgAQAAAAcAIAYMAACqAgAgIwAArQIAICQAAKwCACBFAACrAgAgRgAArgIAIKQBAACMAgAgDokBAADdAQAwigEAAJUBABCLAQAA3QEAMIwBAQDFAQAhlgEBAMUBACGXAUAAygEAIZgBQADKAQAhpAEQAMgBACGlARAA2gEAIagBAADeAagBIqkBEADaAQAhqwEAAN8BqwEirQEAAOABrQEirgEBAMUBACEDAAAABwAgAQAAlAEAMCIAAJUBACADAAAABwAgAQAACAAwAgAACQAgAQAAAA4AIAEAAAAOACADAAAADAAgAQAADQAwAgAADgAgAwAAAAwAIAEAAA0AMAIAAA4AIAMAAAAMACABAAANADACAAAOACALBgAApwIAIAcAAKgCACAIAACpAgAgjAEBAAAAAY0BAQAAAAGWAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAaYBAQAAAAEBFgAAnQEAIAiMAQEAAAABjQEBAAAAAZYBAQAAAAGXAUAAAAABmAFAAAAAAaQBEAAAAAGlARAAAAABpgEBAAAAAQEWAACfAQAwARYAAJ8BADALBgAApAIAIAcAAKUCACAIAACmAgAgjAEBAJICACGNAQEAkgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACjAgAhpQEQAKMCACGmAQEAkgIAIQIAAAAOACAWAACiAQAgCIwBAQCSAgAhjQEBAJICACGWAQEAkgIAIZcBQACXAgAhmAFAAJcCACGkARAAowIAIaUBEACjAgAhpgEBAJICACECAAAADAAgFgAApAEAIAIAAAAMACAWAACkAQAgAwAAAA4AIB0AAJ0BACAeAACiAQAgAQAAAA4AIAEAAAAMACAFDAAAngIAICMAAKECACAkAACgAgAgRQAAnwIAIEYAAKICACALiQEAANkBADCKAQAAqwEAEIsBAADZAQAwjAEBAMUBACGNAQEAxQEAIZYBAQDFAQAhlwFAAMoBACGYAUAAygEAIaQBEADaAQAhpQEQANoBACGmAQEAxQEAIQMAAAAMACABAACqAQAwIgAAqwEAIAMAAAAMACABAAANADACAAAOACABAAAAEgAgAQAAABIAIAMAAAAQACABAAARADACAAASACADAAAAEAAgAQAAEQAwAgAAEgAgAwAAABAAIAEAABEAMAIAABIAIA4HAACbAgAgCAAAnQIAIAoAAJwCACCMAQEAAAABjQEBAAAAAY8BAAAAjwECkQEAAACRAQKSARAAAAABkwEQAAAAAZQBAgAAAAGVAQEAAAABlgEBAAAAAZcBQAAAAAGYAUAAAAABARYAALMBACALjAEBAAAAAY0BAQAAAAGPAQAAAI8BApEBAAAAkQECkgEQ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-gEAMIoBAAAnABCLAQAA-gEAMIwBAQDvAQAhlwFAAPMBACGYAUAA8wEAIcIBAQDvAQAhwwEBAO8BACEDugEAAAMAILsBAAADACC8AQAAAwAgA7oBAAAfACC7AQAAHwAgvAEAAB8AIAwDAAD-AQAgiQEAAP0BADCKAQAAHwAQiwEAAP0BADCMAQEA7wEAIZcBQADzAQAhmAFAAPMBACGuAQEA7wEAIb0BAQDvAQAhvgEQAPEBACG_ARAA8QEAIcABAQDvAQAhDQQAAPsBACAFAAD0AQAgEAAA_AEAIIkBAAD6AQAwigEAACcAEIsBAAD6AQAwjAEBAO8BACGXAUAA8wEAIZgBQADzAQAhwgEBAO8BACHDAQEA7wEAIcQBAAAnACDFAQAAJwAgEQcAAIQCACAIAACFAgAgCgAAhAIAIIkBAAD_AQAwigEAABAAEIsBAAD_AQAwjAEBAO8BACGNAQEA7wEAIY8BAACAAo8BIpEBAACBApEBIpIBEACCAgAhkwEQAIICACGUAQIAgwIAIZUBAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhBJkBAAAAjwECmgEAAACPAQibAQAAAI8BCKABAADWAY8BIgSZAQAAAJEBApoBAAAAkQEImwEAAACRAQigAQAA1AGRASIImQEQAAAAAZoBEAAAAAWbARAAAAAFnAEQAAAAAZ0BEAAAAAGeARAAAAABnwEQAAAAAaABEADSAQAhCJkBAgAAAAGaAQIAAAAFmwECAAAABZwBAgAAAAGdAQIAAAABngECAAAAAZ8BAgAAAAGgAQIAzwEAIRYDAAD-AQAgCAAAhQIAIAsAAPYBACANAAD1AQAgDgAA9QEAIA8AAPYBACCJAQAAhwIAMIoBAAAHABCLAQAAhwIAMIwBAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhpAEQAIICACGlARAA8QEAIagBAACIAqgBIqkBEADxAQAhqwEAAIkCqwEirQEAAIoCrQEirgEBAO8BACHEAQAABwAgxQEAAAcAIBYFAAD0AQAgCQAA9QEAIAsAAPYBACCJAQAA7gEAMIoBAABsABCLAQAA7gEAMIwBAQDvAQAhlwFAAPMBACGYAUAA8wEAIa0BAADwAbMBIq8BAQDvAQAhsAEBAO8BACGxAQEA7wEAIbMBEADxAQAhtAEQAPEBACG1ARAA8QEAIbYBAgDyAQAhtwECAPIBACG4ARAA8QEAIbkBEADxAQAhxAEAAGwAIMUBAABsACAOBgAAhAIAIAcAAIQCACAIAACFAgAgiQEAAIYCADCKAQAADAAQiwEAAIYCADCMAQEA7wEAIY0BAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhpAEQAPEBACGlARAA8QEAIaYBAQDvAQAhFAMAAP4BACAIAACFAgAgCwAA9gEAIA0AAPUBACAOAAD1AQAgDwAA9gEAIIkBAACHAgAwigEAAAcAEIsBAACHAgAwjAEBAO8BACGWAQEA7wEAIZcBQADzAQAhmAFAAPMBACGkARAAggIAIaUBEADxAQAhqAEAAIgCqAEiqQEQAPEBACGrAQAAiQKrASKtAQAAigKtASKuAQEA7wEAIQSZAQAAAKgBApoBAAAAqAEImwEAAACoAQigAQAA5gGoASIEmQEAAACrAQKaAQAAAKsBCJsBAAAAqwEIoAEAAOQBqwEiBJkBAAAArQECmgEAAACtAQibAQAAAK0BCKABAADiAa0BIgkDAAD-AQAgiQEAAIsCADCKAQAAAwAQiwEAAIsCADCMAQEA7wEAIZcBQADzAQAhmAFAAPMBACGuAQEA7wEAIcEBAQDvAQAhAAAAAAAAAckBAQAAAAEByQEAAACPAQIByQEAAACRAQIFyQEQAAAAAc8BEAAAAAHQARAAAAAB0QEQAAAAAdIBEAAAAAEFyQECAAAAAc8BAgAAAAHQAQIAAAAB0QECAAAAAdIBAgAAAAEByQFAAAAAAQUdAACCBAAgHgAAiwQAIMYBAACDBAAgxwEAAIoEACDMAQAACQAgBR0AAIAEACAeAACIBAAgxgEAAIEEACDHAQAAhwQAIMwBAAAJACAFHQAA_gMAIB4AAIUEACDGAQAA_wMAIMcBAACEBAAgzAEAAGkAIAMdAACCBAAgxgEAAIMEACDMAQAACQAgAx0AAIAEACDGAQAAgQQAIMwBAAAJACADHQAA_gMAIMYBAAD_AwAgzAEAAGkAIAAAAAAABckBEAAAAAHPARAAAAAB0AEQAAAAAdEBEAAAAAHSARAAAAABBR0AAPMDACAeAAD8AwAgxgEAAPQDACDHAQAA-wMAIMwBAAAJACAFHQAA8QMAIB4AAPkDACDGAQAA8gMAIMcBAAD4AwAgzAEAAAkAIAUdAADvAwAgHgAA9gMAIMYBAADwAwAgxwEAAPUDACDMAQAAaQAgAx0AAPMDACDGAQAA9AMAIMwBAAAJACADHQAA8QMAIMYBAADyAwAgzAEAAAkAIAMdAADvAwAgxgEAAPADACDMAQAAaQAgAAAAAAAByQEAAACoAQIByQEAAACrAQIByQEAAACtAQIFHQAA4wMAIB4AAO0DACDGAQAA5AMAIMcBAADsAwAgzAEAAAEAIAUdAADhAwAgHgAA6gMAIMYBAADiAwAgxwEAAOkDACDMAQAAaQAgCx0AANkCADAeAADdAgAwxgEAANoCADDHAQAA2wIAMMgBAADcAgAgyQEAANECADDKAQAA0QIAMMsBAADRAgAwzAEAANECADDNAQAA3gIAMM4BAADUAgAwCx0AAM0CADAeAADSAgAwxgEAAM4CADDHAQAAzwIAMMgBAADQAgAgyQEAANECADDKAQAA0QIAMMsBAADRAgAwzAEAANECADDNAQAA0wIAMM4BAADUAgAwCx0AAMQCADAeAADIAgAwxgEAAMUCADDHAQAAxgIAMMgBAADHAgAgyQEAALwCADDKAQAAvAIAMMsBAAC8AgAwzAEAALwCADDNAQAAyQIAMM4BAAC_AgAwCx0AALgCADAeAAC9AgAwxgEAALkCADDHAQAAugIAMMgBAAC7AgAgyQEAALwCADDKAQAAvAIAMMsBAAC8AgAwzAEAALwCADDNAQAAvgIAMM4BAAC_AgAwDAcAAJsCACAIAACdAgAgjAEBAAAAAY0BAQAAAAGPAQAAAI8BApEBAAAAkQECkgEQAAAAAZMBEAAAAAGUAQIAAAABlgEBAAAAAZcBQAAAAAGYAUAAAAABAgAAABIAIB0AAMMCACADAAAAEgAgHQAAwwIAIB4AAMICACABFgAA6AMAMBEHAACEAgAgCAAAhQIAIAoAAIQCACCJAQAA_wEAMIoBAAAQABCLAQAA_wEAMIwBAQAAAAGNAQEA7wEAIY8BAACAAo8BIpEBAACBApEBIpIBEACCAgAhkwEQAIICACGUAQIAgwIAIZUBAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhAgAAABIAIBYAAMICACACAAAAwAIAIBYAAMECACAOiQEAAL8CADCKAQAAwAIAEIsBAAC_AgAwjAEBAO8BACGNAQEA7wEAIY8BAACAAo8BIpEBAACBApEBIpIBEACCAgAhkwEQAIICACGUAQIAgwIAIZUBAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhDokBAAC_AgAwigEAAMACABCLAQAAvwIAMIwBAQDvAQAhjQEBAO8BACGPAQAAgAKPASKRAQAAgQKRASKSARAAggIAIZMBEACCAgAhlAECAIMCACGVAQEA7wEAIZYBAQDvAQAhlwFAAPMBACGYAUAA8wEAIQqMAQEAkgIAIY0BAQCSAgAhjwEAAJMCjwEikQEAAJQCkQEikgEQAJUCACGTARAAlQIAIZQBAgCWAgAhlgEBAJICACGXAUAAlwIAIZgBQACXAgAhDAcAAJgCACAIAACaAgAgjAEBAJICACGNAQEAkgIAIY8BAACTAo8BIpEBAACUApEBIpIBEACVAgAhkwEQAJUCACGUAQIAlgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIQwHAACbAgAgCAAAnQIAIIwBAQAAAAGNAQEAAAABjwEAAACPAQKRAQAAAJEBApIBEAAAAAGTARAAAAABlAECAAAAAZYBAQAAAAGXAUAAAAABmAFAAAAAAQwIAACdAgAgCgAAnAIAIIwBAQAAAAGPAQAAAI8BApEBAAAAkQECkgEQAAAAAZMBEAAAAAGUAQIAAAABlQEBAAAAAZYBAQAAAAGXAUAAAAABmAFAAAAAAQIAAAASACAdAADMAgAgAwAAABIAIB0AAMwCACAeAADLAgAgARYAAOcDADACAAAAEgAgFgAAywIAIAIAAADAAgAgFgAAygIAIAqMAQEAkgIAIY8BAACTAo8BIpEBAACUApEBIpIBEACVAgAhkwEQAJUCACGUAQIAlgIAIZUBAQCSAgAhlgEBAJICACGXAUAAlwIAIZgBQACXAgAhDAgAAJoCACAKAACZAgAgjAEBAJICACGPAQAAkwKPASKRAQAAlAKRASKSARAAlQIAIZMBEACVAgAhlAECAJYCACGVAQEAkgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIQwIAACdAgAgCgAAnAIAIIwBAQAAAAGPAQAAAI8BApEBAAAAkQECkgEQAAAAAZMBEAAAAAGUAQIAAAABlQEBAAAAAZYBAQAAAAGXAUAAAAABmAFAAAAAAQkGAACnAgAgCAAAqQIAIIwBAQAAAAGWAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAaYBAQAAAAECAAAADgAgHQAA2AIAIAMAAAAOACAdAADYAgAgHgAA1wIAIAEWAADmAwAwDgYAAIQCACAHAACEAgAgCAAAhQIAIIkBAACGAgAwigEAAAwAEIsBAACGAgAwjAEBAAAAAY0BAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhpAEQAPEBACGlARAA8QEAIaYBAQDvAQAhAgAAAA4AIBYAANcCACACAAAA1QIAIBYAANYCACALiQEAANQCADCKAQAA1QIAEIsBAADUAgAwjAEBAO8BACGNAQEA7wEAIZYBAQDvAQAhlwFAAPMBACGYAUAA8wEAIaQBEADxAQAhpQEQAPEBACGmAQEA7wEAIQuJAQAA1AIAMIoBAADVAgAQiwEAANQCADCMAQEA7wEAIY0BAQDvAQAhlgEBAO8BACGXAUAA8wEAIZgBQADzAQAhpAEQAPEBACGlARAA8QEAIaYBAQDvAQAhB4wBAQCSAgAhlgEBAJICACGXAUAAlwIAIZgBQACXAgAhpAEQAKMCACGlARAAowIAIaYBAQCSAgAhCQYAAKQCACAIAACmAgAgjAEBAJICACGWAQEAkgIAIZcBQACXAgAhmAFAAJcCACGkARAAowIAIaUBEACjAgAhpgEBAJICACEJBgAApwIAIAgAAKkCACCMAQEAAAABlgEBAAAAAZcBQAAAAAGYAUAAAAABpAEQAAAAAaUBEAAAAAGmAQEAAAABCQcAAKgCACAIAACpAgAgjAEBAAAAAY0BAQAAAAGWAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAQIAAAAOACAdAADhAgAgAwAAAA4AIB0AAOECACAeAADgAgAgARYAAOUDADACAAAADgAgFgAA4AIAIAIAAADVAgAgFgAA3wIAIAeMAQEAkgIAIY0BAQCSAgAhlgEBAJICACGXAUAAlwIAIZgBQACXAgAhpAEQAKMCACGlARAAowIAIQkHAAClAgAgCAAApgIAIIwBAQCSAgAhjQEBAJICACGWAQEAkgIAIZcBQACXAgAhmAFAAJcCACGkARAAowIAIaUBEACjAgAhCQcAAKgCACAIAACpAgAgjAEBAAAAAY0BAQAAAAGWAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAQMdAADjAwAgxgEAAOQDACDMAQAAAQAgAx0AAOEDACDGAQAA4gMAIMwBAABpACAEHQAA2QIAMMYBAADaAgAwyAEAANwCACDMAQAA0QIAMAQdAADNAgAwxgEAAM4CADDIAQAA0AIAIMwBAADRAgAwBB0AAMQCADDGAQAAxQIAMMgBAADHAgAgzAEAALwCADAEHQAAuAIAMMYBAAC5AgAwyAEAALsCACDMAQAAvAIAMAAAAAAAAckBAAAAswECBckBAgAAAAHPAQIAAAAB0AECAAAAAdEBAgAAAAHSAQIAAAABCx0AAIQDADAeAACJAwAwxgEAAIUDADDHAQAAhgMAMMgBAACHAwAgyQEAAIgDADDKAQAAiAMAMMsBAACIAwAwzAEAAIgDADDNAQAAigMAMM4BAACLAwAwCx0AAPsCADAeAAD_AgAwxgEAAPwCADDHAQAA_QIAMMgBAAD-AgAgyQEAANECADDKAQAA0QIAMMsBAADRAgAwzAEAANECADDNAQAAgAMAMM4BAADUAgAwCx0AAPICADAeAAD2AgAwxgEAAPMCADDHAQAA9AIAMMgBAAD1AgAgyQEAALwCADDKAQAAvAIAMMsBAAC8AgAwzAEAALwCADDNAQAA9wIAMM4BAAC_AgAwDAcAAJsCACAKAACcAgAgjAEBAAAAAY0BAQAAAAGPAQAAAI8BApEBAAAAkQECkgEQAAAAAZMBEAAAAAGUAQIAAAABlQEBAAAAAZcBQAAAAAGYAUAAAAABAgAAABIAIB0AAPoCACADAAAAEgAgHQAA-gIAIB4AAPkCACABFgAA4AMAMAIAAAASACAWAAD5AgAgAgAAAMACACAWAAD4AgAgCowBAQCSAgAhjQEBAJICACGPAQAAkwKPASKRAQAAlAKRASKSARAAlQIAIZMBEACVAgAhlAECAJYCACGVAQEAkgIAIZcBQACXAgAhmAFAAJcCACEMBwAAmAIAIAoAAJkCACCMAQEAkgIAIY0BAQCSAgAhjwEAAJMCjwEikQEAAJQCkQEikgEQAJUCACGTARAAlQIAIZQBAgCWAgAhlQEBAJICACGXAUAAlwIAIZgBQACXAgAhDAcAAJsCACAKAACcAgAgjAEBAAAAAY0BAQAAAAGPAQAAAI8BApEBAAAAkQECkgEQAAAAAZMBEAAAAAGUAQIAAAABlQEBAAAAAZcBQAAAAAGYAUAAAAABCQYAAKcCACAHAACoAgAgjAEBAAAAAY0BAQAAAAGXAUAAAAABmAFAAAAAAaQBEAAAAAGlARAAAAABpgEBAAAAAQIAAAAOACAdAACDAwAgAwAAAA4AIB0AAIMDACAeAACCAwAgARYAAN8DADACAAAADgAgFgAAggMAIAIAAADVAgAgFgAAgQMAIAeMAQEAkgIAIY0BAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACjAgAhpQEQAKMCACGmAQEAkgIAIQkGAACkAgAgBwAApQIAIIwBAQCSAgAhjQEBAJICACGXAUAAlwIAIZgBQACXAgAhpAEQAKMCACGlARAAowIAIaYBAQCSAgAhCQYAAKcCACAHAACoAgAgjAEBAAAAAY0BAQAAAAGXAUAAAAABmAFAAAAAAaQBEAAAAAGlARAAAAABpgEBAAAAAQ8DAADiAgAgCwAA5wIAIA0AAOQCACAOAADlAgAgDwAA5gIAIIwBAQAAAAGXAUAAAAABmAFAAAAAAaQBEAAAAAGlARAAAAABqAEAAACoAQKpARAAAAABqwEAAACrAQKtAQAAAK0BAq4BAQAAAAECAAAACQAgHQAAjwMAIAMAAAAJACAdAACPAwAgHgAAjgMAIAEWAADeAwAwFAMAAP4BACAIAACFAgAgCwAA9gEAIA0AAPUBACAOAAD1AQAgDwAA9gEAIIkBAACHAgAwigEAAAcAEIsBAACHAgAwjAEBAAAAAZYBAQDvAQAhlwFAAPMBACGYAUAA8wEAIaQBEACCAgAhpQEQAPEBACGoAQAAiAKoASKpARAA8QEAIasBAACJAqsBIq0BAACKAq0BIq4BAQDvAQAhAgAAAAkAIBYAAI4DACACAAAAjAMAIBYAAI0DACAOiQEAAIsDADCKAQAAjAMAEIsBAACLAwAwjAEBAO8BACGWAQEA7wEAIZcBQADzAQAhmAFAAPMBACGkARAAggIAIaUBEADxAQAhqAEAAIgCqAEiqQEQAPEBACGrAQAAiQKrASKtAQAAigKtASKuAQEA7wEAIQ6JAQAAiwMAMIoBAACMAwAQiwEAAIsDADCMAQEA7wEAIZYBAQDvAQAhlwFAAPMBACGYAUAA8wEAIaQBEACCAgAhpQEQAPEBACGoAQAAiAKoASKpARAA8QEAIasBAACJAqsBIq0BAACKAq0BIq4BAQDvAQAhCowBAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACVAgAhpQEQAKMCACGoAQAArwKoASKpARAAowIAIasBAACwAqsBIq0BAACxAq0BIq4BAQCSAgAhDwMAALICACALAAC3AgAgDQAAtAIAIA4AALUCACAPAAC2AgAgjAEBAJICACGXAUAAlwIAIZgBQACXAgAhpAEQAJUCACGlARAAowIAIagBAACvAqgBIqkBEACjAgAhqwEAALACqwEirQEAALECrQEirgEBAJICACEPAwAA4gIAIAsAAOcCACANAADkAgAgDgAA5QIAIA8AAOYCACCMAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAagBAAAAqAECqQEQAAAAAasBAAAAqwECrQEAAACtAQKuAQEAAAABBB0AAIQDADDGAQAAhQMAMMgBAACHAwAgzAEAAIgDADAEHQAA-wIAMMYBAAD8AgAwyAEAAP4CACDMAQAA0QIAMAQdAADyAgAwxgEAAPMCADDIAQAA9QIAIMwBAAC8AgAwAAAAAAAAAAAFHQAA2QMAIB4AANwDACDGAQAA2gMAIMcBAADbAwAgzAEAAAEAIAMdAADZAwAgxgEAANoDACDMAQAAAQAgAAAABR0AANQDACAeAADXAwAgxgEAANUDACDHAQAA1gMAIMwBAAABACADHQAA1AMAIMYBAADVAwAgzAEAAAEAIAAAAAsdAAC9AwAwHgAAwgMAMMYBAAC-AwAwxwEAAL8DADDIAQAAwAMAIMkBAADBAwAwygEAAMEDADDLAQAAwQMAMMwBAADBAwAwzQEAAMMDADDOAQAAxAMAMAsdAAC0AwAwHgAAuAMAMMYBAAC1AwAwxwEAALYDADDIAQAAtwMAIMkBAACIAwAwygEAAIgDADDLAQAAiAMAMMwBAACIAwAwzQEAALkDADDOAQAAiwMAMAsdAACoAwAwHgAArQMAMMYBAACpAwAwxwEAAKoDADDIAQAAqwMAIMkBAACsAwAwygEAAKwDADDLAQAArAMAMMwBAACsAwAwzQEAAK4DADDOAQAArwMAMAeMAQEAAAABlwFAAAAAAZgBQAAAAAG9AQEAAAABvgEQAAAAAb8BEAAAAAHAAQEAAAABAgAAACEAIB0AALMDACADAAAAIQAgHQAAswMAIB4AALIDACABFgAA0wMAMAwDAAD-AQAgiQEAAP0BADCKAQAAHwAQiwEAAP0BADCMAQEAAAABlwFAAPMBACGYAUAA8wEAIa4BAQDvAQAhvQEBAO8BACG-ARAA8QEAIb8BEADxAQAhwAEBAAAAAQIAAAAhACAWAACyAwAgAgAAALADACAWAACxAwAgC4kBAACvAwAwigEAALADABCLAQAArwMAMIwBAQDvAQAhlwFAAPMBACGYAUAA8wEAIa4BAQDvAQAhvQEBAO8BACG-ARAA8QEAIb8BEADxAQAhwAEBAO8BACELiQEAAK8DADCKAQAAsAMAEIsBAACvAwAwjAEBAO8BACGXAUAA8wEAIZgBQADzAQAhrgEBAO8BACG9AQEA7wEAIb4BEADxAQAhvwEQAPEBACHAAQEA7wEAIQeMAQEAkgIAIZcBQACXAgAhmAFAAJcCACG9AQEAkgIAIb4BEACjAgAhvwEQAKMCACHAAQEAkgIAIQeMAQEAkgIAIZcBQACXAgAhmAFAAJcCACG9AQEAkgIAIb4BEACjAgAhvwEQAKMCACHAAQEAkgIAIQeMAQEAAAABlwFAAAAAAZgBQAAAAAG9AQEAAAABvgEQAAAAAb8BEAAAAAHAAQEAAAABDwgAAOMCACALAADnAgAgDQAA5AIAIA4AAOUCACAPAADmAgAgjAEBAAAAAZYBAQAAAAGXAUAAAAABmAFAAAAAAaQBEAAAAAGlARAAAAABqAEAAACoAQKpARAAAAABqwEAAACrAQKtAQAAAK0BAgIAAAAJACAdAAC8AwAgAwAAAAkAIB0AALwDACAeAAC7AwAgARYAANIDADACAAAACQAgFgAAuwMAIAIAAACMAwAgFgAAugMAIAqMAQEAkgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACVAgAhpQEQAKMCACGoAQAArwKoASKpARAAowIAIasBAACwAqsBIq0BAACxAq0BIg8IAACzAgAgCwAAtwIAIA0AALQCACAOAAC1AgAgDwAAtgIAIIwBAQCSAgAhlgEBAJICACGXAUAAlwIAIZgBQACXAgAhpAEQAJUCACGlARAAowIAIagBAACvAqgBIqkBEACjAgAhqwEAALACqwEirQEAALECrQEiDwgAAOMCACALAADnAgAgDQAA5AIAIA4AAOUCACAPAADmAgAgjAEBAAAAAZYBAQAAAAGXAUAAAAABmAFAAAAAAaQBEAAAAAGlARAAAAABqAEAAACoAQKpARAAAAABqwEAAACrAQKtAQAAAK0BAgSMAQEAAAABlwFAAAAAAZgBQAAAAAHBAQEAAAABAgAAAAUAIB0AAMgDACADAAAABQAgHQAAyAMAIB4AAMcDACABFgAA0QMAMAkDAAD-AQAgiQEAAIsCADCKAQAAAwAQiwEAAIsCADCMAQEAAAABlwFAAPMBACGYAUAA8wEAIa4BAQDvAQAhwQEBAAAAAQIAAAAFACAWAADHAwAgAgAAAMUDACAWAADGAwAgCIkBAADEAwAwigEAAMUDABCLAQAAxAMAMIwBAQDvAQAhlwFAAPMBACGYAUAA8wEAIa4BAQDvAQAhwQEBAO8BACEIiQEAAMQDADCKAQAAxQMAEIsBAADEAwAwjAEBAO8BACGXAUAA8wEAIZgBQADzAQAhrgEBAO8BACHBAQEA7wEAIQSMAQEAkgIAIZcBQACXAgAhmAFAAJcCACHBAQEAkgIAIQSMAQEAkgIAIZcBQACXAgAhmAFAAJcCACHBAQEAkgIAIQSMAQEAAAABlwFAAAAAAZgBQAAAAAHBAQEAAAABBB0AAL0DADDGAQAAvgMAMMgBAADAAwAgzAEAAMEDADAEHQAAtAMAMMYBAAC1AwAwyAEAALcDACDMAQAAiAMAMAQdAACoAwAwxgEAAKkDADDIAQAAqwMAIMwBAACsAwAwAAADBAAAzAMAIAUAAJMDACAQAADNAwAgBwMAAM4DACAIAADQAwAgCwAAlQMAIA0AAJQDACAOAACUAwAgDwAAlQMAIKQBAACMAgAgAwUAAJMDACAJAACUAwAgCwAAlQMAIASMAQEAAAABlwFAAAAAAZgBQAAAAAHBAQEAAAABCowBAQAAAAGWAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAagBAAAAqAECqQEQAAAAAasBAAAAqwECrQEAAACtAQIHjAEBAAAAAZcBQAAAAAGYAUAAAAABvQEBAAAAAb4BEAAAAAG_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_QMAIBIAAAAHACADAACyAgAgCAAAswIAIAsAALcCACAOAAC1AgAgDwAAtgIAIBYAAP0DACCMAQEAkgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACVAgAhpQEQAKMCACGoAQAArwKoASKpARAAowIAIasBAACwAqsBIq0BAACxAq0BIq4BAQCSAgAhEAMAALICACAIAACzAgAgCwAAtwIAIA4AALUCACAPAAC2AgAgjAEBAJICACGWAQEAkgIAIZcBQACXAgAhmAFAAJcCACGkARAAlQIAIaUBEACjAgAhqAEAAK8CqAEiqQEQAKMCACGrAQAAsAKrASKtAQAAsQKtASKuAQEAkgIAIRAFAACQAwAgCQAAkQMAIIwBAQAAAAGXAUAAAAABmAFAAAAAAa0BAAAAswECrwEBAAAAAbABAQAAAAGxAQEAAAABswEQAAAAAbQBEAAAAAG1ARAAAAABtgECAAAAAbcBAgAAAAG4ARAAAAABuQEQAAAAAQIAAABpACAdAAD-AwAgEAMAAOICACAIAADjAgAgDQAA5AIAIA4AAOUCACAPAADmAgAgjAEBAAAAAZYBAQAAAAGXAUAAAAABmAFAAAAAAaQBEAAAAAGlARAAAAABqAEAAACoAQKpARAAAAABqwEAAACrAQKtAQAAAK0BAq4BAQAAAAECAAAACQAgHQAAgAQAIBADAADiAgAgCAAA4wIAIAsAAOcCACANAADkAgAgDgAA5QIAIIwBAQAAAAGWAQEAAAABlwFAAAAAAZgBQAAAAAGkARAAAAABpQEQAAAAAagBAAAAqAECqQEQAAAAAasBAAAAqwECrQEAAACtAQKuAQEAAAABAgAAAAkAIB0AAIIEACADAAAAbAAgHQAA_gMAIB4AAIYEACASAAAAbAAgBQAA7wIAIAkAAPACACAWAACGBAAgjAEBAJICACGXAUAAlwIAIZgBQACXAgAhrQEAAO0CswEirwEBAJICACGwAQEAkgIAIbEBAQCSAgAhswEQAKMCACG0ARAAowIAIbUBEACjAgAhtgECAO4CACG3AQIA7gIAIbgBEACjAgAhuQEQAKMCACEQBQAA7wIAIAkAAPACACCMAQEAkgIAIZcBQACXAgAhmAFAAJcCACGtAQAA7QKzASKvAQEAkgIAIbABAQCSAgAhsQEBAJICACGzARAAowIAIbQBEACjAgAhtQEQAKMCACG2AQIA7gIAIbcBAgDuAgAhuAEQAKMCACG5ARAAowIAIQMAAAAHACAdAACABAAgHgAAiQQAIBIAAAAHACADAACyAgAgCAAAswIAIA0AALQCACAOAAC1AgAgDwAAtgIAIBYAAIkEACCMAQEAkgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACVAgAhpQEQAKMCACGoAQAArwKoASKpARAAowIAIasBAACwAqsBIq0BAACxAq0BIq4BAQCSAgAhEAMAALICACAIAACzAgAgDQAAtAIAIA4AALUCACAPAAC2AgAgjAEBAJICACGWAQEAkgIAIZcBQACXAgAhmAFAAJcCACGkARAAlQIAIaUBEACjAgAhqAEAAK8CqAEiqQEQAKMCACGrAQAAsAKrASKtAQAAsQKtASKuAQEAkgIAIQMAAAAHACAdAACCBAAgHgAAjAQAIBIAAAAHACADAACyAgAgCAAAswIAIAsAALcCACANAAC0AgAgDgAAtQIAIBYAAIwEACCMAQEAkgIAIZYBAQCSAgAhlwFAAJcCACGYAUAAlwIAIaQBEACVAgAhpQEQAKMCACGoAQAArwKoASKpARAAowIAIasBAACwAqsBIq0BAACxAq0BIq4BAQCSAgAhEAMAALICACAIAACzAgAgCwAAtwIAIA0AALQCACAOAAC1AgAgjAEBAJICACGWAQEAkgIAIZcBQACXAgAhmAFAAJcCACGkARAAlQIAIaUBEACjAgAhqAEAAK8CqAEiqQEQAKMCACGrAQAAsAKrASKtAQAAsQKtASKuAQEAkgIAIQQEBgIFCgMMAAoQIgkBAwABBwMAAQgABAsaBgwACA0XBQ4YBQ8ZBgQFCwMJDwULEwYMAAcDBgADBwADCAAEAwcAAwgABAoAAwMFFAAJFQALFgAECx4ADRsADhwADx0AAQMAAQMEIwAFJAAQJQAAAAADDAAPIwAQJAARAAAAAwwADyMAECQAEQEDAAEBAwABAwwAFiMAFyQAGAAAAAMMABYjABckABgBAwABAQMAAQUMAB0jACAkACFFAB5GAB8AAAAAAAUMAB0jACAkACFFAB5GAB8AAAUMACYjACkkACpFACdGACgAAAAAAAUMACYjACkkACpFACdGACgCAwABCAAEAgMAAQgABAUMAC8jADIkADNFADBGADEAAAAAAAUMAC8jADIkADNFADBGADEDBgADBwADCAAEAwYAAwcAAwgABAUMADgjADskADxFADlGADoAAAAAAAUMADgjADskADxFADlGADoDBwADCAAECgADAwcAAwgABAoAAwUMAEEjAEQkAEVFAEJGAEMAAAAAAAUMAEEjAEQkAEVFAEJGAEMRAgESJgETKQEUKgEVKwEXLQEYLwsZMAwaMgEbNAscNQ0fNgEgNwEhOAslOw4mPBInPQIoPgIpPwIqQAIrQQIsQwItRQsuRhMvSAIwSgsxSxQyTAIzTQI0Tgs1URU2Uhk3Uwk4VAk5VQk6Vgk7Vwk8WQk9Wws-XBo_XglAYAtBYRtCYglDYwlEZAtHZxxIaCJJagRKawRLbgRMbwRNcAROcgRPdAtQdSNRdwRSeQtTeiRUewRVfARWfQtXgAElWIEBK1mCAQNagwEDW4QBA1yFAQNdhgEDXogBA1-KAQtgiwEsYY0BA2KPAQtjkAEtZJEBA2WSAQNmkwELZ5YBLmiXATRpmAEFapkBBWuaAQVsmwEFbZwBBW6eAQVvoAELcKEBNXGjAQVypQELc6YBNnSnAQV1qAEFdqkBC3esATd4rQE9ea4BBnqvAQZ7sAEGfLEBBn2yAQZ-tAEGf7YBC4ABtwE-gQG5AQaCAbsBC4MBvAE_hAG9AQaFAb4BBoYBvwELhwHCAUCIAcMBRg"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var runtime2 = __toESM(require("@prisma/client/runtime/client"));
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
var import_meta = {};
globalThis["__dirname"] = path.dirname((0, import_node_url.fileURLToPath)(import_meta.url));
var PrismaClient = getPrismaClientClass();

// src/client.ts
var globalForPrisma = global;
var connectionString = process.env.DATABASE_URL;
var pool = new import_pg3.Pool({
  connectionString
});
var adapter = new PrismaPgAdapterFactory(pool);
var prisma = globalForPrisma.prisma || new PrismaClient({
  adapter
  // Optional: Log queries to see if connection works
  // log: ['query', 'info', 'warn', 'error'],
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// src/seed.ts
var DEFAULT_USERS = [
  // Add your own user to pre-populate the database with
  {
    name: "Tim Apple",
    email: "tim@apple.com"
  }
];
(async () => {
  try {
    await Promise.all(
      DEFAULT_USERS.map(
        (user) => prisma.user.upsert({
          where: {
            email: user.email
          },
          update: {
            ...user
          },
          create: {
            ...user
          }
        })
      )
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
