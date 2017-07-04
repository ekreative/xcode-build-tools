#!/usr/bin/env node

'use strict'

var fetch = require('node-fetch')
var FormData = require('form-data')
var fs = require('fs')
var winston = require('winston')
var program = require('commander')

var commit = require('./lib/commit')
var slack = require('./lib/slack')

program
    .version(require('./package.json').version)
    .description('Upload ipa file to testbuild.rocks and (optional) send a link to slack')
    .option('-p, --project-id <id>', 'Project Id - default PROJECT_ID', process.env.PROJECT_ID)
    .option('--server <name>', 'Alternative server address', 'https://testbuild.rocks')
    .option('--ipa <name>', 'Ipa file to upload - default build/Release-iphoneos/$APP_NAME.ipa', process.cwd() + '/build/Release-iphoneos/' + (process.env.APP_NAME ? process.env.APP_NAME + '.ipa' : 'app.ipa'))
    .option('--key <key>', 'Test build rocks key - default TEST_BUILD_ROCKS_KEY', process.env.TEST_BUILD_ROCKS_KEY)
    .option('-s, --slack-hook <hook>', 'Slack Hook - default SLACK_HOOK', process.env.SLACK_HOOK)
    .option('-c, --slack-channel <channel>', 'Slack Channel - default SLACK_CHANNEL', process.env.SLACK_CHANNEL)
    .option('-m, --message <message>', 'Test build rocks message', 'auto')
    .option('-r, --ref <ref>', 'Test build rocks git ref', process.env.CI_BUILD_REF_NAME)
    .parse(process.argv)

if (program.message === 'auto') {
  program.message = commit()
}

winston.info('Uploading build')

var data = new FormData()
data.append('app', fs.createReadStream(program.ipa))
data.append('comment', program.message)
data.append('ci', 'true')
data.append('ref', program.ref)

data.getLengthSync = null // Work around until https://github.com/bitinn/node-fetch/issues/102

var result = fetch(program.server + '/api/builds/upload/' + program.projectId + '/ios', {
  method: 'POST',
  body: data,
  headers: {
    'X-API-Key': program.key
  }
})
  .then(function (res) {
    if (res.status === 200) {
      return res
    }
    return res.text().then(function (body) {
      throw new Error('Failed to upload build to testbuild.rocks [' + body + ']')
    })
  })
  .then(function (res) { return res.json() })
  .then(function (json) {
    if (json.install) {
      winston.info('Build available at ' + json.install)
    }
    return json
  })
if (program.slackHook) {
  result = result.then(slack(program.slackHook, program.slackChannel))
}
result.catch(function (err) {
  winston.error('Error uploading ipa', err)
  process.exit(1)
})
