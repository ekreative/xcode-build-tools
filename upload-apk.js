#!/usr/bin/env node
'use strict';

const fetch = require('node-fetch'),
    FormData = require('form-data'),
    fs = require('fs'),
    child_process = require('child_process'),
    winston = require('winston'),
    program = require('commander'),

    slack = require('./lib/slack');

program
    .version(require('./package.json').version)
    .option('-p, --project-id <id>', 'Project Id', parseInt, process.env.PROJECT_ID)
    .option('--apk <name>', 'Apk file to upload',  `${process.env.PROJECT_FOLDER || process.cwd()}/app/build/outputs/apk/app-release.apk`)
    .option('--key <key>', 'Test build rocks key', process.env.TEST_BUILD_ROCKS_KEY)
    .option('-s, --slack-hook <hook>', 'Slack Hook', process.env.SLACK_HOOK)
    .option('-c, --slack-channel <channel>', 'Slack Channel', process.env.SLACK_CHANNEL)
    .option('-m, --message <message>', 'Test build rocks message', child_process.execSync('git log --format=%B -n 1 || echo "No comment"'))
    .parse(process.argv);

winston.info('Uploading build');

let data = new FormData();
data.append('app', fs.createReadStream(program.apk));
data.append('comment', program.message);
data.append('ci', 'true');

var result = fetch(`https://testbuild.rocks/api/builds/upload/${program.projectId}/android`, {
    method: 'POST',
    body: data,
    headers: {
        'X-API-Key': program.key
    }
})
    .then(res => {
        if (res.status == 200) {
            return res;
        }
        throw res;
    });
if (program.slackHook) {
    result = result.then(slack(program.slackHook, program.slackChannel));
}
result.catch(err => {
    winston.error('Error uploading build', {err});
    process.exit(1);
});
