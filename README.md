# Spinner

![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/TopCli/Spinner/main/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/TopCli/Spinner/commit-activity)
[![mit](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://github.com/TopCli/Spinner/blob/main/LICENSE)
[![scorecard](https://api.securityscorecards.dev/projects/github.com/TopCli/Spinner/badge?style=for-the-badge)](https://ossf.github.io/scorecard-visualizer/#/projects/github.com/TopCli/Spinner)
![build](https://img.shields.io/github/actions/workflow/status/TopCli/Spinner/node.js.yml?style=for-the-badge)

Asynchronous CLI Spinner. This package has been created to handle simultaneous/multiple spinner at a time. The package has been inspired by [Ora](https://github.com/sindresorhus/ora) but asynchronous.

All available spinners are part of [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme) package.

<p align="center">
<img src="https://github.com/SlimIO/Governance/blob/master/docs/images/cli_init.gif">
</p>

## Requirements

- [Node.js](https://nodejs.org/en/) v20 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @topcli/spinner
# or
$ yarn add @topcli/spinner
```

## Usage example

Create and wait multiple spinner at a time.

```js
import * as timers from "node:timers/promises";
import { Spinner } from "@topcli/spinner";

async function fnWithSpinner(withPrefix, succeed = true) {
    const spinner = new Spinner()
      .start("Start working!", { withPrefix });

    await timers.setTimeout(1000);
    spinner.text = "Work in progress...";
    await timers.setTimeout(1000);

    if (succeed) {
        spinner.succeed(`All done in ${spinner.elapsedTime.toFixed(2)}ms !`);
    }
    else {
        spinner.failed("Something wrong happened !");
    }
}

await Promise.allSettled([
    fnWithSpinner(),
    fnWithSpinner("Item 1"),
    fnWithSpinner("Item 2", false)
]);
Spinner.reset(); // reset internal count
console.log("All spinners finished!");
```

If you want to only achieve one Spinner by one Spinner, use it like Ora (it will work)
```js
const spinner = new Spinner().start("Start working!");

await timers.setTimeout(1_000);
spinner.text = "Work in progress...";

await timers.setTimeout(1_000);
spinner.succeed("All done !");
```

> [!TIP]
> When you are working on a CLI that can be used as an API too, the **verbose** option allow you to disable the Spinner.

## API

<details><summary>constructor(options?: ISpinnerOptions)</summary>
<br>

Create a new Spinner. The **options** payload is described by the following TypeScript interface:

```ts
type ForegroundColors =
  | "black"
  | "blackBright"
  | "blue"
  | "blueBright"
  | "cyan"
  | "cyanBright"
  | "gray"
  | "green"
  | "greenBright"
  | "grey"
  | "magenta"
  | "magentaBright"
  | "red"
  | "redBright"
  | "white"
  | "whiteBright"
  | "yellow"
  | "yellowBright";

type BackgroundColors =
  | "bgBlack"
  | "bgBlackBright"
  | "bgBlue"
  | "bgBlueBright"
  | "bgCyan"
  | "bgCyanBright"
  | "bgGray"
  | "bgGreen"
  | "bgGreenBright"
  | "bgGrey"
  | "bgMagenta"
  | "bgMagentaBright"
  | "bgRed"
  | "bgRedBright"
  | "bgWhite"
  | "bgWhiteBright"
  | "bgYellow"
  | "bgYellowBright";

type Modifiers =
  | "blink"
  | "bold"
  | "dim"
  | "doubleunderline"
  | "framed"
  | "hidden"
  | "inverse"
  | "italic"
  | "overlined"
  | "reset"
  | "strikethrough"
  | "underline";

export type Color = ForegroundColors | BackgroundColors | Modifiers

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
  color?: Color;
  /**
   * Do not log anything when disabled
   *
   * @default true
   */
  verbose?: boolean;
}
```

> [!TIP]
> Check [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme) for all the spinner name.

```js
new Spinner({ name: "dots2" });
```

</details>

<details><summary>start(text?: string, options?: IStartOptions): Spinner</summary>

Start the spinner and optionaly write the text passed as first parameter.

The **options** payload is described by the following TypeScript interface:

```ts
export interface IStartOptions {
  withPrefix?: string;
}
```

</details>

<details><summary>succeed(text?: string): void</summary>

Stop the spinner in the CLI, write the text passed in param and mark it as succeed with a symbol.

</details>

<details><summary>failed(text?: string): void</summary>

Stop the spinner in the CLI, write the text passed in param and mark it as failed with a symbol.

</details>
<br>

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Gentilhomme"/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/TopCli/Spinner/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/TopCli/Spinner/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AlexandreMalaj"><img src="https://avatars.githubusercontent.com/u/32218832?v=4?s=100" width="100px;" alt="Alexandre Malaj"/><br /><sub><b>Alexandre Malaj</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=AlexandreMalaj" title="Code">💻</a> <a href="https://github.com/TopCli/Spinner/commits?author=AlexandreMalaj" title="Documentation">📖</a> <a href="https://github.com/TopCli/Spinner/issues?q=author%3AAlexandreMalaj" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=PierreDemailly" title="Code">💻</a> <a href="#maintenance-PierreDemailly" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://justie.dev"><img src="https://avatars.githubusercontent.com/u/7118300?v=4?s=100" width="100px;" alt="Ben"/><br /><sub><b>Ben</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/issues?q=author%3AJUSTIVE" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
