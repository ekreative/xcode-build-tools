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
  var exists = false;
  process.stdout.split('\n').forEach(function(keychain) {
    if (/login\.keychain-db/.test(keychain)) {
      winston.info('Keychain exists')
      exists = true;
      return;
    }

    exec('security delete-keychain ' + keychain.trim());
  });

  if (!exists) {
    return exec('security create-keychain -p "" login.keychain || :').then(function (process) {
      winston.info('Created keychain')
      return exec('security default-keychain -s login.keychain');
    }).then(function () {
      winston.info('Set default')
    })
  }
})
  .catch(function (err) {
    winston.error('Tried to create keychain', err)
    process.exit(1)
  })
