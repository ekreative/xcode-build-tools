#!/usr/bin/env node

'use strict'

var winston = require('winston')
var program = require('commander')

var exec = require('./lib/exec')
var list = require('./lib/list')

program.version(require('./package.json').version)
    .description('Create an .ipa file from an .app')
    .option('-k, --keychain-name <name>', 'Keychain Name - default APP_NAME', process.env.APP_NAME || 'build-tools')
    .option('--ipa <name>', 'Ipa file to create - default build/Release-iphoneos/$APP_NAME.ipa', process.cwd() + '/build/Release-iphoneos/' + (process.env.APP_NAME ? process.env.APP_NAME + '.ipa' : 'app.ipa'))
    .option('--app <name>', 'App file to convert - default build/Release-iphoneos/$APP_NAME.app', process.cwd() + '/build/Release-iphoneos/' + (process.env.APP_NAME ? process.env.APP_NAME + '.app' : 'app.app'))
    .option('--provisioning-profile <profile>', 'Provisioning profile - default PROVISIONING_PROFILE', list, list(process.env.PROVISIONING_PROFILE))
    .parse(process.argv)

var create = function create () {
  var embed = program.provisioningProfile.length ? ' -embed "' + program.provisioningProfile + '"' : ''

  return exec('xcrun -log -sdk iphoneos PackageApplication "' + program.app + '" -o "' + program.ipa + '" ' + embed)
}

create().catch(function (err) {
  winston.error('Error creating ipa', err)
  process.exit(1)
})
