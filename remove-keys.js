#!/usr/bin/env node

'use strict'

var del = require('del')
var path = require('path')
var program = require('commander')
var os = require('os')

var exec = require('./lib/exec')
var list = require('./lib/list')
var logger = require('./lib/logger')

program
  .version(require('./package.json').version)
  .description('Delete a keychain and provisioning profiles')
  .option('-k, --keychain-name <name>', 'Keychain Name - default APP_NAME', process.env.APP_NAME || 'build-tools')
  .option('--provisioning-profiles <profile>', 'Provisioning profiles - default PROVISIONING_PROFILE', list, list(process.env.PROVISIONING_PROFILE))
  .parse(process.argv)

var commandPromise = exec('security delete-keychain "' + program.keychainName + '.keychain" || :')

commandPromise.catch(function (err) {
  logger.error('Error deleting keychain', err)
  process.exit(1)
})

// Delete the provisioning profiles
program.provisioningProfiles && program.provisioningProfiles.forEach(function (profile) {
  var name = path.basename(profile, path.extname(profile))
  del(os.homedir() + '/Library/MobileDevice/Provisioning Profiles/' + name + '.mobileprovision', { force: true }, function (err) {
    if (err) {
      logger.error('Error deleting profiles', err)
      process.exit(1)
    }
  })
})
