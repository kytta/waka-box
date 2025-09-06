"use strict";

var require$$0 = require("fs");
var require$$1$1 = require("path");
var require$$2$1 = require("os");
var require$$3 = require("crypto");
var require$$1$3 = require("http");
var require$$2$2 = require("https");
var require$$0$2 = require("url");
var require$$3$1 = require("assert");
var require$$4$1 = require("stream");
var require$$0$1 = require("tty");
var require$$1$2 = require("util");
var require$$8 = require("zlib");

function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default")
    ? x["default"]
    : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, "__esModule")) return n;
  var f = n.default;
  if (typeof f == "function") {
    var a = function a() {
      var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch {}
      if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
      }
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function (k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(
      a,
      k,
      d.get
        ? d
        : {
            enumerable: true,
            get: function () {
              return n[k];
            },
          },
    );
  });
  return a;
}

var wakaBoxBFYV4s = {};

var main = { exports: {} };

var version$1 = "17.2.2";
var require$$4 = {
  version: version$1,
};

var hasRequiredMain;

function requireMain() {
  if (hasRequiredMain) return main.exports;
  hasRequiredMain = 1;
  const fs = require$$0;
  const path = require$$1$1;
  const os = require$$2$1;
  const crypto = require$$3;
  const packageJson = require$$4;

  const version = packageJson.version;

  // Array of tips to display randomly
  const TIPS = [
    "🔐 encrypt with Dotenvx: https://dotenvx.com",
    "🔐 prevent committing .env to code: https://dotenvx.com/precommit",
    "🔐 prevent building .env in docker: https://dotenvx.com/prebuild",
    "📡 observe env with Radar: https://dotenvx.com/radar",
    "📡 auto-backup env with Radar: https://dotenvx.com/radar",
    "📡 version env with Radar: https://dotenvx.com/radar",
    "🛠️  run anywhere with `dotenvx run -- yourcommand`",
    "⚙️  specify custom .env file path with { path: '/custom/path/.env' }",
    "⚙️  enable debug logging with { debug: true }",
    "⚙️  override existing env vars with { override: true }",
    "⚙️  suppress all logs with { quiet: true }",
    "⚙️  write to custom object with { processEnv: myObject }",
    "⚙️  load multiple .env files with { path: ['.env.local', '.env'] }",
  ];

  // Get a random tip from the tips array
  function _getRandomTip() {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }

  function parseBoolean(value) {
    if (typeof value === "string") {
      return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
    }
    return Boolean(value);
  }

  function supportsAnsi() {
    return process.stdout.isTTY; // && process.env.TERM !== 'dumb'
  }

  function dim(text) {
    return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text;
  }

  const LINE =
    /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;

  // Parse src into an Object
  function parse(src) {
    const obj = {};

    // Convert buffer to string
    let lines = src.toString();

    // Convert line breaks to same format
    lines = lines.replace(/\r\n?/gm, "\n");

    let match;
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1];

      // Default undefined or null to empty string
      let value = match[2] || "";

      // Remove whitespace
      value = value.trim();

      // Check if double quoted
      const maybeQuote = value[0];

      // Remove surrounding quotes
      value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");

      // Expand newlines if double quoted
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, "\n");
        value = value.replace(/\\r/g, "\r");
      }

      // Add to object
      obj[key] = value;
    }

    return obj;
  }

  function _parseVault(options) {
    options = options || {};

    const vaultPath = _vaultPath(options);
    options.path = vaultPath; // parse .env.vault
    const result = DotenvModule.configDotenv(options);
    if (!result.parsed) {
      const err = new Error(
        `MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`,
      );
      err.code = "MISSING_DATA";
      throw err;
    }

    // handle scenario for comma separated keys - for use with key rotation
    // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
    const keys = _dotenvKey(options).split(",");
    const length = keys.length;

    let decrypted;
    for (let i = 0; i < length; i++) {
      try {
        // Get full key
        const key = keys[i].trim();

        // Get instructions for decrypt
        const attrs = _instructions(result, key);

        // Decrypt
        decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);

        break;
      } catch (error) {
        // last key
        if (i + 1 >= length) {
          throw error;
        }
        // try next key
      }
    }

    // Parse decrypted .env string
    return DotenvModule.parse(decrypted);
  }

  function _warn(message) {
    console.error(`[dotenv@${version}][WARN] ${message}`);
  }

  function _debug(message) {
    console.log(`[dotenv@${version}][DEBUG] ${message}`);
  }

  function _log(message) {
    console.log(`[dotenv@${version}] ${message}`);
  }

  function _dotenvKey(options) {
    // prioritize developer directly setting options.DOTENV_KEY
    if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
      return options.DOTENV_KEY;
    }

    // secondary infra already contains a DOTENV_KEY environment variable
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
      return process.env.DOTENV_KEY;
    }

    // fallback to empty string
    return "";
  }

  function _instructions(result, dotenvKey) {
    // Parse DOTENV_KEY. Format is a URI
    let uri;
    try {
      uri = new URL(dotenvKey);
    } catch (error) {
      if (error.code === "ERR_INVALID_URL") {
        const err = new Error(
          "INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development",
        );
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }

      throw error;
    }

    // Get decrypt key
    const key = uri.password;
    if (!key) {
      const err = new Error("INVALID_DOTENV_KEY: Missing key part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }

    // Get environment
    const environment = uri.searchParams.get("environment");
    if (!environment) {
      const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }

    // Get ciphertext payload
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
    const ciphertext = result.parsed[environmentKey]; // DOTENV_VAULT_PRODUCTION
    if (!ciphertext) {
      const err = new Error(
        `NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`,
      );
      err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
      throw err;
    }

    return { ciphertext, key };
  }

  function _vaultPath(options) {
    let possibleVaultPath = null;

    if (options && options.path && options.path.length > 0) {
      if (Array.isArray(options.path)) {
        for (const filepath of options.path) {
          if (fs.existsSync(filepath)) {
            possibleVaultPath = filepath.endsWith(".vault")
              ? filepath
              : `${filepath}.vault`;
          }
        }
      } else {
        possibleVaultPath = options.path.endsWith(".vault")
          ? options.path
          : `${options.path}.vault`;
      }
    } else {
      possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
    }

    if (fs.existsSync(possibleVaultPath)) {
      return possibleVaultPath;
    }

    return null;
  }

  function _resolveHome(envPath) {
    return envPath[0] === "~"
      ? path.join(os.homedir(), envPath.slice(1))
      : envPath;
  }

  function _configVault(options) {
    const debug = parseBoolean(
      process.env.DOTENV_CONFIG_DEBUG || (options && options.debug),
    );
    const quiet = parseBoolean(
      process.env.DOTENV_CONFIG_QUIET || (options && options.quiet),
    );

    if (debug || !quiet) {
      _log("Loading env from encrypted .env.vault");
    }

    const parsed = DotenvModule._parseVault(options);

    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }

    DotenvModule.populate(processEnv, parsed, options);

    return { parsed };
  }

  function configDotenv(options) {
    const dotenvPath = path.resolve(process.cwd(), ".env");
    let encoding = "utf8";
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    let debug = parseBoolean(
      processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug),
    );
    let quiet = parseBoolean(
      processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet),
    );

    if (options && options.encoding) {
      encoding = options.encoding;
    } else {
      if (debug) {
        _debug("No encoding is specified. UTF-8 is used by default");
      }
    }

    let optionPaths = [dotenvPath]; // default, look for .env
    if (options && options.path) {
      if (!Array.isArray(options.path)) {
        optionPaths = [_resolveHome(options.path)];
      } else {
        optionPaths = []; // reset default
        for (const filepath of options.path) {
          optionPaths.push(_resolveHome(filepath));
        }
      }
    }

    // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
    // parsed data, we will combine it with process.env (or options.processEnv if provided).
    let lastError;
    const parsedAll = {};
    for (const path of optionPaths) {
      try {
        // Specifying an encoding returns a string instead of a buffer
        const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }));

        DotenvModule.populate(parsedAll, parsed, options);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${path} ${e.message}`);
        }
        lastError = e;
      }
    }

    const populated = DotenvModule.populate(processEnv, parsedAll, options);

    // handle user settings DOTENV_CONFIG_ options inside .env file(s)
    debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
    quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);

    if (debug || !quiet) {
      const keysCount = Object.keys(populated).length;
      const shortPaths = [];
      for (const filePath of optionPaths) {
        try {
          const relative = path.relative(process.cwd(), filePath);
          shortPaths.push(relative);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${filePath} ${e.message}`);
          }
          lastError = e;
        }
      }

      _log(
        `injecting env (${keysCount}) from ${shortPaths.join(",")} ${dim(`-- tip: ${_getRandomTip()}`)}`,
      );
    }

    if (lastError) {
      return { parsed: parsedAll, error: lastError };
    } else {
      return { parsed: parsedAll };
    }
  }

  // Populates process.env from .env file
  function config(options) {
    // fallback to original dotenv if DOTENV_KEY is not set
    if (_dotenvKey(options).length === 0) {
      return DotenvModule.configDotenv(options);
    }

    const vaultPath = _vaultPath(options);

    // dotenvKey exists but .env.vault file does not exist
    if (!vaultPath) {
      _warn(
        `You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`,
      );

      return DotenvModule.configDotenv(options);
    }

    return DotenvModule._configVault(options);
  }

  function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), "hex");
    let ciphertext = Buffer.from(encrypted, "base64");

    const nonce = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(-16);
    ciphertext = ciphertext.subarray(12, -16);

    try {
      const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
      aesgcm.setAuthTag(authTag);
      return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
    } catch (error) {
      const isRange = error instanceof RangeError;
      const invalidKeyLength = error.message === "Invalid key length";
      const decryptionFailed =
        error.message === "Unsupported state or unable to authenticate data";

      if (isRange || invalidKeyLength) {
        const err = new Error(
          "INVALID_DOTENV_KEY: It must be 64 characters long (or more)",
        );
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      } else if (decryptionFailed) {
        const err = new Error(
          "DECRYPTION_FAILED: Please check your DOTENV_KEY",
        );
        err.code = "DECRYPTION_FAILED";
        throw err;
      } else {
        throw error;
      }
    }
  }

  // Populate process.env with parsed values
  function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options && options.debug);
    const override = Boolean(options && options.override);
    const populated = {};

    if (typeof parsed !== "object") {
      const err = new Error(
        "OBJECT_REQUIRED: Please check the processEnv argument being passed to populate",
      );
      err.code = "OBJECT_REQUIRED";
      throw err;
    }

    // Set process.env
    for (const key of Object.keys(parsed)) {
      if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
        if (override === true) {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }

        if (debug) {
          if (override === true) {
            _debug(`"${key}" is already defined and WAS overwritten`);
          } else {
            _debug(`"${key}" is already defined and was NOT overwritten`);
          }
        }
      } else {
        processEnv[key] = parsed[key];
        populated[key] = parsed[key];
      }
    }

    return populated;
  }

  const DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate,
  };

  main.exports.configDotenv = DotenvModule.configDotenv;
  main.exports._configVault = DotenvModule._configVault;
  main.exports._parseVault = DotenvModule._parseVault;
  main.exports.config = DotenvModule.config;
  main.exports.decrypt = DotenvModule.decrypt;
  main.exports.parse = DotenvModule.parse;
  main.exports.populate = DotenvModule.populate;

  main.exports = DotenvModule;
  return main.exports;
}

var axios$1 = { exports: {} };

var bind;
var hasRequiredBind;

function requireBind() {
  if (hasRequiredBind) return bind;
  hasRequiredBind = 1;

  bind = function bind(fn, thisArg) {
    return function wrap() {
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      return fn.apply(thisArg, args);
    };
  };
  return bind;
}

var utils;
var hasRequiredUtils;

function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;

  var bind = requireBind();

  /*global toString:true*/

  // utils is a library of generic helper functions non-specific to axios

  var toString = Object.prototype.toString;

  /**
   * Determine if a value is an Array
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Array, otherwise false
   */
  function isArray(val) {
    return toString.call(val) === "[object Array]";
  }

  /**
   * Determine if a value is undefined
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if the value is undefined, otherwise false
   */
  function isUndefined(val) {
    return typeof val === "undefined";
  }

  /**
   * Determine if a value is a Buffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Buffer, otherwise false
   */
  function isBuffer(val) {
    return (
      val !== null &&
      !isUndefined(val) &&
      val.constructor !== null &&
      !isUndefined(val.constructor) &&
      typeof val.constructor.isBuffer === "function" &&
      val.constructor.isBuffer(val)
    );
  }

  /**
   * Determine if a value is an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an ArrayBuffer, otherwise false
   */
  function isArrayBuffer(val) {
    return toString.call(val) === "[object ArrayBuffer]";
  }

  /**
   * Determine if a value is a FormData
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an FormData, otherwise false
   */
  function isFormData(val) {
    return typeof FormData !== "undefined" && val instanceof FormData;
  }

  /**
   * Determine if a value is a view on an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
   */
  function isArrayBufferView(val) {
    var result;
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
      result = ArrayBuffer.isView(val);
    } else {
      result = val && val.buffer && val.buffer instanceof ArrayBuffer;
    }
    return result;
  }

  /**
   * Determine if a value is a String
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a String, otherwise false
   */
  function isString(val) {
    return typeof val === "string";
  }

  /**
   * Determine if a value is a Number
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Number, otherwise false
   */
  function isNumber(val) {
    return typeof val === "number";
  }

  /**
   * Determine if a value is an Object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Object, otherwise false
   */
  function isObject(val) {
    return val !== null && typeof val === "object";
  }

  /**
   * Determine if a value is a Date
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Date, otherwise false
   */
  function isDate(val) {
    return toString.call(val) === "[object Date]";
  }

  /**
   * Determine if a value is a File
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a File, otherwise false
   */
  function isFile(val) {
    return toString.call(val) === "[object File]";
  }

  /**
   * Determine if a value is a Blob
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Blob, otherwise false
   */
  function isBlob(val) {
    return toString.call(val) === "[object Blob]";
  }

  /**
   * Determine if a value is a Function
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Function, otherwise false
   */
  function isFunction(val) {
    return toString.call(val) === "[object Function]";
  }

  /**
   * Determine if a value is a Stream
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Stream, otherwise false
   */
  function isStream(val) {
    return isObject(val) && isFunction(val.pipe);
  }

  /**
   * Determine if a value is a URLSearchParams object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a URLSearchParams object, otherwise false
   */
  function isURLSearchParams(val) {
    return (
      typeof URLSearchParams !== "undefined" && val instanceof URLSearchParams
    );
  }

  /**
   * Trim excess whitespace off the beginning and end of a string
   *
   * @param {String} str The String to trim
   * @returns {String} The String freed of excess whitespace
   */
  function trim(str) {
    return str.replace(/^\s*/, "").replace(/\s*$/, "");
  }

  /**
   * Determine if we're running in a standard browser environment
   *
   * This allows axios to run in a web worker, and react-native.
   * Both environments support XMLHttpRequest, but not fully standard globals.
   *
   * web workers:
   *  typeof window -> undefined
   *  typeof document -> undefined
   *
   * react-native:
   *  navigator.product -> 'ReactNative'
   * nativescript
   *  navigator.product -> 'NativeScript' or 'NS'
   */
  function isStandardBrowserEnv() {
    if (
      typeof navigator !== "undefined" &&
      (navigator.product === "ReactNative" ||
        navigator.product === "NativeScript" ||
        navigator.product === "NS")
    ) {
      return false;
    }
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  /**
   * Iterate over an Array or an Object invoking a function for each item.
   *
   * If `obj` is an Array callback will be called passing
   * the value, index, and complete array for each item.
   *
   * If 'obj' is an Object callback will be called passing
   * the value, key, and complete object for each property.
   *
   * @param {Object|Array} obj The object to iterate
   * @param {Function} fn The callback to invoke for each item
   */
  function forEach(obj, fn) {
    // Don't bother if no value provided
    if (obj === null || typeof obj === "undefined") {
      return;
    }

    // Force an array if not already something iterable
    if (typeof obj !== "object") {
      /*eslint no-param-reassign:0*/
      obj = [obj];
    }

    if (isArray(obj)) {
      // Iterate over array values
      for (var i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // Iterate over object keys
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }

  /**
   * Accepts varargs expecting each argument to be an object, then
   * immutably merges the properties of each object and returns result.
   *
   * When multiple objects contain the same key the later object in
   * the arguments list will take precedence.
   *
   * Example:
   *
   * ```js
   * var result = merge({foo: 123}, {foo: 456});
   * console.log(result.foo); // outputs 456
   * ```
   *
   * @param {Object} obj1 Object to merge
   * @returns {Object} Result of all merge properties
   */
  function merge(/* obj1, obj2, obj3, ... */) {
    var result = {};
    function assignValue(val, key) {
      if (typeof result[key] === "object" && typeof val === "object") {
        result[key] = merge(result[key], val);
      } else {
        result[key] = val;
      }
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Function equal to merge with the difference being that no reference
   * to original objects is kept.
   *
   * @see merge
   * @param {Object} obj1 Object to merge
   * @returns {Object} Result of all merge properties
   */
  function deepMerge(/* obj1, obj2, obj3, ... */) {
    var result = {};
    function assignValue(val, key) {
      if (typeof result[key] === "object" && typeof val === "object") {
        result[key] = deepMerge(result[key], val);
      } else if (typeof val === "object") {
        result[key] = deepMerge({}, val);
      } else {
        result[key] = val;
      }
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Extends object a by mutably adding to it the properties of object b.
   *
   * @param {Object} a The object to be extended
   * @param {Object} b The object to copy properties from
   * @param {Object} thisArg The object to bind function to
   * @return {Object} The resulting value of object a
   */
  function extend(a, b, thisArg) {
    forEach(b, function assignValue(val, key) {
      if (thisArg && typeof val === "function") {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    });
    return a;
  }

  utils = {
    isArray: isArray,
    isArrayBuffer: isArrayBuffer,
    isBuffer: isBuffer,
    isFormData: isFormData,
    isArrayBufferView: isArrayBufferView,
    isString: isString,
    isNumber: isNumber,
    isObject: isObject,
    isUndefined: isUndefined,
    isDate: isDate,
    isFile: isFile,
    isBlob: isBlob,
    isFunction: isFunction,
    isStream: isStream,
    isURLSearchParams: isURLSearchParams,
    isStandardBrowserEnv: isStandardBrowserEnv,
    forEach: forEach,
    merge: merge,
    deepMerge: deepMerge,
    extend: extend,
    trim: trim,
  };
  return utils;
}

var buildURL;
var hasRequiredBuildURL;

function requireBuildURL() {
  if (hasRequiredBuildURL) return buildURL;
  hasRequiredBuildURL = 1;

  var utils = requireUtils();

  function encode(val) {
    return encodeURIComponent(val)
      .replace(/%40/gi, "@")
      .replace(/%3A/gi, ":")
      .replace(/%24/g, "$")
      .replace(/%2C/gi, ",")
      .replace(/%20/g, "+")
      .replace(/%5B/gi, "[")
      .replace(/%5D/gi, "]");
  }

  /**
   * Build a URL by appending params to the end
   *
   * @param {string} url The base of the url (e.g., http://www.google.com)
   * @param {object} [params] The params to be appended
   * @returns {string} The formatted url
   */
  buildURL = function buildURL(url, params, paramsSerializer) {
    /*eslint no-param-reassign:0*/
    if (!params) {
      return url;
    }

    var serializedParams;
    if (paramsSerializer) {
      serializedParams = paramsSerializer(params);
    } else if (utils.isURLSearchParams(params)) {
      serializedParams = params.toString();
    } else {
      var parts = [];

      utils.forEach(params, function serialize(val, key) {
        if (val === null || typeof val === "undefined") {
          return;
        }

        if (utils.isArray(val)) {
          key = key + "[]";
        } else {
          val = [val];
        }

        utils.forEach(val, function parseValue(v) {
          if (utils.isDate(v)) {
            v = v.toISOString();
          } else if (utils.isObject(v)) {
            v = JSON.stringify(v);
          }
          parts.push(encode(key) + "=" + encode(v));
        });
      });

      serializedParams = parts.join("&");
    }

    if (serializedParams) {
      var hashmarkIndex = url.indexOf("#");
      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }

      url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
    }

    return url;
  };
  return buildURL;
}

var InterceptorManager_1;
var hasRequiredInterceptorManager;

function requireInterceptorManager() {
  if (hasRequiredInterceptorManager) return InterceptorManager_1;
  hasRequiredInterceptorManager = 1;

  var utils = requireUtils();

  function InterceptorManager() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected,
    });
    return this.handlers.length - 1;
  };

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   */
  InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   */
  InterceptorManager.prototype.forEach = function forEach(fn) {
    utils.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  };

  InterceptorManager_1 = InterceptorManager;
  return InterceptorManager_1;
}

var transformData;
var hasRequiredTransformData;

function requireTransformData() {
  if (hasRequiredTransformData) return transformData;
  hasRequiredTransformData = 1;

  var utils = requireUtils();

  /**
   * Transform the data for a request or a response
   *
   * @param {Object|String} data The data to be transformed
   * @param {Array} headers The headers for the request or response
   * @param {Array|Function} fns A single function or Array of functions
   * @returns {*} The resulting transformed data
   */
  transformData = function transformData(data, headers, fns) {
    /*eslint no-param-reassign:0*/
    utils.forEach(fns, function transform(fn) {
      data = fn(data, headers);
    });

    return data;
  };
  return transformData;
}

var isCancel;
var hasRequiredIsCancel;

function requireIsCancel() {
  if (hasRequiredIsCancel) return isCancel;
  hasRequiredIsCancel = 1;

  isCancel = function isCancel(value) {
    return !!(value && value.__CANCEL__);
  };
  return isCancel;
}

var normalizeHeaderName;
var hasRequiredNormalizeHeaderName;

function requireNormalizeHeaderName() {
  if (hasRequiredNormalizeHeaderName) return normalizeHeaderName;
  hasRequiredNormalizeHeaderName = 1;

  var utils = requireUtils();

  normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
    utils.forEach(headers, function processHeader(value, name) {
      if (
        name !== normalizedName &&
        name.toUpperCase() === normalizedName.toUpperCase()
      ) {
        headers[normalizedName] = value;
        delete headers[name];
      }
    });
  };
  return normalizeHeaderName;
}

var enhanceError;
var hasRequiredEnhanceError;

function requireEnhanceError() {
  if (hasRequiredEnhanceError) return enhanceError;
  hasRequiredEnhanceError = 1;

  /**
   * Update an Error with the specified config, error code, and response.
   *
   * @param {Error} error The error to update.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The error.
   */
  enhanceError = function enhanceError(error, config, code, request, response) {
    error.config = config;
    if (code) {
      error.code = code;
    }

    error.request = request;
    error.response = response;
    error.isAxiosError = true;

    error.toJSON = function () {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: this.config,
        code: this.code,
      };
    };
    return error;
  };
  return enhanceError;
}

var createError;
var hasRequiredCreateError;

function requireCreateError() {
  if (hasRequiredCreateError) return createError;
  hasRequiredCreateError = 1;

  var enhanceError = requireEnhanceError();

  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The created error.
   */
  createError = function createError(message, config, code, request, response) {
    var error = new Error(message);
    return enhanceError(error, config, code, request, response);
  };
  return createError;
}

var settle;
var hasRequiredSettle;

function requireSettle() {
  if (hasRequiredSettle) return settle;
  hasRequiredSettle = 1;

  var createError = requireCreateError();

  /**
   * Resolve or reject a Promise based on response status.
   *
   * @param {Function} resolve A function that resolves the promise.
   * @param {Function} reject A function that rejects the promise.
   * @param {object} response The response.
   */
  settle = function settle(resolve, reject, response) {
    var validateStatus = response.config.validateStatus;
    if (!validateStatus || validateStatus(response.status)) {
      resolve(response);
    } else {
      reject(
        createError(
          "Request failed with status code " + response.status,
          response.config,
          null,
          response.request,
          response,
        ),
      );
    }
  };
  return settle;
}

var isAbsoluteURL;
var hasRequiredIsAbsoluteURL;

function requireIsAbsoluteURL() {
  if (hasRequiredIsAbsoluteURL) return isAbsoluteURL;
  hasRequiredIsAbsoluteURL = 1;

  /**
   * Determines whether the specified URL is absolute
   *
   * @param {string} url The URL to test
   * @returns {boolean} True if the specified URL is absolute, otherwise false
   */
  isAbsoluteURL = function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
  };
  return isAbsoluteURL;
}

