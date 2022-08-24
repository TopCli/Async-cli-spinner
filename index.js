// Import Node.js Dependencies
import { EventEmitter, once } from "events";
import { performance } from "perf_hooks";
import * as timers from "timers/promises";
import readline from "readline";

// Import Third-party Dependencies
import is from "@slimio/is";
import cliSpinners from "cli-spinners";
import cliCursor from "cli-cursor";
import stripAnsi from "strip-ansi";
import ansiRegex from "ansi-regex";
import wcwidth from "@topcli/wcwidth";
import kleur from "kleur";

// Import Internal Dependencies
import logSymbols from "./src/logSymbols.js";

// CONSTANT
const LINE_JUMP = 1;
const recapSetOpt = new Set(["none", "error", "always"]);

// Symbol
const symSpinner = Symbol("spinner");
const symPrefixText = Symbol("prefixText");
const symText = Symbol("text");
const symColor = Symbol("color");

/**
 * @typedef {object} SpinnerObj
 * @property {string[]} frames Array string frames of spinner
 * @property {number} interval interval between each frame
 */

export default class Spinner {
  /**
   * @class Spinner
   * @memberof Spinner#
   * @param {object} [options] options
   * @param {SpinnerObj|string} options.spinner Object for custom or string to get from cli-spinner
   * @param {string} options.prefixText String spinner prefix text to display
   * @param {string} options.text Spinner text to display
   * @param {string} options.color Spinner color to display
   * @param {boolean} options.verbose Display spinner in console
   */
  constructor(options = Object.create(null)) {
    this.verbose = is.boolean(options.verbose) ? options.verbose : true;
    this.startTime = performance.now();
    if (!this.verbose) {
      return;
    }

    this.spinner = options.spinner;
    this.prefixText = options.prefixText;
    this.text = is.string(options.text) ? options.text : "";
    this.color = options.color;
    this.emitter = new EventEmitter();
    this.stream = process.stdout;
    this.started = false;

    once(this.emitter, "start").then(() => {
      this.spinnerPos = Spinner.count;
      Spinner.count++;
    }).catch(console.error);
  }

  /**
   * @public
   * @memberof Spinner#
   * @member {number} elapsedTime
   * @returns {number}
   */
  get elapsedTime() {
    return performance.now() - this.startTime;
  }

  /**
   * @public
   * @memberof Spinner#
   * @param {string} value Spinner text
   *
   * @throws {TypeError}
   */
  set text(value) {
    if (!is.string(value)) {
      throw new TypeError("text must be a type of string");
    }
    this[symText] = value.replace(/\r?\n|\r/, "");
  }

  /**
   * @public
   * @memberof Spinner#
   * @member {string} text
   * @returns {string}
   */
  get text() {
    return this[symText];
  }

  /**
   * @public
   * @memberof Spinner#
   * @param {string} value Spinner prefix text
   */
  set prefixText(value) {
    this[symPrefixText] = is.string(value) ? `${value.replace(/\r?\n|\r/, "")} - ` : "";
  }

  /**
   * @public
   * @memberof Spinner#
   * @member {string} prefixText
   * @returns {string}
   */
  get prefixText() {
    return this[symPrefixText];
  }

  /**
   * @public
   * @memberof Spinner#
   * @param {string} value Spinner color
   *
   * @throws {TypeError}
   */
  set color(value) {
    if (!is.string(value) && !is.nullOrUndefined(value)) {
      throw new TypeError("Color must be a type of string or undefined");
    }
    this[symColor] = value;
  }

  /**
   * @public
   * @memberof Spinner#
   * @member {string} color
   * @returns {string}
   */
  get color() {
    return this[symColor];
  }

