// Import Node.js Dependencies
import { EventEmitter } from "node:events";
import { performance } from "node:perf_hooks";
import { inspect, styleText } from "node:util";
import readline from "node:readline";
import * as TTY from "node:tty";

// Import Third-party Dependencies
import * as cliSpinners from "cli-spinners";
import stripAnsi from "strip-ansi";
import ansiRegex from "ansi-regex";
import wcwidth from "@topcli/wcwidth";

// Import Internal Dependencies
import type { Color } from "./types.js";

// VARS
let internalSpinnerCount = 0;

// CONSTANTS
const kDefaultSpinnerName = "dots" satisfies cliSpinners.SpinnerName;
const kLogSymbols = process.platform !== "win32" || process.env.CI || process.env.TERM === "xterm-256color" ?
  { success: styleText(["green", "bold"], "✔"), error: styleText(["red", "bold"], "✖") } :
  { success: styleText(["green", "bold"], "✔"), error: styleText(["red", "bold"], "✖") };
const kAvailableColors = new Set(Object.keys(inspect.colors));

export interface ISpinnerOptions {
  /**
   * Spinner name (from cli-spinners lib)
   *
   * @default "dots"
   */
  name?: cliSpinners.SpinnerName;
  /**
   * Spinner frame color
   *
   * @default "white"
   */
  color?: Color | Color[];
  /**
   * Do not log anything when disabled
   *
   * @default true
   */
  verbose?: boolean;
}

export interface IStartOptions {
  withPrefix?: string;
}

export class Spinner extends EventEmitter {
  static reset() {
    internalSpinnerCount = 0;
  }

  public stream: TTY.WriteStream = process.stdout;

  #verbose = true;
  #started = false;
  #spinner: cliSpinners.Spinner;
  #text = "";
  #prefix = "";
  #color: Color;

  #interval: NodeJS.Timeout | null = null;
  #frameIndex = 0;
  #spinnerPos = 0;
  #startTime: number;

  constructor(options: ISpinnerOptions = {}) {
    super();
    this.#verbose = options.verbose ?? true;
    if (!this.#verbose) {
      return;
    }

    const { name = kDefaultSpinnerName, color = "white" } = options;

    this.#spinner = name in cliSpinners ? cliSpinners[name] : cliSpinners[kDefaultSpinnerName];

    const colors = Array.isArray(color) ? color : [color];

    if (colors.every((color) => kAvailableColors.has(color)) === false) {
      throw new Error("Invalid color given");
    }
  }

  get started() {
    return this.#started;
  }

  get verbose() {
    return this.#verbose;
  }

  get elapsedTime() {
    return performance.now() - this.#startTime;
  }

  get startTime() {
    return this.#startTime;
  }

  set text(value: string | undefined) {
    if (typeof value == "string") {
      this.#text = value.replaceAll(/\r?\n|\r/gm, "");
    }
  }

  get text() {
    return this.#text;
  }

  #getSpinnerFrame(spinnerSymbol?: string) {
    if (typeof spinnerSymbol === "string") {
      return spinnerSymbol;
    }

    const { frames } = this.#spinner;
    const frame = frames[this.#frameIndex];
    this.#frameIndex = ++this.#frameIndex < frames.length ? this.#frameIndex : 0;

    return styleText(this.#color, frame);
  }

  #lineToRender(spinnerSymbol?: string) {
    const terminalCol = this.stream.columns;
    const defaultRaw = `${this.#getSpinnerFrame(spinnerSymbol)} ${this.#prefix}${this.text}`;

    let regexArray: any[];
    let count = 0;
    while (1) {
      regexArray = defaultRaw
        .slice(0, terminalCol + count)
        .match(ansiRegex()) ?? [];
      if (regexArray.length === count) {
        break;
      }
      count = regexArray.length;
    }
    count += regexArray!.reduce((prev, curr) => prev + wcwidth(curr), 0);

    return wcwidth(stripAnsi(defaultRaw)) > terminalCol ?
      `${defaultRaw.slice(0, terminalCol + count)}\x1B[0m` :
      defaultRaw;
  }

  #renderLine(spinnerSymbol?: string) {
    if (!this.#verbose) {
      return;
    }

    const moveCursorPos = internalSpinnerCount - this.#spinnerPos;
    readline.moveCursor(this.stream, 0, -moveCursorPos);

    const line = this.#lineToRender(spinnerSymbol);
    readline.clearLine(this.stream, 0);
    this.stream.write(line);
    readline.moveCursor(this.stream, -(wcwidth(line)), moveCursorPos);
  }

  start(text?: string, options: IStartOptions = {}) {
    this.#started = true;
    this.text = text;
    if (typeof options.withPrefix === "string") {
      this.#prefix = options.withPrefix;
    }

    this.emit("start");
    this.#spinnerPos = internalSpinnerCount++;
    this.#startTime = performance.now();

    if (!this.#verbose) {
      return this;
    }

    this.#frameIndex = 0;
    this.stream.write(this.#lineToRender() + "\n");
    this.#interval = setInterval(
      () => this.#renderLine(),
      this.#spinner.interval
    );

    return this;
  }

  #stop(text?: string) {
    this.text = text;
    this.#started = false;

    if (this.#interval !== null) {
      clearInterval(this.#interval);
    }
  }

  succeed(text?: string) {
    if (this.#started) {
      this.#stop(text);
      this.#renderLine(kLogSymbols.success);
      this.emit("succeed");
    }

    return this;
  }

  failed(text?: string) {
    if (this.#started) {
      this.#stop(text);
      this.#renderLine(kLogSymbols.error);
      this.emit("failed");
    }

    return this;
  }
}
