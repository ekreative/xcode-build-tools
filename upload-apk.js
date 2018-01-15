#!/usr/bin/env node

'use strict'

var fetch = require('node-fetch')
var FormData = require('form-data')
var fs = require('fs')
var winston = require('winston')
var program = require('commander')

var git = require('./lib/git')
var slack = require('./lib/slack')

program
    .version(require('./package.json').version)
    .description('Upload apk file to testbuild.rocks and (optional) send a link to slack')
    .option('-p, --project-id <id>', 'Project Id - default PROJECT_ID', parseInt, process.env.PROJECT_ID)
    .option('--project-url <url>', 'GitLab project url', process.env.CI_PROJECT_URL)
    .option('--server <name>', 'Alternative server address', 'https://testbuild.rocks')
    .option('--apk <name>', 'Apk file to upload - default app/build/outputs/apk/app-release.apk', (process.env.PROJECT_FOLDER || process.cwd()) + '/app/build/outputs/apk/app-release.apk')
    .option('--key <key>', 'Test build rocks key - default TEST_BUILD_ROCKS_KEY', process.env.TEST_BUILD_ROCKS_KEY)
    .option('-s, --slack-hook <hook>', 'Slack Hook - default SLACK_URL', process.env.SLACK_URL || process.env.SLACK_HOOK)
    .option('-c, --slack-channel <channel>', 'Slack Channel - default SLACK_CHANNEL', process.env.SLACK_CHANNEL)
    .option('-m, --message <message>', 'Test build rocks message', 'auto')
    .option('-r, --ref <ref>', 'Test build rocks git ref', process.env.CI_COMMIT_REF_SLUG || process.env.CI_BUILD_REF_SLUG || 'auto')
    .option('-c, --commit <commit>', 'Test build rocks git commit', process.env.CI_COMMIT_SHA || process.env.CI_BUILD_REF || 'auto')
    .parse(process.argv)

if (!program.projectId) {
  throw new Error('Missing GitLab Project Id')
}

if (!program.apk) {
  throw new Error('Missing Apk file')
}

if (!fs.existsSync(program.apk)) {
  throw new Error('Apk file doesnt exist')
}

if (!program.key) {
  throw new Error('Missing Test build rocks token')
}

if (program.message === 'auto') {
  program.message = git.commit()
}

if (program.ref === 'auto') {
  try {
    program.ref = git.branch()
  } catch (e) {
    program.ref = ''
  }
}

if (program.commit === 'auto') {
  try {
    program.commit = git.ref()
  } catch (e) {
    program.commit = ''
  }
}

winston.info('Uploading build')

var data = new FormData()
data.append('app', fs.createReadStream(program.apk))
data.append('comment', program.message)
data.append('ci', 'true')
data.append('ref', program.ref)
data.append('commit', program.commit)

data.getLengthSync = null // Work around until https://github.com/bitinn/node-fetch/issues/102

var result = fetch(program.server + '/api/builds/upload/' + program.projectId + '/android', {
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
  result = result.then(slack(program.slackHook, program.slackChannel, program.projectUrl))
}
result.catch(function (err) {
  winston.error('Error uploading apk', err)
  process.exit(1)
})