  /**
   * @public
   * @memberof Spinner#
   * @param {object|string} value text value
   *
   * @throws {TypeError}
   */
  set spinner(value) {
    if (is.plainObject(value)) {
      if (is.nullOrUndefined(value.frames)) {
        throw new Error("Spinner object must have a frames property");
      }
      if (is.nullOrUndefined(value.interval)) {
        throw new Error("Spinner object must have an interval property");
      }
      this[symSpinner] = value;
    }
    else if (is.string(value)) {
      if (cliSpinners[value]) {
        this[symSpinner] = cliSpinners[value];
      }
      else {
        throw new Error(`There is no built-in spinner named '${value}'. See "cli-spinners" from sindresorhus for a full list.`);
      }
    }
    // else if (process.platform === "win32") {
    //     this[symSpinner] = cliSpinners[DEFAULT_WIN_SPINNER];
    // }
    else if (is.nullOrUndefined(value)) {
      this[symSpinner] = cliSpinners[Spinner.DEFAULT_SPINNER];
    }
    else {
      throw new TypeError("spinner must be a type of string|object|undefined");
    }
    this.frameIndex = 0;
  }

  /**
   * @public
   * @memberof Spinner#
   * @member {object} spinner
   * @returns {object}
   */
  get spinner() {
    return this[symSpinner];
  }

  /**
   * @private
   * @function lineToRender
   * @memberof Spinner#
   * @param {string} [symbol] Text symbol
   *
   * @returns {string}
   */
  lineToRender(symbol) {
    const terminalCol = this.stream.columns;
    let frame;
    if (is.nullOrUndefined(symbol)) {
      const { frames } = this.spinner;
      frame = frames[this.frameIndex];
      this.frameIndex = ++this.frameIndex < frames.length ? this.frameIndex : 0;
    }
    else {
      frame = symbol;
    }

    if (!is.nullOrUndefined(this.color)) {
      frame = kleur[this.color](frame);
    }
    const defaultRaw = `${frame} ${this.prefixText}${this.text}`;

    let regexArray = [];
    let count = 0;
    while (1) {
      const sliced = defaultRaw.slice(0, terminalCol + count);
      regexArray = sliced.match(ansiRegex()) || [];
      if (regexArray.length === count) {
        break;
      }
      count = regexArray.length;
    }
    count += regexArray.reduce((prev, curr) => prev + wcwidth(curr), 0);

    if (wcwidth(stripAnsi(defaultRaw)) > terminalCol) {
      return `${defaultRaw.slice(0, terminalCol + count)}\x1B[0m`;
    }

    return defaultRaw;
  }

  /**
   * @private
   * @function renderLine
   * @memberof Spinner#
   * @param {string} [symbol] Text symbol
   *
   * @returns {void}
   */
  renderLine(symbol) {
    const moveCursorPos = Spinner.count - this.spinnerPos;
    readline.moveCursor(this.stream, 0, -moveCursorPos);

    const line = this.lineToRender(symbol);
    readline.clearLine(this.stream);
    this.stream.write(line);
    readline.moveCursor(this.stream, -line.length, moveCursorPos);
  }

  /**
   * @public
   * @function start
   * @memberof Spinner#
   * @param {string} [text] text
   *
   * @returns {void}
   */
  start(text) {
    if (!this.verbose) {
      return this;
    }
    if (!is.nullOrUndefined(text)) {
      this.text = text;
    }
    this.started = true;
    this.startTime = performance.now();
    this.emitter.emit("start");
    setImmediate(() => Spinner.emitter.emit("start"));

    this.frameIndex = 0;
    console.log(this.lineToRender());
    this.interval = setInterval(this.renderLine.bind(this), this.spinner.interval);

    return this;
  }

  /**
   * @private
   * @function stop
   * @memberof Spinner#
   * @param {string} [text] Spinner text
   *
   * @returns {void}
   */
  stop(text) {
    if (!this.verbose || this.started === false) {
      return;
    }

    if (!is.nullOrUndefined(text)) {
      this.text = text;
    }
    this.started = false;
    clearInterval(this.interval);
  }

  /**
   * @public
   * @function succeed
   * @memberof Spinner#
   * @param {string} [text] Spinner text
   *
   * @returns {void}
   */
  succeed(text) {
    if (!this.verbose) {
      return;
    }

    this.stop(text);
    this.renderLine(logSymbols.success);
    Spinner.emitter.emit("succeed");
  }

