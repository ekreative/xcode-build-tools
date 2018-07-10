#!/usr/bin/env node

'use strict'

var program = require('commander')

var exec = require('./lib/exec')
var logger = require('./lib/logger')

program
  .version(require('./package.json').version)
  .description('Ensure default login keychain exists')
  .parse(process.argv)

exec('security list-keychains -d user').then(function (process) {
  var exists = false
  process.stdout.split('\n').forEach(function (keychainX) {
    var keychain = keychainX.trim()
    if (keychain) {
      if (/login\.keychain-db/.test(keychain)) {
        logger.info('Keychain exists')
        exists = true
        return
      }

      exec('security delete-keychain ' + keychain)
        .catch(function (err) {
          logger.error('Failed to delete keychain', keychain, err)
        })
    }
  })

  if (!exists) {
    return exec('security create-keychain -p "" login.keychain || :').then(function (process) {
      logger.info('Created keychain')
      return exec('security default-keychain -s login.keychain')
    }).then(function () {
      logger.info('Set default')
    })
  }
})
  .catch(function (err) {
    logger.error('Tried to create keychain', err)
    process.exit(1)
  })
