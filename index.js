/* jshint node: true */
'use strict';

var CachingWriter = require('broccoli-caching-writer');
var analyzer = require('riot/lib/server/analyzer');
var fs = require('fs');
var path = require('path');
var riot = require('riot');
var walkSync = require('walk-sync');
var util = require('util');

/**
 * Riot error.
 *
 * @constructor
 *
 * @param {Object[]} messages List of messages.
 * @param {String} fileName Name of file with syntax error.
 */
function RiotError(messages, fileName) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.file = fileName;
  this.message = 'Riot tag compiler';

  if (!util.isArray(messages)) {
    messages = [messages];
  }

  messages.forEach(function(message) {
    this.message += '\n> ';

    if (typeof message === 'string') {
      this.message += message;
    } else {  // analyzer error.
      this.message += message.line + ': ' + message.source;
      this.message += '\n  ' + message.error;
    }
  }, this);
}

util.inherits(RiotError, Error);

/**
 * @extends {CachingWriter}
 */
module.exports = CachingWriter.extend({
  /**
   * Initialize the broccoli Riot compiler.
   *
   * @param {Object[]} inputTrees List of trees to compile.
   * @param {String} outputFile Destination for compiled JS.
   * @param {Object} options `CachingWriter` options.
   */
  init: function(inputTrees, outputFile, options) {
    this._super.init(inputTrees, options);

    if (inputTrees.length) {
      this.options = inputTrees.map(function(inputTree) { return inputTree.options; });
    } else {
      this.options = [inputTrees.options];
    }

    this.outputFile = outputFile;
  },

  /**
   * Compile source trees to the destination.
   *
   * @param {String[]} srcPaths List of source tag files to compile.
   * @param {String} destDir Destination directory for compiled JS.
   */
  updateCache: function(srcPaths, destDir) {
    var jsFile = path.join(destDir, this.outputFile);
    var options;
    var tagFile;

    srcPaths.forEach(function(srcPath, index) {
      options = this.options[index];
      walkSync(srcPath).forEach(function(relativePath) {
        tagFile = path.join(srcPath, relativePath);

        if (fs.statSync(tagFile).isFile()) {
          this._compile(tagFile, jsFile, options);
        }
      }, this);
    }, this);
  },

  /**
   * Analyze the given source tag file.
   *
   * @param {String} source The source tag file to analyze.
   *
   * @return {String} Contents of the analyzed tag file.
   *
   * @throws {RiotError} if the tag file is invalid.
   *
   * @private
   */
  _analyze: function(source) {
    var retVal = fs.readFileSync(source, 'utf8');
    var analysis = analyzer(retVal);
    var messages = analysis.filter(function(result) { return result.error; });

    if (messages && messages.length) {
      throw new RiotError(messages, source);
    }

    return retVal;
  },

  /**
   * Compile the given source tag file to the given destination JS file.
   *
   * @param {String} source The source tag file to compile.
   * @param {String} destination The destination JavaScript file.
   * @param {Object} options Riot compile options.
   *
   * @throws {RiotError} if the tag file cannot be compiled.
   *
   * @private
   */
  _compile: function(source, destination, options) {
    var tag = this._analyze(source);
    var js;

    try {
      js = riot.compile(tag, options);
    } catch (error) {
      throw new RiotError(error.message, source);
    }
    var directory = path.dirname(destination);

    if (directory) {
      try {
        fs.mkdirSync(directory);
      } catch (error) {
        // ignore
      }
    }

    fs.appendFileSync(destination, js);
  }
});