var combineURLs;
var hasRequiredCombineURLs;

function requireCombineURLs() {
  if (hasRequiredCombineURLs) return combineURLs;
  hasRequiredCombineURLs = 1;

  /**
   * Creates a new URL by combining the specified URLs
   *
   * @param {string} baseURL The base URL
   * @param {string} relativeURL The relative URL
   * @returns {string} The combined URL
   */
  combineURLs = function combineURLs(baseURL, relativeURL) {
    return relativeURL
      ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "")
      : baseURL;
  };
  return combineURLs;
}

var buildFullPath;
var hasRequiredBuildFullPath;

function requireBuildFullPath() {
  if (hasRequiredBuildFullPath) return buildFullPath;
  hasRequiredBuildFullPath = 1;

  var isAbsoluteURL = requireIsAbsoluteURL();
  var combineURLs = requireCombineURLs();

  /**
   * Creates a new URL by combining the baseURL with the requestedURL,
   * only when the requestedURL is not already an absolute URL.
   * If the requestURL is absolute, this function returns the requestedURL untouched.
   *
   * @param {string} baseURL The base URL
   * @param {string} requestedURL Absolute or relative URL to combine
   * @returns {string} The combined full path
   */
  buildFullPath = function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  };
  return buildFullPath;
}

var parseHeaders;
var hasRequiredParseHeaders;

function requireParseHeaders() {
  if (hasRequiredParseHeaders) return parseHeaders;
  hasRequiredParseHeaders = 1;

  var utils = requireUtils();

  // Headers whose duplicates are ignored by node
  // c.f. https://nodejs.org/api/http.html#http_message_headers
  var ignoreDuplicateOf = [
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent",
  ];

  /**
   * Parse headers into an object
   *
   * ```
   * Date: Wed, 27 Aug 2014 08:58:49 GMT
   * Content-Type: application/json
   * Connection: keep-alive
   * Transfer-Encoding: chunked
   * ```
   *
   * @param {String} headers Headers needing to be parsed
   * @returns {Object} Headers parsed into an object
   */
  parseHeaders = function parseHeaders(headers) {
    var parsed = {};
    var key;
    var val;
    var i;

    if (!headers) {
      return parsed;
    }

    utils.forEach(headers.split("\n"), function parser(line) {
      i = line.indexOf(":");
      key = utils.trim(line.substr(0, i)).toLowerCase();
      val = utils.trim(line.substr(i + 1));

      if (key) {
        if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
          return;
        }
        if (key === "set-cookie") {
          parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
        }
      }
    });

    return parsed;
  };
  return parseHeaders;
}

var isURLSameOrigin;
var hasRequiredIsURLSameOrigin;

function requireIsURLSameOrigin() {
  if (hasRequiredIsURLSameOrigin) return isURLSameOrigin;
  hasRequiredIsURLSameOrigin = 1;

  var utils = requireUtils();

  isURLSameOrigin = utils.isStandardBrowserEnv()
    ? // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
      (function standardBrowserEnv() {
        var msie = /(msie|trident)/i.test(navigator.userAgent);
        var urlParsingNode = document.createElement("a");
        var originURL;

        /**
         * Parse a URL to discover it's components
         *
         * @param {String} url The URL to be parsed
         * @returns {Object}
         */
        function resolveURL(url) {
          var href = url;

          if (msie) {
            // IE needs attribute set twice to normalize properties
            urlParsingNode.setAttribute("href", href);
            href = urlParsingNode.href;
          }

          urlParsingNode.setAttribute("href", href);

          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol
              ? urlParsingNode.protocol.replace(/:$/, "")
              : "",
            host: urlParsingNode.host,
            search: urlParsingNode.search
              ? urlParsingNode.search.replace(/^\?/, "")
              : "",
            hash: urlParsingNode.hash
              ? urlParsingNode.hash.replace(/^#/, "")
              : "",
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname:
              urlParsingNode.pathname.charAt(0) === "/"
                ? urlParsingNode.pathname
                : "/" + urlParsingNode.pathname,
          };
        }

        originURL = resolveURL(window.location.href);

        /**
         * Determine if a URL shares the same origin as the current location
         *
         * @param {String} requestURL The URL to test
         * @returns {boolean} True if URL shares the same origin, otherwise false
         */
        return function isURLSameOrigin(requestURL) {
          var parsed = utils.isString(requestURL)
            ? resolveURL(requestURL)
            : requestURL;
          return (
            parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host
          );
        };
      })()
    : // Non standard browser envs (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      })();
  return isURLSameOrigin;
}

var cookies;
var hasRequiredCookies;

function requireCookies() {
  if (hasRequiredCookies) return cookies;
  hasRequiredCookies = 1;

  var utils = requireUtils();

  cookies = utils.isStandardBrowserEnv()
    ? // Standard browser envs support document.cookie
      (function standardBrowserEnv() {
        return {
          write: function write(name, value, expires, path, domain, secure) {
            var cookie = [];
            cookie.push(name + "=" + encodeURIComponent(value));

            if (utils.isNumber(expires)) {
              cookie.push("expires=" + new Date(expires).toGMTString());
            }

            if (utils.isString(path)) {
              cookie.push("path=" + path);
            }

            if (utils.isString(domain)) {
              cookie.push("domain=" + domain);
            }

            if (secure === true) {
              cookie.push("secure");
            }

            document.cookie = cookie.join("; ");
          },

          read: function read(name) {
            var match = document.cookie.match(
              new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"),
            );
            return match ? decodeURIComponent(match[3]) : null;
          },

          remove: function remove(name) {
            this.write(name, "", Date.now() - 86400000);
          },
        };
      })()
    : // Non standard browser env (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return {
          write: function write() {},
          read: function read() {
            return null;
          },
          remove: function remove() {},
        };
      })();
  return cookies;
}

var xhr;
var hasRequiredXhr;

function requireXhr() {
  if (hasRequiredXhr) return xhr;
  hasRequiredXhr = 1;

  var utils = requireUtils();
  var settle = requireSettle();
  var buildURL = requireBuildURL();
  var buildFullPath = requireBuildFullPath();
  var parseHeaders = requireParseHeaders();
  var isURLSameOrigin = requireIsURLSameOrigin();
  var createError = requireCreateError();

  xhr = function xhrAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      var requestData = config.data;
      var requestHeaders = config.headers;

      if (utils.isFormData(requestData)) {
        delete requestHeaders["Content-Type"]; // Let the browser set it
      }

      var request = new XMLHttpRequest();

      // HTTP basic authentication
      if (config.auth) {
        var username = config.auth.username || "";
        var password = config.auth.password || "";
        requestHeaders.Authorization =
          "Basic " + btoa(username + ":" + password);
      }

      var fullPath = buildFullPath(config.baseURL, config.url);
      request.open(
        config.method.toUpperCase(),
        buildURL(fullPath, config.params, config.paramsSerializer),
        true,
      );

      // Set the request timeout in MS
      request.timeout = config.timeout;

      // Listen for ready state
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (
          request.status === 0 &&
          !(request.responseURL && request.responseURL.indexOf("file:") === 0)
        ) {
          return;
        }

        // Prepare the response
        var responseHeaders =
          "getAllResponseHeaders" in request
            ? parseHeaders(request.getAllResponseHeaders())
            : null;
        var responseData =
          !config.responseType || config.responseType === "text"
            ? request.responseText
            : request.response;
        var response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config: config,
          request: request,
        };

        settle(resolve, reject, response);

        // Clean up request
        request = null;
      };

      // Handle browser request cancellation (as opposed to a manual cancellation)
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }

        reject(createError("Request aborted", config, "ECONNABORTED", request));

        // Clean up request
        request = null;
      };

      // Handle low level network errors
      request.onerror = function handleError() {
        // Real errors are hidden from us by the browser
        // onerror should only fire if it's a network error
        reject(createError("Network Error", config, null, request));

        // Clean up request
        request = null;
      };

      // Handle timeout
      request.ontimeout = function handleTimeout() {
        var timeoutErrorMessage =
          "timeout of " + config.timeout + "ms exceeded";
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        reject(
          createError(timeoutErrorMessage, config, "ECONNABORTED", request),
        );

        // Clean up request
        request = null;
      };

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.
      if (utils.isStandardBrowserEnv()) {
        var cookies = requireCookies();

        // Add xsrf header
        var xsrfValue =
          (config.withCredentials || isURLSameOrigin(fullPath)) &&
          config.xsrfCookieName
            ? cookies.read(config.xsrfCookieName)
            : undefined;

        if (xsrfValue) {
          requestHeaders[config.xsrfHeaderName] = xsrfValue;
        }
      }

      // Add headers to the request
      if ("setRequestHeader" in request) {
        utils.forEach(requestHeaders, function setRequestHeader(val, key) {
          if (
            typeof requestData === "undefined" &&
            key.toLowerCase() === "content-type"
          ) {
            // Remove Content-Type if data is undefined
            delete requestHeaders[key];
          } else {
            // Otherwise add header to the request
            request.setRequestHeader(key, val);
          }
        });
      }

      // Add withCredentials to request if needed
      if (!utils.isUndefined(config.withCredentials)) {
        request.withCredentials = !!config.withCredentials;
      }

      // Add responseType to request if needed
      if (config.responseType) {
        try {
          request.responseType = config.responseType;
        } catch (e) {
          // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
          // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
          if (config.responseType !== "json") {
            throw e;
          }
        }
      }

      // Handle progress if needed
      if (typeof config.onDownloadProgress === "function") {
        request.addEventListener("progress", config.onDownloadProgress);
      }

      // Not all browsers support upload events
      if (typeof config.onUploadProgress === "function" && request.upload) {
        request.upload.addEventListener("progress", config.onUploadProgress);
      }

      if (config.cancelToken) {
        // Handle cancellation
        config.cancelToken.promise.then(function onCanceled(cancel) {
          if (!request) {
            return;
          }

          request.abort();
          reject(cancel);
          // Clean up request
          request = null;
        });
      }

      if (requestData === undefined) {
        requestData = null;
      }

      // Send the request
      request.send(requestData);
    });
  };
  return xhr;
}

var followRedirects = { exports: {} };

var src = { exports: {} };

var browser = { exports: {} };

var debug = { exports: {} };

/**
 * Helpers.
 */

var ms;
var hasRequiredMs;

function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;

  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  ms = function (val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" +
        JSON.stringify(val),
    );
  };

  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */

  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match =
      /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
        str,
      );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return undefined;
    }
  }

  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtShort(ms) {
    if (ms >= d) {
      return Math.round(ms / d) + "d";
    }
    if (ms >= h) {
      return Math.round(ms / h) + "h";
    }
    if (ms >= m) {
      return Math.round(ms / m) + "m";
    }
    if (ms >= s) {
      return Math.round(ms / s) + "s";
    }
    return ms + "ms";
  }

  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */

  function fmtLong(ms) {
    return (
      plural(ms, d, "day") ||
      plural(ms, h, "hour") ||
      plural(ms, m, "minute") ||
      plural(ms, s, "second") ||
      ms + " ms"
    );
  }

  /**
   * Pluralization helper.
   */

  function plural(ms, n, name) {
    if (ms < n) {
      return;
    }
    if (ms < n * 1.5) {
      return Math.floor(ms / n) + " " + name;
    }
    return Math.ceil(ms / n) + " " + name + "s";
  }
  return ms;
}

var hasRequiredDebug;

function requireDebug() {
  if (hasRequiredDebug) return debug.exports;
  hasRequiredDebug = 1;
  (function (module, exports) {
    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports =
      module.exports =
      createDebug.debug =
      createDebug["default"] =
        createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = requireMs();

    /**
     * Active `debug` instances.
     */
    exports.instances = [];

    /**
     * The currently active debug mode names, and names to skip.
     */

    exports.names = [];
    exports.skips = [];

    /**
     * Map of special "%n" handling functions, for the debug "format" argument.
     *
     * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
     */

    exports.formatters = {};

    /**
     * Select a color.
     * @param {String} namespace
     * @return {Number}
     * @api private
     */

    function selectColor(namespace) {
      var hash = 0,
        i;

      for (i in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }

      return exports.colors[Math.abs(hash) % exports.colors.length];
    }

    /**
     * Create a debugger with the given `namespace`.
     *
     * @param {String} namespace
     * @return {Function}
     * @api public
     */

    function createDebug(namespace) {
      var prevTime;

      function debug() {
        // disabled?
        if (!debug.enabled) return;

        var self = debug;

        // set `diff` timestamp
        var curr = +new Date();
        var ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;

        // turn the `arguments` into a proper Array
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }

        args[0] = exports.coerce(args[0]);

        if ("string" !== typeof args[0]) {
          // anything else let's inspect with %O
          args.unshift("%O");
        }

        // apply any `formatters` transformations
        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
          // if we encounter an escaped % then don't increase the array index
          if (match === "%%") return match;
          index++;
          var formatter = exports.formatters[format];
          if ("function" === typeof formatter) {
            var val = args[index];
            match = formatter.call(self, val);

            // now we need to remove `args[index]` since it's inlined in the `format`
            args.splice(index, 1);
            index--;
          }
          return match;
        });

        // apply env-specific formatting (colors, etc.)
        exports.formatArgs.call(self, args);

        var logFn = debug.log || exports.log || console.log.bind(console);
        logFn.apply(self, args);
      }

      debug.namespace = namespace;
      debug.enabled = exports.enabled(namespace);
      debug.useColors = exports.useColors();
      debug.color = selectColor(namespace);
      debug.destroy = destroy;

      // env-specific initialization logic for debug instances
      if ("function" === typeof exports.init) {
        exports.init(debug);
      }

      exports.instances.push(debug);

      return debug;
    }

    function destroy() {
      var index = exports.instances.indexOf(this);
      if (index !== -1) {
        exports.instances.splice(index, 1);
        return true;
      } else {
        return false;
      }
    }

    /**
     * Enables a debug mode by namespaces. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} namespaces
     * @api public
     */

    function enable(namespaces) {
      exports.save(namespaces);

      exports.names = [];
      exports.skips = [];

      var i;
      var split = (typeof namespaces === "string" ? namespaces : "").split(
        /[\s,]+/,
      );
      var len = split.length;

      for (i = 0; i < len; i++) {
        if (!split[i]) continue; // ignore empty strings
        namespaces = split[i].replace(/\*/g, ".*?");
        if (namespaces[0] === "-") {
          exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
        } else {
          exports.names.push(new RegExp("^" + namespaces + "$"));
        }
      }

      for (i = 0; i < exports.instances.length; i++) {
        var instance = exports.instances[i];
        instance.enabled = exports.enabled(instance.namespace);
      }
    }

    /**
     * Disable debug output.
     *
     * @api public
     */

    function disable() {
      exports.enable("");
    }

    /**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */

    function enabled(name) {
      if (name[name.length - 1] === "*") {
        return true;
      }
      var i, len;
      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }
      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Coerce `val`.
     *
     * @param {Mixed} val
     * @return {Mixed}
     * @api private
     */

    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
  })(debug, debug.exports);
  return debug.exports;
}

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

var hasRequiredBrowser;

