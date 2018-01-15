#!/usr/bin/env node

'use strict'

var execSync = require('child_process').execSync
var fetch = require('node-fetch')
var FormData = require('form-data')
var program = require('commander')
var winston = require('winston')

var git = require('./lib/git')

program
    .version(require('./package.json').version)
    .description('Create a new release on GitLab')
    .option('--server <server>', 'GitLab server', process.env.GITLAB_API || 'https://git.ekreative.com')
    .option('--token <token>', 'Api key', process.env.GITLAB_API_TOKEN)
    .option('--project-id <id>', 'Project Id', process.env.CI_PROJECT_ID)
    .option('--tag-name <tag>', 'Tag name', 'auto')
    .option('--ref <ref>', 'Git ref', process.env.CI_COMMIT_SHA || process.env.CI_BUILD_REF || 'auto')
    .option('--apk <name>', 'Apk file to find version - default app/build/outputs/apk/app-release.apk', (process.env.PROJECT_FOLDER || process.cwd()) + '/app/build/outputs/apk/app-release.apk')
    .option('--appVersion <appVersion>', 'Set the version to tag, will have build number added')
    .option('--build-number <build>', 'Set the build number to use', process.env.CI_JOB_ID || process.env.CI_BUILD_ID || '1')
    .option('-n, --notes <notes>', 'Release notes', 'auto')
    .parse(process.argv)

if (!program.buildNumber) {
  throw new Error('Missing build number')
}

if (program.notes === 'auto') {
  program.notes = git.commit()
}

if (!program.server) {
  throw new Error('Missing GitLab server')
}

if (!program.token) {
  throw new Error('Missing GitLab token')
}

if (!program.projectId) {
  throw new Error('Missing GitLab Project Id')
}

if (program.tagName === 'auto') {
  if (program.appVersion) {
    program.tagName = 'v' + program.version + '-' + program.buildNumber
  } else {
    try {
      program.tagName = 'v' + iosVersion() + '-' + program.buildNumber
    } catch (e) {
      try {
        program.tagName = 'v' + androidVersion(program.apk) + '-' + program.buildNumber
      } catch (e) {
        var date = new Date()
        program.tagName = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()].map(leadingZero).join('-') + '.' + program.buildNumber
      }
    }
  }
}

if (!program.tagName) {
  throw new Error('Missing tag name')
}

if (program.ref === 'auto') {
  try {
    program.ref = git.ref()
  } catch (e) {
    throw new Error('Missing git ref')
  }
}

winston.info('Creating release: ' + program.tagName)

var data = new FormData()
data.append('tag_name', program.tagName)
data.append('ref', program.ref)
data.append('release_description', program.notes)

data.getLengthSync = null // Work around until https://github.com/bitinn/node-fetch/issues/102

var result = fetch(program.server + '/api/v3/projects/' + program.projectId + '/repository/tags', {
  method: 'POST',
  body: data,
  headers: {
    'PRIVATE-TOKEN': program.token
  }
})
    .then(function (res) {
      if (res.status >= 200 && res.status < 300) {
        return res
      }
      return res.text().then(function (body) {
        throw new Error('Failed to create release [' + body + ']')
      })
    })
result = result.then(function () {
  winston.info('Created release ' + program.tagName)
})

result.catch(function (err) {
  winston.error('Error creating release', err)
  process.exit(1)
})

function leadingZero (val) {
  var str = '' + val
  if (str.length === 1) {
    return '0' + str
  }
  return str
}

function iosVersion () {
  return ('' + execSync('agvtool what-marketing-version -terse1')).trim().split('\n').pop()
}

function androidVersion (apk) {
  var v = ('' + execSync('aapt dump badging "' + apk + '" | grep versionName')).trim()
  if (!v) {
    throw new Error('Failed to find appVersion')
  }
  var matches = v.match(/versionName='(.+?)'/)
  if (!matches || !matches[1]) {
    throw new Error('Invalid version from aapt ' + v)
  }
  return matches[1]
}
