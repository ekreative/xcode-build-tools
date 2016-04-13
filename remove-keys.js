#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),
    del = require('del'),
    path = require('path'),

    exec = require('./lib/exec'),

    list = (val) => val.split(',');

program
    .version(require('./package.json').version)
    .option('-k, --keychain-name <name>', 'Keychain Name', parseInt, process.env.APP_NAME || 'build-tools')
    .option('--provisioning-profiles <profile>', 'Provisioning profiles', list, list(process.env.PROVISIONING_PROFILE))
    .parse(process.argv);

let commandPromise = exec(`security delete-keychain "${program.keychainName}.keychain" || :`);

commandPromise.catch((err) => {
    winston.error('Error deleting keychain', err);
});

// Delete the provisioning profiles
program.provisioningProfiles && program.provisioningProfiles.forEach((profile) => {
    let name = path.basename(profile, path.extname(profile));
    del(`~/Library/MobileDevice/Provisioning\ Profiles/${name}.mobileprovision`, (err) => {
        if (err) {
            winston.error('Error deleting profiles', err);
        }
    })
});
