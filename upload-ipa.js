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
    .description('Upload ipa file to testbuild.rocks and (optional) send a link to slack')
    .option('-p, --project-id <id>', 'Project Id - default PROJECT_ID', process.env.PROJECT_ID)
    .option('--server <name>', 'Alternative server address', 'https://testbuild.rocks')
    .option('--ipa <name>', 'Ipa file to upload - default build/Release-iphoneos/$APP_NAME.ipa', `${process.cwd()}/build/Release-iphoneos/` + (process.env.APP_NAME ? `${process.env.APP_NAME}.ipa` : 'app.ipa'))
    .option('--key <key>', 'Test build rocks key - default TEST_BUILD_ROCKS_KEY', process.env.TEST_BUILD_ROCKS_KEY)
    .option('-s, --slack-hook <hook>', 'Slack Hook - default SLACK_HOOK', process.env.SLACK_HOOK)
    .option('-c, --slack-channel <channel>', 'Slack Channel - default SLACK_CHANNEL', process.env.SLACK_CHANNEL)
    .option('-m, --message <message>', 'Test build rocks message', child_process.execSync('git log --format=%B -n 1 || echo "No comment"'))
    .parse(process.argv);

winston.info('Uploading build');

let data = new FormData();
data.append('app', fs.createReadStream(program.ipa));
data.append('comment', program.message);
data.append('ci', 'true');

data.getLengthSync = null; //Work around until https://github.com/bitinn/node-fetch/issues/102

var result = fetch(`${program.server}/api/builds/upload/${program.projectId}/ios`, {
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
        return res.text().then((body) => {
            throw new Error(`Failed to upload build to testbuild.rocks [${body}]`);
        });
    });
if (program.slackHook) {
    result = result.then(slack(program.slackHook, program.slackChannel));
}
result.catch(err => {
    winston.error('Error uploading ipa', err);
    process.exit(1);
});
