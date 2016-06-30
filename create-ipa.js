#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),
    path = require('path'),
    os = require('os'),

    exec = require('./lib/exec'),
    find = require('./lib/find-identity-name');

program
    .version(require('./package.json').version)
    .description('Create an .ipa file from an .app')
    .option('-k, --keychain-name <name>', 'Keychain Name - default APP_NAME', process.env.APP_NAME || 'build-tools')
    .option('--developer-name <name>', 'Developer name to use - CODE_SIGN_IDENTITY', process.env.CODE_SIGN_IDENTITY || process.env.DEVELOPER_NAME)
    .option('--ipa <name>', 'Ipa file to create - default build/Release-iphoneos/$APP_NAME.ipa', `${process.cwd()}/build/Release-iphoneos/` + (process.env.APP_NAME ? `${process.env.APP_NAME}.ipa` : 'app.ipa'))
    .option('--app <name>', 'App file to convert - default build/Release-iphoneos/$APP_NAME.app', `${process.cwd()}/build/Release-iphoneos/` + (process.env.APP_NAME ? `${process.env.APP_NAME}.app` : 'app.app'))
    .option('--provisioning-profile <profile>', 'Provisioning profile - default PROVISIONING_PROFILE', process.env.PROVISIONING_PROFILE)
    .parse(process.argv);

let create = (developerName) => {
    let name = path.basename(program.provisioningProfile, path.extname(program.provisioningProfile));

    return exec(`xcrun -log -sdk iphoneos PackageApplication "${program.app}" -o "${program.ipa}" -sign "${developerName}" -embed "${os.homedir()}/Library/MobileDevice/Provisioning Profiles/${name}.mobileprovision"`);
};

let commandPromise;

if (program.developerName) {
    commandPromise = create(program.developerName);
} else {
    commandPromise = find(program.keychainName).then(create);
}

commandPromise.catch((err) => {
    winston.error('Error creating ipa', err);
    process.exit(1);
});
