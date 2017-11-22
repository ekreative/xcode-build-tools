#!/usr/bin/env node

'use strict'

var program = require('commander')
var winston = require('winston')

var exec = require('./lib/exec')

program
  .version(require('./package.json').version)
  .description('Ensure default login keychain exists')
  .parse(process.argv)

exec('security list-keychains -d user').then(function (process) {
  if (/keychain/.test(process.stdout)) {
    winston.info('Keychain exists')
  } else {
    return exec('security create-keychain -p "" login.keychain').then(function (process) {
      winston.info('Created keychain')
    }).catch(function (err) {
      if (err === 48) {
        winston.info('Restored keychain')
      } else {
        throw err
      }
    }).then(function () {
      return exec('security default-keychain -s login.keychain');
    })
  }
})
  .catch(function (err) {
    winston.error('Tried to create keychain', err)
    process.exit(1)
  })
