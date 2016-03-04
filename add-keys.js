#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),
    cpr = require('cpr'),

    exec = require('./lib/exec');

program
    .version(require('./package.json').version)
    .option('-k, --keychain-name <name>', 'Keychain Name', parseInt, process.env.APP_NAME)
    .option('--timeout <timeout>', 'Keychain password timeout', 3600)
    .option('--apple-cert <cert>', 'App sigining certificate', process.env.APPLE_CERT)
    .option('--app-cert <cert>', 'App sigining certificate', process.env.APP_CERT)
    .option('--app-key <key>', 'App sigining key', process.env.APP_KEY)
    .option('--app-key-password <pass>', 'App sigining key password', process.env.KEY_PASSWORD)
    .option('--provisioning-profile <profile>', 'Provisioning profile', process.env.PROVISIONING_PROFILE)
    .option('--provisioning-profile-name <name>', 'Provisioning profile name', process.env.PROVISIONING_PROFILE_NAME)
    .parse(process.argv);

const keychainName = program.keychainName;

const commands = [
    `security create-keychain -p gitlab "${program.keychainName}.keychain"`,
    `security list-keychains -s "${program.keychainName}.keychain"`,
    `security default-keychain -s "${program.keychainName}.keychain"`,
    `security unlock-keychain -p gitlab "${program.keychainName}.keychain"`,
    `security set-keychain-settings -t ${program.timeout} -l "${program.keychainName}.keychain"`,
    `security import ${program.appleCert} -k "${program.keychainName}.keychain" -T /usr/bin/codesign`
    `security import ${program.appCert} -k "${program.keychainName}.keychain" -T /usr/bin/codesign`
    `security import ${program.appKey} -k "${program.keychainName}.keychain" -P ${program.appKeyPassword} -T /usr/bin/codesign`
];

let commandPromise = exec(commands.shift());

commands.forEach((command) => {
    commandPromise = commandPromise.then(() => {
        return exec(command);
    });
});

if (program.provisioningProfile && program.provisioningProfileName) {
    cpr(program.provisioningProfile, `~/Library/MobileDevice/Provisioning\ Profiles/${program.provisioningProfileName}.mobileprovision`)
}
