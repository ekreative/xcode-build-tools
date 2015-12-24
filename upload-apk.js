#!/usr/bin/env node
'use strict';

const fetch = require('node-fetch'),
    FormData = require('form-data'),
    fs = require('fs'),
    child_process = require('child_process'),
    winston = require('winston'),

    slack = require('./lib/slack');

const projectId = process.env.PROJECT_ID,
    projectFolder = process.env.PROJECT_FOLDER,
    message = child_process.execSync('git log --format=%B -n 1'),
    testBuildRocksKey = process.env.TEST_BUILD_ROCKS_KEY,
    slackHook = process.env.SLACK_HOOK,
    slackChannel = process.env.SLACK_CHANNEL;

winston.info('Uploading build');

let data = new FormData();
data.append('app', fs.createReadStream(`${projectFolder}/app/build/outputs/apk/app-release.apk`));
data.append('comment', message);
data.append('ci', 'true');

var result = fetch(`https://testbuild.rocks/api/builds/upload/${projectId}/android`, {
    method: 'POST',
    body: data,
    headers: {
        'X-API-Key': testBuildRocksKey
    }
})
    .then(res => {
        if (res.status == 200) {
            return res;
        }
        throw res;
    });
if (slackHook) {
    result = result.then(slack(slackHook, slackChannel));
}
result.catch(err => {
    winston.error('Error uploading build', {err});
});
