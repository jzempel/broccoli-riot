# broccoli-riot

The broccoli-riot plugin compiles [Riot](https://muut.com/riotjs/) tag
files.

## Installation

    $ npm install --save-dev git+https://git@github.com:jzempel/broccoli-riot.git

## Usage

```js
var RiotCompiler = require('broccoli-riot');

var outputTree = new RiotCompiler(inputTrees, outputFile, options);
```

* **`inputTrees`**: A list of trees (or single tree) containing tag
  files to compile. If an `options` object is attached to any tree, it
  is passed through to the Riot [compiler](https://muut.com/riotjs/compiler.html#pre-processors).
  This allows you to compile one tree with ES6 tags and another with
  CoffeeScript tags, for example.

* **`outputFile`**: Relative destination for the compile JS.

* **`options`**: See [broccoli-caching-writer
  options](https://github.com/ember-cli/broccoli-caching-writer#options).