function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function (module, exports) {
    exports = module.exports = requireDebug();
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage =
      "undefined" != typeof chrome && "undefined" != typeof chrome.storage
        ? chrome.storage.local
        : localstorage();

    /**
     * Colors.
     */

    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33",
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    function useColors() {
      // NB: In an Electron preload script, document will be defined but not fully
      // initialized. Since we know we're in Chrome, we'll just detect this case
      // explicitly
      if (
        typeof window !== "undefined" &&
        window.process &&
        window.process.type === "renderer"
      ) {
        return true;
      }

      // Internet Explorer and Edge do not support colors.
      if (
        typeof navigator !== "undefined" &&
        navigator.userAgent &&
        navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
      ) {
        return false;
      }

      // is webkit? http://stackoverflow.com/a/16459606/376773
      // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
      return (
        (typeof document !== "undefined" &&
          document.documentElement &&
          document.documentElement.style &&
          document.documentElement.style.WebkitAppearance) ||
        // is firebug? http://stackoverflow.com/a/398120/376773
        (typeof window !== "undefined" &&
          window.console &&
          (window.console.firebug ||
            (window.console.exception && window.console.table))) ||
        // is firefox >= v31?
        // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
        (typeof navigator !== "undefined" &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) &&
          parseInt(RegExp.$1, 10) >= 31) ||
        // double check webkit in userAgent just in case we are in a worker
        (typeof navigator !== "undefined" &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
      );
    }

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    exports.formatters.j = function (v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return "[UnexpectedJSONParseError]: " + err.message;
      }
    };

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
      var useColors = this.useColors;

      args[0] =
        (useColors ? "%c" : "") +
        this.namespace +
        (useColors ? " %c" : " ") +
        args[0] +
        (useColors ? "%c " : " ") +
        "+" +
        exports.humanize(this.diff);

      if (!useColors) return;

      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");

      // the final "%c" is somewhat tricky, because there could be other
      // arguments passed either before or after the %c, so we need to
      // figure out the correct index to insert the CSS into
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function (match) {
        if ("%%" === match) return;
        index++;
        if ("%c" === match) {
          // we only are interested in the *last* %c
          // (the user may have provided their own)
          lastC = index;
        }
      });

      args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.log()` when available.
     * No-op when `console.log` is not a "function".
     *
     * @api public
     */

    function log() {
      // this hackery is required for IE8/9, where
      // the `console.log` function doesn't have 'apply'
      return (
        "object" === typeof console &&
        console.log &&
        Function.prototype.apply.call(console.log, console, arguments)
      );
    }

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */

    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports.storage.removeItem("debug");
        } else {
          exports.storage.debug = namespaces;
        }
      } catch (e) {}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */

    function load() {
      var r;
      try {
        r = exports.storage.debug;
      } catch (e) {}

      // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }

      return r;
    }

    /**
     * Enable namespaces listed in `localStorage.debug` initially.
     */

    exports.enable(load());

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {}
    }
  })(browser, browser.exports);
  return browser.exports;
}

var node = { exports: {} };

/**
 * Module dependencies.
 */

var hasRequiredNode;

function requireNode() {
  if (hasRequiredNode) return node.exports;
  hasRequiredNode = 1;
  (function (module, exports) {
    var tty = require$$0$1;
    var util = require$$1$2;

    /**
     * This is the Node.js implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */

    exports = module.exports = requireDebug();
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;

    /**
     * Colors.
     */

    exports.colors = [6, 2, 3, 4, 5, 1];

    try {
      var supportsColor = require("supports-color");
      if (supportsColor && supportsColor.level >= 2) {
        exports.colors = [
          20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62,
          63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113,
          128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167,
          168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199,
          200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
        ];
      }
    } catch (err) {
      // swallow - we only care if `supports-color` is available; it doesn't have to be.
    }

    /**
     * Build up the default `inspectOpts` object from the environment variables.
     *
     *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
     */

    exports.inspectOpts = Object.keys(process.env)
      .filter(function (key) {
        return /^debug_/i.test(key);
      })
      .reduce(function (obj, key) {
        // camel-case
        var prop = key
          .substring(6)
          .toLowerCase()
          .replace(/_([a-z])/g, function (_, k) {
            return k.toUpperCase();
          });

        // coerce string value into JS value
        var val = process.env[key];
        if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
        else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
        else if (val === "null") val = null;
        else val = Number(val);

        obj[prop] = val;
        return obj;
      }, {});

    /**
     * Is stdout a TTY? Colored output is enabled when `true`.
     */

    function useColors() {
      return "colors" in exports.inspectOpts
        ? Boolean(exports.inspectOpts.colors)
        : tty.isatty(process.stderr.fd);
    }

    /**
     * Map %o to `util.inspect()`, all on a single line.
     */

    exports.formatters.o = function (v) {
      this.inspectOpts.colors = this.useColors;
      return util
        .inspect(v, this.inspectOpts)
        .split("\n")
        .map(function (str) {
          return str.trim();
        })
        .join(" ");
    };

    /**
     * Map %o to `util.inspect()`, allowing multiple lines if needed.
     */

    exports.formatters.O = function (v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };

    /**
     * Adds ANSI color escape codes if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
      var name = this.namespace;
      var useColors = this.useColors;

      if (useColors) {
        var c = this.color;
        var colorCode = "\u001b[3" + (c < 8 ? c : "8;5;" + c);
        var prefix = "  " + colorCode + ";1m" + name + " " + "\u001b[0m";

        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + exports.humanize(this.diff) + "\u001b[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }

    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      } else {
        return new Date().toISOString() + " ";
      }
    }

    /**
     * Invokes `util.format()` with the specified arguments and writes to stderr.
     */

    function log() {
      return process.stderr.write(util.format.apply(util, arguments) + "\n");
    }

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */

    function save(namespaces) {
      if (null == namespaces) {
        // If you set a process.env field to null or undefined, it gets cast to the
        // string 'null' or 'undefined'. Just delete instead.
        delete process.env.DEBUG;
      } else {
        process.env.DEBUG = namespaces;
      }
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */

    function load() {
      return process.env.DEBUG;
    }

    /**
     * Init logic for `debug` instances.
     *
     * Create a new `inspectOpts` object in case `useColors` is set
     * differently for a particular `debug` instance.
     */

    function init(debug) {
      debug.inspectOpts = {};

      var keys = Object.keys(exports.inspectOpts);
      for (var i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }

    /**
     * Enable namespaces listed in `process.env.DEBUG` initially.
     */

    exports.enable(load());
  })(node, node.exports);
  return node.exports;
}

/**
 * Detect Electron renderer process, which is node, but we should
 * treat as a browser.
 */

var hasRequiredSrc;

function requireSrc() {
  if (hasRequiredSrc) return src.exports;
  hasRequiredSrc = 1;
  if (typeof process === "undefined" || process.type === "renderer") {
    src.exports = requireBrowser();
  } else {
    src.exports = requireNode();
  }
  return src.exports;
}

var hasRequiredFollowRedirects;

function requireFollowRedirects() {
  if (hasRequiredFollowRedirects) return followRedirects.exports;
  hasRequiredFollowRedirects = 1;
  var url = require$$0$2;
  var http = require$$1$3;
  var https = require$$2$2;
  var assert = require$$3$1;
  var Writable = require$$4$1.Writable;
  var debug = requireSrc()("follow-redirects");

  // RFC7231§4.2.1: Of the request methods defined by this specification,
  // the GET, HEAD, OPTIONS, and TRACE methods are defined to be safe.
  var SAFE_METHODS = { GET: true, HEAD: true, OPTIONS: true, TRACE: true };

  // Create handlers that pass events from native requests
  var eventHandlers = Object.create(null);
  ["abort", "aborted", "error", "socket", "timeout"].forEach(function (event) {
    eventHandlers[event] = function (arg) {
      this._redirectable.emit(event, arg);
    };
  });

  // An HTTP(S) request that can be redirected
  function RedirectableRequest(options, responseCallback) {
    // Initialize the request
    Writable.call(this);
    options.headers = options.headers || {};
    this._options = options;
    this._redirectCount = 0;
    this._redirects = [];
    this._requestBodyLength = 0;
    this._requestBodyBuffers = [];

    // Since http.request treats host as an alias of hostname,
    // but the url module interprets host as hostname plus port,
    // eliminate the host property to avoid confusion.
    if (options.host) {
      // Use hostname if set, because it has precedence
      if (!options.hostname) {
        options.hostname = options.host;
      }
      delete options.host;
    }

    // Attach a callback if passed
    if (responseCallback) {
      this.on("response", responseCallback);
    }

    // React to responses of native requests
    var self = this;
    this._onNativeResponse = function (response) {
      self._processResponse(response);
    };

    // Complete the URL object when necessary
    if (!options.pathname && options.path) {
      var searchPos = options.path.indexOf("?");
      if (searchPos < 0) {
        options.pathname = options.path;
      } else {
        options.pathname = options.path.substring(0, searchPos);
        options.search = options.path.substring(searchPos);
      }
    }

    // Perform the first request
    this._performRequest();
  }
  RedirectableRequest.prototype = Object.create(Writable.prototype);

  // Writes buffered data to the current native request
  RedirectableRequest.prototype.write = function (data, encoding, callback) {
    // Validate input and shift parameters if necessary
    if (
      !(
        typeof data === "string" ||
        (typeof data === "object" && "length" in data)
      )
    ) {
      throw new Error("data should be a string, Buffer or Uint8Array");
    }
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = null;
    }

    // Ignore empty buffers, since writing them doesn't invoke the callback
    // https://github.com/nodejs/node/issues/22066
    if (data.length === 0) {
      if (callback) {
        callback();
      }
      return;
    }
    // Only write when we don't exceed the maximum body length
    if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
      this._requestBodyLength += data.length;
      this._requestBodyBuffers.push({ data: data, encoding: encoding });
      this._currentRequest.write(data, encoding, callback);
    }
    // Error when we exceed the maximum body length
    else {
      this.emit(
        "error",
        new Error("Request body larger than maxBodyLength limit"),
      );
      this.abort();
    }
  };

  // Ends the current native request
  RedirectableRequest.prototype.end = function (data, encoding, callback) {
    // Shift parameters if necessary
    if (typeof data === "function") {
      callback = data;
      data = encoding = null;
    } else if (typeof encoding === "function") {
      callback = encoding;
      encoding = null;
    }

    // Write data and end
    var currentRequest = this._currentRequest;
    this.write(data || "", encoding, function () {
      currentRequest.end(null, null, callback);
    });
  };

  // Sets a header value on the current native request
  RedirectableRequest.prototype.setHeader = function (name, value) {
    this._options.headers[name] = value;
    this._currentRequest.setHeader(name, value);
  };

  // Clears a header value on the current native request
  RedirectableRequest.prototype.removeHeader = function (name) {
    delete this._options.headers[name];
    this._currentRequest.removeHeader(name);
  };

  // Proxy all other public ClientRequest methods
  [
    "abort",
    "flushHeaders",
    "getHeader",
    "setNoDelay",
    "setSocketKeepAlive",
    "setTimeout",
  ].forEach(function (method) {
    RedirectableRequest.prototype[method] = function (a, b) {
      return this._currentRequest[method](a, b);
    };
  });

  // Proxy all public ClientRequest properties
  ["aborted", "connection", "socket"].forEach(function (property) {
    Object.defineProperty(RedirectableRequest.prototype, property, {
      get: function () {
        return this._currentRequest[property];
      },
    });
  });

  // Executes the next native request (initial or redirect)
  RedirectableRequest.prototype._performRequest = function () {
    // Load the native protocol
    var protocol = this._options.protocol;
    var nativeProtocol = this._options.nativeProtocols[protocol];
    if (!nativeProtocol) {
      this.emit("error", new Error("Unsupported protocol " + protocol));
      return;
    }

    // If specified, use the agent corresponding to the protocol
    // (HTTP and HTTPS use different types of agents)
    if (this._options.agents) {
      var scheme = protocol.substr(0, protocol.length - 1);
      this._options.agent = this._options.agents[scheme];
    }

    // Create the native request
    var request = (this._currentRequest = nativeProtocol.request(
      this._options,
      this._onNativeResponse,
    ));
    this._currentUrl = url.format(this._options);

    // Set up event handlers
    request._redirectable = this;
    for (var event in eventHandlers) {
      /* istanbul ignore else */
      if (event) {
        request.on(event, eventHandlers[event]);
      }
    }

    // End a redirected request
    // (The first request must be ended explicitly with RedirectableRequest#end)
    if (this._isRedirect) {
      // Write the request entity and end.
      var i = 0;
      var buffers = this._requestBodyBuffers;
      (function writeNext() {
        if (i < buffers.length) {
          var buffer = buffers[i++];
          request.write(buffer.data, buffer.encoding, writeNext);
        } else {
          request.end();
        }
      })();
    }
  };

  // Processes a response from the current native request
  RedirectableRequest.prototype._processResponse = function (response) {
    // Store the redirected response
    if (this._options.trackRedirects) {
      this._redirects.push({
        url: this._currentUrl,
        headers: response.headers,
        statusCode: response.statusCode,
      });
    }

    // RFC7231§6.4: The 3xx (Redirection) class of status code indicates
    // that further action needs to be taken by the user agent in order to
    // fulfill the request. If a Location header field is provided,
    // the user agent MAY automatically redirect its request to the URI
    // referenced by the Location field value,
    // even if the specific status code is not understood.
    var location = response.headers.location;
    if (
      location &&
      this._options.followRedirects !== false &&
      response.statusCode >= 300 &&
      response.statusCode < 400
    ) {
      // RFC7231§6.4: A client SHOULD detect and intervene
      // in cyclical redirections (i.e., "infinite" redirection loops).
      if (++this._redirectCount > this._options.maxRedirects) {
        this.emit("error", new Error("Max redirects exceeded."));
        return;
      }

      // RFC7231§6.4: Automatic redirection needs to done with
      // care for methods not known to be safe […],
      // since the user might not wish to redirect an unsafe request.
      // RFC7231§6.4.7: The 307 (Temporary Redirect) status code indicates
      // that the target resource resides temporarily under a different URI
      // and the user agent MUST NOT change the request method
      // if it performs an automatic redirection to that URI.
      var header;
      var headers = this._options.headers;
      if (
        response.statusCode !== 307 &&
        !(this._options.method in SAFE_METHODS)
      ) {
        this._options.method = "GET";
        // Drop a possible entity and headers related to it
        this._requestBodyBuffers = [];
        for (header in headers) {
          if (/^content-/i.test(header)) {
            delete headers[header];
          }
        }
      }

      // Drop the Host header, as the redirect might lead to a different host
      if (!this._isRedirect) {
        for (header in headers) {
          if (/^host$/i.test(header)) {
            delete headers[header];
          }
        }
      }

      // Perform the redirected request
      var redirectUrl = url.resolve(this._currentUrl, location);
      debug("redirecting to", redirectUrl);
      Object.assign(this._options, url.parse(redirectUrl));
      this._isRedirect = true;
      this._performRequest();

      // Discard the remainder of the response to avoid waiting for data
      response.destroy();
    } else {
      // The response is not a redirect; return it as-is
      response.responseUrl = this._currentUrl;
      response.redirects = this._redirects;
      this.emit("response", response);

      // Clean up
      this._requestBodyBuffers = [];
    }
  };

  // Wraps the key/value object of protocols with redirect functionality
  function wrap(protocols) {
    // Default settings
    var exports = {
      maxRedirects: 21,
      maxBodyLength: 10 * 1024 * 1024,
    };

    // Wrap each protocol
    var nativeProtocols = {};
    Object.keys(protocols).forEach(function (scheme) {
      var protocol = scheme + ":";
      var nativeProtocol = (nativeProtocols[protocol] = protocols[scheme]);
      var wrappedProtocol = (exports[scheme] = Object.create(nativeProtocol));

      // Executes a request, following redirects
      wrappedProtocol.request = function (options, callback) {
        if (typeof options === "string") {
          options = url.parse(options);
          options.maxRedirects = exports.maxRedirects;
        } else {
          options = Object.assign(
            {
              protocol: protocol,
              maxRedirects: exports.maxRedirects,
              maxBodyLength: exports.maxBodyLength,
            },
            options,
          );
        }
        options.nativeProtocols = nativeProtocols;
        assert.equal(options.protocol, protocol, "protocol mismatch");
        debug("options", options);
        return new RedirectableRequest(options, callback);
      };

      // Executes a GET request, following redirects
      wrappedProtocol.get = function (options, callback) {
        var request = wrappedProtocol.request(options, callback);
        request.end();
        return request;
      };
    });
    return exports;
  }

  // Exports
  followRedirects.exports = wrap({ http: http, https: https });
  followRedirects.exports.wrap = wrap;
  return followRedirects.exports;
}

var version = "0.19.2";
var require$$9 = {
  version: version,
};

var http_1;
var hasRequiredHttp;

function requireHttp() {
  if (hasRequiredHttp) return http_1;
  hasRequiredHttp = 1;

  var utils = requireUtils();
  var settle = requireSettle();
  var buildFullPath = requireBuildFullPath();
  var buildURL = requireBuildURL();
  var http = require$$1$3;
  var https = require$$2$2;
  var httpFollow = requireFollowRedirects().http;
  var httpsFollow = requireFollowRedirects().https;
  var url = require$$0$2;
  var zlib = require$$8;
  var pkg = require$$9;
  var createError = requireCreateError();
  var enhanceError = requireEnhanceError();

  var isHttps = /https:?/;

  /*eslint consistent-return:0*/
  http_1 = function httpAdapter(config) {
    return new Promise(function dispatchHttpRequest(
      resolvePromise,
      rejectPromise,
    ) {
      var resolve = function resolve(value) {
        resolvePromise(value);
      };
      var reject = function reject(value) {
        rejectPromise(value);
      };
      var data = config.data;
      var headers = config.headers;

      // Set User-Agent (required by some servers)
      // Only set header if it hasn't been set in config
      // See https://github.com/axios/axios/issues/69
      if (!headers["User-Agent"] && !headers["user-agent"]) {
        headers["User-Agent"] = "axios/" + pkg.version;
      }

      if (data && !utils.isStream(data)) {
        if (Buffer.isBuffer(data));
        else if (utils.isArrayBuffer(data)) {
          data = Buffer.from(new Uint8Array(data));
        } else if (utils.isString(data)) {
          data = Buffer.from(data, "utf-8");
        } else {
          return reject(
            createError(
              "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
              config,
            ),
          );
        }

        // Add Content-Length header if data exists
        headers["Content-Length"] = data.length;
      }

      // HTTP basic authentication
      var auth = undefined;
      if (config.auth) {
        var username = config.auth.username || "";
        var password = config.auth.password || "";
        auth = username + ":" + password;
      }

      // Parse url
      var fullPath = buildFullPath(config.baseURL, config.url);
      var parsed = url.parse(fullPath);
      var protocol = parsed.protocol || "http:";

      if (!auth && parsed.auth) {
        var urlAuth = parsed.auth.split(":");
        var urlUsername = urlAuth[0] || "";
        var urlPassword = urlAuth[1] || "";
        auth = urlUsername + ":" + urlPassword;
      }

      if (auth) {
        delete headers.Authorization;
      }

      var isHttpsRequest = isHttps.test(protocol);
      var agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;

      var options = {
        path: buildURL(
          parsed.path,
          config.params,
          config.paramsSerializer,
        ).replace(/^\?/, ""),
        method: config.method.toUpperCase(),
        headers: headers,
        agent: agent,
        agents: { http: config.httpAgent, https: config.httpsAgent },
        auth: auth,
      };

      if (config.socketPath) {
        options.socketPath = config.socketPath;
      } else {
        options.hostname = parsed.hostname;
        options.port = parsed.port;
      }

      var proxy = config.proxy;
      if (!proxy && proxy !== false) {
        var proxyEnv = protocol.slice(0, -1) + "_proxy";
        var proxyUrl =
          process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()];
        if (proxyUrl) {
          var parsedProxyUrl = url.parse(proxyUrl);
          var noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
          var shouldProxy = true;

          if (noProxyEnv) {
            var noProxy = noProxyEnv.split(",").map(function trim(s) {
              return s.trim();
            });

            shouldProxy = !noProxy.some(function proxyMatch(proxyElement) {
              if (!proxyElement) {
                return false;
              }
              if (proxyElement === "*") {
                return true;
              }
              if (
                proxyElement[0] === "." &&
                parsed.hostname.substr(
                  parsed.hostname.length - proxyElement.length,
                ) === proxyElement
              ) {
                return true;
              }

              return parsed.hostname === proxyElement;
            });
          }

          if (shouldProxy) {
            proxy = {
              host: parsedProxyUrl.hostname,
              port: parsedProxyUrl.port,
            };

            if (parsedProxyUrl.auth) {
              var proxyUrlAuth = parsedProxyUrl.auth.split(":");
              proxy.auth = {
                username: proxyUrlAuth[0],
                password: proxyUrlAuth[1],
              };
            }
          }
        }
      }

      if (proxy) {
        options.hostname = proxy.host;
        options.host = proxy.host;
        options.headers.host =
          parsed.hostname + (parsed.port ? ":" + parsed.port : "");
        options.port = proxy.port;
        options.path =
          protocol +
          "//" +
          parsed.hostname +
          (parsed.port ? ":" + parsed.port : "") +
          options.path;

        // Basic proxy authorization
        if (proxy.auth) {
          var base64 = Buffer.from(
            proxy.auth.username + ":" + proxy.auth.password,
            "utf8",
          ).toString("base64");
          options.headers["Proxy-Authorization"] = "Basic " + base64;
        }
      }

      var transport;
      var isHttpsProxy =
        isHttpsRequest && (proxy ? isHttps.test(proxy.protocol) : true);
      if (config.transport) {
        transport = config.transport;
      } else if (config.maxRedirects === 0) {
        transport = isHttpsProxy ? https : http;
      } else {
        if (config.maxRedirects) {
          options.maxRedirects = config.maxRedirects;
        }
        transport = isHttpsProxy ? httpsFollow : httpFollow;
      }

      if (config.maxContentLength && config.maxContentLength > -1) {
        options.maxBodyLength = config.maxContentLength;
      }

      // Create the request
      var req = transport.request(options, function handleResponse(res) {
        if (req.aborted) return;

        // uncompress the response body transparently if required
        var stream = res;
        switch (res.headers["content-encoding"]) {
          /*eslint default-case:0*/
          case "gzip":
          case "compress":
          case "deflate":
            // add the unzipper to the body stream processing pipeline
            stream =
              res.statusCode === 204 ? stream : stream.pipe(zlib.createUnzip());

            // remove the content-encoding in order to not confuse downstream operations
            delete res.headers["content-encoding"];
            break;
        }

        // return the last request in case of redirects
        var lastRequest = res.req || req;

        var response = {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          config: config,
          request: lastRequest,
        };

        if (config.responseType === "stream") {
          response.data = stream;
          settle(resolve, reject, response);
        } else {
          var responseBuffer = [];
          stream.on("data", function handleStreamData(chunk) {
            responseBuffer.push(chunk);

            // make sure the content length is not over the maxContentLength if specified
            if (
              config.maxContentLength > -1 &&
              Buffer.concat(responseBuffer).length > config.maxContentLength
            ) {
              stream.destroy();
              reject(
                createError(
                  "maxContentLength size of " +
                    config.maxContentLength +
                    " exceeded",
                  config,
                  null,
                  lastRequest,
                ),
              );
            }
          });

          stream.on("error", function handleStreamError(err) {
            if (req.aborted) return;
            reject(enhanceError(err, config, null, lastRequest));
          });

          stream.on("end", function handleStreamEnd() {
            var responseData = Buffer.concat(responseBuffer);
            if (config.responseType !== "arraybuffer") {
              responseData = responseData.toString(config.responseEncoding);
            }

            response.data = responseData;
            settle(resolve, reject, response);
          });
        }
      });

      // Handle errors
      req.on("error", function handleRequestError(err) {
        if (req.aborted) return;
        reject(enhanceError(err, config, null, req));
      });

      // Handle request timeout
      if (config.timeout) {
        // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
        // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
        // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
        // And then these socket which be hang up will devoring CPU little by little.
        // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
        req.setTimeout(config.timeout, function handleRequestTimeout() {
          req.abort();
          reject(
            createError(
              "timeout of " + config.timeout + "ms exceeded",
              config,
              "ECONNABORTED",
              req,
            ),
          );
        });
      }

      if (config.cancelToken) {
        // Handle cancellation
        config.cancelToken.promise.then(function onCanceled(cancel) {
          if (req.aborted) return;

          req.abort();
          reject(cancel);
        });
      }

      // Send the request
      if (utils.isStream(data)) {
        data
          .on("error", function handleStreamError(err) {
            reject(enhanceError(err, config, null, req));
          })
          .pipe(req);
      } else {
        req.end(data);
      }
    });
  };
  return http_1;
}

var defaults_1;
var hasRequiredDefaults;

function requireDefaults() {
  if (hasRequiredDefaults) return defaults_1;
  hasRequiredDefaults = 1;

  var utils = requireUtils();
  var normalizeHeaderName = requireNormalizeHeaderName();

  var DEFAULT_CONTENT_TYPE = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  function setContentTypeIfUnset(headers, value) {
    if (
      !utils.isUndefined(headers) &&
      utils.isUndefined(headers["Content-Type"])
    ) {
      headers["Content-Type"] = value;
    }
  }

  function getDefaultAdapter() {
    var adapter;
    if (typeof XMLHttpRequest !== "undefined") {
      // For browsers use XHR adapter
      adapter = requireXhr();
    } else if (
      typeof process !== "undefined" &&
      Object.prototype.toString.call(process) === "[object process]"
    ) {
      // For node use HTTP adapter
      adapter = requireHttp();
    }
    return adapter;
  }

  var defaults = {
    adapter: getDefaultAdapter(),

    transformRequest: [
      function transformRequest(data, headers) {
        normalizeHeaderName(headers, "Accept");
        normalizeHeaderName(headers, "Content-Type");
        if (
          utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(
            headers,
            "application/x-www-form-urlencoded;charset=utf-8",
          );
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, "application/json;charset=utf-8");
          return JSON.stringify(data);
        }
        return data;
      },
    ],

    transformResponse: [
      function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (e) {
            /* Ignore */
          }
        }
        return data;
      },
    ],

    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,

    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",

    maxContentLength: -1,

    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    },
  };

  defaults.headers = {
    common: {
      Accept: "application/json, text/plain, */*",
    },
  };

  utils.forEach(
    ["delete", "get", "head"],
    function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    },
  );

  utils.forEach(
    ["post", "put", "patch"],
    function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    },
  );

  defaults_1 = defaults;
  return defaults_1;
}

var dispatchRequest;
var hasRequiredDispatchRequest;

function requireDispatchRequest() {
  if (hasRequiredDispatchRequest) return dispatchRequest;
  hasRequiredDispatchRequest = 1;

  var utils = requireUtils();
  var transformData = requireTransformData();
  var isCancel = requireIsCancel();
  var defaults = requireDefaults();

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
      config.cancelToken.throwIfRequested();
    }
  }

  /**
   * Dispatch a request to the server using the configured adapter.
   *
   * @param {object} config The config that is to be used for the request
   * @returns {Promise} The Promise to be fulfilled
   */
  dispatchRequest = function dispatchRequest(config) {
    throwIfCancellationRequested(config);

    // Ensure headers exist
    config.headers = config.headers || {};

    // Transform request data
    config.data = transformData(
      config.data,
      config.headers,
      config.transformRequest,
    );

    // Flatten headers
    config.headers = utils.merge(
      config.headers.common || {},
      config.headers[config.method] || {},
      config.headers,
    );

    utils.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      function cleanHeaderConfig(method) {
        delete config.headers[method];
      },
    );

    var adapter = config.adapter || defaults.adapter;

    return adapter(config).then(
      function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse,
        );

        return response;
      },
      function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse,
            );
          }
        }

        return Promise.reject(reason);
      },
    );
  };
  return dispatchRequest;
}

var mergeConfig;
var hasRequiredMergeConfig;

function requireMergeConfig() {
  if (hasRequiredMergeConfig) return mergeConfig;
  hasRequiredMergeConfig = 1;

  var utils = requireUtils();

  /**
   * Config-specific merge-function which creates a new config-object
   * by merging two configuration objects together.
   *
   * @param {Object} config1
   * @param {Object} config2
   * @returns {Object} New object resulting from merging config2 to config1
   */
  mergeConfig = function mergeConfig(config1, config2) {
    // eslint-disable-next-line no-param-reassign
    config2 = config2 || {};
    var config = {};

    var valueFromConfig2Keys = ["url", "method", "params", "data"];
    var mergeDeepPropertiesKeys = ["headers", "auth", "proxy"];
    var defaultToConfig2Keys = [
      "baseURL",
      "url",
      "transformRequest",
      "transformResponse",
      "paramsSerializer",
      "timeout",
      "withCredentials",
      "adapter",
      "responseType",
      "xsrfCookieName",
      "xsrfHeaderName",
      "onUploadProgress",
      "onDownloadProgress",
      "maxContentLength",
      "validateStatus",
      "maxRedirects",
      "httpAgent",
      "httpsAgent",
      "cancelToken",
      "socketPath",
    ];

    utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
      if (typeof config2[prop] !== "undefined") {
        config[prop] = config2[prop];
      }
    });

    utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
      if (utils.isObject(config2[prop])) {
        config[prop] = utils.deepMerge(config1[prop], config2[prop]);
      } else if (typeof config2[prop] !== "undefined") {
        config[prop] = config2[prop];
      } else if (utils.isObject(config1[prop])) {
        config[prop] = utils.deepMerge(config1[prop]);
      } else if (typeof config1[prop] !== "undefined") {
        config[prop] = config1[prop];
      }
    });

    utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
      if (typeof config2[prop] !== "undefined") {
        config[prop] = config2[prop];
      } else if (typeof config1[prop] !== "undefined") {
        config[prop] = config1[prop];
      }
    });

    var axiosKeys = valueFromConfig2Keys
      .concat(mergeDeepPropertiesKeys)
      .concat(defaultToConfig2Keys);

    var otherKeys = Object.keys(config2).filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });

    utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
      if (typeof config2[prop] !== "undefined") {
        config[prop] = config2[prop];
      } else if (typeof config1[prop] !== "undefined") {
        config[prop] = config1[prop];
      }
    });

    return config;
  };
  return mergeConfig;
}

var Axios_1;
var hasRequiredAxios$2;

function requireAxios$2() {
  if (hasRequiredAxios$2) return Axios_1;
  hasRequiredAxios$2 = 1;

  var utils = requireUtils();
  var buildURL = requireBuildURL();
  var InterceptorManager = requireInterceptorManager();
  var dispatchRequest = requireDispatchRequest();
  var mergeConfig = requireMergeConfig();

  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   */
  function Axios(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }

  /**
   * Dispatch a request
   *
   * @param {Object} config The config specific for this request (merged with this.defaults)
   */
  Axios.prototype.request = function request(config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof config === "string") {
      config = arguments[1] || {};
      config.url = arguments[0];
    } else {
      config = config || {};
    }

    config = mergeConfig(this.defaults, config);

    // Set config.method
    if (config.method) {
      config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
      config.method = this.defaults.method.toLowerCase();
    } else {
      config.method = "get";
    }

    // Hook up interceptors middleware
    var chain = [dispatchRequest, undefined];
    var promise = Promise.resolve(config);

    this.interceptors.request.forEach(
      function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      },
    );

    this.interceptors.response.forEach(
      function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      },
    );

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  };

  Axios.prototype.getUri = function getUri(config) {
    config = mergeConfig(this.defaults, config);
    return buildURL(config.url, config.params, config.paramsSerializer).replace(
      /^\?/,
      "",
    );
  };

  // Provide aliases for supported request methods
  utils.forEach(
    ["delete", "get", "head", "options"],
    function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function (url, config) {
        return this.request(
          utils.merge(config || {}, {
            method: method,
            url: url,
          }),
        );
      };
    },
  );

  utils.forEach(
    ["post", "put", "patch"],
    function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function (url, data, config) {
        return this.request(
          utils.merge(config || {}, {
            method: method,
            url: url,
            data: data,
          }),
        );
      };
    },
  );

  Axios_1 = Axios;
  return Axios_1;
}

var Cancel_1;
var hasRequiredCancel;

function requireCancel() {
  if (hasRequiredCancel) return Cancel_1;
  hasRequiredCancel = 1;

  /**
   * A `Cancel` is an object that is thrown when an operation is canceled.
   *
   * @class
   * @param {string=} message The message.
   */
  function Cancel(message) {
    this.message = message;
  }

  Cancel.prototype.toString = function toString() {
    return "Cancel" + (this.message ? ": " + this.message : "");
  };

  Cancel.prototype.__CANCEL__ = true;

  Cancel_1 = Cancel;
  return Cancel_1;
}

var CancelToken_1;
var hasRequiredCancelToken;

function requireCancelToken() {
  if (hasRequiredCancelToken) return CancelToken_1;
  hasRequiredCancelToken = 1;

  var Cancel = requireCancel();

  /**
   * A `CancelToken` is an object that can be used to request cancellation of an operation.
   *
   * @class
   * @param {Function} executor The executor function.
   */
  function CancelToken(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }

    var resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    var token = this;
    executor(function cancel(message) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new Cancel(message);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  CancelToken.prototype.throwIfRequested = function throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  };

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  CancelToken.source = function source() {
    var cancel;
    var token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token: token,
      cancel: cancel,
    };
  };

  CancelToken_1 = CancelToken;
  return CancelToken_1;
}

var spread;
var hasRequiredSpread;

function requireSpread() {
  if (hasRequiredSpread) return spread;
  hasRequiredSpread = 1;

  /**
   * Syntactic sugar for invoking a function and expanding an array for arguments.
   *
   * Common use case would be to use `Function.prototype.apply`.
   *
   *  ```js
   *  function f(x, y, z) {}
   *  var args = [1, 2, 3];
   *  f.apply(null, args);
   *  ```
   *
   * With `spread` this example can be re-written.
   *
   *  ```js
   *  spread(function(x, y, z) {})([1, 2, 3]);
   *  ```
   *
   * @param {Function} callback
   * @returns {Function}
   */
  spread = function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  };
  return spread;
}

var hasRequiredAxios$1;

function requireAxios$1() {
  if (hasRequiredAxios$1) return axios$1.exports;
  hasRequiredAxios$1 = 1;

  var utils = requireUtils();
  var bind = requireBind();
  var Axios = requireAxios$2();
  var mergeConfig = requireMergeConfig();
  var defaults = requireDefaults();

  /**
   * Create an instance of Axios
   *
   * @param {Object} defaultConfig The default config for the instance
   * @return {Axios} A new instance of Axios
   */
  function createInstance(defaultConfig) {
    var context = new Axios(defaultConfig);
    var instance = bind(Axios.prototype.request, context);

    // Copy axios.prototype to instance
    utils.extend(instance, Axios.prototype, context);

    // Copy context to instance
    utils.extend(instance, context);

    return instance;
  }

  // Create the default instance to be exported
  var axios = createInstance(defaults);

  // Expose Axios class to allow class inheritance
  axios.Axios = Axios;

  // Factory for creating new instances
  axios.create = function create(instanceConfig) {
    return createInstance(mergeConfig(axios.defaults, instanceConfig));
  };

  // Expose Cancel & CancelToken
  axios.Cancel = requireCancel();
  axios.CancelToken = requireCancelToken();
  axios.isCancel = requireIsCancel();

  // Expose all/spread
  axios.all = function all(promises) {
    return Promise.all(promises);
  };
  axios.spread = requireSpread();

  axios$1.exports = axios;

  // Allow use of default import syntax in TypeScript
  axios$1.exports.default = axios;
  return axios$1.exports;
}

var axios;
var hasRequiredAxios;

function requireAxios() {
  if (hasRequiredAxios) return axios;
  hasRequiredAxios = 1;
  axios = requireAxios$1();
  return axios;
}

var axiosExports = requireAxios();
var t = /*@__PURE__*/ getDefaultExportFromCjs(axiosExports);

function e(t, e) {
  if (!(t instanceof e))
    throw new TypeError("Cannot call a class as a function");
}
function n(t, e) {
  for (var n, r = 0; r < e.length; r++)
    (((n = e[r]).enumerable = n.enumerable || false),
      (n.configurable = true),
      "value" in n && (n.writable = true),
      Object.defineProperty(t, n.key, n));
}
function r(t, e, n) {
  return (
    e in t
      ? Object.defineProperty(t, e, {
          value: n,
          enumerable: true,
          configurable: true,
          writable: true,
        })
      : (t[e] = n),
    t
  );
}
function a() {
  return (a =
    Object.assign ||
    function (t) {
      for (var e, n = 1; n < arguments.length; n++)
        for (var r in (e = arguments[n]))
          Object.prototype.hasOwnProperty.call(e, r) && (t[r] = e[r]);
      return t;
    }).apply(this, arguments);
}
function o(t, e) {
  if (null == t) return {};
  var n,
    r,
    a = (function (t, e) {
      if (null == t) return {};
      var n,
        r,
        a = {},
        o = Object.keys(t);
      for (r = 0; r < o.length; r++)
        ((n = o[r]), 0 <= e.indexOf(n) || (a[n] = t[n]));
      return a;
    })(t, e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(t);
    for (r = 0; r < o.length; r++)
      ((n = o[r]),
        !(0 <= e.indexOf(n)) &&
          Object.prototype.propertyIsEnumerable.call(t, n) &&
          (a[n] = t[n]));
  }
  return a;
}
var u,
  i = Object.freeze({
    LAST_7_DAYS: "LAST_7_DAYS",
    LAST_30_DAYS: "LAST_30_DAYS",
    LAST_6_MONTHS: "LAST_6_MONTHS",
    LAST_YEAR: "LAST_YEAR",
  }),
  s = function (t) {
    var e = t.dateRange,
      n = t.projectName,
      r = void 0 === n ? null : n,
      a = t.branchNames,
      o = void 0 === a ? [] : a;
    return {
      start: e.startDate,
      end: e.endDate,
      project: r,
      branches: o.join(","),
    };
  },
  c = function () {
    var t = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
      e = t.timeout,
      n = void 0 === e ? null : e,
      r = t.useWritesOnly,
      a = void 0 === r ? null : r,
      o = t.projectName,
      u = void 0 === o ? null : o;
    return { timeout: n, writes_only: a, project: u };
  },
  g = function (t) {
    var e = t.date,
      n = t.projectName,
      r = void 0 === n ? null : n,
      a = t.branchNames;
    return { date: e, project: r, branches: (void 0 === a ? [] : a).join(",") };
  },
  d = function () {
    var t = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : {},
      e = t.authorUsername,
      n = void 0 === e ? null : e,
      r = t.pageNumber,
      a = void 0 === r ? null : r;
    return { author: n, page: a };
  },
  f = Object.freeze(
    (r((u = {}), i.LAST_7_DAYS, "last_7_days"),
    r(u, i.LAST_30_DAYS, "last_30_days"),
    r(u, i.LAST_6_MONTHS, "last_6_months"),
    r(u, i.LAST_YEAR, "last_year"),
    u),
  ),
  m = (function () {
    function r(n) {
      var a =
        1 < arguments.length && void 0 !== arguments[1]
          ? arguments[1]
          : "https://wakatime.com/api/v1/";
      (e(this, r),
        (this.apiKey = n),
        (this.axiosConfiguration = t.create({
          baseURL: a,
          headers: {
            Authorization: "Basic ".concat(
              Buffer.from(this.apiKey).toString("base64"),
            ),
          },
        })));
    }
    return (
      (function (t, e, r) {
        e && n(t.prototype, e);
      })(r, [
        {
          key: "getUser",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/".concat(t))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMe",
          value: function () {
            return this.axiosConfiguration
              .get("users/current")
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getTeams",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/".concat(t, "/teams"))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyTeams",
          value: function () {
            return this.axiosConfiguration
              .get("users/current/teams")
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getUserAgents",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/".concat(t, "/user_agents"))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyUserAgents",
          value: function () {
            return this.axiosConfiguration
              .get("users/current/user_agents")
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getTeamMembers",
          value: function (t) {
            var e = t.userId,
              n = t.teamId;
            return this.axiosConfiguration
              .get("users/".concat(e, "/teams/").concat(n, "/members"))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyTeamMembers",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/current/teams/".concat(t, "/members"))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getTeamMemberSummary",
          value: function (t) {
            var e = t.userId,
              n = t.teamId,
              r = t.teamMemberId,
              a = o(t, ["userId", "teamId", "teamMemberId"]);
            return this.axiosConfiguration
              .get(
                "users/"
                  .concat(e, "/teams/")
                  .concat(n, "/members/")
                  .concat(r, "/summaries"),
                { params: s(a) },
              )
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyTeamMemberSummary",
          value: function (t) {
            var e = t.teamId,
              n = t.teamMemberId,
              r = o(t, ["teamId", "teamMemberId"]);
            return this.axiosConfiguration
              .get(
                "users/current/teams/"
                  .concat(e, "/members/")
                  .concat(n, "/summaries"),
                { params: s(r) },
              )
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getUserSummary",
          value: function (t) {
            var e = t.userId,
              n = o(t, ["userId"]);
            return this.axiosConfiguration
              .get("users/".concat(e, "/summaries"), { params: s(n) })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMySummary",
          value: function (t) {
            var e = a({}, t);
            return this.axiosConfiguration
              .get("users/current/summaries", { params: s(e) })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getUserStats",
          value: function (t) {
            var e = t.userId,
              n = t.range,
              r = o(t, ["userId", "range"]);
            return this.axiosConfiguration
              .get("users/".concat(e, "/stats/").concat(f[n]), { params: c(r) })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyStats",
          value: function (t) {
            var e = t.range,
              n = o(t, ["range"]);
            return this.axiosConfiguration
              .get("users/current/stats/".concat(f[e]), { params: c(n) })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getProjects",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/".concat(t, "/projects"))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyProjects",
          value: function () {
            return this.axiosConfiguration
              .get("users/current/projects")
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getLeaders",
          value: function () {
            var t =
                0 < arguments.length && void 0 !== arguments[0]
                  ? arguments[0]
                  : {},
              e = t.language,
              n = void 0 === e ? null : e,
              r = t.pageNumber,
              a = void 0 === r ? null : r;
            return this.axiosConfiguration
              .get("leaders", { params: { language: n, page: a } })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getHeartbeats",
          value: function (t) {
            var e = t.userId,
              n = t.date;
            return this.axiosConfiguration
              .get("users/".concat(e, "/heartbeats"), { params: { date: n } })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyHeartbeats",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/current/heartbeats", { params: { date: t } })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getGoals",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/".concat(t, "/goals"))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyGoals",
          value: function () {
            return this.axiosConfiguration
              .get("users/current/goals")
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getDurations",
          value: function (t) {
            var e = t.userId,
              n = o(t, ["userId"]);
            return this.axiosConfiguration
              .get("users/".concat(e, "/durations"), { params: g(n) })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyDurations",
          value: function (t) {
            var e = a({}, t);
            return this.axiosConfiguration
              .get("users/current/durations", { params: g(e) })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getCommits",
          value: function (t) {
            var e = t.userId,
              n = t.projectName,
              r = o(t, ["userId", "projectName"]);
            return this.axiosConfiguration
              .get("users/".concat(e, "/projects/").concat(n, "/commits"), {
                params: d(r),
              })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyCommits",
          value: function (t) {
            var e = t.projectName,
              n = o(t, ["projectName"]);
            return this.axiosConfiguration
              .get("users/current/projects/".concat(e, "/commits"), {
                params: d(n),
              })
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMetadata",
          value: function () {
            return this.axiosConfiguration.get("meta");
          },
        },
        {
          key: "getOrganizations",
          value: function (t) {
            return this.axiosConfiguration
              .get("users/".concat(t, "/orgs"))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyOrganizations",
          value: function () {
            return this.axiosConfiguration
              .get("users/current/orgs")
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getOrganizationDashboards",
          value: function (t) {
            var e = t.userId,
              n = t.organizationId;
            return this.axiosConfiguration
              .get("users/".concat(e, "/orgs/").concat(n))
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyOrganizationDashboards",
          value: function (t) {
            return this.getOrganizationDashboards({
              userId: "current",
              organizationId: t,
            });
          },
        },
        {
          key: "getOrganizationDashboardMembers",
          value: function (t) {
            var e = t.userId,
              n = t.organizationId,
              r = t.dashboardId;
            return this.axiosConfiguration
              .get(
                "users/"
                  .concat(e, "/orgs/")
                  .concat(n, "/dashboards/")
                  .concat(r, "/members"),
              )
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyOrganizationDashboardMembers",
          value: function (t) {
            var e = t.organizationId,
              n = t.dashboardId;
            return this.getOrganizationDashboardMembers({
              userId: "current",
              organizationId: e,
              dashboardId: n,
            });
          },
        },
        {
          key: "getOrganizationDashboardMemberSummaries",
          value: function (t) {
            var e = t.userId,
              n = t.organizationId,
              r = t.dashboardId,
              a = t.memberId;
            return this.axiosConfiguration
              .get(
                "users/"
                  .concat(e, "/orgs/")
                  .concat(n, "/dashboards/")
                  .concat(r, "/members/")
                  .concat(a, "/summaries"),
              )
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyOrganizationDashboardMemberSummaries",
          value: function (t) {
            var e = t.organizationId,
              n = t.dashboardId,
              r = t.memberId;
            return this.getOrganizationDashboardMemberSummaries({
              userId: "current",
              organizationId: e,
              dashboardId: n,
              memberId: r,
            });
          },
        },
        {
          key: "getOrganizationDashboardMemberDurations",
          value: function (t) {
            var e = t.userId,
              n = t.organizationId,
              r = t.dashboardId,
              a = t.memberId;
            return this.axiosConfiguration
              .get(
                "users/"
                  .concat(e, "/orgs/")
                  .concat(n, "/dashboards/")
                  .concat(r, "/members/")
                  .concat(a, "/durations"),
              )
              .then(function (t) {
                return t.data;
              });
          },
        },
        {
          key: "getMyOrganizationDashboardMemberDurations",
          value: function (t) {
            var e = t.organizationId,
              n = t.dashboardId,
              r = t.memberId;
            return this.getOrganizationDashboardMemberDurations({
              userId: "current",
              organizationId: e,
              dashboardId: n,
              memberId: r,
            });
          },
        },
      ]),
      r
    );
  })();

var index_esm = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  RANGE: i,
  WakaTimeClient: m,
});

var require$$1 = /*@__PURE__*/ getAugmentedNamespace(index_esm);

function getUserAgent() {
  if (typeof navigator === "object" && "userAgent" in navigator) {
    return navigator.userAgent;
  }
  if (typeof process === "object" && process.version !== undefined) {
    return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
  }
  return "<environment undetectable>";
}

var beforeAfterHook = { exports: {} };

var register_1;
var hasRequiredRegister;

function requireRegister() {
  if (hasRequiredRegister) return register_1;
  hasRequiredRegister = 1;
  register_1 = register;

  function register(state, name, method, options) {
    if (typeof method !== "function") {
      throw new Error("method for before hook must be a function");
    }

    if (!options) {
      options = {};
    }

    if (Array.isArray(name)) {
      return name.reverse().reduce(function (callback, name) {
        return register.bind(null, state, name, callback, options);
      }, method)();
    }

    return Promise.resolve().then(function () {
      if (!state.registry[name]) {
        return method(options);
      }

      return state.registry[name].reduce(function (method, registered) {
        return registered.hook.bind(null, method, options);
      }, method)();
    });
  }
  return register_1;
}

var add;
var hasRequiredAdd;

function requireAdd() {
  if (hasRequiredAdd) return add;
  hasRequiredAdd = 1;
  add = addHook;

  function addHook(state, kind, name, hook) {
    var orig = hook;
    if (!state.registry[name]) {
      state.registry[name] = [];
    }

    if (kind === "before") {
      hook = function (method, options) {
        return Promise.resolve()
          .then(orig.bind(null, options))
          .then(method.bind(null, options));
      };
    }

    if (kind === "after") {
      hook = function (method, options) {
        var result;
        return Promise.resolve()
          .then(method.bind(null, options))
          .then(function (result_) {
            result = result_;
            return orig(result, options);
          })
          .then(function () {
            return result;
          });
      };
    }

    if (kind === "error") {
      hook = function (method, options) {
        return Promise.resolve()
          .then(method.bind(null, options))
          .catch(function (error) {
            return orig(error, options);
          });
      };
    }

    state.registry[name].push({
      hook: hook,
      orig: orig,
    });
  }
  return add;
}

var remove;
var hasRequiredRemove;

function requireRemove() {
  if (hasRequiredRemove) return remove;
  hasRequiredRemove = 1;
  remove = removeHook;

  function removeHook(state, name, method) {
    if (!state.registry[name]) {
      return;
    }

    var index = state.registry[name]
      .map(function (registered) {
        return registered.orig;
      })
      .indexOf(method);

    if (index === -1) {
      return;
    }

    state.registry[name].splice(index, 1);
  }
  return remove;
}

var hasRequiredBeforeAfterHook;

function requireBeforeAfterHook() {
  if (hasRequiredBeforeAfterHook) return beforeAfterHook.exports;
  hasRequiredBeforeAfterHook = 1;
  var register = requireRegister();
  var addHook = requireAdd();
  var removeHook = requireRemove();

  // bind with array of arguments: https://stackoverflow.com/a/21792913
  var bind = Function.bind;
  var bindable = bind.bind(bind);

  function bindApi(hook, state, name) {
    var removeHookRef = bindable(removeHook, null).apply(
      null,
      name ? [state, name] : [state],
    );
    hook.api = { remove: removeHookRef };
    hook.remove = removeHookRef;
    ["before", "error", "after", "wrap"].forEach(function (kind) {
      var args = name ? [state, kind, name] : [state, kind];
      hook[kind] = hook.api[kind] = bindable(addHook, null).apply(null, args);
    });
  }

  function HookSingular() {
    var singularHookName = "h";
    var singularHookState = {
      registry: {},
    };
    var singularHook = register.bind(null, singularHookState, singularHookName);
    bindApi(singularHook, singularHookState, singularHookName);
    return singularHook;
  }

  function HookCollection() {
    var state = {
      registry: {},
    };

    var hook = register.bind(null, state);
    bindApi(hook, state);

    return hook;
  }

  var collectionHookDeprecationMessageDisplayed = false;
  function Hook() {
    if (!collectionHookDeprecationMessageDisplayed) {
      console.warn(
        '[before-after-hook]: "Hook()" repurposing warning, use "Hook.Collection()". Read more: https://git.io/upgrade-before-after-hook-to-1.4',
      );
      collectionHookDeprecationMessageDisplayed = true;
    }
    return HookCollection();
  }

  Hook.Singular = HookSingular.bind();
  Hook.Collection = HookCollection.bind();

  beforeAfterHook.exports = Hook;
  // expose constructors as a named property for TypeScript
  beforeAfterHook.exports.Hook = Hook;
  beforeAfterHook.exports.Singular = Hook.Singular;
  beforeAfterHook.exports.Collection = Hook.Collection;
  return beforeAfterHook.exports;
}

var beforeAfterHookExports = requireBeforeAfterHook();

const VERSION$7 = "9.0.6";

const userAgent = `octokit-endpoint.js/${VERSION$7} ${getUserAgent()}`;
const DEFAULTS = {
  method: "GET",
  baseUrl: "https://api.github.com",
  headers: {
    accept: "application/vnd.github.v3+json",
    "user-agent": userAgent,
  },
  mediaType: {
    format: "",
  },
};

function lowercaseKeys(object) {
  if (!object) {
    return {};
  }
  return Object.keys(object).reduce((newObj, key) => {
    newObj[key.toLowerCase()] = object[key];
    return newObj;
  }, {});
}

function isPlainObject$1(value) {
  if (typeof value !== "object" || value === null) return false;
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  const Ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof Ctor === "function" &&
    Ctor instanceof Ctor &&
    Function.prototype.call(Ctor) === Function.prototype.call(value)
  );
}

function mergeDeep(defaults, options) {
  const result = Object.assign({}, defaults);
  Object.keys(options).forEach((key) => {
    if (isPlainObject$1(options[key])) {
      if (!(key in defaults)) Object.assign(result, { [key]: options[key] });
      else result[key] = mergeDeep(defaults[key], options[key]);
    } else {
      Object.assign(result, { [key]: options[key] });
    }
  });
  return result;
}

function removeUndefinedProperties(obj) {
  for (const key in obj) {
    if (obj[key] === void 0) {
      delete obj[key];
    }
  }
  return obj;
}

function merge(defaults, route, options) {
  if (typeof route === "string") {
    let [method, url] = route.split(" ");
    options = Object.assign(url ? { method, url } : { url: method }, options);
  } else {
    options = Object.assign({}, route);
  }
  options.headers = lowercaseKeys(options.headers);
  removeUndefinedProperties(options);
  removeUndefinedProperties(options.headers);
  const mergedOptions = mergeDeep(defaults || {}, options);
  if (options.url === "/graphql") {
    if (defaults && defaults.mediaType.previews?.length) {
      mergedOptions.mediaType.previews = defaults.mediaType.previews
        .filter(
          (preview) => !mergedOptions.mediaType.previews.includes(preview),
        )
        .concat(mergedOptions.mediaType.previews);
    }
    mergedOptions.mediaType.previews = (
      mergedOptions.mediaType.previews || []
    ).map((preview) => preview.replace(/-preview/, ""));
  }
  return mergedOptions;
}

function addQueryParameters(url, parameters) {
  const separator = /\?/.test(url) ? "&" : "?";
  const names = Object.keys(parameters);
  if (names.length === 0) {
    return url;
  }
  return (
    url +
    separator +
    names
      .map((name) => {
        if (name === "q") {
          return (
            "q=" + parameters.q.split("+").map(encodeURIComponent).join("+")
          );
        }
        return `${name}=${encodeURIComponent(parameters[name])}`;
      })
      .join("&")
  );
}

const urlVariableRegex = /\{[^{}}]+\}/g;
function removeNonChars(variableName) {
  return variableName.replace(/(?:^\W+)|(?:(?<!\W)\W+$)/g, "").split(/,/);
}
function extractUrlVariableNames(url) {
  const matches = url.match(urlVariableRegex);
  if (!matches) {
    return [];
  }
  return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
}

function omit(object, keysToOmit) {
  const result = { __proto__: null };
  for (const key of Object.keys(object)) {
    if (keysToOmit.indexOf(key) === -1) {
      result[key] = object[key];
    }
  }
  return result;
}

function encodeReserved(str) {
  return str
    .split(/(%[0-9A-Fa-f]{2})/g)
    .map(function (part) {
      if (!/%[0-9A-Fa-f]/.test(part)) {
        part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
      }
      return part;
    })
    .join("");
}
function encodeUnreserved(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
function encodeValue(operator, value, key) {
  value =
    operator === "+" || operator === "#"
      ? encodeReserved(value)
      : encodeUnreserved(value);
  if (key) {
    return encodeUnreserved(key) + "=" + value;
  } else {
    return value;
  }
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isKeyOperator(operator) {
  return operator === ";" || operator === "&" || operator === "?";
}
function getValues(context, operator, key, modifier) {
  var value = context[key],
    result = [];
  if (isDefined(value) && value !== "") {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      value = value.toString();
      if (modifier && modifier !== "*") {
        value = value.substring(0, parseInt(modifier, 10));
      }
      result.push(
        encodeValue(operator, value, isKeyOperator(operator) ? key : ""),
      );
    } else {
      if (modifier === "*") {
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function (value2) {
            result.push(
              encodeValue(operator, value2, isKeyOperator(operator) ? key : ""),
            );
          });
        } else {
          Object.keys(value).forEach(function (k) {
            if (isDefined(value[k])) {
              result.push(encodeValue(operator, value[k], k));
            }
          });
        }
      } else {
        const tmp = [];
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function (value2) {
            tmp.push(encodeValue(operator, value2));
          });
        } else {
          Object.keys(value).forEach(function (k) {
            if (isDefined(value[k])) {
              tmp.push(encodeUnreserved(k));
              tmp.push(encodeValue(operator, value[k].toString()));
            }
          });
        }
        if (isKeyOperator(operator)) {
          result.push(encodeUnreserved(key) + "=" + tmp.join(","));
        } else if (tmp.length !== 0) {
          result.push(tmp.join(","));
        }
      }
    }
  } else {
    if (operator === ";") {
      if (isDefined(value)) {
        result.push(encodeUnreserved(key));
      }
    } else if (value === "" && (operator === "&" || operator === "?")) {
      result.push(encodeUnreserved(key) + "=");
    } else if (value === "") {
      result.push("");
    }
  }
  return result;
}
function parseUrl(template) {
  return {
    expand: expand.bind(null, template),
  };
}
function expand(template, context) {
  var operators = ["+", "#", ".", "/", ";", "?", "&"];
  template = template.replace(
    /\{([^\{\}]+)\}|([^\{\}]+)/g,
    function (_, expression, literal) {
      if (expression) {
        let operator = "";
        const values = [];
        if (operators.indexOf(expression.charAt(0)) !== -1) {
          operator = expression.charAt(0);
          expression = expression.substr(1);
        }
        expression.split(/,/g).forEach(function (variable) {
          var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
          values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
        });
        if (operator && operator !== "+") {
          var separator = ",";
          if (operator === "?") {
            separator = "&";
          } else if (operator !== "#") {
            separator = operator;
          }
          return (values.length !== 0 ? operator : "") + values.join(separator);
        } else {
          return values.join(",");
        }
      } else {
        return encodeReserved(literal);
      }
    },
  );
  if (template === "/") {
    return template;
  } else {
    return template.replace(/\/$/, "");
  }
}

function parse(options) {
  let method = options.method.toUpperCase();
  let url = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
  let headers = Object.assign({}, options.headers);
  let body;
  let parameters = omit(options, [
    "method",
    "baseUrl",
    "url",
    "headers",
    "request",
    "mediaType",
  ]);
  const urlVariableNames = extractUrlVariableNames(url);
  url = parseUrl(url).expand(parameters);
  if (!/^http/.test(url)) {
    url = options.baseUrl + url;
  }
  const omittedParameters = Object.keys(options)
    .filter((option) => urlVariableNames.includes(option))
    .concat("baseUrl");
  const remainingParameters = omit(parameters, omittedParameters);
  const isBinaryRequest = /application\/octet-stream/i.test(headers.accept);
  if (!isBinaryRequest) {
    if (options.mediaType.format) {
      headers.accept = headers.accept
        .split(/,/)
        .map((format) =>
          format.replace(
            /application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/,
            `application/vnd$1$2.${options.mediaType.format}`,
          ),
        )
        .join(",");
    }
    if (url.endsWith("/graphql")) {
      if (options.mediaType.previews?.length) {
        const previewsFromAcceptHeader =
          headers.accept.match(/(?<![\w-])[\w-]+(?=-preview)/g) || [];
        headers.accept = previewsFromAcceptHeader
          .concat(options.mediaType.previews)
          .map((preview) => {
            const format = options.mediaType.format
              ? `.${options.mediaType.format}`
              : "+json";
            return `application/vnd.github.${preview}-preview${format}`;
          })
          .join(",");
      }
    }
  }
  if (["GET", "HEAD"].includes(method)) {
    url = addQueryParameters(url, remainingParameters);
  } else {
    if ("data" in remainingParameters) {
      body = remainingParameters.data;
    } else {
      if (Object.keys(remainingParameters).length) {
        body = remainingParameters;
      }
    }
  }
  if (!headers["content-type"] && typeof body !== "undefined") {
    headers["content-type"] = "application/json; charset=utf-8";
  }
  if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") {
    body = "";
  }
  return Object.assign(
    { method, url, headers },
    typeof body !== "undefined" ? { body } : null,
    options.request ? { request: options.request } : null,
  );
}

function endpointWithDefaults(defaults, route, options) {
  return parse(merge(defaults, route, options));
}

function withDefaults$2(oldDefaults, newDefaults) {
  const DEFAULTS = merge(oldDefaults, newDefaults);
  const endpoint = endpointWithDefaults.bind(null, DEFAULTS);
  return Object.assign(endpoint, {
    DEFAULTS,
    defaults: withDefaults$2.bind(null, DEFAULTS),
    merge: merge.bind(null, DEFAULTS),
    parse,
  });
}

const endpoint = withDefaults$2(null, DEFAULTS);

const VERSION$6 = "8.4.1";

function isPlainObject(value) {
  if (typeof value !== "object" || value === null) return false;
  if (Object.prototype.toString.call(value) !== "[object Object]") return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  const Ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof Ctor === "function" &&
    Ctor instanceof Ctor &&
    Function.prototype.call(Ctor) === Function.prototype.call(value)
  );
}

class Deprecation extends Error {
  constructor(message) {
    super(message); // Maintains proper stack trace (only available on V8)

    /* istanbul ignore next */

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = "Deprecation";
  }
}

var once$1 = { exports: {} };

var wrappy_1;
var hasRequiredWrappy;

function requireWrappy() {
  if (hasRequiredWrappy) return wrappy_1;
  hasRequiredWrappy = 1;
  // Returns a wrapper function that returns a wrapped callback
  // The wrapper function should do some stuff, and return a
  // presumably different callback function.
  // This makes sure that own properties are retained, so that
  // decorations and such are not lost along the way.
  wrappy_1 = wrappy;
  function wrappy(fn, cb) {
    if (fn && cb) return wrappy(fn)(cb);

    if (typeof fn !== "function") throw new TypeError("need wrapper function");

    Object.keys(fn).forEach(function (k) {
      wrapper[k] = fn[k];
    });

    return wrapper;

    function wrapper() {
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      var ret = fn.apply(this, args);
      var cb = args[args.length - 1];
      if (typeof ret === "function" && ret !== cb) {
        Object.keys(cb).forEach(function (k) {
          ret[k] = cb[k];
        });
      }
      return ret;
    }
  }
  return wrappy_1;
}

var hasRequiredOnce;

function requireOnce() {
  if (hasRequiredOnce) return once$1.exports;
  hasRequiredOnce = 1;
  var wrappy = requireWrappy();
  once$1.exports = wrappy(once);
  once$1.exports.strict = wrappy(onceStrict);

  once.proto = once(function () {
    Object.defineProperty(Function.prototype, "once", {
      value: function () {
        return once(this);
      },
      configurable: true,
    });

    Object.defineProperty(Function.prototype, "onceStrict", {
      value: function () {
        return onceStrict(this);
      },
      configurable: true,
    });
  });

  function once(fn) {
    var f = function () {
      if (f.called) return f.value;
      f.called = true;
      return (f.value = fn.apply(this, arguments));
    };
    f.called = false;
    return f;
  }

  function onceStrict(fn) {
    var f = function () {
      if (f.called) throw new Error(f.onceError);
      f.called = true;
      return (f.value = fn.apply(this, arguments));
    };
    var name = fn.name || "Function wrapped with `once`";
    f.onceError = name + " shouldn't be called more than once";
    f.called = false;
    return f;
  }
  return once$1.exports;
}

var onceExports = requireOnce();
var once = /*@__PURE__*/ getDefaultExportFromCjs(onceExports);

const logOnceCode = once((deprecation) => console.warn(deprecation));
const logOnceHeaders = once((deprecation) => console.warn(deprecation));
class RequestError extends Error {
  constructor(message, statusCode, options) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "HttpError";
    this.status = statusCode;
    let headers;
    if ("headers" in options && typeof options.headers !== "undefined") {
      headers = options.headers;
    }
    if ("response" in options) {
      this.response = options.response;
      headers = options.response.headers;
    }
    const requestCopy = Object.assign({}, options.request);
    if (options.request.headers.authorization) {
      requestCopy.headers = Object.assign({}, options.request.headers, {
        authorization: options.request.headers.authorization.replace(
          /(?<! ) .*$/,
          " [REDACTED]",
        ),
      });
    }
    requestCopy.url = requestCopy.url
      .replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]")
      .replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
    this.request = requestCopy;
    Object.defineProperty(this, "code", {
      get() {
        logOnceCode(
          new Deprecation(
            "[@octokit/request-error] `error.code` is deprecated, use `error.status`.",
          ),
        );
        return statusCode;
      },
    });
    Object.defineProperty(this, "headers", {
      get() {
        logOnceHeaders(
          new Deprecation(
            "[@octokit/request-error] `error.headers` is deprecated, use `error.response.headers`.",
          ),
        );
        return headers || {};
      },
    });
  }
}

function getBufferResponse(response) {
  return response.arrayBuffer();
}

function fetchWrapper(requestOptions) {
  const log =
    requestOptions.request && requestOptions.request.log
      ? requestOptions.request.log
      : console;
  const parseSuccessResponseBody =
    requestOptions.request?.parseSuccessResponseBody !== false;
  if (
    isPlainObject(requestOptions.body) ||
    Array.isArray(requestOptions.body)
  ) {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }
  let headers = {};
  let status;
  let url;
  let { fetch } = globalThis;
  if (requestOptions.request?.fetch) {
    fetch = requestOptions.request.fetch;
  }
  if (!fetch) {
    throw new Error(
      "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing",
    );
  }
  return fetch(requestOptions.url, {
    method: requestOptions.method,
    body: requestOptions.body,
    redirect: requestOptions.request?.redirect,
    headers: requestOptions.headers,
    signal: requestOptions.request?.signal,
    // duplex must be set if request.body is ReadableStream or Async Iterables.
    // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
    ...(requestOptions.body && { duplex: "half" }),
  })
    .then(async (response) => {
      url = response.url;
      status = response.status;
      for (const keyAndValue of response.headers) {
        headers[keyAndValue[0]] = keyAndValue[1];
      }
      if ("deprecation" in headers) {
        const matches =
          headers.link && headers.link.match(/<([^<>]+)>; rel="deprecation"/);
        const deprecationLink = matches && matches.pop();
        log.warn(
          `[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${headers.sunset}${deprecationLink ? `. See ${deprecationLink}` : ""}`,
        );
      }
      if (status === 204 || status === 205) {
        return;
      }
      if (requestOptions.method === "HEAD") {
        if (status < 400) {
          return;
        }
        throw new RequestError(response.statusText, status, {
          response: {
            url,
            status,
            headers,
            data: void 0,
          },
          request: requestOptions,
        });
      }
      if (status === 304) {
        throw new RequestError("Not modified", status, {
          response: {
            url,
            status,
            headers,
            data: await getResponseData(response),
          },
          request: requestOptions,
        });
      }
      if (status >= 400) {
        const data = await getResponseData(response);
        const error = new RequestError(toErrorMessage(data), status, {
          response: {
            url,
            status,
            headers,
            data,
          },
          request: requestOptions,
        });
        throw error;
      }
      return parseSuccessResponseBody
        ? await getResponseData(response)
        : response.body;
    })
    .then((data) => {
      return {
        status,
        url,
        headers,
        data,
      };
    })
    .catch((error) => {
      if (error instanceof RequestError) throw error;
      else if (error.name === "AbortError") throw error;
      let message = error.message;
      if (error.name === "TypeError" && "cause" in error) {
        if (error.cause instanceof Error) {
          message = error.cause.message;
        } else if (typeof error.cause === "string") {
          message = error.cause;
        }
      }
      throw new RequestError(message, 500, {
        request: requestOptions,
      });
    });
}
async function getResponseData(response) {
  const contentType = response.headers.get("content-type");
  if (/application\/json/.test(contentType)) {
    return response
      .json()
      .catch(() => response.text())
      .catch(() => "");
  }
  if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
    return response.text();
  }
  return getBufferResponse(response);
}
function toErrorMessage(data) {
  if (typeof data === "string") return data;
  let suffix;
  if ("documentation_url" in data) {
    suffix = ` - ${data.documentation_url}`;
  } else {
    suffix = "";
  }
  if ("message" in data) {
    if (Array.isArray(data.errors)) {
      return `${data.message}: ${data.errors.map(JSON.stringify).join(", ")}${suffix}`;
    }
    return `${data.message}${suffix}`;
  }
  return `Unknown error: ${JSON.stringify(data)}`;
}

function withDefaults$1(oldEndpoint, newDefaults) {
  const endpoint = oldEndpoint.defaults(newDefaults);
  const newApi = function (route, parameters) {
    const endpointOptions = endpoint.merge(route, parameters);
    if (!endpointOptions.request || !endpointOptions.request.hook) {
      return fetchWrapper(endpoint.parse(endpointOptions));
    }
    const request = (route2, parameters2) => {
      return fetchWrapper(endpoint.parse(endpoint.merge(route2, parameters2)));
    };
    Object.assign(request, {
      endpoint,
      defaults: withDefaults$1.bind(null, endpoint),
    });
    return endpointOptions.request.hook(request, endpointOptions);
  };
  return Object.assign(newApi, {
    endpoint,
    defaults: withDefaults$1.bind(null, endpoint),
  });
}

const request = withDefaults$1(endpoint, {
  headers: {
    "user-agent": `octokit-request.js/${VERSION$6} ${getUserAgent()}`,
  },
});

// pkg/dist-src/index.js

// pkg/dist-src/version.js
var VERSION$5 = "7.1.1";

// pkg/dist-src/error.js
function _buildMessageForResponseErrors(data) {
  return (
    `Request failed due to following response errors:
` + data.errors.map((e) => ` - ${e.message}`).join("\n")
  );
}
var GraphqlResponseError = class extends Error {
  constructor(request2, headers, response) {
    super(_buildMessageForResponseErrors(response));
    this.request = request2;
    this.headers = headers;
    this.response = response;
    this.name = "GraphqlResponseError";
    this.errors = response.errors;
    this.data = response.data;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};

// pkg/dist-src/graphql.js
var NON_VARIABLE_OPTIONS = [
  "method",
  "baseUrl",
  "url",
  "headers",
  "request",
  "query",
  "mediaType",
];
var FORBIDDEN_VARIABLE_OPTIONS = ["query", "method", "url"];
var GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
function graphql(request2, query, options) {
  if (options) {
    if (typeof query === "string" && "query" in options) {
      return Promise.reject(
        new Error(`[@octokit/graphql] "query" cannot be used as variable name`),
      );
    }
    for (const key in options) {
      if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key)) continue;
      return Promise.reject(
        new Error(
          `[@octokit/graphql] "${key}" cannot be used as variable name`,
        ),
      );
    }
  }
  const parsedOptions =
    typeof query === "string" ? Object.assign({ query }, options) : query;
  const requestOptions = Object.keys(parsedOptions).reduce((result, key) => {
    if (NON_VARIABLE_OPTIONS.includes(key)) {
      result[key] = parsedOptions[key];
      return result;
    }
    if (!result.variables) {
      result.variables = {};
    }
    result.variables[key] = parsedOptions[key];
    return result;
  }, {});
  const baseUrl = parsedOptions.baseUrl || request2.endpoint.DEFAULTS.baseUrl;
  if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
    requestOptions.url = baseUrl.replace(GHES_V3_SUFFIX_REGEX, "/api/graphql");
  }
  return request2(requestOptions).then((response) => {
    if (response.data.errors) {
      const headers = {};
      for (const key of Object.keys(response.headers)) {
        headers[key] = response.headers[key];
      }
      throw new GraphqlResponseError(requestOptions, headers, response.data);
    }
    return response.data.data;
  });
}

// pkg/dist-src/with-defaults.js
function withDefaults(request2, newDefaults) {
  const newRequest = request2.defaults(newDefaults);
  const newApi = (query, options) => {
    return graphql(newRequest, query, options);
  };
  return Object.assign(newApi, {
    defaults: withDefaults.bind(null, newRequest),
    endpoint: newRequest.endpoint,
  });
}

// pkg/dist-src/index.js
withDefaults(request, {
  headers: {
    "user-agent": `octokit-graphql.js/${VERSION$5} ${getUserAgent()}`,
  },
  method: "POST",
  url: "/graphql",
});
function withCustomRequest(customRequest) {
  return withDefaults(customRequest, {
    method: "POST",
    url: "/graphql",
  });
}

const REGEX_IS_INSTALLATION_LEGACY = /^v1\./;
const REGEX_IS_INSTALLATION = /^ghs_/;
const REGEX_IS_USER_TO_SERVER = /^ghu_/;
async function auth(token) {
  const isApp = token.split(/\./).length === 3;
  const isInstallation =
    REGEX_IS_INSTALLATION_LEGACY.test(token) ||
    REGEX_IS_INSTALLATION.test(token);
  const isUserToServer = REGEX_IS_USER_TO_SERVER.test(token);
  const tokenType = isApp
    ? "app"
    : isInstallation
      ? "installation"
      : isUserToServer
        ? "user-to-server"
        : "oauth";
  return {
    type: "token",
    token,
    tokenType,
  };
}

function withAuthorizationPrefix(token) {
  if (token.split(/\./).length === 3) {
    return `bearer ${token}`;
  }
  return `token ${token}`;
}

async function hook(token, request, route, parameters) {
  const endpoint = request.endpoint.merge(route, parameters);
  endpoint.headers.authorization = withAuthorizationPrefix(token);
  return request(endpoint);
}

const createTokenAuth = function createTokenAuth2(token) {
  if (!token) {
    throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
  }
  if (typeof token !== "string") {
    throw new Error(
      "[@octokit/auth-token] Token passed to createTokenAuth is not a string",
    );
  }
  token = token.replace(/^(token|bearer) +/i, "");
  return Object.assign(auth.bind(null, token), {
    hook: hook.bind(null, token),
  });
};

// pkg/dist-src/index.js

// pkg/dist-src/version.js
var VERSION$4 = "5.2.2";

// pkg/dist-src/index.js
var noop = () => {};
var consoleWarn = console.warn.bind(console);
var consoleError = console.error.bind(console);
function createLogger(logger = {}) {
  if (typeof logger.debug !== "function") {
    logger.debug = noop;
  }
  if (typeof logger.info !== "function") {
    logger.info = noop;
  }
  if (typeof logger.warn !== "function") {
    logger.warn = consoleWarn;
  }
  if (typeof logger.error !== "function") {
    logger.error = consoleError;
  }
  return logger;
}
var userAgentTrail = `octokit-core.js/${VERSION$4} ${getUserAgent()}`;
var Octokit$1 = class Octokit {
  static {
    this.VERSION = VERSION$4;
  }
  static defaults(defaults) {
    const OctokitWithDefaults = class extends this {
      constructor(...args) {
        const options = args[0] || {};
        if (typeof defaults === "function") {
          super(defaults(options));
          return;
        }
        super(
          Object.assign(
            {},
            defaults,
            options,
            options.userAgent && defaults.userAgent
              ? {
                  userAgent: `${options.userAgent} ${defaults.userAgent}`,
                }
              : null,
          ),
        );
      }
    };
    return OctokitWithDefaults;
  }
  static {
    this.plugins = [];
  }
  /**
   * Attach a plugin (or many) to your Octokit instance.
   *
   * @example
   * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
   */
  static plugin(...newPlugins) {
    const currentPlugins = this.plugins;
    const NewOctokit = class extends this {
      static {
        this.plugins = currentPlugins.concat(
          newPlugins.filter((plugin) => !currentPlugins.includes(plugin)),
        );
      }
    };
    return NewOctokit;
  }
  constructor(options = {}) {
    const hook = new beforeAfterHookExports.Collection();
    const requestDefaults = {
      baseUrl: request.endpoint.DEFAULTS.baseUrl,
      headers: {},
      request: Object.assign({}, options.request, {
        // @ts-ignore internal usage only, no need to type
        hook: hook.bind(null, "request"),
      }),
      mediaType: {
        previews: [],
        format: "",
      },
    };
    requestDefaults.headers["user-agent"] = options.userAgent
      ? `${options.userAgent} ${userAgentTrail}`
      : userAgentTrail;
    if (options.baseUrl) {
      requestDefaults.baseUrl = options.baseUrl;
    }
    if (options.previews) {
      requestDefaults.mediaType.previews = options.previews;
    }
    if (options.timeZone) {
      requestDefaults.headers["time-zone"] = options.timeZone;
    }
    this.request = request.defaults(requestDefaults);
    this.graphql = withCustomRequest(this.request).defaults(requestDefaults);
    this.log = createLogger(options.log);
    this.hook = hook;
    if (!options.authStrategy) {
      if (!options.auth) {
        this.auth = async () => ({
          type: "unauthenticated",
        });
      } else {
        const auth = createTokenAuth(options.auth);
        hook.wrap("request", auth.hook);
        this.auth = auth;
      }
    } else {
      const { authStrategy, ...otherOptions } = options;
      const auth = authStrategy(
        Object.assign(
          {
            request: this.request,
            log: this.log,
            // we pass the current octokit instance as well as its constructor options
            // to allow for authentication strategies that return a new octokit instance
            // that shares the same internal state as the current one. The original
            // requirement for this was the "event-octokit" authentication strategy
            // of https://github.com/probot/octokit-auth-probot.
            octokit: this,
            octokitOptions: otherOptions,
          },
          options.auth,
        ),
      );
      hook.wrap("request", auth.hook);
      this.auth = auth;
    }
    const classConstructor = this.constructor;
    for (let i = 0; i < classConstructor.plugins.length; ++i) {
      Object.assign(this, classConstructor.plugins[i](this, options));
    }
  }
};

const VERSION$3 = "4.0.1";

function requestLog(octokit) {
  octokit.hook.wrap("request", (request, options) => {
    octokit.log.debug("request", options);
    const start = Date.now();
    const requestOptions = octokit.request.endpoint.parse(options);
    const path = requestOptions.url.replace(options.baseUrl, "");
    return request(options)
      .then((response) => {
        octokit.log.info(
          `${requestOptions.method} ${path} - ${response.status} in ${Date.now() - start}ms`,
        );
        return response;
      })
      .catch((error) => {
        octokit.log.info(
          `${requestOptions.method} ${path} - ${error.status} in ${Date.now() - start}ms`,
        );
        throw error;
      });
  });
}
requestLog.VERSION = VERSION$3;

// pkg/dist-src/version.js
var VERSION$2 = "11.4.4-cjs.2";

// pkg/dist-src/normalize-paginated-list-response.js
function normalizePaginatedListResponse(response) {
  if (!response.data) {
    return {
      ...response,
      data: [],
    };
  }
  const responseNeedsNormalization =
    "total_count" in response.data && !("url" in response.data);
  if (!responseNeedsNormalization) return response;
  const incompleteResults = response.data.incomplete_results;
  const repositorySelection = response.data.repository_selection;
  const totalCount = response.data.total_count;
  delete response.data.incomplete_results;
  delete response.data.repository_selection;
  delete response.data.total_count;
  const namespaceKey = Object.keys(response.data)[0];
  const data = response.data[namespaceKey];
  response.data = data;
  if (typeof incompleteResults !== "undefined") {
    response.data.incomplete_results = incompleteResults;
  }
  if (typeof repositorySelection !== "undefined") {
    response.data.repository_selection = repositorySelection;
  }
  response.data.total_count = totalCount;
  return response;
}

// pkg/dist-src/iterator.js
function iterator(octokit, route, parameters) {
  const options =
    typeof route === "function"
      ? route.endpoint(parameters)
      : octokit.request.endpoint(route, parameters);
  const requestMethod = typeof route === "function" ? route : octokit.request;
  const method = options.method;
  const headers = options.headers;
  let url = options.url;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (!url) return { done: true };
        try {
          const response = await requestMethod({ method, url, headers });
          const normalizedResponse = normalizePaginatedListResponse(response);
          url = ((normalizedResponse.headers.link || "").match(
            /<([^<>]+)>;\s*rel="next"/,
          ) || [])[1];
          return { value: normalizedResponse };
        } catch (error) {
          if (error.status !== 409) throw error;
          url = "";
          return {
            value: {
              status: 200,
              headers: {},
              data: [],
            },
          };
        }
      },
    }),
  };
}

// pkg/dist-src/paginate.js
function paginate(octokit, route, parameters, mapFn) {
  if (typeof parameters === "function") {
    mapFn = parameters;
    parameters = void 0;
  }
  return gather(
    octokit,
    [],
    iterator(octokit, route, parameters)[Symbol.asyncIterator](),
    mapFn,
  );
}
function gather(octokit, results, iterator2, mapFn) {
  return iterator2.next().then((result) => {
    if (result.done) {
      return results;
    }
    let earlyExit = false;
    function done() {
      earlyExit = true;
    }
    results = results.concat(
      mapFn ? mapFn(result.value, done) : result.value.data,
    );
    if (earlyExit) {
      return results;
    }
    return gather(octokit, results, iterator2, mapFn);
  });
}

// pkg/dist-src/compose-paginate.js
Object.assign(paginate, {
  iterator,
});

// pkg/dist-src/index.js
function paginateRest(octokit) {
  return {
    paginate: Object.assign(paginate.bind(null, octokit), {
      iterator: iterator.bind(null, octokit),
    }),
  };
}
paginateRest.VERSION = VERSION$2;

const VERSION$1 = "13.3.2-cjs.1";

const Endpoints = {
  actions: {
    addCustomLabelsToSelfHostedRunnerForOrg: [
      "POST /orgs/{org}/actions/runners/{runner_id}/labels",
    ],
    addCustomLabelsToSelfHostedRunnerForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
    ],
    addRepoAccessToSelfHostedRunnerGroupInOrg: [
      "PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}",
    ],
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
    ],
    addSelectedRepoToOrgVariable: [
      "PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id}",
    ],
    approveWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve",
    ],
    cancelWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel",
    ],
    createEnvironmentVariable: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/variables",
    ],
    createOrUpdateEnvironmentSecret: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}",
    ],
    createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
    ],
    createOrgVariable: ["POST /orgs/{org}/actions/variables"],
    createRegistrationTokenForOrg: [
      "POST /orgs/{org}/actions/runners/registration-token",
    ],
    createRegistrationTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/registration-token",
    ],
    createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
    createRemoveTokenForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/remove-token",
    ],
    createRepoVariable: ["POST /repos/{owner}/{repo}/actions/variables"],
    createWorkflowDispatch: [
      "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
    ],
    deleteActionsCacheById: [
      "DELETE /repos/{owner}/{repo}/actions/caches/{cache_id}",
    ],
    deleteActionsCacheByKey: [
      "DELETE /repos/{owner}/{repo}/actions/caches{?key,ref}",
    ],
    deleteArtifact: [
      "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}",
    ],
    deleteEnvironmentSecret: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}",
    ],
    deleteEnvironmentVariable: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}",
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
    deleteOrgVariable: ["DELETE /orgs/{org}/actions/variables/{name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}",
    ],
    deleteRepoVariable: [
      "DELETE /repos/{owner}/{repo}/actions/variables/{name}",
    ],
    deleteSelfHostedRunnerFromOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}",
    ],
    deleteSelfHostedRunnerFromRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}",
    ],
    deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
    deleteWorkflowRunLogs: [
      "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
    ],
    disableSelectedRepositoryGithubActionsOrganization: [
      "DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}",
    ],
    disableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable",
    ],
    downloadArtifact: [
      "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
    ],
    downloadJobLogsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs",
    ],
    downloadWorkflowRunAttemptLogs: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs",
    ],
    downloadWorkflowRunLogs: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
    ],
    enableSelectedRepositoryGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories/{repository_id}",
    ],
    enableWorkflow: [
      "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable",
    ],
    forceCancelWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/force-cancel",
    ],
    generateRunnerJitconfigForOrg: [
      "POST /orgs/{org}/actions/runners/generate-jitconfig",
    ],
    generateRunnerJitconfigForRepo: [
      "POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig",
    ],
    getActionsCacheList: ["GET /repos/{owner}/{repo}/actions/caches"],
    getActionsCacheUsage: ["GET /repos/{owner}/{repo}/actions/cache/usage"],
    getActionsCacheUsageByRepoForOrg: [
      "GET /orgs/{org}/actions/cache/usage-by-repository",
    ],
    getActionsCacheUsageForOrg: ["GET /orgs/{org}/actions/cache/usage"],
    getAllowedActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/selected-actions",
    ],
    getAllowedActionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/selected-actions",
    ],
    getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
    getCustomOidcSubClaimForRepo: [
      "GET /repos/{owner}/{repo}/actions/oidc/customization/sub",
    ],
    getEnvironmentPublicKey: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key",
    ],
    getEnvironmentSecret: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}",
    ],
    getEnvironmentVariable: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}",
    ],
    getGithubActionsDefaultWorkflowPermissionsOrganization: [
      "GET /orgs/{org}/actions/permissions/workflow",
    ],
    getGithubActionsDefaultWorkflowPermissionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/workflow",
    ],
    getGithubActionsPermissionsOrganization: [
      "GET /orgs/{org}/actions/permissions",
    ],
    getGithubActionsPermissionsRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions",
    ],
    getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
    getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
    getOrgVariable: ["GET /orgs/{org}/actions/variables/{name}"],
    getPendingDeploymentsForRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
    ],
    getRepoPermissions: [
      "GET /repos/{owner}/{repo}/actions/permissions",
      {},
      { renamed: ["actions", "getGithubActionsPermissionsRepository"] },
    ],
    getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
    getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
    getRepoVariable: ["GET /repos/{owner}/{repo}/actions/variables/{name}"],
    getReviewsForRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals",
    ],
    getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
    getSelfHostedRunnerForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/{runner_id}",
    ],
    getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
    getWorkflowAccessToRepository: [
      "GET /repos/{owner}/{repo}/actions/permissions/access",
    ],
    getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
    getWorkflowRunAttempt: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}",
    ],
    getWorkflowRunUsage: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing",
    ],
    getWorkflowUsage: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing",
    ],
    listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
    listEnvironmentSecrets: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/secrets",
    ],
    listEnvironmentVariables: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/variables",
    ],
    listJobsForWorkflowRun: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
    ],
    listJobsForWorkflowRunAttempt: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs",
    ],
    listLabelsForSelfHostedRunnerForOrg: [
      "GET /orgs/{org}/actions/runners/{runner_id}/labels",
    ],
    listLabelsForSelfHostedRunnerForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
    ],
    listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
    listOrgVariables: ["GET /orgs/{org}/actions/variables"],
    listRepoOrganizationSecrets: [
      "GET /repos/{owner}/{repo}/actions/organization-secrets",
    ],
    listRepoOrganizationVariables: [
      "GET /repos/{owner}/{repo}/actions/organization-variables",
    ],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
    listRepoVariables: ["GET /repos/{owner}/{repo}/actions/variables"],
    listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
    listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
    listRunnerApplicationsForRepo: [
      "GET /repos/{owner}/{repo}/actions/runners/downloads",
    ],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
    ],
    listSelectedReposForOrgVariable: [
      "GET /orgs/{org}/actions/variables/{name}/repositories",
    ],
    listSelectedRepositoriesEnabledGithubActionsOrganization: [
      "GET /orgs/{org}/actions/permissions/repositories",
    ],
    listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
    listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
    listWorkflowRunArtifacts: [
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
    ],
    listWorkflowRuns: [
      "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
    ],
    listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
    reRunJobForWorkflowRun: [
      "POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun",
    ],
    reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
    reRunWorkflowFailedJobs: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs",
    ],
    removeAllCustomLabelsFromSelfHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}/labels",
    ],
    removeAllCustomLabelsFromSelfHostedRunnerForRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
    ],
    removeCustomLabelFromSelfHostedRunnerForOrg: [
      "DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name}",
    ],
    removeCustomLabelFromSelfHostedRunnerForRepo: [
      "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}",
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
    ],
    removeSelectedRepoFromOrgVariable: [
      "DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id}",
    ],
    reviewCustomGatesForRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule",
    ],
    reviewPendingDeploymentsForRun: [
      "POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
    ],
    setAllowedActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/selected-actions",
    ],
    setAllowedActionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/selected-actions",
    ],
    setCustomLabelsForSelfHostedRunnerForOrg: [
      "PUT /orgs/{org}/actions/runners/{runner_id}/labels",
    ],
    setCustomLabelsForSelfHostedRunnerForRepo: [
      "PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
    ],
    setCustomOidcSubClaimForRepo: [
      "PUT /repos/{owner}/{repo}/actions/oidc/customization/sub",
    ],
    setGithubActionsDefaultWorkflowPermissionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/workflow",
    ],
    setGithubActionsDefaultWorkflowPermissionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/workflow",
    ],
    setGithubActionsPermissionsOrganization: [
      "PUT /orgs/{org}/actions/permissions",
    ],
    setGithubActionsPermissionsRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions",
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories",
    ],
    setSelectedReposForOrgVariable: [
      "PUT /orgs/{org}/actions/variables/{name}/repositories",
    ],
    setSelectedRepositoriesEnabledGithubActionsOrganization: [
      "PUT /orgs/{org}/actions/permissions/repositories",
    ],
    setWorkflowAccessToRepository: [
      "PUT /repos/{owner}/{repo}/actions/permissions/access",
    ],
    updateEnvironmentVariable: [
      "PATCH /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}",
    ],
    updateOrgVariable: ["PATCH /orgs/{org}/actions/variables/{name}"],
    updateRepoVariable: [
      "PATCH /repos/{owner}/{repo}/actions/variables/{name}",
    ],
  },
  activity: {
    checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
    deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
    deleteThreadSubscription: [
      "DELETE /notifications/threads/{thread_id}/subscription",
    ],
    getFeeds: ["GET /feeds"],
    getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
    getThread: ["GET /notifications/threads/{thread_id}"],
    getThreadSubscriptionForAuthenticatedUser: [
      "GET /notifications/threads/{thread_id}/subscription",
    ],
    listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
    listNotificationsForAuthenticatedUser: ["GET /notifications"],
    listOrgEventsForAuthenticatedUser: [
      "GET /users/{username}/events/orgs/{org}",
    ],
    listPublicEvents: ["GET /events"],
    listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
    listPublicEventsForUser: ["GET /users/{username}/events/public"],
    listPublicOrgEvents: ["GET /orgs/{org}/events"],
    listReceivedEventsForUser: ["GET /users/{username}/received_events"],
    listReceivedPublicEventsForUser: [
      "GET /users/{username}/received_events/public",
    ],
    listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
    listRepoNotificationsForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/notifications",
    ],
    listReposStarredByAuthenticatedUser: ["GET /user/starred"],
    listReposStarredByUser: ["GET /users/{username}/starred"],
    listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
    listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
    listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
    listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
    markNotificationsAsRead: ["PUT /notifications"],
    markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
    markThreadAsDone: ["DELETE /notifications/threads/{thread_id}"],
    markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
    setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
    setThreadSubscription: [
      "PUT /notifications/threads/{thread_id}/subscription",
    ],
    starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
    unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"],
  },
  apps: {
    addRepoToInstallation: [
      "PUT /user/installations/{installation_id}/repositories/{repository_id}",
      {},
      { renamed: ["apps", "addRepoToInstallationForAuthenticatedUser"] },
    ],
    addRepoToInstallationForAuthenticatedUser: [
      "PUT /user/installations/{installation_id}/repositories/{repository_id}",
    ],
    checkToken: ["POST /applications/{client_id}/token"],
    createFromManifest: ["POST /app-manifests/{code}/conversions"],
    createInstallationAccessToken: [
      "POST /app/installations/{installation_id}/access_tokens",
    ],
    deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
    deleteInstallation: ["DELETE /app/installations/{installation_id}"],
    deleteToken: ["DELETE /applications/{client_id}/token"],
    getAuthenticated: ["GET /app"],
    getBySlug: ["GET /apps/{app_slug}"],
    getInstallation: ["GET /app/installations/{installation_id}"],
    getOrgInstallation: ["GET /orgs/{org}/installation"],
    getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
    getSubscriptionPlanForAccount: [
      "GET /marketplace_listing/accounts/{account_id}",
    ],
    getSubscriptionPlanForAccountStubbed: [
      "GET /marketplace_listing/stubbed/accounts/{account_id}",
    ],
    getUserInstallation: ["GET /users/{username}/installation"],
    getWebhookConfigForApp: ["GET /app/hook/config"],
    getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
    listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
    listAccountsForPlanStubbed: [
      "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts",
    ],
    listInstallationReposForAuthenticatedUser: [
      "GET /user/installations/{installation_id}/repositories",
    ],
    listInstallationRequestsForAuthenticatedApp: [
      "GET /app/installation-requests",
    ],
    listInstallations: ["GET /app/installations"],
    listInstallationsForAuthenticatedUser: ["GET /user/installations"],
    listPlans: ["GET /marketplace_listing/plans"],
    listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
    listReposAccessibleToInstallation: ["GET /installation/repositories"],
    listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
    listSubscriptionsForAuthenticatedUserStubbed: [
      "GET /user/marketplace_purchases/stubbed",
    ],
    listWebhookDeliveries: ["GET /app/hook/deliveries"],
    redeliverWebhookDelivery: [
      "POST /app/hook/deliveries/{delivery_id}/attempts",
    ],
    removeRepoFromInstallation: [
      "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
      {},
      { renamed: ["apps", "removeRepoFromInstallationForAuthenticatedUser"] },
    ],
    removeRepoFromInstallationForAuthenticatedUser: [
      "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
    ],
    resetToken: ["PATCH /applications/{client_id}/token"],
    revokeInstallationAccessToken: ["DELETE /installation/token"],
    scopeToken: ["POST /applications/{client_id}/token/scoped"],
    suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
    unsuspendInstallation: [
      "DELETE /app/installations/{installation_id}/suspended",
    ],
    updateWebhookConfigForApp: ["PATCH /app/hook/config"],
  },
  billing: {
    getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
    getGithubActionsBillingUser: [
      "GET /users/{username}/settings/billing/actions",
    ],
    getGithubBillingUsageReportOrg: [
      "GET /organizations/{org}/settings/billing/usage",
    ],
    getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
    getGithubPackagesBillingUser: [
      "GET /users/{username}/settings/billing/packages",
    ],
    getSharedStorageBillingOrg: [
      "GET /orgs/{org}/settings/billing/shared-storage",
    ],
    getSharedStorageBillingUser: [
      "GET /users/{username}/settings/billing/shared-storage",
    ],
  },
  checks: {
    create: ["POST /repos/{owner}/{repo}/check-runs"],
    createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
    get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
    getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
    listAnnotations: [
      "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
    ],
    listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
    listForSuite: [
      "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
    ],
    listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
    rerequestRun: [
      "POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest",
    ],
    rerequestSuite: [
      "POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest",
    ],
    setSuitesPreferences: [
      "PATCH /repos/{owner}/{repo}/check-suites/preferences",
    ],
    update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"],
  },
  codeScanning: {
    commitAutofix: [
      "POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits",
    ],
    createAutofix: [
      "POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix",
    ],
    createVariantAnalysis: [
      "POST /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses",
    ],
    deleteAnalysis: [
      "DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}",
    ],
    deleteCodeqlDatabase: [
      "DELETE /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}",
    ],
    getAlert: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
      {},
      { renamedParameters: { alert_id: "alert_number" } },
    ],
    getAnalysis: [
      "GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}",
    ],
    getAutofix: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix",
    ],
    getCodeqlDatabase: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}",
    ],
    getDefaultSetup: ["GET /repos/{owner}/{repo}/code-scanning/default-setup"],
    getSarif: ["GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}"],
    getVariantAnalysis: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}",
    ],
    getVariantAnalysisRepoTask: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}/repos/{repo_owner}/{repo_name}",
    ],
    listAlertInstances: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
    ],
    listAlertsForOrg: ["GET /orgs/{org}/code-scanning/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
    listAlertsInstances: [
      "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
      {},
      { renamed: ["codeScanning", "listAlertInstances"] },
    ],
    listCodeqlDatabases: [
      "GET /repos/{owner}/{repo}/code-scanning/codeql/databases",
    ],
    listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
    ],
    updateDefaultSetup: [
      "PATCH /repos/{owner}/{repo}/code-scanning/default-setup",
    ],
    uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"],
  },
  codeSecurity: {
    attachConfiguration: [
      "POST /orgs/{org}/code-security/configurations/{configuration_id}/attach",
    ],
    attachEnterpriseConfiguration: [
      "POST /enterprises/{enterprise}/code-security/configurations/{configuration_id}/attach",
    ],
    createConfiguration: ["POST /orgs/{org}/code-security/configurations"],
    createConfigurationForEnterprise: [
      "POST /enterprises/{enterprise}/code-security/configurations",
    ],
    deleteConfiguration: [
      "DELETE /orgs/{org}/code-security/configurations/{configuration_id}",
    ],
    deleteConfigurationForEnterprise: [
      "DELETE /enterprises/{enterprise}/code-security/configurations/{configuration_id}",
    ],
    detachConfiguration: [
      "DELETE /orgs/{org}/code-security/configurations/detach",
    ],
    getConfiguration: [
      "GET /orgs/{org}/code-security/configurations/{configuration_id}",
    ],
    getConfigurationForRepository: [
      "GET /repos/{owner}/{repo}/code-security-configuration",
    ],
    getConfigurationsForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations",
    ],
    getConfigurationsForOrg: ["GET /orgs/{org}/code-security/configurations"],
    getDefaultConfigurations: [
      "GET /orgs/{org}/code-security/configurations/defaults",
    ],
    getDefaultConfigurationsForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations/defaults",
    ],
    getRepositoriesForConfiguration: [
      "GET /orgs/{org}/code-security/configurations/{configuration_id}/repositories",
    ],
    getRepositoriesForEnterpriseConfiguration: [
      "GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}/repositories",
    ],
    getSingleConfigurationForEnterprise: [
      "GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}",
    ],
    setConfigurationAsDefault: [
      "PUT /orgs/{org}/code-security/configurations/{configuration_id}/defaults",
    ],
    setConfigurationAsDefaultForEnterprise: [
      "PUT /enterprises/{enterprise}/code-security/configurations/{configuration_id}/defaults",
    ],
    updateConfiguration: [
      "PATCH /orgs/{org}/code-security/configurations/{configuration_id}",
    ],
    updateEnterpriseConfiguration: [
      "PATCH /enterprises/{enterprise}/code-security/configurations/{configuration_id}",
    ],
  },
  codesOfConduct: {
    getAllCodesOfConduct: ["GET /codes_of_conduct"],
    getConductCode: ["GET /codes_of_conduct/{key}"],
  },
  codespaces: {
    addRepositoryForSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id}",
    ],
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}",
    ],
    checkPermissionsForDevcontainer: [
      "GET /repos/{owner}/{repo}/codespaces/permissions_check",
    ],
    codespaceMachinesForAuthenticatedUser: [
      "GET /user/codespaces/{codespace_name}/machines",
    ],
    createForAuthenticatedUser: ["POST /user/codespaces"],
    createOrUpdateOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}",
    ],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
    ],
    createOrUpdateSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}",
    ],
    createWithPrForAuthenticatedUser: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces",
    ],
    createWithRepoForAuthenticatedUser: [
      "POST /repos/{owner}/{repo}/codespaces",
    ],
    deleteForAuthenticatedUser: ["DELETE /user/codespaces/{codespace_name}"],
    deleteFromOrganization: [
      "DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name}",
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/codespaces/secrets/{secret_name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
    ],
    deleteSecretForAuthenticatedUser: [
      "DELETE /user/codespaces/secrets/{secret_name}",
    ],
    exportForAuthenticatedUser: [
      "POST /user/codespaces/{codespace_name}/exports",
    ],
    getCodespacesForUserInOrg: [
      "GET /orgs/{org}/members/{username}/codespaces",
    ],
    getExportDetailsForAuthenticatedUser: [
      "GET /user/codespaces/{codespace_name}/exports/{export_id}",
    ],
    getForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}"],
    getOrgPublicKey: ["GET /orgs/{org}/codespaces/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/codespaces/secrets/{secret_name}"],
    getPublicKeyForAuthenticatedUser: [
      "GET /user/codespaces/secrets/public-key",
    ],
    getRepoPublicKey: [
      "GET /repos/{owner}/{repo}/codespaces/secrets/public-key",
    ],
    getRepoSecret: [
      "GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name}",
    ],
    getSecretForAuthenticatedUser: [
      "GET /user/codespaces/secrets/{secret_name}",
    ],
    listDevcontainersInRepositoryForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/devcontainers",
    ],
    listForAuthenticatedUser: ["GET /user/codespaces"],
    listInOrganization: [
      "GET /orgs/{org}/codespaces",
      {},
      { renamedParameters: { org_id: "org" } },
    ],
    listInRepositoryForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces",
    ],
    listOrgSecrets: ["GET /orgs/{org}/codespaces/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/codespaces/secrets"],
    listRepositoriesForSecretForAuthenticatedUser: [
      "GET /user/codespaces/secrets/{secret_name}/repositories",
    ],
    listSecretsForAuthenticatedUser: ["GET /user/codespaces/secrets"],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
    ],
    preFlightWithRepoForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/new",
    ],
    publishForAuthenticatedUser: [
      "POST /user/codespaces/{codespace_name}/publish",
    ],
    removeRepositoryForSecretForAuthenticatedUser: [
      "DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id}",
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}",
    ],
    repoMachinesForAuthenticatedUser: [
      "GET /repos/{owner}/{repo}/codespaces/machines",
    ],
    setRepositoriesForSecretForAuthenticatedUser: [
      "PUT /user/codespaces/secrets/{secret_name}/repositories",
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories",
    ],
    startForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/start"],
    stopForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/stop"],
    stopInOrganization: [
      "POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop",
    ],
    updateForAuthenticatedUser: ["PATCH /user/codespaces/{codespace_name}"],
  },
  copilot: {
    addCopilotSeatsForTeams: [
      "POST /orgs/{org}/copilot/billing/selected_teams",
    ],
    addCopilotSeatsForUsers: [
      "POST /orgs/{org}/copilot/billing/selected_users",
    ],
    cancelCopilotSeatAssignmentForTeams: [
      "DELETE /orgs/{org}/copilot/billing/selected_teams",
    ],
    cancelCopilotSeatAssignmentForUsers: [
      "DELETE /orgs/{org}/copilot/billing/selected_users",
    ],
    copilotMetricsForOrganization: ["GET /orgs/{org}/copilot/metrics"],
    copilotMetricsForTeam: ["GET /orgs/{org}/team/{team_slug}/copilot/metrics"],
    getCopilotOrganizationDetails: ["GET /orgs/{org}/copilot/billing"],
    getCopilotSeatDetailsForUser: [
      "GET /orgs/{org}/members/{username}/copilot",
    ],
    listCopilotSeats: ["GET /orgs/{org}/copilot/billing/seats"],
    usageMetricsForOrg: ["GET /orgs/{org}/copilot/usage"],
    usageMetricsForTeam: ["GET /orgs/{org}/team/{team_slug}/copilot/usage"],
  },
  dependabot: {
    addSelectedRepoToOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}",
    ],
    createOrUpdateOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}",
    ],
    createOrUpdateRepoSecret: [
      "PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
    ],
    deleteOrgSecret: ["DELETE /orgs/{org}/dependabot/secrets/{secret_name}"],
    deleteRepoSecret: [
      "DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
    ],
    getAlert: ["GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"],
    getOrgPublicKey: ["GET /orgs/{org}/dependabot/secrets/public-key"],
    getOrgSecret: ["GET /orgs/{org}/dependabot/secrets/{secret_name}"],
    getRepoPublicKey: [
      "GET /repos/{owner}/{repo}/dependabot/secrets/public-key",
    ],
    getRepoSecret: [
      "GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
    ],
    listAlertsForEnterprise: [
      "GET /enterprises/{enterprise}/dependabot/alerts",
    ],
    listAlertsForOrg: ["GET /orgs/{org}/dependabot/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/dependabot/alerts"],
    listOrgSecrets: ["GET /orgs/{org}/dependabot/secrets"],
    listRepoSecrets: ["GET /repos/{owner}/{repo}/dependabot/secrets"],
    listSelectedReposForOrgSecret: [
      "GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
    ],
    removeSelectedRepoFromOrgSecret: [
      "DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}",
    ],
    setSelectedReposForOrgSecret: [
      "PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories",
    ],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}",
    ],
  },
  dependencyGraph: {
    createRepositorySnapshot: [
      "POST /repos/{owner}/{repo}/dependency-graph/snapshots",
    ],
    diffRange: [
      "GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}",
    ],
    exportSbom: ["GET /repos/{owner}/{repo}/dependency-graph/sbom"],
  },
  emojis: { get: ["GET /emojis"] },
  gists: {
    checkIsStarred: ["GET /gists/{gist_id}/star"],
    create: ["POST /gists"],
    createComment: ["POST /gists/{gist_id}/comments"],
    delete: ["DELETE /gists/{gist_id}"],
    deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
    fork: ["POST /gists/{gist_id}/forks"],
    get: ["GET /gists/{gist_id}"],
    getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
    getRevision: ["GET /gists/{gist_id}/{sha}"],
    list: ["GET /gists"],
    listComments: ["GET /gists/{gist_id}/comments"],
    listCommits: ["GET /gists/{gist_id}/commits"],
    listForUser: ["GET /users/{username}/gists"],
    listForks: ["GET /gists/{gist_id}/forks"],
    listPublic: ["GET /gists/public"],
    listStarred: ["GET /gists/starred"],
    star: ["PUT /gists/{gist_id}/star"],
    unstar: ["DELETE /gists/{gist_id}/star"],
    update: ["PATCH /gists/{gist_id}"],
    updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"],
  },
  git: {
    createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
    createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
    createRef: ["POST /repos/{owner}/{repo}/git/refs"],
    createTag: ["POST /repos/{owner}/{repo}/git/tags"],
    createTree: ["POST /repos/{owner}/{repo}/git/trees"],
    deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
    getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
    getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
    getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
    getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
    getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
    listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
    updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"],
  },
  gitignore: {
    getAllTemplates: ["GET /gitignore/templates"],
    getTemplate: ["GET /gitignore/templates/{name}"],
  },
  interactions: {
    getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
    getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
    getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
    getRestrictionsForYourPublicRepos: [
      "GET /user/interaction-limits",
      {},
      { renamed: ["interactions", "getRestrictionsForAuthenticatedUser"] },
    ],
    removeRestrictionsForAuthenticatedUser: ["DELETE /user/interaction-limits"],
    removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
    removeRestrictionsForRepo: [
      "DELETE /repos/{owner}/{repo}/interaction-limits",
    ],
    removeRestrictionsForYourPublicRepos: [
      "DELETE /user/interaction-limits",
      {},
      { renamed: ["interactions", "removeRestrictionsForAuthenticatedUser"] },
    ],
    setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
    setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
    setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
    setRestrictionsForYourPublicRepos: [
      "PUT /user/interaction-limits",
      {},
      { renamed: ["interactions", "setRestrictionsForAuthenticatedUser"] },
    ],
  },
  issues: {
    addAssignees: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/assignees",
    ],
    addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    addSubIssue: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues",
    ],
    checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
    checkUserCanBeAssignedToIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}",
    ],
    create: ["POST /repos/{owner}/{repo}/issues"],
    createComment: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
    ],
    createLabel: ["POST /repos/{owner}/{repo}/labels"],
    createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
    deleteComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}",
    ],
    deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
    deleteMilestone: [
      "DELETE /repos/{owner}/{repo}/milestones/{milestone_number}",
    ],
    get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
    getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
    getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
    getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
    list: ["GET /issues"],
    listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
    listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
    listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
    listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
    listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
    listEventsForTimeline: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
    ],
    listForAuthenticatedUser: ["GET /user/issues"],
    listForOrg: ["GET /orgs/{org}/issues"],
    listForRepo: ["GET /repos/{owner}/{repo}/issues"],
    listLabelsForMilestone: [
      "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels",
    ],
    listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
    listLabelsOnIssue: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
    ],
    listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
    listSubIssues: [
      "GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues",
    ],
    lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    removeAllLabels: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels",
    ],
    removeAssignees: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees",
    ],
    removeLabel: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}",
    ],
    removeSubIssue: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue",
    ],
    reprioritizeSubIssue: [
      "PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority",
    ],
    setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
    unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
    update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
    updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
    updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
    updateMilestone: [
      "PATCH /repos/{owner}/{repo}/milestones/{milestone_number}",
    ],
  },
  licenses: {
    get: ["GET /licenses/{license}"],
    getAllCommonlyUsed: ["GET /licenses"],
    getForRepo: ["GET /repos/{owner}/{repo}/license"],
  },
  markdown: {
    render: ["POST /markdown"],
    renderRaw: [
      "POST /markdown/raw",
      { headers: { "content-type": "text/plain; charset=utf-8" } },
    ],
  },
  meta: {
    get: ["GET /meta"],
    getAllVersions: ["GET /versions"],
    getOctocat: ["GET /octocat"],
    getZen: ["GET /zen"],
    root: ["GET /"],
  },
  migrations: {
    deleteArchiveForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/archive",
    ],
    deleteArchiveForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/archive",
    ],
    downloadArchiveForOrg: [
      "GET /orgs/{org}/migrations/{migration_id}/archive",
    ],
    getArchiveForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}/archive",
    ],
    getStatusForAuthenticatedUser: ["GET /user/migrations/{migration_id}"],
    getStatusForOrg: ["GET /orgs/{org}/migrations/{migration_id}"],
    listForAuthenticatedUser: ["GET /user/migrations"],
    listForOrg: ["GET /orgs/{org}/migrations"],
    listReposForAuthenticatedUser: [
      "GET /user/migrations/{migration_id}/repositories",
    ],
    listReposForOrg: ["GET /orgs/{org}/migrations/{migration_id}/repositories"],
    listReposForUser: [
      "GET /user/migrations/{migration_id}/repositories",
      {},
      { renamed: ["migrations", "listReposForAuthenticatedUser"] },
    ],
    startForAuthenticatedUser: ["POST /user/migrations"],
    startForOrg: ["POST /orgs/{org}/migrations"],
    unlockRepoForAuthenticatedUser: [
      "DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock",
    ],
    unlockRepoForOrg: [
      "DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock",
    ],
  },
  oidc: {
    getOidcCustomSubTemplateForOrg: [
      "GET /orgs/{org}/actions/oidc/customization/sub",
    ],
    updateOidcCustomSubTemplateForOrg: [
      "PUT /orgs/{org}/actions/oidc/customization/sub",
    ],
  },
  orgs: {
    addSecurityManagerTeam: [
      "PUT /orgs/{org}/security-managers/teams/{team_slug}",
      {},
      {
        deprecated:
          "octokit.rest.orgs.addSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#add-a-security-manager-team",
      },
    ],
    assignTeamToOrgRole: [
      "PUT /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}",
    ],
    assignUserToOrgRole: [
      "PUT /orgs/{org}/organization-roles/users/{username}/{role_id}",
    ],
    blockUser: ["PUT /orgs/{org}/blocks/{username}"],
    cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
    checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
    checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
    checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
    convertMemberToOutsideCollaborator: [
      "PUT /orgs/{org}/outside_collaborators/{username}",
    ],
    createInvitation: ["POST /orgs/{org}/invitations"],
    createOrUpdateCustomProperties: ["PATCH /orgs/{org}/properties/schema"],
    createOrUpdateCustomPropertiesValuesForRepos: [
      "PATCH /orgs/{org}/properties/values",
    ],
    createOrUpdateCustomProperty: [
      "PUT /orgs/{org}/properties/schema/{custom_property_name}",
    ],
    createWebhook: ["POST /orgs/{org}/hooks"],
    delete: ["DELETE /orgs/{org}"],
    deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
    enableOrDisableSecurityProductOnAllOrgRepos: [
      "POST /orgs/{org}/{security_product}/{enablement}",
      {},
      {
        deprecated:
          "octokit.rest.orgs.enableOrDisableSecurityProductOnAllOrgRepos() is deprecated, see https://docs.github.com/rest/orgs/orgs#enable-or-disable-a-security-feature-for-an-organization",
      },
    ],
    get: ["GET /orgs/{org}"],
    getAllCustomProperties: ["GET /orgs/{org}/properties/schema"],
    getCustomProperty: [
      "GET /orgs/{org}/properties/schema/{custom_property_name}",
    ],
    getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
    getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
    getOrgRole: ["GET /orgs/{org}/organization-roles/{role_id}"],
    getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
    getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
    getWebhookDelivery: [
      "GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}",
    ],
    list: ["GET /organizations"],
    listAppInstallations: ["GET /orgs/{org}/installations"],
    listAttestations: ["GET /orgs/{org}/attestations/{subject_digest}"],
    listBlockedUsers: ["GET /orgs/{org}/blocks"],
    listCustomPropertiesValuesForRepos: ["GET /orgs/{org}/properties/values"],
    listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
    listForAuthenticatedUser: ["GET /user/orgs"],
    listForUser: ["GET /users/{username}/orgs"],
    listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
    listMembers: ["GET /orgs/{org}/members"],
    listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
    listOrgRoleTeams: ["GET /orgs/{org}/organization-roles/{role_id}/teams"],
    listOrgRoleUsers: ["GET /orgs/{org}/organization-roles/{role_id}/users"],
    listOrgRoles: ["GET /orgs/{org}/organization-roles"],
    listOrganizationFineGrainedPermissions: [
      "GET /orgs/{org}/organization-fine-grained-permissions",
    ],
    listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
    listPatGrantRepositories: [
      "GET /orgs/{org}/personal-access-tokens/{pat_id}/repositories",
    ],
    listPatGrantRequestRepositories: [
      "GET /orgs/{org}/personal-access-token-requests/{pat_request_id}/repositories",
    ],
    listPatGrantRequests: ["GET /orgs/{org}/personal-access-token-requests"],
    listPatGrants: ["GET /orgs/{org}/personal-access-tokens"],
    listPendingInvitations: ["GET /orgs/{org}/invitations"],
    listPublicMembers: ["GET /orgs/{org}/public_members"],
    listSecurityManagerTeams: [
      "GET /orgs/{org}/security-managers",
      {},
      {
        deprecated:
          "octokit.rest.orgs.listSecurityManagerTeams() is deprecated, see https://docs.github.com/rest/orgs/security-managers#list-security-manager-teams",
      },
    ],
    listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
    listWebhooks: ["GET /orgs/{org}/hooks"],
    pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: [
      "POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
    ],
    removeCustomProperty: [
      "DELETE /orgs/{org}/properties/schema/{custom_property_name}",
    ],
    removeMember: ["DELETE /orgs/{org}/members/{username}"],
    removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
    removeOutsideCollaborator: [
      "DELETE /orgs/{org}/outside_collaborators/{username}",
    ],
    removePublicMembershipForAuthenticatedUser: [
      "DELETE /orgs/{org}/public_members/{username}",
    ],
    removeSecurityManagerTeam: [
      "DELETE /orgs/{org}/security-managers/teams/{team_slug}",
      {},
      {
        deprecated:
          "octokit.rest.orgs.removeSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#remove-a-security-manager-team",
      },
    ],
    reviewPatGrantRequest: [
      "POST /orgs/{org}/personal-access-token-requests/{pat_request_id}",
    ],
    reviewPatGrantRequestsInBulk: [
      "POST /orgs/{org}/personal-access-token-requests",
    ],
    revokeAllOrgRolesTeam: [
      "DELETE /orgs/{org}/organization-roles/teams/{team_slug}",
    ],
    revokeAllOrgRolesUser: [
      "DELETE /orgs/{org}/organization-roles/users/{username}",
    ],
    revokeOrgRoleTeam: [
      "DELETE /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}",
    ],
    revokeOrgRoleUser: [
      "DELETE /orgs/{org}/organization-roles/users/{username}/{role_id}",
    ],
    setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
    setPublicMembershipForAuthenticatedUser: [
      "PUT /orgs/{org}/public_members/{username}",
    ],
    unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
    update: ["PATCH /orgs/{org}"],
    updateMembershipForAuthenticatedUser: [
      "PATCH /user/memberships/orgs/{org}",
    ],
    updatePatAccess: ["POST /orgs/{org}/personal-access-tokens/{pat_id}"],
    updatePatAccesses: ["POST /orgs/{org}/personal-access-tokens"],
    updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
    updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"],
  },
  packages: {
    deletePackageForAuthenticatedUser: [
      "DELETE /user/packages/{package_type}/{package_name}",
    ],
    deletePackageForOrg: [
      "DELETE /orgs/{org}/packages/{package_type}/{package_name}",
    ],
    deletePackageForUser: [
      "DELETE /users/{username}/packages/{package_type}/{package_name}",
    ],
    deletePackageVersionForAuthenticatedUser: [
      "DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
    ],
    deletePackageVersionForOrg: [
      "DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
    ],
    deletePackageVersionForUser: [
      "DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}",
    ],
    getAllPackageVersionsForAPackageOwnedByAnOrg: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
      {},
      { renamed: ["packages", "getAllPackageVersionsForPackageOwnedByOrg"] },
    ],
    getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions",
      {},
      {
        renamed: [
          "packages",
          "getAllPackageVersionsForPackageOwnedByAuthenticatedUser",
        ],
      },
    ],
    getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions",
    ],
    getAllPackageVersionsForPackageOwnedByOrg: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
    ],
    getAllPackageVersionsForPackageOwnedByUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}/versions",
    ],
    getPackageForAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}",
    ],
    getPackageForOrganization: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}",
    ],
    getPackageForUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}",
    ],
    getPackageVersionForAuthenticatedUser: [
      "GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
    ],
    getPackageVersionForOrganization: [
      "GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
    ],
    getPackageVersionForUser: [
      "GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}",
    ],
    listDockerMigrationConflictingPackagesForAuthenticatedUser: [
      "GET /user/docker/conflicts",
    ],
    listDockerMigrationConflictingPackagesForOrganization: [
      "GET /orgs/{org}/docker/conflicts",
    ],
    listDockerMigrationConflictingPackagesForUser: [
      "GET /users/{username}/docker/conflicts",
    ],
    listPackagesForAuthenticatedUser: ["GET /user/packages"],
    listPackagesForOrganization: ["GET /orgs/{org}/packages"],
    listPackagesForUser: ["GET /users/{username}/packages"],
    restorePackageForAuthenticatedUser: [
      "POST /user/packages/{package_type}/{package_name}/restore{?token}",
    ],
    restorePackageForOrg: [
      "POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}",
    ],
    restorePackageForUser: [
      "POST /users/{username}/packages/{package_type}/{package_name}/restore{?token}",
    ],
    restorePackageVersionForAuthenticatedUser: [
      "POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
    ],
    restorePackageVersionForOrg: [
      "POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
    ],
    restorePackageVersionForUser: [
      "POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
    ],
  },
  privateRegistries: {
    createOrgPrivateRegistry: ["POST /orgs/{org}/private-registries"],
    deleteOrgPrivateRegistry: [
      "DELETE /orgs/{org}/private-registries/{secret_name}",
    ],
    getOrgPrivateRegistry: ["GET /orgs/{org}/private-registries/{secret_name}"],
    getOrgPublicKey: ["GET /orgs/{org}/private-registries/public-key"],
    listOrgPrivateRegistries: ["GET /orgs/{org}/private-registries"],
    updateOrgPrivateRegistry: [
      "PATCH /orgs/{org}/private-registries/{secret_name}",
    ],
  },
  projects: {
    addCollaborator: ["PUT /projects/{project_id}/collaborators/{username}"],
    createCard: ["POST /projects/columns/{column_id}/cards"],
    createColumn: ["POST /projects/{project_id}/columns"],
    createForAuthenticatedUser: ["POST /user/projects"],
    createForOrg: ["POST /orgs/{org}/projects"],
    createForRepo: ["POST /repos/{owner}/{repo}/projects"],
    delete: ["DELETE /projects/{project_id}"],
    deleteCard: ["DELETE /projects/columns/cards/{card_id}"],
    deleteColumn: ["DELETE /projects/columns/{column_id}"],
    get: ["GET /projects/{project_id}"],
    getCard: ["GET /projects/columns/cards/{card_id}"],
    getColumn: ["GET /projects/columns/{column_id}"],
    getPermissionForUser: [
      "GET /projects/{project_id}/collaborators/{username}/permission",
    ],
    listCards: ["GET /projects/columns/{column_id}/cards"],
    listCollaborators: ["GET /projects/{project_id}/collaborators"],
    listColumns: ["GET /projects/{project_id}/columns"],
    listForOrg: ["GET /orgs/{org}/projects"],
    listForRepo: ["GET /repos/{owner}/{repo}/projects"],
    listForUser: ["GET /users/{username}/projects"],
    moveCard: ["POST /projects/columns/cards/{card_id}/moves"],
    moveColumn: ["POST /projects/columns/{column_id}/moves"],
    removeCollaborator: [
      "DELETE /projects/{project_id}/collaborators/{username}",
    ],
    update: ["PATCH /projects/{project_id}"],
    updateCard: ["PATCH /projects/columns/cards/{card_id}"],
    updateColumn: ["PATCH /projects/columns/{column_id}"],
  },
  pulls: {
    checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    create: ["POST /repos/{owner}/{repo}/pulls"],
    createReplyForReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
    ],
    createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    createReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
    ],
    deletePendingReview: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
    ],
    deleteReviewComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}",
    ],
    dismissReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals",
    ],
    get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
    getReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
    ],
    getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
    list: ["GET /repos/{owner}/{repo}/pulls"],
    listCommentsForReview: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
    ],
    listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
    listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
    listRequestedReviewers: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
    ],
    listReviewComments: [
      "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
    ],
    listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
    listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
    merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
    removeRequestedReviewers: [
      "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
    ],
    requestReviewers: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
    ],
    submitReview: [
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events",
    ],
    update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
    updateBranch: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
    ],
    updateReview: [
      "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
    ],
    updateReviewComment: [
      "PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}",
    ],
  },
  rateLimit: { get: ["GET /rate_limit"] },
  reactions: {
    createForCommitComment: [
      "POST /repos/{owner}/{repo}/comments/{comment_id}/reactions",
    ],
    createForIssue: [
      "POST /repos/{owner}/{repo}/issues/{issue_number}/reactions",
    ],
    createForIssueComment: [
      "POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
    ],
    createForPullRequestReviewComment: [
      "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
    ],
    createForRelease: [
      "POST /repos/{owner}/{repo}/releases/{release_id}/reactions",
    ],
    createForTeamDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
    ],
    createForTeamDiscussionInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
    ],
    deleteForCommitComment: [
      "DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}",
    ],
    deleteForIssue: [
      "DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}",
    ],
    deleteForIssueComment: [
      "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}",
    ],
    deleteForPullRequestComment: [
      "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}",
    ],
    deleteForRelease: [
      "DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}",
    ],
    deleteForTeamDiscussion: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}",
    ],
    deleteForTeamDiscussionComment: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}",
    ],
    listForCommitComment: [
      "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
    ],
    listForIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/reactions"],
    listForIssueComment: [
      "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
    ],
    listForPullRequestReviewComment: [
      "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
    ],
    listForRelease: [
      "GET /repos/{owner}/{repo}/releases/{release_id}/reactions",
    ],
    listForTeamDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
    ],
    listForTeamDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
    ],
  },
  repos: {
    acceptInvitation: [
      "PATCH /user/repository_invitations/{invitation_id}",
      {},
      { renamed: ["repos", "acceptInvitationForAuthenticatedUser"] },
    ],
    acceptInvitationForAuthenticatedUser: [
      "PATCH /user/repository_invitations/{invitation_id}",
    ],
    addAppAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" },
    ],
    addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
    addStatusCheckContexts: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" },
    ],
    addTeamAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" },
    ],
    addUserAccessRestrictions: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" },
    ],
    cancelPagesDeployment: [
      "POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel",
    ],
    checkAutomatedSecurityFixes: [
      "GET /repos/{owner}/{repo}/automated-security-fixes",
    ],
    checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
    checkPrivateVulnerabilityReporting: [
      "GET /repos/{owner}/{repo}/private-vulnerability-reporting",
    ],
    checkVulnerabilityAlerts: [
      "GET /repos/{owner}/{repo}/vulnerability-alerts",
    ],
    codeownersErrors: ["GET /repos/{owner}/{repo}/codeowners/errors"],
    compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
    compareCommitsWithBasehead: [
      "GET /repos/{owner}/{repo}/compare/{basehead}",
    ],
    createAttestation: ["POST /repos/{owner}/{repo}/attestations"],
    createAutolink: ["POST /repos/{owner}/{repo}/autolinks"],
    createCommitComment: [
      "POST /repos/{owner}/{repo}/commits/{commit_sha}/comments",
    ],
    createCommitSignatureProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
    ],
    createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
    createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
    createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
    createDeploymentBranchPolicy: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
    ],
    createDeploymentProtectionRule: [
      "POST /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules",
    ],
    createDeploymentStatus: [
      "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
    ],
    createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
    createForAuthenticatedUser: ["POST /user/repos"],
    createFork: ["POST /repos/{owner}/{repo}/forks"],
    createInOrg: ["POST /orgs/{org}/repos"],
    createOrUpdateCustomPropertiesValues: [
      "PATCH /repos/{owner}/{repo}/properties/values",
    ],
    createOrUpdateEnvironment: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}",
    ],
    createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
    createOrgRuleset: ["POST /orgs/{org}/rulesets"],
    createPagesDeployment: ["POST /repos/{owner}/{repo}/pages/deployments"],
    createPagesSite: ["POST /repos/{owner}/{repo}/pages"],
    createRelease: ["POST /repos/{owner}/{repo}/releases"],
    createRepoRuleset: ["POST /repos/{owner}/{repo}/rulesets"],
    createUsingTemplate: [
      "POST /repos/{template_owner}/{template_repo}/generate",
    ],
    createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
    declineInvitation: [
      "DELETE /user/repository_invitations/{invitation_id}",
      {},
      { renamed: ["repos", "declineInvitationForAuthenticatedUser"] },
    ],
    declineInvitationForAuthenticatedUser: [
      "DELETE /user/repository_invitations/{invitation_id}",
    ],
    delete: ["DELETE /repos/{owner}/{repo}"],
    deleteAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
    ],
    deleteAdminBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
    ],
    deleteAnEnvironment: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}",
    ],
    deleteAutolink: ["DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    deleteBranchProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection",
    ],
    deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
    deleteCommitSignatureProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
    ],
    deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
    deleteDeployment: [
      "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}",
    ],
    deleteDeploymentBranchPolicy: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
    ],
    deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
    deleteInvitation: [
      "DELETE /repos/{owner}/{repo}/invitations/{invitation_id}",
    ],
    deleteOrgRuleset: ["DELETE /orgs/{org}/rulesets/{ruleset_id}"],
    deletePagesSite: ["DELETE /repos/{owner}/{repo}/pages"],
    deletePullRequestReviewProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
    ],
    deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
    deleteReleaseAsset: [
      "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}",
    ],
    deleteRepoRuleset: ["DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
    disableAutomatedSecurityFixes: [
      "DELETE /repos/{owner}/{repo}/automated-security-fixes",
    ],
    disableDeploymentProtectionRule: [
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}",
    ],
    disablePrivateVulnerabilityReporting: [
      "DELETE /repos/{owner}/{repo}/private-vulnerability-reporting",
    ],
    disableVulnerabilityAlerts: [
      "DELETE /repos/{owner}/{repo}/vulnerability-alerts",
    ],
    downloadArchive: [
      "GET /repos/{owner}/{repo}/zipball/{ref}",
      {},
      { renamed: ["repos", "downloadZipballArchive"] },
    ],
    downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
    downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
    enableAutomatedSecurityFixes: [
      "PUT /repos/{owner}/{repo}/automated-security-fixes",
    ],
    enablePrivateVulnerabilityReporting: [
      "PUT /repos/{owner}/{repo}/private-vulnerability-reporting",
    ],
    enableVulnerabilityAlerts: [
      "PUT /repos/{owner}/{repo}/vulnerability-alerts",
    ],
    generateReleaseNotes: [
      "POST /repos/{owner}/{repo}/releases/generate-notes",
    ],
    get: ["GET /repos/{owner}/{repo}"],
    getAccessRestrictions: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
    ],
    getAdminBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
    ],
    getAllDeploymentProtectionRules: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules",
    ],
    getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
    getAllStatusCheckContexts: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
    ],
    getAllTopics: ["GET /repos/{owner}/{repo}/topics"],
    getAppsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
    ],
    getAutolink: ["GET /repos/{owner}/{repo}/autolinks/{autolink_id}"],
    getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
    getBranchProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection",
    ],
    getBranchRules: ["GET /repos/{owner}/{repo}/rules/branches/{branch}"],
    getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
    getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
    getCollaboratorPermissionLevel: [
      "GET /repos/{owner}/{repo}/collaborators/{username}/permission",
    ],
    getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
    getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
    getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
    getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
    getCommitSignatureProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
    ],
    getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
    getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
    getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
    getCustomDeploymentProtectionRule: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}",
    ],
    getCustomPropertiesValues: ["GET /repos/{owner}/{repo}/properties/values"],
    getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
    getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
    getDeploymentBranchPolicy: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
    ],
    getDeploymentStatus: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}",
    ],
    getEnvironment: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}",
    ],
    getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
    getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
    getOrgRuleSuite: ["GET /orgs/{org}/rulesets/rule-suites/{rule_suite_id}"],
    getOrgRuleSuites: ["GET /orgs/{org}/rulesets/rule-suites"],
    getOrgRuleset: ["GET /orgs/{org}/rulesets/{ruleset_id}"],
    getOrgRulesets: ["GET /orgs/{org}/rulesets"],
    getPages: ["GET /repos/{owner}/{repo}/pages"],
    getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
    getPagesDeployment: [
      "GET /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}",
    ],
    getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
    getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
    getPullRequestReviewProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
    ],
    getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
    getReadme: ["GET /repos/{owner}/{repo}/readme"],
    getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
    getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
    getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
    getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
    getRepoRuleSuite: [
      "GET /repos/{owner}/{repo}/rulesets/rule-suites/{rule_suite_id}",
    ],
    getRepoRuleSuites: ["GET /repos/{owner}/{repo}/rulesets/rule-suites"],
    getRepoRuleset: ["GET /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    getRepoRulesets: ["GET /repos/{owner}/{repo}/rulesets"],
    getStatusChecksProtection: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
    ],
    getTeamsWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
    ],
    getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
    getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
    getUsersWithAccessToProtectedBranch: [
      "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
    ],
    getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
    getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
    getWebhookConfigForRepo: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/config",
    ],
    getWebhookDelivery: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}",
    ],
    listActivities: ["GET /repos/{owner}/{repo}/activity"],
    listAttestations: [
      "GET /repos/{owner}/{repo}/attestations/{subject_digest}",
    ],
    listAutolinks: ["GET /repos/{owner}/{repo}/autolinks"],
    listBranches: ["GET /repos/{owner}/{repo}/branches"],
    listBranchesForHeadCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head",
    ],
    listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
    listCommentsForCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
    ],
    listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
    listCommitStatusesForRef: [
      "GET /repos/{owner}/{repo}/commits/{ref}/statuses",
    ],
    listCommits: ["GET /repos/{owner}/{repo}/commits"],
    listContributors: ["GET /repos/{owner}/{repo}/contributors"],
    listCustomDeploymentRuleIntegrations: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps",
    ],
    listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
    listDeploymentBranchPolicies: [
      "GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
    ],
    listDeploymentStatuses: [
      "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
    ],
    listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
    listForAuthenticatedUser: ["GET /user/repos"],
    listForOrg: ["GET /orgs/{org}/repos"],
    listForUser: ["GET /users/{username}/repos"],
    listForks: ["GET /repos/{owner}/{repo}/forks"],
    listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
    listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
    listLanguages: ["GET /repos/{owner}/{repo}/languages"],
    listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
    listPublic: ["GET /repositories"],
    listPullRequestsAssociatedWithCommit: [
      "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
    ],
    listReleaseAssets: [
      "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
    ],
    listReleases: ["GET /repos/{owner}/{repo}/releases"],
    listTags: ["GET /repos/{owner}/{repo}/tags"],
    listTeams: ["GET /repos/{owner}/{repo}/teams"],
    listWebhookDeliveries: [
      "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
    ],
    listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
    merge: ["POST /repos/{owner}/{repo}/merges"],
    mergeUpstream: ["POST /repos/{owner}/{repo}/merge-upstream"],
    pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
    redeliverWebhookDelivery: [
      "POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
    ],
    removeAppAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" },
    ],
    removeCollaborator: [
      "DELETE /repos/{owner}/{repo}/collaborators/{username}",
    ],
    removeStatusCheckContexts: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" },
    ],
    removeStatusCheckProtection: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
    ],
    removeTeamAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" },
    ],
    removeUserAccessRestrictions: [
      "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" },
    ],
    renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
    replaceAllTopics: ["PUT /repos/{owner}/{repo}/topics"],
    requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
    setAdminBranchProtection: [
      "POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
    ],
    setAppAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
      {},
      { mapToData: "apps" },
    ],
    setStatusCheckContexts: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
      {},
      { mapToData: "contexts" },
    ],
    setTeamAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
      {},
      { mapToData: "teams" },
    ],
    setUserAccessRestrictions: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
      {},
      { mapToData: "users" },
    ],
    testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
    transfer: ["POST /repos/{owner}/{repo}/transfer"],
    update: ["PATCH /repos/{owner}/{repo}"],
    updateBranchProtection: [
      "PUT /repos/{owner}/{repo}/branches/{branch}/protection",
    ],
    updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
    updateDeploymentBranchPolicy: [
      "PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
    ],
    updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
    updateInvitation: [
      "PATCH /repos/{owner}/{repo}/invitations/{invitation_id}",
    ],
    updateOrgRuleset: ["PUT /orgs/{org}/rulesets/{ruleset_id}"],
    updatePullRequestReviewProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
    ],
    updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
    updateReleaseAsset: [
      "PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}",
    ],
    updateRepoRuleset: ["PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
    updateStatusCheckPotection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
      {},
      { renamed: ["repos", "updateStatusCheckProtection"] },
    ],
    updateStatusCheckProtection: [
      "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
    ],
    updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
    updateWebhookConfigForRepo: [
      "PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config",
    ],
    uploadReleaseAsset: [
      "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}",
      { baseUrl: "https://uploads.github.com" },
    ],
  },
  search: {
    code: ["GET /search/code"],
    commits: ["GET /search/commits"],
    issuesAndPullRequests: ["GET /search/issues"],
    labels: ["GET /search/labels"],
    repos: ["GET /search/repositories"],
    topics: ["GET /search/topics"],
    users: ["GET /search/users"],
  },
  secretScanning: {
    createPushProtectionBypass: [
      "POST /repos/{owner}/{repo}/secret-scanning/push-protection-bypasses",
    ],
    getAlert: [
      "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
    ],
    getScanHistory: ["GET /repos/{owner}/{repo}/secret-scanning/scan-history"],
    listAlertsForEnterprise: [
      "GET /enterprises/{enterprise}/secret-scanning/alerts",
    ],
    listAlertsForOrg: ["GET /orgs/{org}/secret-scanning/alerts"],
    listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
    listLocationsForAlert: [
      "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations",
    ],
    updateAlert: [
      "PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
    ],
  },
  securityAdvisories: {
    createFork: [
      "POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/forks",
    ],
    createPrivateVulnerabilityReport: [
      "POST /repos/{owner}/{repo}/security-advisories/reports",
    ],
    createRepositoryAdvisory: [
      "POST /repos/{owner}/{repo}/security-advisories",
    ],
    createRepositoryAdvisoryCveRequest: [
      "POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/cve",
    ],
    getGlobalAdvisory: ["GET /advisories/{ghsa_id}"],
    getRepositoryAdvisory: [
      "GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}",
    ],
    listGlobalAdvisories: ["GET /advisories"],
    listOrgRepositoryAdvisories: ["GET /orgs/{org}/security-advisories"],
    listRepositoryAdvisories: ["GET /repos/{owner}/{repo}/security-advisories"],
    updateRepositoryAdvisory: [
      "PATCH /repos/{owner}/{repo}/security-advisories/{ghsa_id}",
    ],
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}",
    ],
    addOrUpdateProjectPermissionsInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}",
    ],
    addOrUpdateRepoPermissionsInOrg: [
      "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
    ],
    checkPermissionsForProjectInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/projects/{project_id}",
    ],
    checkPermissionsForRepoInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
    ],
    create: ["POST /orgs/{org}/teams"],
    createDiscussionCommentInOrg: [
      "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
    ],
    createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
    deleteDiscussionCommentInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
    ],
    deleteDiscussionInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
    ],
    deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
    getByName: ["GET /orgs/{org}/teams/{team_slug}"],
    getDiscussionCommentInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
    ],
    getDiscussionInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
    ],
    getMembershipForUserInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/memberships/{username}",
    ],
    list: ["GET /orgs/{org}/teams"],
    listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
    listDiscussionCommentsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
    ],
    listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
    listForAuthenticatedUser: ["GET /user/teams"],
    listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
    listPendingInvitationsInOrg: [
      "GET /orgs/{org}/teams/{team_slug}/invitations",
    ],
    listProjectsInOrg: ["GET /orgs/{org}/teams/{team_slug}/projects"],
    listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
    removeMembershipForUserInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}",
    ],
    removeProjectInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}",
    ],
    removeRepoInOrg: [
      "DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
    ],
    updateDiscussionCommentInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
    ],
    updateDiscussionInOrg: [
      "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
    ],
    updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"],
  },
  users: {
    addEmailForAuthenticated: [
      "POST /user/emails",
      {},
      { renamed: ["users", "addEmailForAuthenticatedUser"] },
    ],
    addEmailForAuthenticatedUser: ["POST /user/emails"],
    addSocialAccountForAuthenticatedUser: ["POST /user/social_accounts"],
    block: ["PUT /user/blocks/{username}"],
    checkBlocked: ["GET /user/blocks/{username}"],
    checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
    checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
    createGpgKeyForAuthenticated: [
      "POST /user/gpg_keys",
      {},
      { renamed: ["users", "createGpgKeyForAuthenticatedUser"] },
    ],
    createGpgKeyForAuthenticatedUser: ["POST /user/gpg_keys"],
    createPublicSshKeyForAuthenticated: [
      "POST /user/keys",
      {},
      { renamed: ["users", "createPublicSshKeyForAuthenticatedUser"] },
    ],
    createPublicSshKeyForAuthenticatedUser: ["POST /user/keys"],
    createSshSigningKeyForAuthenticatedUser: ["POST /user/ssh_signing_keys"],
    deleteEmailForAuthenticated: [
      "DELETE /user/emails",
      {},
      { renamed: ["users", "deleteEmailForAuthenticatedUser"] },
    ],
    deleteEmailForAuthenticatedUser: ["DELETE /user/emails"],
    deleteGpgKeyForAuthenticated: [
      "DELETE /user/gpg_keys/{gpg_key_id}",
      {},
      { renamed: ["users", "deleteGpgKeyForAuthenticatedUser"] },
    ],
    deleteGpgKeyForAuthenticatedUser: ["DELETE /user/gpg_keys/{gpg_key_id}"],
    deletePublicSshKeyForAuthenticated: [
      "DELETE /user/keys/{key_id}",
      {},
      { renamed: ["users", "deletePublicSshKeyForAuthenticatedUser"] },
    ],
    deletePublicSshKeyForAuthenticatedUser: ["DELETE /user/keys/{key_id}"],
    deleteSocialAccountForAuthenticatedUser: ["DELETE /user/social_accounts"],
    deleteSshSigningKeyForAuthenticatedUser: [
      "DELETE /user/ssh_signing_keys/{ssh_signing_key_id}",
    ],
    follow: ["PUT /user/following/{username}"],
    getAuthenticated: ["GET /user"],
    getById: ["GET /user/{account_id}"],
    getByUsername: ["GET /users/{username}"],
    getContextForUser: ["GET /users/{username}/hovercard"],
    getGpgKeyForAuthenticated: [
      "GET /user/gpg_keys/{gpg_key_id}",
      {},
      { renamed: ["users", "getGpgKeyForAuthenticatedUser"] },
    ],
    getGpgKeyForAuthenticatedUser: ["GET /user/gpg_keys/{gpg_key_id}"],
    getPublicSshKeyForAuthenticated: [
      "GET /user/keys/{key_id}",
      {},
      { renamed: ["users", "getPublicSshKeyForAuthenticatedUser"] },
    ],
    getPublicSshKeyForAuthenticatedUser: ["GET /user/keys/{key_id}"],
    getSshSigningKeyForAuthenticatedUser: [
      "GET /user/ssh_signing_keys/{ssh_signing_key_id}",
    ],
    list: ["GET /users"],
    listAttestations: ["GET /users/{username}/attestations/{subject_digest}"],
    listBlockedByAuthenticated: [
      "GET /user/blocks",
      {},
      { renamed: ["users", "listBlockedByAuthenticatedUser"] },
    ],
    listBlockedByAuthenticatedUser: ["GET /user/blocks"],
    listEmailsForAuthenticated: [
      "GET /user/emails",
      {},
      { renamed: ["users", "listEmailsForAuthenticatedUser"] },
    ],
    listEmailsForAuthenticatedUser: ["GET /user/emails"],
    listFollowedByAuthenticated: [
      "GET /user/following",
      {},
      { renamed: ["users", "listFollowedByAuthenticatedUser"] },
    ],
    listFollowedByAuthenticatedUser: ["GET /user/following"],
    listFollowersForAuthenticatedUser: ["GET /user/followers"],
    listFollowersForUser: ["GET /users/{username}/followers"],
    listFollowingForUser: ["GET /users/{username}/following"],
    listGpgKeysForAuthenticated: [
      "GET /user/gpg_keys",
      {},
      { renamed: ["users", "listGpgKeysForAuthenticatedUser"] },
    ],
    listGpgKeysForAuthenticatedUser: ["GET /user/gpg_keys"],
    listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
    listPublicEmailsForAuthenticated: [
      "GET /user/public_emails",
      {},
      { renamed: ["users", "listPublicEmailsForAuthenticatedUser"] },
    ],
    listPublicEmailsForAuthenticatedUser: ["GET /user/public_emails"],
    listPublicKeysForUser: ["GET /users/{username}/keys"],
    listPublicSshKeysForAuthenticated: [
      "GET /user/keys",
      {},
      { renamed: ["users", "listPublicSshKeysForAuthenticatedUser"] },
    ],
    listPublicSshKeysForAuthenticatedUser: ["GET /user/keys"],
    listSocialAccountsForAuthenticatedUser: ["GET /user/social_accounts"],
    listSocialAccountsForUser: ["GET /users/{username}/social_accounts"],
    listSshSigningKeysForAuthenticatedUser: ["GET /user/ssh_signing_keys"],
    listSshSigningKeysForUser: ["GET /users/{username}/ssh_signing_keys"],
    setPrimaryEmailVisibilityForAuthenticated: [
      "PATCH /user/email/visibility",
      {},
      { renamed: ["users", "setPrimaryEmailVisibilityForAuthenticatedUser"] },
    ],
    setPrimaryEmailVisibilityForAuthenticatedUser: [
      "PATCH /user/email/visibility",
    ],
    unblock: ["DELETE /user/blocks/{username}"],
    unfollow: ["DELETE /user/following/{username}"],
    updateAuthenticated: ["PATCH /user"],
  },
};
var endpoints_default = Endpoints;

const endpointMethodsMap = /* @__PURE__ */ new Map();
for (const [scope, endpoints] of Object.entries(endpoints_default)) {
  for (const [methodName, endpoint] of Object.entries(endpoints)) {
    const [route, defaults, decorations] = endpoint;
    const [method, url] = route.split(/ /);
    const endpointDefaults = Object.assign(
      {
        method,
        url,
      },
      defaults,
    );
    if (!endpointMethodsMap.has(scope)) {
      endpointMethodsMap.set(scope, /* @__PURE__ */ new Map());
    }
    endpointMethodsMap.get(scope).set(methodName, {
      scope,
      methodName,
      endpointDefaults,
      decorations,
    });
  }
}
const handler = {
  has({ scope }, methodName) {
    return endpointMethodsMap.get(scope).has(methodName);
  },
  getOwnPropertyDescriptor(target, methodName) {
    return {
      value: this.get(target, methodName),
      // ensures method is in the cache
      configurable: true,
      writable: true,
      enumerable: true,
    };
  },
  defineProperty(target, methodName, descriptor) {
    Object.defineProperty(target.cache, methodName, descriptor);
    return true;
  },
  deleteProperty(target, methodName) {
    delete target.cache[methodName];
    return true;
  },
  ownKeys({ scope }) {
    return [...endpointMethodsMap.get(scope).keys()];
  },
  set(target, methodName, value) {
    return (target.cache[methodName] = value);
  },
  get({ octokit, scope, cache }, methodName) {
    if (cache[methodName]) {
      return cache[methodName];
    }
    const method = endpointMethodsMap.get(scope).get(methodName);
    if (!method) {
      return void 0;
    }
    const { endpointDefaults, decorations } = method;
    if (decorations) {
      cache[methodName] = decorate(
        octokit,
        scope,
        methodName,
        endpointDefaults,
        decorations,
      );
    } else {
      cache[methodName] = octokit.request.defaults(endpointDefaults);
    }
    return cache[methodName];
  },
};
function endpointsToMethods(octokit) {
  const newMethods = {};
  for (const scope of endpointMethodsMap.keys()) {
    newMethods[scope] = new Proxy({ octokit, scope, cache: {} }, handler);
  }
  return newMethods;
}
function decorate(octokit, scope, methodName, defaults, decorations) {
  const requestWithDefaults = octokit.request.defaults(defaults);
  function withDecorations(...args) {
    let options = requestWithDefaults.endpoint.merge(...args);
    if (decorations.mapToData) {
      options = Object.assign({}, options, {
        data: options[decorations.mapToData],
        [decorations.mapToData]: void 0,
      });
      return requestWithDefaults(options);
    }
    if (decorations.renamed) {
      const [newScope, newMethodName] = decorations.renamed;
      octokit.log.warn(
        `octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`,
      );
    }
    if (decorations.deprecated) {
      octokit.log.warn(decorations.deprecated);
    }
    if (decorations.renamedParameters) {
      const options2 = requestWithDefaults.endpoint.merge(...args);
      for (const [name, alias] of Object.entries(
        decorations.renamedParameters,
      )) {
        if (name in options2) {
          octokit.log.warn(
            `"${name}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`,
          );
          if (!(alias in options2)) {
            options2[alias] = options2[name];
          }
          delete options2[name];
        }
      }
      return requestWithDefaults(options2);
    }
    return requestWithDefaults(...args);
  }
  return Object.assign(withDecorations, requestWithDefaults);
}

