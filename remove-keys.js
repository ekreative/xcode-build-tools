#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),
    del = require('del'),
    path = require('path'),
    os = require('os'),

    exec = require('./lib/exec'),

    list = (val) => val ? val.split(',') : [];

program
    .version(require('./package.json').version)
    .description('Delete a keychain and provisioning profiles')
    .option('-k, --keychain-name <name>', 'Keychain Name - default APP_NAME', process.env.APP_NAME || 'build-tools')
    .option('--provisioning-profiles <profile>', 'Provisioning profiles - default PROVISIONING_PROFILE', list, list(process.env.PROVISIONING_PROFILE))
    .parse(process.argv);

let commandPromise = exec(`security delete-keychain "${program.keychainName}.keychain" || :`);

commandPromise.catch((err) => {
    winston.error('Error deleting keychain', err);
    process.exit(1);
});

// Delete the provisioning profiles
program.provisioningProfiles && program.provisioningProfiles.forEach((profile) => {
    let name = path.basename(profile, path.extname(profile));
    del(`${os.homedir()}/Library/MobileDevice/Provisioning Profiles/${name}.mobileprovision`, (err) => {
        if (err) {
            winston.error('Error deleting profiles', err);
            process.exit(1);
        }
    })
});
