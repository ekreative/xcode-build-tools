#!/usr/bin/env node

'use strict'

var program = require('commander')

var exec = require('./lib/exec')
var logger = require('./lib/logger')

program.version(require('./package.json').version)
  .description('Set version for building')
  .option('-v, --current-version <current-version>', 'Current main version')
  .parse(process.argv)

var version = function () {
  return Promise.resolve()
    .then(function () {
      if (program.currentVersion) {
        return program.currentVersion
      } else {
        return exec('agvtool what-marketing-version -terse1')
          .then(function (result) {
            return result.stdout.trim()
          })
      }
    })
    .then(function (version) {
      return exec('agvtool new-version -all "' + version + 'dev$(date +"%Y_%m_%d_%H_%M")$CI_BUILD_REF_NAME"')
    })
}

version().catch(function (err) {
  logger.error('Error updating version', err)
  process.exit(1)
})