function legacyRestEndpointMethods(octokit) {
  const api = endpointsToMethods(octokit);
  return {
    ...api,
    rest: api,
  };
}
legacyRestEndpointMethods.VERSION = VERSION$1;

// pkg/dist-src/index.js

// pkg/dist-src/version.js
var VERSION = "20.1.2";

// pkg/dist-src/index.js
var Octokit = Octokit$1.plugin(
  requestLog,
  legacyRestEndpointMethods,
  paginateRest,
).defaults({
  userAgent: `octokit-rest.js/${VERSION}`,
});

var distWeb = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  Octokit: Octokit,
});

var require$$2 = /*@__PURE__*/ getAugmentedNamespace(distWeb);

var hasRequiredWakaBoxBFYV4s;

function requireWakaBoxBFYV4s() {
  if (hasRequiredWakaBoxBFYV4s) return wakaBoxBFYV4s;
  hasRequiredWakaBoxBFYV4s = 1;
  requireMain().config();
  const { WakaTimeClient, RANGE } = require$$1;
  const { Octokit } = require$$2;

  const {
    GIST_ID: gistId,
    GH_TOKEN: githubToken,
    WAKATIME_API_KEY: wakatimeApiKey,
  } = process.env;

  const wakatime = new WakaTimeClient(wakatimeApiKey);

  const octokit = new Octokit({ auth: `token ${githubToken}` });

  async function main() {
    const stats = await wakatime.getMyStats({ range: RANGE.LAST_7_DAYS });
    await updateGist(stats);
  }

  function trimRightStr(str, len) {
    // Ellipsis takes 3 positions, so the index of substring is 0 to total length - 3.
    return str.length > len ? str.substring(0, len - 3) + "..." : str;
  }

  async function updateGist(stats) {
    let gist;
    try {
      gist = await octokit.gists.get({ gist_id: gistId });
    } catch (error) {
      console.error(`Unable to get gist\n${error}`);
    }

    const lines = [];
    for (let i = 0; i < Math.min(stats.data.languages.length, 5); i++) {
      const data = stats.data.languages[i];
      const { name, percent, text: time } = data;

      const line = [
        trimRightStr(name, 10).padEnd(10),
        time.padEnd(14),
        generateBarChart(percent, 21),
        String(percent.toFixed(1)).padStart(5) + "%",
      ];

      lines.push(line.join(" "));
    }

    if (lines.length == 0) return;

    try {
      // Get original filename to update that same file
      const filename = Object.keys(gist.data.files)[0];
      await octokit.gists.update({
        gist_id: gistId,
        files: {
          [filename]: {
            filename: `📊 Weekly development breakdown`,
            content: lines.join("\n"),
          },
        },
      });
    } catch (error) {
      console.error(`Unable to update gist\n${error}`);
    }
  }

  function generateBarChart(percent, size) {
    const syms = "░▏▎▍▌▋▊▉█";

    const frac = Math.floor((size * 8 * percent) / 100);
    const barsFull = Math.floor(frac / 8);
    if (barsFull >= size) {
      return syms.substring(8, 9).repeat(size);
    }
    const semi = frac % 8;

    return [
      syms.substring(8, 9).repeat(barsFull),
      syms.substring(semi, semi + 1),
    ]
      .join("")
      .padEnd(size, syms.substring(0, 1));
  }

  (async () => {
    await main();
  })();
  return wakaBoxBFYV4s;
}

var wakaBoxBFYV4sExports = requireWakaBoxBFYV4s();
var index = /*@__PURE__*/ getDefaultExportFromCjs(wakaBoxBFYV4sExports);

module.exports = index;
