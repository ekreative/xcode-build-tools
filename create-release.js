#!/usr/bin/env node

'use strict';

var child_process = require('child_process'),
    fetch = require('node-fetch'),
    FormData = require('form-data'),
    program = require('commander'),
    winston = require('winston');

program
    .version(require('./package.json').version)
    .description('Create a new release on GitLab')
    .option('--server <server>', 'GitLab server', process.env.GITLAB_API || 'https://git.ekreative.com')
    .option('--token <token>', 'Api key', process.env.GITLAB_API_TOKEN)
    .option('--project-id <id>', 'Project Id', process.env.CI_PROJECT_ID)
    .option('--tag-name <tag>', 'Tag name', 'auto')
    .option('--ref <ref>', 'Git ref', process.env.CI_COMMIT_SHA || process.env.CI_BUILD_REF)
    .option('-n, --notes <notes>', 'Release notes', 'auto')
    .parse(process.argv);

var buildNumber = (process.env.CI_BUILD_ID || process.env.CI_JOB_ID || '1');

if (program.tagName == 'auto') {
  try {
    program.tagName = 'v' + iosVersion() + '-' + buildNumber;
  } catch (e) {
    var date = new Date();
    program.tagName = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()].map(leadingZero).join('-') + '.' + buildNumber;
  }
}

if (program.notes == 'auto') {
    program.notes = ('' + child_process.execSync('git log --format=%B -n 1 || echo "No comment"')).trim();
}

winston.info('Creating release');

var data = new FormData();
data.append('tag_name', program.tagName);
data.append('ref', program.ref);
data.append('release_description', program.notes);

data.getLengthSync = null; //Work around until https://github.com/bitinn/node-fetch/issues/102

var result = fetch(program.server + '/api/v3/projects/' + program.projectId + '/repository/tags', {
    method: 'POST',
    body: data,
    headers: {
        'PRIVATE-TOKEN': program.token
    }
})
    .then(function (res) {
        if (res.status >= 200 && res.status < 300) {
            return res;
        }
        return res.text().then(function (body) {
            throw new Error('Failed to create release [' + body + ']');
        });
    });

result.catch(function (err) {
    winston.error('Error creating release', err);
    process.exit(1);
});

function leadingZero(val) {
  var str = '' + val;
  if (str.length == 1) {
    return '0' + str;
  }
  return str;
}

function iosVersion() {
  return ('' + child_process.execSync('agvtool what-marketing-version -terse1')).trim();
}