  /**
   * @public
   * @function failed
   * @memberof Spinner#
   * @param {string} [text] Spinner text
   *
   * @returns {void}
   */
  failed(text) {
    if (!this.verbose) {
      return;
    }

    this.stop(text);
    this.renderLine(logSymbols.error);
    Spinner.emitter.emit("failed");
  }
}


/**
 * @static
 * @memberof Spinner#
 * @function startAll
 * @param {Function[]} array array
 * @param {object} [options] options
 * @param {boolean} [options.recap=true] Write a recap in terminal
 * @param {boolean} [options.rejects=true] Write all rejection in terminal
 *
 * @returns {Promise<any[]>}
 */
Spinner.startAll = async function startAll(functions, options = Object.create(null)) {
  if (!is.array(functions)) {
    throw new TypeError("functions param must be a type of <array>");
  }

  for (const elem of functions) {
    if (is.array(elem)) {
      const [fn] = elem;
      if (!is.asyncFunction(fn)) {
        throw new TypeError("The first item of an array in startAll() functions param must be a type of <Function>");
      }

      continue;
    }
    if (!is.asyncFunction(elem)) {
      throw new TypeError("Item startAll() functions param must be a type of <Function>");
    }
  }

  if (!is.nullOrUndefined(options.recap) && !recapSetOpt.has(options.recap)) {
    throw new Error(`recap option must be ${[...recapSetOpt].join("|")}`);
  }

  const recapOpt = recapSetOpt.has(options.recap) ? options.recap : "always";
  const rejectOpt = is.boolean(options.rejects) ? options.rejects : true;
  let recap = recapOpt === "always";
  let [started, finished, failed] = [0, 0, 0];

  /**
   * @function writeRecap
   * @returns {void}
   */
  function writeRecap() {
    const col = process.stdout.columns;
    const recapStr = `${finished} / ${functions.length} : with ${failed} failed`;
    const displayRecap = recapStr.length > col ? recapStr.slice(0, col) : recapStr;

    readline.moveCursor(process.stdout, 0, LINE_JUMP);
    readline.clearLine(process.stdout);
    process.stdout.write(displayRecap);
    readline.moveCursor(process.stdout, -displayRecap.length, -LINE_JUMP);
  }


  Spinner.emitter.on("start", () => {
    started++;
    if (started === functions.length && recap === true) {
      console.log("\n".repeat(LINE_JUMP - 1));
      readline.moveCursor(process.stdout, 0, -LINE_JUMP);
      writeRecap();
    }
  });

  Spinner.emitter.on("succeed", () => {
    finished++;
    if (started === functions.length && recap === true) {
      writeRecap();
    }
  });

  Spinner.emitter.on("failed", () => {
    finished++;
    failed++;
    recap = recapOpt === "error" || recapOpt === "always";
    if (started === functions.length && recap === true) {
      writeRecap();
    }
  });

  cliCursor.hide();
  const rejects = [];
  const results = await Promise.all(
    functions.map((promise) => {
      if (is.array(promise)) {
        const [fn, ...args] = promise;

        return fn(...args).catch((err) => rejects.push(err));
      }

      return promise().catch((err) => rejects.push(err));
    })
  );

  await timers.setImmediate();
  if (recap === true) {
    writeRecap();
    readline.moveCursor(process.stdout, 0, LINE_JUMP + 1);
  }

  if (rejectOpt === true && rejects.length > 0) {
    for (const reject of rejects) {
      console.error(`\n${reject.stack}`);
    }
  }
  cliCursor.show();
  Spinner.count = 0;

  return results;
};

/**
 * @static
 * @function create
 * @memberof Spinner#
 * @param {Function} fn Async function
 * @param {Array} args array of arguments for the async function
 * @returns {Array<any>}
 *
 * @throws {TypeError}
 */
Spinner.create = function create(fn, ...args) {
  if (!is.asyncFunction(fn)) {
    throw new TypeError("fn param must be an Asynchronous Function");
  }
  if (args.length > 0) {
    return [fn, ...args];
  }

  return fn;
};

Spinner.DEFAULT_SPINNER = "dots";
Spinner.count = 0;
Spinner.emitter = new EventEmitter();
Object.preventExtensions(Spinner);
