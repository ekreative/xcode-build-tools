#!/usr/bin/env node

'use strict'

var cpr = require('cpr')
var crypto = require('crypto')
var os = require('os')
var path = require('path')
var program = require('commander')
var winston = require('winston')

var exec = require('./lib/exec')
var list = require('./lib/list')

program
  .version(require('./package.json').version)
  .description('Ensure default login keychain exists')
  .parse(process.argv)

exec('security list-keychains -d user').then(function(process) {
  if (/keychain/.test(process.stdout)) {
    winston.info('Keychain exists')
  } else {
    return exec('security create-keychain -p "" login.keychain').then(function(process) {
      winston.info('Created keychain')
    }).catch(function(err) {
      if (err === 48) {
        winston.info('Restored keychain')
      } else {
        throw err;
      }
    })
  }
})
  .catch(function(err) {
    winston.error('Tried to create keychain', err);
    process.exit(1)
  })
