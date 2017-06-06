#!/usr/bin/env node

'use strict'

var winston = require('winston')
var program = require('commander')

var find = require('./lib/find-identity-name')

program
    .version(require('./package.json').version)
    .option('-k, --keychain-name <name>', 'Keychain Name - default APP_NAME', process.env.APP_NAME || 'build-tools')
    .parse(process.argv)

find(program.keychainName)
    .then(function (name) {
      process.stdout.write(name)
    }).catch(function (err) {
      winston.error('Error finding name', err)
      process.exit(1)
    })
