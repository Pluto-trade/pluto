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
var import_config2 = require("dotenv/config");

// src/client.ts
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
  "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Balances {\n  id           String   @id\n  userId       String\n  asset        String\n  reserved     Decimal\n  available    Decimal\n  userId_asset String   @unique\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime\n  User         User     @relation(fields: [userId], references: [id])\n}\n\nmodel Market {\n  id                  String                @id\n  symbol              String                @unique\n  baseAsset           String\n  quoteAsset          String\n  status              MarketStatus\n  tickSize            Decimal\n  lotSize             Decimal\n  minOrderSize        Decimal\n  pricePrecision      Int\n  sizePrecision       Int\n  makerFeeRate        Decimal\n  takerFeeRate        Decimal\n  createdAt           DateTime              @default(now())\n  updatedAt           DateTime\n  Order               Order[]\n  ProtectionDecisions ProtectionDecisions[]\n  Trade               Trade[]\n}\n\nmodel Order {\n  id                                                          String                @id\n  side                                                        OrderSide\n  price                                                       Decimal?\n  size                                                        Decimal\n  remainingSize                                               Decimal\n  type                                                        OrderType\n  status                                                      OrderStatus\n  userId                                                      String\n  marketId                                                    String\n  createdAt                                                   DateTime              @default(now())\n  updatedAt                                                   DateTime\n  Market                                                      Market                @relation(fields: [marketId], references: [id])\n  User                                                        User                  @relation(fields: [userId], references: [id])\n  ProtectionDecisions_ProtectionDecisions_orderIdToOrder      ProtectionDecisions[] @relation("ProtectionDecisions_orderIdToOrder")\n  ProtectionDecisions_ProtectionDecisions_takerOrderIdToOrder ProtectionDecisions[] @relation("ProtectionDecisions_takerOrderIdToOrder")\n  Trade_Trade_makerOrderIdToOrder                             Trade[]               @relation("Trade_makerOrderIdToOrder")\n  Trade_Trade_takerOrderIdToOrder                             Trade[]               @relation("Trade_takerOrderIdToOrder")\n}\n\nmodel ProtectionDecisions {\n  id                                            String           @id\n  takerOrderId                                  String\n  decision                                      DecisionType\n  reason                                        ProtectionReason\n  priceDeviation                                Decimal?\n  quotePrice                                    Decimal?\n  quoteAgeMs                                    Int?\n  orderId                                       String\n  marketId                                      String\n  createdAt                                     DateTime         @default(now())\n  updatedAt                                     DateTime\n  Market                                        Market           @relation(fields: [marketId], references: [id])\n  Order_ProtectionDecisions_orderIdToOrder      Order            @relation("ProtectionDecisions_orderIdToOrder", fields: [orderId], references: [id])\n  Order_ProtectionDecisions_takerOrderIdToOrder Order            @relation("ProtectionDecisions_takerOrderIdToOrder", fields: [takerOrderId], references: [id])\n}\n\nmodel Trade {\n  id                              String   @id\n  price                           Decimal\n  size                            Decimal\n  makerOrderId                    String\n  takerOrderId                    String\n  marketId                        String\n  createdAt                       DateTime @default(now())\n  updatedAt                       DateTime\n  Order_Trade_makerOrderIdToOrder Order    @relation("Trade_makerOrderIdToOrder", fields: [makerOrderId], references: [id])\n  Market                          Market   @relation(fields: [marketId], references: [id])\n  Order_Trade_takerOrderIdToOrder Order    @relation("Trade_takerOrderIdToOrder", fields: [takerOrderId], references: [id])\n}\n\nmodel User {\n  id        String     @id\n  email     String     @unique\n  name      String\n  createdAt DateTime   @default(now())\n  updatedAt DateTime\n  Balances  Balances[]\n  Order     Order[]\n  Wallet    Wallet[]\n}\n\nmodel Wallet {\n  id        String   @id\n  address   String   @unique\n  userId    String\n  createdAt DateTime @default(now())\n  updatedAt DateTime\n  User      User     @relation(fields: [userId], references: [id])\n}\n\nenum DecisionType {\n  CANCEL\n}\n\nenum MarketStatus {\n  ACTIVE\n  PAUSED\n  DISABLED\n}\n\nenum OrderSide {\n  BUY\n  SELL\n}\n\nenum OrderStatus {\n  ACCEPTED\n  OPEN\n  PARTIALLY_FILLED\n  FILLED\n  CANCELLED\n}\n\nenum OrderType {\n  LIMIT\n  MARKET\n}\n\nenum ProtectionReason {\n  STRONG_STALE\n  DEVIATION\n  DEVIATION_HIGH_VOL\n  DELAY\n  DELAY_HIGH_VOL\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"Balances":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"asset","kind":"scalar","type":"String"},{"name":"reserved","kind":"scalar","type":"Decimal"},{"name":"available","kind":"scalar","type":"Decimal"},{"name":"userId_asset","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"User","kind":"object","type":"User","relationName":"BalancesToUser"}],"dbName":null},"Market":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"symbol","kind":"scalar","type":"String"},{"name":"baseAsset","kind":"scalar","type":"String"},{"name":"quoteAsset","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"MarketStatus"},{"name":"tickSize","kind":"scalar","type":"Decimal"},{"name":"lotSize","kind":"scalar","type":"Decimal"},{"name":"minOrderSize","kind":"scalar","type":"Decimal"},{"name":"pricePrecision","kind":"scalar","type":"Int"},{"name":"sizePrecision","kind":"scalar","type":"Int"},{"name":"makerFeeRate","kind":"scalar","type":"Decimal"},{"name":"takerFeeRate","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"Order","kind":"object","type":"Order","relationName":"MarketToOrder"},{"name":"ProtectionDecisions","kind":"object","type":"ProtectionDecisions","relationName":"MarketToProtectionDecisions"},{"name":"Trade","kind":"object","type":"Trade","relationName":"MarketToTrade"}],"dbName":null},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"side","kind":"enum","type":"OrderSide"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"size","kind":"scalar","type":"Decimal"},{"name":"remainingSize","kind":"scalar","type":"Decimal"},{"name":"type","kind":"enum","type":"OrderType"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"userId","kind":"scalar","type":"String"},{"name":"marketId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"Market","kind":"object","type":"Market","relationName":"MarketToOrder"},{"name":"User","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"ProtectionDecisions_ProtectionDecisions_orderIdToOrder","kind":"object","type":"ProtectionDecisions","relationName":"ProtectionDecisions_orderIdToOrder"},{"name":"ProtectionDecisions_ProtectionDecisions_takerOrderIdToOrder","kind":"object","type":"ProtectionDecisions","relationName":"ProtectionDecisions_takerOrderIdToOrder"},{"name":"Trade_Trade_makerOrderIdToOrder","kind":"object","type":"Trade","relationName":"Trade_makerOrderIdToOrder"},{"name":"Trade_Trade_takerOrderIdToOrder","kind":"object","type":"Trade","relationName":"Trade_takerOrderIdToOrder"}],"dbName":null},"ProtectionDecisions":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"takerOrderId","kind":"scalar","type":"String"},{"name":"decision","kind":"enum","type":"DecisionType"},{"name":"reason","kind":"enum","type":"ProtectionReason"},{"name":"priceDeviation","kind":"scalar","type":"Decimal"},{"name":"quotePrice","kind":"scalar","type":"Decimal"},{"name":"quoteAgeMs","kind":"scalar","type":"Int"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"marketId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"Market","kind":"object","type":"Market","relationName":"MarketToProtectionDecisions"},{"name":"Order_ProtectionDecisions_orderIdToOrder","kind":"object","type":"Order","relationName":"ProtectionDecisions_orderIdToOrder"},{"name":"Order_ProtectionDecisions_takerOrderIdToOrder","kind":"object","type":"Order","relationName":"ProtectionDecisions_takerOrderIdToOrder"}],"dbName":null},"Trade":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"size","kind":"scalar","type":"Decimal"},{"name":"makerOrderId","kind":"scalar","type":"String"},{"name":"takerOrderId","kind":"scalar","type":"String"},{"name":"marketId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"Order_Trade_makerOrderIdToOrder","kind":"object","type":"Order","relationName":"Trade_makerOrderIdToOrder"},{"name":"Market","kind":"object","type":"Market","relationName":"MarketToTrade"},{"name":"Order_Trade_takerOrderIdToOrder","kind":"object","type":"Order","relationName":"Trade_takerOrderIdToOrder"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"Balances","kind":"object","type":"Balances","relationName":"BalancesToUser"},{"name":"Order","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"Wallet","kind":"object","type":"Wallet","relationName":"UserToWallet"}],"dbName":null},"Wallet":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"User","kind":"object","type":"User","relationName":"UserToWallet"}],"dbName":null}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","Balances","Order","Market","Order_ProtectionDecisions_orderIdToOrder","Order_ProtectionDecisions_takerOrderIdToOrder","ProtectionDecisions","Order_Trade_makerOrderIdToOrder","Order_Trade_takerOrderIdToOrder","Trade","_count","User","ProtectionDecisions_ProtectionDecisions_orderIdToOrder","ProtectionDecisions_ProtectionDecisions_takerOrderIdToOrder","Trade_Trade_makerOrderIdToOrder","Trade_Trade_takerOrderIdToOrder","Wallet","Balances.findUnique","Balances.findUniqueOrThrow","Balances.findFirst","Balances.findFirstOrThrow","Balances.findMany","data","Balances.createOne","Balances.createMany","Balances.createManyAndReturn","Balances.updateOne","Balances.updateMany","Balances.updateManyAndReturn","create","update","Balances.upsertOne","Balances.deleteOne","Balances.deleteMany","having","_avg","_sum","_min","_max","Balances.groupBy","Balances.aggregate","Market.findUnique","Market.findUniqueOrThrow","Market.findFirst","Market.findFirstOrThrow","Market.findMany","Market.createOne","Market.createMany","Market.createManyAndReturn","Market.updateOne","Market.updateMany","Market.updateManyAndReturn","Market.upsertOne","Market.deleteOne","Market.deleteMany","Market.groupBy","Market.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","ProtectionDecisions.findUnique","ProtectionDecisions.findUniqueOrThrow","ProtectionDecisions.findFirst","ProtectionDecisions.findFirstOrThrow","ProtectionDecisions.findMany","ProtectionDecisions.createOne","ProtectionDecisions.createMany","ProtectionDecisions.createManyAndReturn","ProtectionDecisions.updateOne","ProtectionDecisions.updateMany","ProtectionDecisions.updateManyAndReturn","ProtectionDecisions.upsertOne","ProtectionDecisions.deleteOne","ProtectionDecisions.deleteMany","ProtectionDecisions.groupBy","ProtectionDecisions.aggregate","Trade.findUnique","Trade.findUniqueOrThrow","Trade.findFirst","Trade.findFirstOrThrow","Trade.findMany","Trade.createOne","Trade.createMany","Trade.createManyAndReturn","Trade.updateOne","Trade.updateMany","Trade.updateManyAndReturn","Trade.upsertOne","Trade.deleteOne","Trade.deleteMany","Trade.groupBy","Trade.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Wallet.findUnique","Wallet.findUniqueOrThrow","Wallet.findFirst","Wallet.findFirstOrThrow","Wallet.findMany","Wallet.createOne","Wallet.createMany","Wallet.createManyAndReturn","Wallet.updateOne","Wallet.updateMany","Wallet.updateManyAndReturn","Wallet.upsertOne","Wallet.deleteOne","Wallet.deleteMany","Wallet.groupBy","Wallet.aggregate","AND","OR","NOT","id","address","userId","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","email","name","every","some","none","price","size","makerOrderId","takerOrderId","marketId","DecisionType","decision","ProtectionReason","reason","priceDeviation","quotePrice","quoteAgeMs","orderId","OrderSide","side","remainingSize","OrderType","type","OrderStatus","status","symbol","baseAsset","quoteAsset","MarketStatus","tickSize","lotSize","minOrderSize","pricePrecision","sizePrecision","makerFeeRate","takerFeeRate","asset","reserved","available","userId_asset","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "jARGcAwNAAD-AQAgiwEAAIsCADCMAQAAAwAQjQEAAIsCADCOAQEAAAABkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhwgEBAM4BACHDARAA-AEAIcQBEAD4AQAhxQEBAAAAAQEAAAABACAMDQAA_gEAIIsBAACLAgAwjAEAAAMAEI0BAACLAgAwjgEBAM4BACGQAQEAzgEAIZEBQADPAQAhkgFAAM8BACHCAQEAzgEAIcMBEAD4AQAhxAEQAPgBACHFAQEAzgEAIQENAADOAwAgAwAAAAMAIAEAAAQAMAIAAAEAIBQFAACBAgAgDQAA_gEAIA4AAPoBACAPAAD6AQAgEAAA-wEAIBEAAPsBACCLAQAAhwIAMIwBAAAGABCNAQAAhwIAMI4BAQDOAQAhkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhowEQAIUCACGkARAA-AEAIacBAQDOAQAhsQEAAIgCsQEisgEQAPgBACG0AQAAiQK0ASK2AQAAigK2ASIHBQAA0AMAIA0AAM4DACAOAADFAwAgDwAAxQMAIBAAAMYDACARAADGAwAgowEAAJADACAUBQAAgQIAIA0AAP4BACAOAAD6AQAgDwAA-gEAIBAAAPsBACARAAD7AQAgiwEAAIcCADCMAQAABgAQjQEAAIcCADCOAQEAAAABkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhowEQAIUCACGkARAA-AEAIacBAQDOAQAhsQEAAIgCsQEisgEQAPgBACG0AQAAiQK0ASK2AQAAigK2ASIDAAAABgAgAQAABwAwAgAACAAgAwAAAAYAIAEAAAcAMAIAAAgAIBEFAACBAgAgBgAAgAIAIAcAAIACACCLAQAAggIAMIwBAAALABCNAQAAggIAMI4BAQDOAQAhkQFAAM8BACGSAUAAzwEAIaYBAQDOAQAhpwEBAM4BACGpAQAAgwKpASKrAQAAhAKrASKsARAAhQIAIa0BEACFAgAhrgECAIYCACGvAQEAzgEAIQYFAADQAwAgBgAAzwMAIAcAAM8DACCsAQAAkAMAIK0BAACQAwAgrgEAAJADACARBQAAgQIAIAYAAIACACAHAACAAgAgiwEAAIICADCMAQAACwAQjQEAAIICADCOAQEAAAABkQFAAM8BACGSAUAAzwEAIaYBAQDOAQAhpwEBAM4BACGpAQAAgwKpASKrAQAAhAKrASKsARAAhQIAIa0BEACFAgAhrgECAIYCACGvAQEAzgEAIQMAAAALACABAAAMADACAAANACAOBQAAgQIAIAkAAIACACAKAACAAgAgiwEAAP8BADCMAQAADwAQjQEAAP8BADCOAQEAzgEAIZEBQADPAQAhkgFAAM8BACGjARAA-AEAIaQBEAD4AQAhpQEBAM4BACGmAQEAzgEAIacBAQDOAQAhAwUAANADACAJAADPAwAgCgAAzwMAIA4FAACBAgAgCQAAgAIAIAoAAIACACCLAQAA_wEAMIwBAAAPABCNAQAA_wEAMI4BAQAAAAGRAUAAzwEAIZIBQADPAQAhowEQAPgBACGkARAA-AEAIaUBAQDOAQAhpgEBAM4BACGnAQEAzgEAIQMAAAAPACABAAAQADACAAARACABAAAABgAgAQAAAAsAIAEAAAAPACADAAAACwAgAQAADAAwAgAADQAgAwAAAAsAIAEAAAwAMAIAAA0AIAMAAAAPACABAAAQADACAAARACADAAAADwAgAQAAEAAwAgAAEQAgAQAAAAsAIAEAAAALACABAAAADwAgAQAAAA8AIAkNAAD-AQAgiwEAAP0BADCMAQAAHgAQjQEAAP0BADCOAQEAzgEAIY8BAQDOAQAhkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhAQ0AAM4DACAJDQAA_gEAIIsBAAD9AQAwjAEAAB4AEI0BAAD9AQAwjgEBAAAAAY8BAQAAAAGQAQEAzgEAIZEBQADPAQAhkgFAAM8BACEDAAAAHgAgAQAAHwAwAgAAIAAgAQAAAAMAIAEAAAAGACABAAAAHgAgAQAAAAEAIAMAAAADACABAAAEADACAAABACADAAAAAwAgAQAABAAwAgAAAQAgAwAAAAMAIAEAAAQAMAIAAAEAIAkNAADNAwAgjgEBAAAAAZABAQAAAAGRAUAAAAABkgFAAAAAAcIBAQAAAAHDARAAAAABxAEQAAAAAcUBAQAAAAEBGAAAKQAgCI4BAQAAAAGQAQEAAAABkQFAAAAAAZIBQAAAAAHCAQEAAAABwwEQAAAAAcQBEAAAAAHFAQEAAAABARgAACsAMAEYAAArADAJDQAAzAMAII4BAQCPAgAhkAEBAI8CACGRAUAAkAIAIZIBQACQAgAhwgEBAI8CACHDARAAsQIAIcQBEACxAgAhxQEBAI8CACECAAAAAQAgGAAALgAgCI4BAQCPAgAhkAEBAI8CACGRAUAAkAIAIZIBQACQAgAhwgEBAI8CACHDARAAsQIAIcQBEACxAgAhxQEBAI8CACECAAAAAwAgGAAAMAAgAgAAAAMAIBgAADAAIAMAAAABACAfAAApACAgAAAuACABAAAAAQAgAQAAAAMAIAUMAADHAwAgJQAAyAMAICYAAMsDACAnAADKAwAgKAAAyQMAIAuLAQAA_AEAMIwBAAA3ABCNAQAA_AEAMI4BAQDFAQAhkAEBAMUBACGRAUAAxgEAIZIBQADGAQAhwgEBAMUBACHDARAA1AEAIcQBEADUAQAhxQEBAMUBACEDAAAAAwAgAQAANgAwJAAANwAgAwAAAAMAIAEAAAQAMAIAAAEAIBQEAADRAQAgCAAA-gEAIAsAAPsBACCLAQAA9gEAMIwBAAA9ABCNAQAA9gEAMI4BAQAAAAGRAUAAzwEAIZIBQADPAQAhtgEAAPcBuwEitwEBAAAAAbgBAQDOAQAhuQEBAM4BACG7ARAA-AEAIbwBEAD4AQAhvQEQAPgBACG-AQIA-QEAIb8BAgD5AQAhwAEQAPgBACHBARAA-AEAIQEAAAA6ACABAAAAOgAgFAQAANEBACAIAAD6AQAgCwAA-wEAIIsBAAD2AQAwjAEAAD0AEI0BAAD2AQAwjgEBAM4BACGRAUAAzwEAIZIBQADPAQAhtgEAAPcBuwEitwEBAM4BACG4AQEAzgEAIbkBAQDOAQAhuwEQAPgBACG8ARAA-AEAIb0BEAD4AQAhvgECAPkBACG_AQIA-QEAIcABEAD4AQAhwQEQAPgBACEDBAAAiQMAIAgAAMUDACALAADGAwAgAwAAAD0AIAEAAD4AMAIAADoAIAMAAAA9ACABAAA-ADACAAA6ACADAAAAPQAgAQAAPgAwAgAAOgAgEQQAAMIDACAIAADDAwAgCwAAxAMAII4BAQAAAAGRAUAAAAABkgFAAAAAAbYBAAAAuwECtwEBAAAAAbgBAQAAAAG5AQEAAAABuwEQAAAAAbwBEAAAAAG9ARAAAAABvgECAAAAAb8BAgAAAAHAARAAAAABwQEQAAAAAQEYAABCACAOjgEBAAAAAZEBQAAAAAGSAUAAAAABtgEAAAC7AQK3AQEAAAABuAEBAAAAAbkBAQAAAAG7ARAAAAABvAEQAAAAAb0BEAAAAAG-AQIAAAABvwECAAAAAcABEAAAAAHBARAAAAABARgAAEQAMAEYAABEADARBAAApAMAIAgAAKUDACALAACmAwAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhtgEAAKIDuwEitwEBAI8CACG4AQEAjwIAIbkBAQCPAgAhuwEQALECACG8ARAAsQIAIb0BEACxAgAhvgECAKMDACG_AQIAowMAIcABEACxAgAhwQEQALECACECAAAAOgAgGAAARwAgDo4BAQCPAgAhkQFAAJACACGSAUAAkAIAIbYBAACiA7sBIrcBAQCPAgAhuAEBAI8CACG5AQEAjwIAIbsBEACxAgAhvAEQALECACG9ARAAsQIAIb4BAgCjAwAhvwECAKMDACHAARAAsQIAIcEBEACxAgAhAgAAAD0AIBgAAEkAIAIAAAA9ACAYAABJACADAAAAOgAgHwAAQgAgIAAARwAgAQAAADoAIAEAAAA9ACAFDAAAnQMAICUAAJ4DACAmAAChAwAgJwAAoAMAICgAAJ8DACARiwEAAO8BADCMAQAAUAAQjQEAAO8BADCOAQEAxQEAIZEBQADGAQAhkgFAAMYBACG2AQAA8AG7ASK3AQEAxQEAIbgBAQDFAQAhuQEBAMUBACG7ARAA1AEAIbwBEADUAQAhvQEQANQBACG-AQIA8QEAIb8BAgDxAQAhwAEQANQBACHBARAA1AEAIQMAAAA9ACABAABPADAkAABQACADAAAAPQAgAQAAPgAwAgAAOgAgAQAAAAgAIAEAAAAIACADAAAABgAgAQAABwAwAgAACAAgAwAAAAYAIAEAAAcAMAIAAAgAIAMAAAAGACABAAAHADACAAAIACARBQAA9AIAIA0AAJwDACAOAAD1AgAgDwAA9gIAIBAAAPcCACARAAD4AgAgjgEBAAAAAZABAQAAAAGRAUAAAAABkgFAAAAAAaMBEAAAAAGkARAAAAABpwEBAAAAAbEBAAAAsQECsgEQAAAAAbQBAAAAtAECtgEAAAC2AQIBGAAAWAAgC44BAQAAAAGQAQEAAAABkQFAAAAAAZIBQAAAAAGjARAAAAABpAEQAAAAAacBAQAAAAGxAQAAALEBArIBEAAAAAG0AQAAALQBArYBAAAAtgECARgAAFoAMAEYAABaADARBQAAtQIAIA0AAJsDACAOAAC2AgAgDwAAtwIAIBAAALgCACARAAC5AgAgjgEBAI8CACGQAQEAjwIAIZEBQACQAgAhkgFAAJACACGjARAAsAIAIaQBEACxAgAhpwEBAI8CACGxAQAArwKxASKyARAAsQIAIbQBAACyArQBIrYBAACzArYBIgIAAAAIACAYAABdACALjgEBAI8CACGQAQEAjwIAIZEBQACQAgAhkgFAAJACACGjARAAsAIAIaQBEACxAgAhpwEBAI8CACGxAQAArwKxASKyARAAsQIAIbQBAACyArQBIrYBAACzArYBIgIAAAAGACAYAABfACACAAAABgAgGAAAXwAgAwAAAAgAIB8AAFgAICAAAF0AIAEAAAAIACABAAAABgAgBgwAAJYDACAlAACXAwAgJgAAmgMAICcAAJkDACAoAACYAwAgowEAAJADACAOiwEAAOUBADCMAQAAZgAQjQEAAOUBADCOAQEAxQEAIZABAQDFAQAhkQFAAMYBACGSAUAAxgEAIaMBEADaAQAhpAEQANQBACGnAQEAxQEAIbEBAADmAbEBIrIBEADUAQAhtAEAAOcBtAEitgEAAOgBtgEiAwAAAAYAIAEAAGUAMCQAAGYAIAMAAAAGACABAAAHADACAAAIACABAAAADQAgAQAAAA0AIAMAAAALACABAAAMADACAAANACADAAAACwAgAQAADAAwAgAADQAgAwAAAAsAIAEAAAwAMAIAAA0AIA4FAADmAgAgBgAA5wIAIAcAAPICACCOAQEAAAABkQFAAAAAAZIBQAAAAAGmAQEAAAABpwEBAAAAAakBAAAAqQECqwEAAACrAQKsARAAAAABrQEQAAAAAa4BAgAAAAGvAQEAAAABARgAAG4AIAuOAQEAAAABkQFAAAAAAZIBQAAAAAGmAQEAAAABpwEBAAAAAakBAAAAqQECqwEAAACrAQKsARAAAAABrQEQAAAAAa4BAgAAAAGvAQEAAAABARgAAHAAMAEYAABwADAOBQAA4wIAIAYAAOQCACAHAADwAgAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhpgEBAI8CACGnAQEAjwIAIakBAADfAqkBIqsBAADgAqsBIqwBEACwAgAhrQEQALACACGuAQIA4QIAIa8BAQCPAgAhAgAAAA0AIBgAAHMAIAuOAQEAjwIAIZEBQACQAgAhkgFAAJACACGmAQEAjwIAIacBAQCPAgAhqQEAAN8CqQEiqwEAAOACqwEirAEQALACACGtARAAsAIAIa4BAgDhAgAhrwEBAI8CACECAAAACwAgGAAAdQAgAgAAAAsAIBgAAHUAIAMAAAANACAfAABuACAgAABzACABAAAADQAgAQAAAAsAIAgMAACRAwAgJQAAkgMAICYAAJUDACAnAACUAwAgKAAAkwMAIKwBAACQAwAgrQEAAJADACCuAQAAkAMAIA6LAQAA1wEAMIwBAAB8ABCNAQAA1wEAMI4BAQDFAQAhkQFAAMYBACGSAUAAxgEAIaYBAQDFAQAhpwEBAMUBACGpAQAA2AGpASKrAQAA2QGrASKsARAA2gEAIa0BEADaAQAhrgECANsBACGvAQEAxQEAIQMAAAALACABAAB7ADAkAAB8ACADAAAACwAgAQAADAAwAgAADQAgAQAAABEAIAEAAAARACADAAAADwAgAQAAEAAwAgAAEQAgAwAAAA8AIAEAABAAMAIAABEAIAMAAAAPACABAAAQADACAAARACALBQAAyQIAIAkAAMgCACAKAADUAgAgjgEBAAAAAZEBQAAAAAGSAUAAAAABowEQAAAAAaQBEAAAAAGlAQEAAAABpgEBAAAAAacBAQAAAAEBGAAAhAEAIAiOAQEAAAABkQFAAAAAAZIBQAAAAAGjARAAAAABpAEQAAAAAaUBAQAAAAGmAQEAAAABpwEBAAAAAQEYAACGAQAwARgAAIYBADALBQAAxgIAIAkAAMUCACAKAADSAgAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhowEQALECACGkARAAsQIAIaUBAQCPAgAhpgEBAI8CACGnAQEAjwIAIQIAAAARACAYAACJAQAgCI4BAQCPAgAhkQFAAJACACGSAUAAkAIAIaMBEACxAgAhpAEQALECACGlAQEAjwIAIaYBAQCPAgAhpwEBAI8CACECAAAADwAgGAAAiwEAIAIAAAAPACAYAACLAQAgAwAAABEAIB8AAIQBACAgAACJAQAgAQAAABEAIAEAAAAPACAFDAAAiwMAICUAAIwDACAmAACPAwAgJwAAjgMAICgAAI0DACALiwEAANMBADCMAQAAkgEAEI0BAADTAQAwjgEBAMUBACGRAUAAxgEAIZIBQADGAQAhowEQANQBACGkARAA1AEAIaUBAQDFAQAhpgEBAMUBACGnAQEAxQEAIQMAAAAPACABAACRAQAwJAAAkgEAIAMAAAAPACABAAAQADACAAARACALAwAA0AEAIAQAANEBACASAADSAQAgiwEAAM0BADCMAQAAmAEAEI0BAADNAQAwjgEBAAAAAZEBQADPAQAhkgFAAM8BACGeAQEAAAABnwEBAM4BACEBAAAAlQEAIAEAAACVAQAgCwMAANABACAEAADRAQAgEgAA0gEAIIsBAADNAQAwjAEAAJgBABCNAQAAzQEAMI4BAQDOAQAhkQFAAM8BACGSAUAAzwEAIZ4BAQDOAQAhnwEBAM4BACEDAwAAiAMAIAQAAIkDACASAACKAwAgAwAAAJgBACABAACZAQAwAgAAlQEAIAMAAACYAQAgAQAAmQEAMAIAAJUBACADAAAAmAEAIAEAAJkBADACAACVAQAgCAMAAIUDACAEAACGAwAgEgAAhwMAII4BAQAAAAGRAUAAAAABkgFAAAAAAZ4BAQAAAAGfAQEAAAABARgAAJ0BACAFjgEBAAAAAZEBQAAAAAGSAUAAAAABngEBAAAAAZ8BAQAAAAEBGAAAnwEAMAEYAACfAQAwCAMAAJYCACAEAACXAgAgEgAAmAIAII4BAQCPAgAhkQFAAJACACGSAUAAkAIAIZ4BAQCPAgAhnwEBAI8CACECAAAAlQEAIBgAAKIBACAFjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhngEBAI8CACGfAQEAjwIAIQIAAACYAQAgGAAApAEAIAIAAACYAQAgGAAApAEAIAMAAACVAQAgHwAAnQEAICAAAKIBACABAAAAlQEAIAEAAACYAQAgAwwAAJMCACAnAACVAgAgKAAAlAIAIAiLAQAAzAEAMIwBAACrAQAQjQEAAMwBADCOAQEAxQEAIZEBQADGAQAhkgFAAMYBACGeAQEAxQEAIZ8BAQDFAQAhAwAAAJgBACABAACqAQAwJAAAqwEAIAMAAACYAQAgAQAAmQEAMAIAAJUBACABAAAAIAAgAQAAACAAIAMAAAAeACABAAAfADACAAAgACADAAAAHgAgAQAAHwAwAgAAIAAgAwAAAB4AIAEAAB8AMAIAACAAIAYNAACSAgAgjgEBAAAAAY8BAQAAAAGQAQEAAAABkQFAAAAAAZIBQAAAAAEBGAAAswEAIAWOAQEAAAABjwEBAAAAAZABAQAAAAGRAUAAAAABkgFAAAAAAQEYAAC1AQAwARgAALUBADAGDQAAkQIAII4BAQCPAgAhjwEBAI8CACGQAQEAjwIAIZEBQACQAgAhkgFAAJACACECAAAAIAAgGAAAuAEAIAWOAQEAjwIAIY8BAQCPAgAhkAEBAI8CACGRAUAAkAIAIZIBQACQAgAhAgAAAB4AIBgAALoBACACAAAAHgAgGAAAugEAIAMAAAAgACAfAACzAQAgIAAAuAEAIAEAAAAgACABAAAAHgAgAwwAAIwCACAnAACOAgAgKAAAjQIAIAiLAQAAxAEAMIwBAADBAQAQjQEAAMQBADCOAQEAxQEAIY8BAQDFAQAhkAEBAMUBACGRAUAAxgEAIZIBQADGAQAhAwAAAB4AIAEAAMABADAkAADBAQAgAwAAAB4AIAEAAB8AMAIAACAAIAiLAQAAxAEAMIwBAADBAQAQjQEAAMQBADCOAQEAxQEAIY8BAQDFAQAhkAEBAMUBACGRAUAAxgEAIZIBQADGAQAhDgwAAMgBACAnAADLAQAgKAAAywEAIJMBAQAAAAGUAQEAAAAElQEBAAAABJYBAQAAAAGXAQEAAAABmAEBAAAAAZkBAQAAAAGaAQEAygEAIZsBAQAAAAGcAQEAAAABnQEBAAAAAQsMAADIAQAgJwAAyQEAICgAAMkBACCTAUAAAAABlAFAAAAABJUBQAAAAASWAUAAAAABlwFAAAAAAZgBQAAAAAGZAUAAAAABmgFAAMcBACELDAAAyAEAICcAAMkBACAoAADJAQAgkwFAAAAAAZQBQAAAAASVAUAAAAAElgFAAAAAAZcBQAAAAAGYAUAAAAABmQFAAAAAAZoBQADHAQAhCJMBAgAAAAGUAQIAAAAElQECAAAABJYBAgAAAAGXAQIAAAABmAECAAAAAZkBAgAAAAGaAQIAyAEAIQiTAUAAAAABlAFAAAAABJUBQAAAAASWAUAAAAABlwFAAAAAAZgBQAAAAAGZAUAAAAABmgFAAMkBACEODAAAyAEAICcAAMsBACAoAADLAQAgkwEBAAAAAZQBAQAAAASVAQEAAAAElgEBAAAAAZcBAQAAAAGYAQEAAAABmQEBAAAAAZoBAQDKAQAhmwEBAAAAAZwBAQAAAAGdAQEAAAABC5MBAQAAAAGUAQEAAAAElQEBAAAABJYBAQAAAAGXAQEAAAABmAEBAAAAAZkBAQAAAAGaAQEAywEAIZsBAQAAAAGcAQEAAAABnQEBAAAAAQiLAQAAzAEAMIwBAACrAQAQjQEAAMwBADCOAQEAxQEAIZEBQADGAQAhkgFAAMYBACGeAQEAxQEAIZ8BAQDFAQAhCwMAANABACAEAADRAQAgEgAA0gEAIIsBAADNAQAwjAEAAJgBABCNAQAAzQEAMI4BAQDOAQAhkQFAAM8BACGSAUAAzwEAIZ4BAQDOAQAhnwEBAM4BACELkwEBAAAAAZQBAQAAAASVAQEAAAAElgEBAAAAAZcBAQAAAAGYAQEAAAABmQEBAAAAAZoBAQDLAQAhmwEBAAAAAZwBAQAAAAGdAQEAAAABCJMBQAAAAAGUAUAAAAAElQFAAAAABJYBQAAAAAGXAUAAAAABmAFAAAAAAZkBQAAAAAGaAUAAyQEAIQOgAQAAAwAgoQEAAAMAIKIBAAADACADoAEAAAYAIKEBAAAGACCiAQAABgAgA6ABAAAeACChAQAAHgAgogEAAB4AIAuLAQAA0wEAMIwBAACSAQAQjQEAANMBADCOAQEAxQEAIZEBQADGAQAhkgFAAMYBACGjARAA1AEAIaQBEADUAQAhpQEBAMUBACGmAQEAxQEAIacBAQDFAQAhDQwAAMgBACAlAADWAQAgJgAA1gEAICcAANYBACAoAADWAQAgkwEQAAAAAZQBEAAAAASVARAAAAAElgEQAAAAAZcBEAAAAAGYARAAAAABmQEQAAAAAZoBEADVAQAhDQwAAMgBACAlAADWAQAgJgAA1gEAICcAANYBACAoAADWAQAgkwEQAAAAAZQBEAAAAASVARAAAAAElgEQAAAAAZcBEAAAAAGYARAAAAABmQEQAAAAAZoBEADVAQAhCJMBEAAAAAGUARAAAAAElQEQAAAABJYBEAAAAAGXARAAAAABmAEQAAAAAZkBEAAAAAGaARAA1gEAIQ6LAQAA1wEAMIwBAAB8ABCNAQAA1wEAMI4BAQDFAQAhkQFAAMYBACGSAUAAxgEAIaYBAQDFAQAhpwEBAMUBACGpAQAA2AGpASKrAQAA2QGrASKsARAA2gEAIa0BEADaAQAhrgECANsBACGvAQEAxQEAIQcMAADIAQAgJwAA5AEAICgAAOQBACCTAQAAAKkBApQBAAAAqQEIlQEAAACpAQiaAQAA4wGpASIHDAAAyAEAICcAAOIBACAoAADiAQAgkwEAAACrAQKUAQAAAKsBCJUBAAAAqwEImgEAAOEBqwEiDQwAAN0BACAlAADgAQAgJgAA4AEAICcAAOABACAoAADgAQAgkwEQAAAAAZQBEAAAAAWVARAAAAAFlgEQAAAAAZcBEAAAAAGYARAAAAABmQEQAAAAAZoBEADfAQAhDQwAAN0BACAlAADeAQAgJgAA3QEAICcAAN0BACAoAADdAQAgkwECAAAAAZQBAgAAAAWVAQIAAAAFlgECAAAAAZcBAgAAAAGYAQIAAAABmQECAAAAAZoBAgDcAQAhDQwAAN0BACAlAADeAQAgJgAA3QEAICcAAN0BACAoAADdAQAgkwECAAAAAZQBAgAAAAWVAQIAAAAFlgECAAAAAZcBAgAAAAGYAQIAAAABmQECAAAAAZoBAgDcAQAhCJMBAgAAAAGUAQIAAAAFlQECAAAABZYBAgAAAAGXAQIAAAABmAECAAAAAZkBAgAAAAGaAQIA3QEAIQiTAQgAAAABlAEIAAAABZUBCAAAAAWWAQgAAAABlwEIAAAAAZgBCAAAAAGZAQgAAAABmgEIAN4BACENDAAA3QEAICUAAOABACAmAADgAQAgJwAA4AEAICgAAOABACCTARAAAAABlAEQAAAABZUBEAAAAAWWARAAAAABlwEQAAAAAZgBEAAAAAGZARAAAAABmgEQAN8BACEIkwEQAAAAAZQBEAAAAAWVARAAAAAFlgEQAAAAAZcBEAAAAAGYARAAAAABmQEQAAAAAZoBEADgAQAhBwwAAMgBACAnAADiAQAgKAAA4gEAIJMBAAAAqwEClAEAAACrAQiVAQAAAKsBCJoBAADhAasBIgSTAQAAAKsBApQBAAAAqwEIlQEAAACrAQiaAQAA4gGrASIHDAAAyAEAICcAAOQBACAoAADkAQAgkwEAAACpAQKUAQAAAKkBCJUBAAAAqQEImgEAAOMBqQEiBJMBAAAAqQEClAEAAACpAQiVAQAAAKkBCJoBAADkAakBIg6LAQAA5QEAMIwBAABmABCNAQAA5QEAMI4BAQDFAQAhkAEBAMUBACGRAUAAxgEAIZIBQADGAQAhowEQANoBACGkARAA1AEAIacBAQDFAQAhsQEAAOYBsQEisgEQANQBACG0AQAA5wG0ASK2AQAA6AG2ASIHDAAAyAEAICcAAO4BACAoAADuAQAgkwEAAACxAQKUAQAAALEBCJUBAAAAsQEImgEAAO0BsQEiBwwAAMgBACAnAADsAQAgKAAA7AEAIJMBAAAAtAEClAEAAAC0AQiVAQAAALQBCJoBAADrAbQBIgcMAADIAQAgJwAA6gEAICgAAOoBACCTAQAAALYBApQBAAAAtgEIlQEAAAC2AQiaAQAA6QG2ASIHDAAAyAEAICcAAOoBACAoAADqAQAgkwEAAAC2AQKUAQAAALYBCJUBAAAAtgEImgEAAOkBtgEiBJMBAAAAtgEClAEAAAC2AQiVAQAAALYBCJoBAADqAbYBIgcMAADIAQAgJwAA7AEAICgAAOwBACCTAQAAALQBApQBAAAAtAEIlQEAAAC0AQiaAQAA6wG0ASIEkwEAAAC0AQKUAQAAALQBCJUBAAAAtAEImgEAAOwBtAEiBwwAAMgBACAnAADuAQAgKAAA7gEAIJMBAAAAsQEClAEAAACxAQiVAQAAALEBCJoBAADtAbEBIgSTAQAAALEBApQBAAAAsQEIlQEAAACxAQiaAQAA7gGxASIRiwEAAO8BADCMAQAAUAAQjQEAAO8BADCOAQEAxQEAIZEBQADGAQAhkgFAAMYBACG2AQAA8AG7ASK3AQEAxQEAIbgBAQDFAQAhuQEBAMUBACG7ARAA1AEAIbwBEADUAQAhvQEQANQBACG-AQIA8QEAIb8BAgDxAQAhwAEQANQBACHBARAA1AEAIQcMAADIAQAgJwAA9QEAICgAAPUBACCTAQAAALsBApQBAAAAuwEIlQEAAAC7AQiaAQAA9AG7ASINDAAAyAEAICUAAPMBACAmAADIAQAgJwAAyAEAICgAAMgBACCTAQIAAAABlAECAAAABJUBAgAAAASWAQIAAAABlwECAAAAAZgBAgAAAAGZAQIAAAABmgECAPIBACENDAAAyAEAICUAAPMBACAmAADIAQAgJwAAyAEAICgAAMgBACCTAQIAAAABlAECAAAABJUBAgAAAASWAQIAAAABlwECAAAAAZgBAgAAAAGZAQIAAAABmgECAPIBACEIkwEIAAAAAZQBCAAAAASVAQgAAAAElgEIAAAAAZcBCAAAAAGYAQgAAAABmQEIAAAAAZoBCADzAQAhBwwAAMgBACAnAAD1AQAgKAAA9QEAIJMBAAAAuwEClAEAAAC7AQiVAQAAALsBCJoBAAD0AbsBIgSTAQAAALsBApQBAAAAuwEIlQEAAAC7AQiaAQAA9QG7ASIUBAAA0QEAIAgAAPoBACALAAD7AQAgiwEAAPYBADCMAQAAPQAQjQEAAPYBADCOAQEAzgEAIZEBQADPAQAhkgFAAM8BACG2AQAA9wG7ASK3AQEAzgEAIbgBAQDOAQAhuQEBAM4BACG7ARAA-AEAIbwBEAD4AQAhvQEQAPgBACG-AQIA-QEAIb8BAgD5AQAhwAEQAPgBACHBARAA-AEAIQSTAQAAALsBApQBAAAAuwEIlQEAAAC7AQiaAQAA9QG7ASIIkwEQAAAAAZQBEAAAAASVARAAAAAElgEQAAAAAZcBEAAAAAGYARAAAAABmQEQAAAAAZoBEADWAQAhCJMBAgAAAAGUAQIAAAAElQECAAAABJYBAgAAAAGXAQIAAAABmAECAAAAAZkBAgAAAAGaAQIAyAEAIQOgAQAACwAgoQEAAAsAIKIBAAALACADoAEAAA8AIKEBAAAPACCiAQAADwAgC4sBAAD8AQAwjAEAADcAEI0BAAD8AQAwjgEBAMUBACGQAQEAxQEAIZEBQADGAQAhkgFAAMYBACHCAQEAxQEAIcMBEADUAQAhxAEQANQBACHFAQEAxQEAIQkNAAD-AQAgiwEAAP0BADCMAQAAHgAQjQEAAP0BADCOAQEAzgEAIY8BAQDOAQAhkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhDQMAANABACAEAADRAQAgEgAA0gEAIIsBAADNAQAwjAEAAJgBABCNAQAAzQEAMI4BAQDOAQAhkQFAAM8BACGSAUAAzwEAIZ4BAQDOAQAhnwEBAM4BACHGAQAAmAEAIMcBAACYAQAgDgUAAIECACAJAACAAgAgCgAAgAIAIIsBAAD_AQAwjAEAAA8AEI0BAAD_AQAwjgEBAM4BACGRAUAAzwEAIZIBQADPAQAhowEQAPgBACGkARAA-AEAIaUBAQDOAQAhpgEBAM4BACGnAQEAzgEAIRYFAACBAgAgDQAA_gEAIA4AAPoBACAPAAD6AQAgEAAA-wEAIBEAAPsBACCLAQAAhwIAMIwBAAAGABCNAQAAhwIAMI4BAQDOAQAhkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhowEQAIUCACGkARAA-AEAIacBAQDOAQAhsQEAAIgCsQEisgEQAPgBACG0AQAAiQK0ASK2AQAAigK2ASLGAQAABgAgxwEAAAYAIBYEAADRAQAgCAAA-gEAIAsAAPsBACCLAQAA9gEAMIwBAAA9ABCNAQAA9gEAMI4BAQDOAQAhkQFAAM8BACGSAUAAzwEAIbYBAAD3AbsBIrcBAQDOAQAhuAEBAM4BACG5AQEAzgEAIbsBEAD4AQAhvAEQAPgBACG9ARAA-AEAIb4BAgD5AQAhvwECAPkBACHAARAA-AEAIcEBEAD4AQAhxgEAAD0AIMcBAAA9ACARBQAAgQIAIAYAAIACACAHAACAAgAgiwEAAIICADCMAQAACwAQjQEAAIICADCOAQEAzgEAIZEBQADPAQAhkgFAAM8BACGmAQEAzgEAIacBAQDOAQAhqQEAAIMCqQEiqwEAAIQCqwEirAEQAIUCACGtARAAhQIAIa4BAgCGAgAhrwEBAM4BACEEkwEAAACpAQKUAQAAAKkBCJUBAAAAqQEImgEAAOQBqQEiBJMBAAAAqwEClAEAAACrAQiVAQAAAKsBCJoBAADiAasBIgiTARAAAAABlAEQAAAABZUBEAAAAAWWARAAAAABlwEQAAAAAZgBEAAAAAGZARAAAAABmgEQAOABACEIkwECAAAAAZQBAgAAAAWVAQIAAAAFlgECAAAAAZcBAgAAAAGYAQIAAAABmQECAAAAAZoBAgDdAQAhFAUAAIECACANAAD-AQAgDgAA-gEAIA8AAPoBACAQAAD7AQAgEQAA-wEAIIsBAACHAgAwjAEAAAYAEI0BAACHAgAwjgEBAM4BACGQAQEAzgEAIZEBQADPAQAhkgFAAM8BACGjARAAhQIAIaQBEAD4AQAhpwEBAM4BACGxAQAAiAKxASKyARAA-AEAIbQBAACJArQBIrYBAACKArYBIgSTAQAAALEBApQBAAAAsQEIlQEAAACxAQiaAQAA7gGxASIEkwEAAAC0AQKUAQAAALQBCJUBAAAAtAEImgEAAOwBtAEiBJMBAAAAtgEClAEAAAC2AQiVAQAAALYBCJoBAADqAbYBIgwNAAD-AQAgiwEAAIsCADCMAQAAAwAQjQEAAIsCADCOAQEAzgEAIZABAQDOAQAhkQFAAM8BACGSAUAAzwEAIcIBAQDOAQAhwwEQAPgBACHEARAA-AEAIcUBAQDOAQAhAAAAAcsBAQAAAAEBywFAAAAAAQUfAACIBAAgIAAAiwQAIMgBAACJBAAgyQEAAIoEACDOAQAAlQEAIAMfAACIBAAgyAEAAIkEACDOAQAAlQEAIAAAAAsfAAD5AgAwIAAA_gIAMMgBAAD6AgAwyQEAAPsCADDKAQAA_AIAIMsBAAD9AgAwzAEAAP0CADDNAQAA_QIAMM4BAAD9AgAwzwEAAP8CADDQAQAAgAMAMAsfAAClAgAwIAAAqgIAMMgBAACmAgAwyQEAAKcCADDKAQAAqAIAIMsBAACpAgAwzAEAAKkCADDNAQAAqQIAMM4BAACpAgAwzwEAAKsCADDQAQAArAIAMAsfAACZAgAwIAAAngIAMMgBAACaAgAwyQEAAJsCADDKAQAAnAIAIMsBAACdAgAwzAEAAJ0CADDNAQAAnQIAMM4BAACdAgAwzwEAAJ8CADDQAQAAoAIAMASOAQEAAAABjwEBAAAAAZEBQAAAAAGSAUAAAAABAgAAACAAIB8AAKQCACADAAAAIAAgHwAApAIAICAAAKMCACABGAAAhwQAMAkNAAD-AQAgiwEAAP0BADCMAQAAHgAQjQEAAP0BADCOAQEAAAABjwEBAAAAAZABAQDOAQAhkQFAAM8BACGSAUAAzwEAIQIAAAAgACAYAACjAgAgAgAAAKECACAYAACiAgAgCIsBAACgAgAwjAEAAKECABCNAQAAoAIAMI4BAQDOAQAhjwEBAM4BACGQAQEAzgEAIZEBQADPAQAhkgFAAM8BACEIiwEAAKACADCMAQAAoQIAEI0BAACgAgAwjgEBAM4BACGPAQEAzgEAIZABAQDOAQAhkQFAAM8BACGSAUAAzwEAIQSOAQEAjwIAIY8BAQCPAgAhkQFAAJACACGSAUAAkAIAIQSOAQEAjwIAIY8BAQCPAgAhkQFAAJACACGSAUAAkAIAIQSOAQEAAAABjwEBAAAAAZEBQAAAAAGSAUAAAAABDwUAAPQCACAOAAD1AgAgDwAA9gIAIBAAAPcCACARAAD4AgAgjgEBAAAAAZEBQAAAAAGSAUAAAAABowEQAAAAAaQBEAAAAAGnAQEAAAABsQEAAACxAQKyARAAAAABtAEAAAC0AQK2AQAAALYBAgIAAAAIACAfAADzAgAgAwAAAAgAIB8AAPMCACAgAAC0AgAgARgAAIYEADAUBQAAgQIAIA0AAP4BACAOAAD6AQAgDwAA-gEAIBAAAPsBACARAAD7AQAgiwEAAIcCADCMAQAABgAQjQEAAIcCADCOAQEAAAABkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhowEQAIUCACGkARAA-AEAIacBAQDOAQAhsQEAAIgCsQEisgEQAPgBACG0AQAAiQK0ASK2AQAAigK2ASICAAAACAAgGAAAtAIAIAIAAACtAgAgGAAArgIAIA6LAQAArAIAMIwBAACtAgAQjQEAAKwCADCOAQEAzgEAIZABAQDOAQAhkQFAAM8BACGSAUAAzwEAIaMBEACFAgAhpAEQAPgBACGnAQEAzgEAIbEBAACIArEBIrIBEAD4AQAhtAEAAIkCtAEitgEAAIoCtgEiDosBAACsAgAwjAEAAK0CABCNAQAArAIAMI4BAQDOAQAhkAEBAM4BACGRAUAAzwEAIZIBQADPAQAhowEQAIUCACGkARAA-AEAIacBAQDOAQAhsQEAAIgCsQEisgEQAPgBACG0AQAAiQK0ASK2AQAAigK2ASIKjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhowEQALACACGkARAAsQIAIacBAQCPAgAhsQEAAK8CsQEisgEQALECACG0AQAAsgK0ASK2AQAAswK2ASIBywEAAACxAQIFywEQAAAAAdEBEAAAAAHSARAAAAAB0wEQAAAAAdQBEAAAAAEFywEQAAAAAdEBEAAAAAHSARAAAAAB0wEQAAAAAdQBEAAAAAEBywEAAAC0AQIBywEAAAC2AQIPBQAAtQIAIA4AALYCACAPAAC3AgAgEAAAuAIAIBEAALkCACCOAQEAjwIAIZEBQACQAgAhkgFAAJACACGjARAAsAIAIaQBEACxAgAhpwEBAI8CACGxAQAArwKxASKyARAAsQIAIbQBAACyArQBIrYBAACzArYBIgUfAADfAwAgIAAAhAQAIMgBAADgAwAgyQEAAIMEACDOAQAAOgAgCx8AAOgCADAgAADsAgAwyAEAAOkCADDJAQAA6gIAMMoBAADrAgAgywEAANkCADDMAQAA2QIAMM0BAADZAgAwzgEAANkCADDPAQAA7QIAMNABAADcAgAwCx8AANUCADAgAADaAgAwyAEAANYCADDJAQAA1wIAMMoBAADYAgAgywEAANkCADDMAQAA2QIAMM0BAADZAgAwzgEAANkCADDPAQAA2wIAMNABAADcAgAwCx8AAMoCADAgAADOAgAwyAEAAMsCADDJAQAAzAIAMMoBAADNAgAgywEAAL4CADDMAQAAvgIAMM0BAAC-AgAwzgEAAL4CADDPAQAAzwIAMNABAADBAgAwCx8AALoCADAgAAC_AgAwyAEAALsCADDJAQAAvAIAMMoBAAC9AgAgywEAAL4CADDMAQAAvgIAMM0BAAC-AgAwzgEAAL4CADDPAQAAwAIAMNABAADBAgAwCQUAAMkCACAJAADIAgAgjgEBAAAAAZEBQAAAAAGSAUAAAAABowEQAAAAAaQBEAAAAAGlAQEAAAABpwEBAAAAAQIAAAARACAfAADHAgAgAwAAABEAIB8AAMcCACAgAADEAgAgARgAAIIEADAOBQAAgQIAIAkAAIACACAKAACAAgAgiwEAAP8BADCMAQAADwAQjQEAAP8BADCOAQEAAAABkQFAAM8BACGSAUAAzwEAIaMBEAD4AQAhpAEQAPgBACGlAQEAzgEAIaYBAQDOAQAhpwEBAM4BACECAAAAEQAgGAAAxAIAIAIAAADCAgAgGAAAwwIAIAuLAQAAwQIAMIwBAADCAgAQjQEAAMECADCOAQEAzgEAIZEBQADPAQAhkgFAAM8BACGjARAA-AEAIaQBEAD4AQAhpQEBAM4BACGmAQEAzgEAIacBAQDOAQAhC4sBAADBAgAwjAEAAMICABCNAQAAwQIAMI4BAQDOAQAhkQFAAM8BACGSAUAAzwEAIaMBEAD4AQAhpAEQAPgBACGlAQEAzgEAIaYBAQDOAQAhpwEBAM4BACEHjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhowEQALECACGkARAAsQIAIaUBAQCPAgAhpwEBAI8CACEJBQAAxgIAIAkAAMUCACCOAQEAjwIAIZEBQACQAgAhkgFAAJACACGjARAAsQIAIaQBEACxAgAhpQEBAI8CACGnAQEAjwIAIQUfAAD6AwAgIAAAgAQAIMgBAAD7AwAgyQEAAP8DACDOAQAACAAgBR8AAPgDACAgAAD9AwAgyAEAAPkDACDJAQAA_AMAIM4BAAA6ACAJBQAAyQIAIAkAAMgCACCOAQEAAAABkQFAAAAAAZIBQAAAAAGjARAAAAABpAEQAAAAAaUBAQAAAAGnAQEAAAABAx8AAPoDACDIAQAA-wMAIM4BAAAIACADHwAA-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-QIAMMgBAAD6AgAwygEAAPwCACDOAQAA_QIAMAQfAAClAgAwyAEAAKYCADDKAQAAqAIAIM4BAACpAgAwBB8AAJkCADDIAQAAmgIAMMoBAACcAgAgzgEAAJ0CADAAAAAAAAAAAAAAAAAAAAAAAAAABR8AANkDACAgAADcAwAgyAEAANoDACDJAQAA2wMAIM4BAACVAQAgAx8AANkDACDIAQAA2gMAIM4BAACVAQAgAAAAAAABywEAAAC7AQIFywECAAAAAdEBAgAAAAHSAQIAAAAB0wECAAAAAdQBAgAAAAELHwAAuQMAMCAAAL0DADDIAQAAugMAMMkBAAC7AwAwygEAALwDACDLAQAAqQIAMMwBAACpAgAwzQEAAKkCADDOAQAAqQIAMM8BAAC-AwAw0AEAAKwCADALHwAAsAMAMCAAALQDADDIAQAAsQMAMMkBAACyAwAwygEAALMDACDLAQAA2QIAMMwBAADZAgAwzQEAANkCADDOAQAA2QIAMM8BAAC1AwAw0AEAANwCADALHwAApwMAMCAAAKsDADDIAQAAqAMAMMkBAACpAwAwygEAAKoDACDLAQAAvgIAMMwBAAC-AgAwzQEAAL4CADDOAQAAvgIAMM8BAACsAwAw0AEAAMECADAJCQAAyAIAIAoAANQCACCOAQEAAAABkQFAAAAAAZIBQAAAAAGjARAAAAABpAEQAAAAAaUBAQAAAAGmAQEAAAABAgAAABEAIB8AAK8DACADAAAAEQAgHwAArwMAICAAAK4DACABGAAA2AMAMAIAAAARACAYAACuAwAgAgAAAMICACAYAACtAwAgB44BAQCPAgAhkQFAAJACACGSAUAAkAIAIaMBEACxAgAhpAEQALECACGlAQEAjwIAIaYBAQCPAgAhCQkAAMUCACAKAADSAgAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhowEQALECACGkARAAsQIAIaUBAQCPAgAhpgEBAI8CACEJCQAAyAIAIAoAANQCACCOAQEAAAABkQFAAAAAAZIBQAAAAAGjARAAAAABpAEQAAAAAaUBAQAAAAGmAQEAAAABDAYAAOcCACAHAADyAgAgjgEBAAAAAZEBQAAAAAGSAUAAAAABpgEBAAAAAakBAAAAqQECqwEAAACrAQKsARAAAAABrQEQAAAAAa4BAgAAAAGvAQEAAAABAgAAAA0AIB8AALgDACADAAAADQAgHwAAuAMAICAAALcDACABGAAA1wMAMAIAAAANACAYAAC3AwAgAgAAAN0CACAYAAC2AwAgCo4BAQCPAgAhkQFAAJACACGSAUAAkAIAIaYBAQCPAgAhqQEAAN8CqQEiqwEAAOACqwEirAEQALACACGtARAAsAIAIa4BAgDhAgAhrwEBAI8CACEMBgAA5AIAIAcAAPACACCOAQEAjwIAIZEBQACQAgAhkgFAAJACACGmAQEAjwIAIakBAADfAqkBIqsBAADgAqsBIqwBEACwAgAhrQEQALACACGuAQIA4QIAIa8BAQCPAgAhDAYAAOcCACAHAADyAgAgjgEBAAAAAZEBQAAAAAGSAUAAAAABpgEBAAAAAakBAAAAqQECqwEAAACrAQKsARAAAAABrQEQAAAAAa4BAgAAAAGvAQEAAAABDw0AAJwDACAOAAD1AgAgDwAA9gIAIBAAAPcCACARAAD4AgAgjgEBAAAAAZABAQAAAAGRAUAAAAABkgFAAAAAAaMBEAAAAAGkARAAAAABsQEAAACxAQKyARAAAAABtAEAAAC0AQK2AQAAALYBAgIAAAAIACAfAADBAwAgAwAAAAgAIB8AAMEDACAgAADAAwAgARgAANYDADACAAAACAAgGAAAwAMAIAIAAACtAgAgGAAAvwMAIAqOAQEAjwIAIZABAQCPAgAhkQFAAJACACGSAUAAkAIAIaMBEACwAgAhpAEQALECACGxAQAArwKxASKyARAAsQIAIbQBAACyArQBIrYBAACzArYBIg8NAACbAwAgDgAAtgIAIA8AALcCACAQAAC4AgAgEQAAuQIAII4BAQCPAgAhkAEBAI8CACGRAUAAkAIAIZIBQACQAgAhowEQALACACGkARAAsQIAIbEBAACvArEBIrIBEACxAgAhtAEAALICtAEitgEAALMCtgEiDw0AAJwDACAOAAD1AgAgDwAA9gIAIBAAAPcCACARAAD4AgAgjgEBAAAAAZABAQAAAAGRAUAAAAABkgFAAAAAAaMBEAAAAAGkARAAAAABsQEAAACxAQKyARAAAAABtAEAAAC0AQK2AQAAALYBAgQfAAC5AwAwyAEAALoDADDKAQAAvAMAIM4BAACpAgAwBB8AALADADDIAQAAsQMAMMoBAACzAwAgzgEAANkCADAEHwAApwMAMMgBAACoAwAwygEAAKoDACDOAQAAvgIAMAAAAAAAAAAFHwAA0QMAICAAANQDACDIAQAA0gMAIMkBAADTAwAgzgEAAJUBACADHwAA0QMAIMgBAADSAwAgzgEAAJUBACADAwAAiAMAIAQAAIkDACASAACKAwAgBwUAANADACANAADOAwAgDgAAxQMAIA8AAMUDACAQAADGAwAgEQAAxgMAIKMBAACQAwAgAwQAAIkDACAIAADFAwAgCwAAxgMAIAcEAACGAwAgEgAAhwMAII4BAQAAAAGRAUAAAAABkgFAAAAAAZ4BAQAAAAGfAQEAAAABAgAAAJUBACAfAADRAwAgAwAAAJgBACAfAADRAwAgIAAA1QMAIAkAAACYAQAgBAAAlwIAIBIAAJgCACAYAADVAwAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhngEBAI8CACGfAQEAjwIAIQcEAACXAgAgEgAAmAIAII4BAQCPAgAhkQFAAJACACGSAUAAkAIAIZ4BAQCPAgAhnwEBAI8CACEKjgEBAAAAAZABAQAAAAGRAUAAAAABkgFAAAAAAaMBEAAAAAGkARAAAAABsQEAAACxAQKyARAAAAABtAEAAAC0AQK2AQAAALYBAgqOAQEAAAABkQFAAAAAAZIBQAAAAAGmAQEAAAABqQEAAACpAQKrAQAAAKsBAqwBEAAAAAGtARAAAAABrgECAAAAAa8BAQAAAAEHjgEBAAAAAZEBQAAAAAGSAUAAAAABowEQAAAAAaQBEAAAAAGlAQEAAAABpgEBAAAAAQcDAACFAwAgEgAAhwMAII4BAQAAAAGRAUAAAAABkgFAAAAAAZ4BAQAAAAGfAQEAAAABAgAAAJUBACAfAADZAwAgAwAAAJgBACAfAADZAwAgIAAA3QMAIAkAAACYAQAgAwAAlgIAIBIAAJgCACAYAADdAwAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhngEBAI8CACGfAQEAjwIAIQcDAACWAgAgEgAAmAIAII4BAQCPAgAhkQFAAJACACGSAUAAkAIAIZ4BAQCPAgAhnwEBAI8CACEHjgEBAAAAAZEBQAAAAAGSAUAAAAABwgEBAAAAAcMBEAAAAAHEARAAAAABxQEBAAAAARAIAADDAwAgCwAAxAMAII4BAQAAAAGRAUAAAAABkgFAAAAAAbYBAAAAuwECtwEBAAAAAbgBAQAAAAG5AQEAAAABuwEQAAAAAbwBEAAAAAG9ARAAAAABvgECAAAAAb8BAgAAAAHAARAAAAABwQEQAAAAAQIAAAA6ACAfAADfAwAgEAUAAPQCACANAACcAwAgDgAA9QIAIBAAAPcCACARAAD4AgAgjgEBAAAAAZABAQAAAAGRAUAAAAABkgFAAAAAAaMBEAAAAAGkARAAAAABpwEBAAAAAbEBAAAAsQECsgEQAAAAAbQBAAAAtAECtgEAAAC2AQICAAAACAAgHwAA4QMAIAMAAAAGACAfAADhAwAgIAAA5QMAIBIAAAAGACAFAAC1AgAgDQAAmwMAIA4AALYCACAQAAC4AgAgEQAAuQIAIBgAAOUDACCOAQEAjwIAIZABAQCPAgAhkQFAAJACACGSAUAAkAIAIaMBEACwAgAhpAEQALECACGnAQEAjwIAIbEBAACvArEBIrIBEACxAgAhtAEAALICtAEitgEAALMCtgEiEAUAALUCACANAACbAwAgDgAAtgIAIBAAALgCACARAAC5AgAgjgEBAI8CACGQAQEAjwIAIZEBQACQAgAhkgFAAJACACGjARAAsAIAIaQBEACxAgAhpwEBAI8CACGxAQAArwKxASKyARAAsQIAIbQBAACyArQBIrYBAACzArYBIgqOAQEAAAABkQFAAAAAAZIBQAAAAAGmAQEAAAABpwEBAAAAAakBAAAAqQECqwEAAACrAQKsARAAAAABrQEQAAAAAa4BAgAAAAEQBQAA9AIAIA0AAJwDACAPAAD2AgAgEAAA9wIAIBEAAPgCACCOAQEAAAABkAEBAAAAAZEBQAAAAAGSAUAAAAABowEQAAAAAaQBEAAAAAGnAQEAAAABsQEAAACxAQKyARAAAAABtAEAAAC0AQK2AQAAALYBAgIAAAAIACAfAADnAwAgEAQAAMIDACALAADEAwAgjgEBAAAAAZEBQAAAAAGSAUAAAAABtgEAAAC7AQK3AQEAAAABuAEBAAAAAbkBAQAAAAG7ARAAAAABvAEQAAAAAb0BEAAAAAG-AQIAAAABvwECAAAAAcABEAAAAAHBARAAAAABAgAAADoAIB8AAOkDACADAAAABgAgHwAA5wMAICAAAO0DACASAAAABgAgBQAAtQIAIA0AAJsDACAPAAC3AgAgEAAAuAIAIBEAALkCACAYAADtAwAgjgEBAI8CACGQAQEAjwIAIZEBQACQAgAhkgFAAJACACGjARAAsAIAIaQBEACxAgAhpwEBAI8CACGxAQAArwKxASKyARAAsQIAIbQBAACyArQBIrYBAACzArYBIhAFAAC1AgAgDQAAmwMAIA8AALcCACAQAAC4AgAgEQAAuQIAII4BAQCPAgAhkAEBAI8CACGRAUAAkAIAIZIBQACQAgAhowEQALACACGkARAAsQIAIacBAQCPAgAhsQEAAK8CsQEisgEQALECACG0AQAAsgK0ASK2AQAAswK2ASIDAAAAPQAgHwAA6QMAICAAAPADACASAAAAPQAgBAAApAMAIAsAAKYDACAYAADwAwAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhtgEAAKIDuwEitwEBAI8CACG4AQEAjwIAIbkBAQCPAgAhuwEQALECACG8ARAAsQIAIb0BEACxAgAhvgECAKMDACG_AQIAowMAIcABEACxAgAhwQEQALECACEQBAAApAMAIAsAAKYDACCOAQEAjwIAIZEBQACQAgAhkgFAAJACACG2AQAAogO7ASK3AQEAjwIAIbgBAQCPAgAhuQEBAI8CACG7ARAAsQIAIbwBEACxAgAhvQEQALECACG-AQIAowMAIb8BAgCjAwAhwAEQALECACHBARAAsQIAIQqOAQEAAAABkQFAAAAAAZIBQAAAAAGnAQEAAAABqQEAAACpAQKrAQAAAKsBAqwBEAAAAAGtARAAAAABrgECAAAAAa8BAQAAAAEQBQAA9AIAIA0AAJwDACAOAAD1AgAgDwAA9gIAIBAAAPcCACCOAQEAAAABkAEBAAAAAZEBQAAAAAGSAUAAAAABowEQAAAAAaQBEAAAAAGnAQEAAAABsQEAAACxAQKyARAAAAABtAEAAAC0AQK2AQAAALYBAgIAAAAIACAfAADyAwAgAwAAAAYAIB8AAPIDACAgAAD2AwAgEgAAAAYAIAUAALUCACANAACbAwAgDgAAtgIAIA8AALcCACAQAAC4AgAgGAAA9gMAII4BAQCPAgAhkAEBAI8CACGRAUAAkAIAIZIBQACQAgAhowEQALACACGkARAAsQIAIacBAQCPAgAhsQEAAK8CsQEisgEQALECACG0AQAAsgK0ASK2AQAAswK2ASIQBQAAtQIAIA0AAJsDACAOAAC2AgAgDwAAtwIAIBAAALgCACCOAQEAjwIAIZABAQCPAgAhkQFAAJACACGSAUAAkAIAIaMBEACwAgAhpAEQALECACGnAQEAjwIAIbEBAACvArEBIrIBEACxAgAhtAEAALICtAEitgEAALMCtgEiB44BAQAAAAGRAUAAAAABkgFAAAAAAaMBEAAAAAGkARAAAAABpgEBAAAAAacBAQAAAAEQBAAAwgMAIAgAAMMDACCOAQEAAAABkQFAAAAAAZIBQAAAAAG2AQAAALsBArcBAQAAAAG4AQEAAAABuQEBAAAAAbsBEAAAAAG8ARAAAAABvQEQAAAAAb4BAgAAAAG_AQIAAAABwAEQAAAAAcEBEAAAAAECAAAAOgAgHwAA-AMAIBAFAAD0AgAgDQAAnAMAIA4AAPUCACAPAAD2AgAgEQAA-AIAII4BAQAAAAGQAQEAAAABkQFAAAAAAZIBQAAAAAGjARAAAAABpAEQAAAAAacBAQAAAAGxAQAAALEBArIBEAAAAAG0AQAAALQBArYBAAAAtgECAgAAAAgAIB8AAPoDACADAAAAPQAgHwAA-AMAICAAAP4DACASAAAAPQAgBAAApAMAIAgAAKUDACAYAAD-AwAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhtgEAAKIDuwEitwEBAI8CACG4AQEAjwIAIbkBAQCPAgAhuwEQALECACG8ARAAsQIAIb0BEACxAgAhvgECAKMDACG_AQIAowMAIcABEACxAgAhwQEQALECACEQBAAApAMAIAgAAKUDACCOAQEAjwIAIZEBQACQAgAhkgFAAJACACG2AQAAogO7ASK3AQEAjwIAIbgBAQCPAgAhuQEBAI8CACG7ARAAsQIAIbwBEACxAgAhvQEQALECACG-AQIAowMAIb8BAgCjAwAhwAEQALECACHBARAAsQIAIQMAAAAGACAfAAD6AwAgIAAAgQQAIBIAAAAGACAFAAC1AgAgDQAAmwMAIA4AALYCACAPAAC3AgAgEQAAuQIAIBgAAIEEACCOAQEAjwIAIZABAQCPAgAhkQFAAJACACGSAUAAkAIAIaMBEACwAgAhpAEQALECACGnAQEAjwIAIbEBAACvArEBIrIBEACxAgAhtAEAALICtAEitgEAALMCtgEiEAUAALUCACANAACbAwAgDgAAtgIAIA8AALcCACARAAC5AgAgjgEBAI8CACGQAQEAjwIAIZEBQACQAgAhkgFAAJACACGjARAAsAIAIaQBEACxAgAhpwEBAI8CACGxAQAArwKxASKyARAAsQIAIbQBAACyArQBIrYBAACzArYBIgeOAQEAAAABkQFAAAAAAZIBQAAAAAGjARAAAAABpAEQAAAAAaUBAQAAAAGnAQEAAAABAwAAAD0AIB8AAN8DACAgAACFBAAgEgAAAD0AIAgAAKUDACALAACmAwAgGAAAhQQAII4BAQCPAgAhkQFAAJACACGSAUAAkAIAIbYBAACiA7sBIrcBAQCPAgAhuAEBAI8CACG5AQEAjwIAIbsBEACxAgAhvAEQALECACG9ARAAsQIAIb4BAgCjAwAhvwECAKMDACHAARAAsQIAIcEBEACxAgAhEAgAAKUDACALAACmAwAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhtgEAAKIDuwEitwEBAI8CACG4AQEAjwIAIbkBAQCPAgAhuwEQALECACG8ARAAsQIAIb0BEACxAgAhvgECAKMDACG_AQIAowMAIcABEACxAgAhwQEQALECACEKjgEBAAAAAZEBQAAAAAGSAUAAAAABowEQAAAAAaQBEAAAAAGnAQEAAAABsQEAAACxAQKyARAAAAABtAEAAAC0AQK2AQAAALYBAgSOAQEAAAABjwEBAAAAAZEBQAAAAAGSAUAAAAABBwMAAIUDACAEAACGAwAgjgEBAAAAAZEBQAAAAAGSAUAAAAABngEBAAAAAZ8BAQAAAAECAAAAlQEAIB8AAIgEACADAAAAmAEAIB8AAIgEACAgAACMBAAgCQAAAJgBACADAACWAgAgBAAAlwIAIBgAAIwEACCOAQEAjwIAIZEBQACQAgAhkgFAAJACACGeAQEAjwIAIZ8BAQCPAgAhBwMAAJYCACAEAACXAgAgjgEBAI8CACGRAUAAkAIAIZIBQACQAgAhngEBAI8CACGfAQEAjwIAIQENAAIEAwUBBAkDDAAKEiEJBwUABAwACA0AAg4WBQ8XBRAYBhEZBgQECgMIDgULEgYMAAcDBQAEBgADBwADAwUABAkAAwoAAwMEEwAIFAALFQAEDhoADxsAEBwAER0AAQ0AAgMDIgAEIwASJAAAAQ0AAgENAAIFDAAPJQAQJgARJwASKAATAAAAAAAFDAAPJQAQJgARJwASKAATAAAFDAAYJQAZJgAaJwAbKAAcAAAAAAAFDAAYJQAZJgAaJwAbKAAcAgUABA0AAgIFAAQNAAIFDAAhJQAiJgAjJwAkKAAlAAAAAAAFDAAhJQAiJgAjJwAkKAAlAwUABAYAAwcAAwMFAAQGAAMHAAMFDAAqJQArJgAsJwAtKAAuAAAAAAAFDAAqJQArJgAsJwAtKAAuAwUABAkAAwoAAwMFAAQJAAMKAAMFDAAzJQA0JgA1JwA2KAA3AAAAAAAFDAAzJQA0JgA1JwA2KAA3AAADDAA8JwA9KAA-AAAAAwwAPCcAPSgAPgENAAIBDQACAwwAQycARCgARQAAAAMMAEMnAEQoAEUTAgEUJQEVJgEWJwEXKAEZKgEaLAsbLQwcLwEdMQseMg0hMwEiNAEjNQspOA4qORQrOwQsPAQtPwQuQAQvQQQwQwQxRQsyRhUzSAQ0Sgs1SxY2TAQ3TQQ4Tgs5URc6Uh07UwM8VAM9VQM-VgM_VwNAWQNBWwtCXB5DXgNEYAtFYR9GYgNHYwNIZAtJZyBKaCZLaQVMagVNawVObAVPbQVQbwVRcQtScidTdAVUdgtVdyhWeAVXeQVYegtZfSlafi9bfwZcgAEGXYEBBl6CAQZfgwEGYIUBBmGHAQtiiAEwY4oBBmSMAQtljQExZo4BBmePAQZokAELaZMBMmqUAThrlgECbJcBAm2aAQJumwECb5wBAnCeAQJxoAELcqEBOXOjAQJ0pQELdaYBOnanAQJ3qAECeKkBC3msATt6rQE_e64BCXyvAQl9sAEJfrEBCX-yAQmAAbQBCYEBtgELggG3AUCDAbkBCYQBuwELhQG8AUGGAb0BCYcBvgEJiAG_AQuJAcIBQooBwwFG"
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
