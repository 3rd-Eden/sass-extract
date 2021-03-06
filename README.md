# sass-extract

[![Build Status](https://travis-ci.org/jgranstrom/sass-extract.svg?branch=master&style=flat)](https://travis-ci.org/jgranstorm/sass-extract)
[![npm version](https://badge.fury.io/js/sass-extract.svg)](http://badge.fury.io/js/sass-extract)
[![dependencies Status](https://david-dm.org/jgranstrom/sass-extract/status.svg)](https://david-dm.org/jgranstrom/sass-extract)
[![devDependencies Status](https://david-dm.org/jgranstrom/sass-extract/dev-status.svg)](https://david-dm.org/jgranstrom/sass-extract?type=dev)
[![peerDependencies Status](https://david-dm.org/jgranstrom/sass-extract/peer-status.svg)](https://david-dm.org/jgranstrom/sass-extract?type=peer)

Extract structured variables from your sass files with no effort. Have all your style variables defined in style files, while being able to use them in javascript for things that cannot be styled with css such as complex visualisations or other dynamic content.

If you are using webpack make sure to also check out the [sass-extract-loader](https://github.com/jgranstrom/sass-extract-loader).

[![demo.gif](https://s27.postimg.org/w40sdzqjn/demo.gif)](https://postimg.org/image/oba4m0kkf/)
Demo of **sass-extract** using the [sass-extract-loader](https://github.com/jgranstrom/sass-extract-loader)

------

- [Installation](#installation)
- [API](#api)
  - [render(compileOptions)](#rendercompileoptions)
  - [renderSync(compileOptions)](#rendersynccompileoptions)
  - [extract(rendered, { compileOptions })](#extractrendered--compileoptions-)
  - [extractSync(rendered, { compileOptions })](#extractsyncrendered--compileoptions-)
- [Variable context](#variable-context)
  - [Global variables](#global-variables)
  - [Local variables](#local-variables)
  - [Overrides](#overrides)
- [Data types](#data-types)
  - [General variable value structure](#general-variable-value-structure)
  - [SassString](#sassstring)
  - [SassBoolean](#sassboolean)
  - [SassNull](#sassnull)
  - [SassNumber](#sassnumber)
  - [SassColor](#sasscolor)
  - [SassList](#sasslist)
  - [SassMap](#sassmap)
- [What is sass-extract?](#what-is-sass-extract)
- [Requirements](#requirements)
- [Contributing](#contributing)
  - [Running tests](#running-tests)

## Installation
```bash
npm install --save node-sass sass-extract
```
*Note that the node-sass compiler have to be installed as it is a peer dependency of sass-extract.*

## API
The API is deliberately kept very similar to that of `node-sass`. This is because `sass-extract` can be used as a replacement that will add variable extraction as an additional feature to compiling the sass into css.

##### render(compileOptions)

An augmented version of the `node-sass` render function that in addition to rendering css also extract sass variables into `rendered.vars`.

See [node-sass](https://github.com/sass/node-sass) for documentation of the compileOptions object.

To be able to extract variables across multiple files using the `@import` directive you need to provide either `file` or `includePaths` for import lookups.

```js
const sassExtract = require('sass-extract');

sassExtract.render({
  file: 'path/to/my/styles.scss'
})
.then(rendered => {
  console.log(rendered.vars);
  console.log(rendere.css.toString());
});
```

##### renderSync(compileOptions)

A synchronous version of the `render` function.

```js
const sassExtract = require('sass-extract');

const rendered = sassExtract.render({
  file: 'path/to/my/styles.scss'
});

console.log(rendered.vars);
console.log(rendere.css.toString());
```

##### extract(rendered, { compileOptions })

Extract variables for a rendered sass files.

See [node-sass](https://github.com/sass/node-sass) for documentation of the compileOptions object.

Generally you will pass the same compileOptions to both `node-sass` for rendering and **sass-extract** for extraction.

To be able to extract variables across multiple files using the `@import` directive you need to provide either `file` or `includePaths` for import lookups.

```js
const sass = require('node-sass');
const sassExtract = require('sass-extract');

const rendered = sass.renderSync({
  file: 'path/to/my/styles.scss'
});

sassExtract.extract(rendered, {
  file: 'path/to/my/styles.scss'
})
.then(vars => {
  console.log(vars);
});
```

##### extractSync(rendered, { compileOptions })

A synchronous version of the `extract` function.

```js
const sass = require('node-sass');
const sassExtract = require('sass-extract');

const rendered = sass.renderSync({
  file: 'path/to/my/styles.scss'
});

const vars = sassExtract.extractSync(rendered, {
  file: 'path/to/my/styles.scss'
});

console.log(vars);
```

## Variable context

Sass features both global and local variables.

```scss
// style.scss

$globalVariable1: 123px; // global

div {
  $localVariable1: red; // Local
  $globalVariable2: 1em !global; // global
}
```

The extracted variables returned from **sass-extract** are namespaced by the context where they are declared, so `global` variables will be placed in `vars.global`;

##### Global variables

A global variable is accessible from anywhere withint that file, as well as from files that `@import` the file where the variable is declared. A variable is considered global when it is declared outside of any selector, or if the annotation `!global` is included after the variable expression.

```scss
// styleA.scss
$a: 123px;
@import './styleB.scss';
```

```scss
// styleB.scss
$b: 456px;
```

```js
// extracted variables of styleA.scss
{
  global: {
    $a: {/*...*/},
    $b: {/*...*/}
  }
}
```

##### Local variables

A local variable is only accessible from within the selector where it is declared and from children to that selector.

Currently sass-extract supports extraction of global variables only. Local variables based on selectors and APIs to utilize them is on the roadmap. Global variables is however covers the most likely use cases of this tool at this point, and thus made sense to be the fundamental first feature.

##### Overrides

Variables in sass can be overridden any number of times and across multiple files when using `@import`. A variable can only have one final value within its context, but intermediate values can be assigned to separate variables in order to be retained.

**sass-extract** will always extract the final computed value of a variable, no matter the number of overrides. This means however that variables can have multiple different expressions and be specified in multiple files, while still always having one value.

```scss
// styleA.scss
$a: 123px;
$b: $a;
@import './styleB.scss';
```

```scss
// styleB.scss
$a: 456px;
```

```js
// extracted variables of styleA.scss
{
  global: {
    $a: { value: 456 },
    $b: { value: 123 }
  }
}
```

## Data types

Sass has a few different data types that a variable can have. These are detected by **sass-extract** automatically and the structure of the result of a variable value will be adapted to the type of the variables. Below follows descriptions for how each type of variable is extracted.


##### General variable value structure

Each variable extracted is available under its context by a key which is the variable name as specified in the sass file.

```scss
// style.scss
$myVariable: 123px;
```

```js
// Corresponding variable result object
{
  global: {
    $myVariable: {
      type: 'SassNumber',
      sources: [ 'path/to/style.sass' ],
      expressions: [ '123px' ],
      unit: 'px' // Data type specific field
    }
  }
}
```

Each of the variable results will have the same general structure and potentially additional type specific fields.

| field  | description |
|---|---|
| `type`| A string describing the data type of the extracted variables  |
| `sources`| An array of all file paths where this variables is declared  |
| `expressions`| An array of all expressions that defines the variable value |

Note that `sources` and `expressions` are both arrays, see [Overrides](#overrides) for details about this.

##### SassString
```scss
$variable: 'string';
```
```js
{
  type: 'SassString',
  value: 'string'
}
```

##### SassBoolean
```scss
$variable: true;
```
```js
{
  type: 'SassBoolean',
  value: true
}
```

##### SassNull
```scss
$variable: null;
```
```js
{
  type: 'SassNull',
  value: null
}
```

##### SassNumber
*SassNumbers contains both the extracted number and their unit*
```scss
$variable: 123px;
```
```js
{
  type: 'SassNumber',
  value: 123,
  unit: 'px'
}
```

##### SassColor
*SassColors contains extracted colors in both rgba and hex formats*

```scss
$variable: #FF0000;
```
```js
{
  type: 'SassColor',
  value: {
    r: 255,
    g: 0,
    b: 0,
    a: 1,
    hex: '#FF0000'
  }
}

```

*Or alternatively*

```scss
$variable: rgba(0, 255, 0, 0.5);
```
```js
{
  type: 'SassColor',
  value: {
    r: 0,
    g: 255,
    b: 0,
    a: 0.5,
    hex: '#00FF00'
  }
}

```

##### SassList
*SassLists contains recursive types as an array*

```scss
$variable: 1px solid black;
```
```js
{
  type: 'SassList',
  value: [
    {
      type: 'SassNumber',
      value: 1,
      unit: 'px'
    },
    {
      type: 'SassString',
      value: 'solid'
    },
    {
      type: 'SassColor',
      value: {
        r: 0,
        g: 0,
        b: 0,
        a: 1,
        hex: '#000000'
      }
    }
  ]
}
```

##### SassMap
*SassMaps contains recursive types as an object with matching field names*

```scss
$variable: ( width: 10em, height: 5em );
```
```js
{
  type: 'SassMap',
  value: {
    width: {
      type: 'SassNumber',
      value: 10,
      unit: 'em'
    },
    height: {
      type: 'SassNumber',
      value: 5,
      unit: 'em'
    }
  }
}
```

## What is sass-extract?

**sass-extract** is a tool that compiles sass files into a JSON object containing its variables and their computed values. This can be very useful when you need to style something that cannot be styled by css, or when you need to know details about the styles in your javascript.

It is built on top of [node-sass](https://github.com/sass/node-sass) which is using the performant [libsass](http://sass-lang.com/libsass) compiler. **sass-extract** is using native features in libsass in order to extract computed variables from your stylesheet that will be identical to the values in the generated css. This means you can expect to get the correct extracted value of a variable like `$myVariable: $multiplier * 200px / 10`, even if the `$multipler` variable is a variable defined in a separate imported sass file.

The purpose of this library is to give you the option to keep all of your style information in style files as expected. Maybe you are rendering on a canvas and cannot use css for styling the content, then this library will help you out.

There are other solutions to the same problem such as placing some of your style variables in a JSON file an including them into the sass, but with **sass-extract** you can skip that additional complexity of separate files and preprocessing and just get the variables directly from the sass itself.

## Requirements
- `node-sass >= 3.8.0`
- `node >= 4`

## Contributing

**sass-extract** is using babel in order to take advantage of recent langugae features.

##### Compile source
```bash
npm run compile
```

##### Running tests

```bash
npm test
```

##### Commits

In order to have readable commit messages and the ability to generate a changelog the commit messages should follow a certain structure.

To make it easier install `npm install -g commitizen` and commit using `git-cz`.

Generate changelog using `npm install -g conventional-changelog` and `npm run changelog`.

##### Releasing new versions

1. Make changes
2. Commit those changes
4. Set new version in package.json
5. `npm run changelog`
6. Commit package.json and CHANGELOG.md files
7. Tag
8. Push