#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),
    cpr = require('cpr'),
    path = require('path'),

    exec = require('./lib/exec'),

    list = (val) => val.split(',');

program
    .version(require('./package.json').version)
    .option('-k, --keychain-name <name>', 'Keychain Name', parseInt, process.env.APP_NAME || 'build-tools')
    .option('--timeout <timeout>', 'Keychain password timeout', 3600)
    .option('--apple-cert <cert>', 'App sigining certificate', process.env.APPLE_CERT)
    .option('--app-certs <cert>', 'App sigining certificates', list, list(process.env.APP_CERT))
    .option('--app-keys <key>', 'App sigining keys', list, list(process.env.APP_KEY))
    .option('--app-key-password <pass>', 'App sigining key password', process.env.KEY_PASSWORD)
    .option('--provisioning-profiles <profile>', 'Provisioning profiles', list, list(process.env.PROVISIONING_PROFILE))
    .parse(process.argv);

const commands = [
    `security delete-keychain "${program.keychainName}.keychain" || :`, // delete existing keychain
    `security create-keychain -p gitlab "${program.keychainName}.keychain"`, // Create a custom keychain
    `security list-keychains -s "${program.keychainName}.keychain"`, // Add it to the list
    `security default-keychain -s "${program.keychainName}.keychain"`, // Make the custom keychain default, so xcodebuild will use it for signing
    `security unlock-keychain -p gitlab "${program.keychainName}.keychain"`, // Unlock the keychain
    `security set-keychain-settings -t ${program.timeout} -l "${program.keychainName}.keychain"` // Set keychain timeout to 1 hour for long builds
];

// Add certificates to keychain and allow codesign to access them
if (program.appleCert) {
    commands.push(`security import apple.cer -k "${program.keychainName}.keychain" -T /usr/bin/codesign`);
} else {
    commands.push(
        'curl https://developer.apple.com/certificationauthority/AppleWWDRCA.cer > apple.cer',
        `security import apple.cer -k "${program.keychainName}.keychain" -T /usr/bin/codesign`,
        `rm apple.cer`
    );
}

program.appCerts && program.appCerts.forEach((appCert) => {
    commands.push(
        `security import ${appCert} -k "${program.keychainName}.keychain" -T /usr/bin/codesign`
    );
});

program.appKeys && program.appKeys.forEach((appKey) => {
    if (program.appKeyPassword) {
        commands.push(
            `security import ${appKey} -k "${program.keychainName}.keychain" -P ${program.appKeyPassword} -T /usr/bin/codesign`
        );
    } else {
        commands.push(
            `security import ${appKey} -k "${program.keychainName}.keychain" -T /usr/bin/codesign`
        );
    }
});

let commandPromise = exec(commands.shift());

commands.forEach((command) => {
    commandPromise = commandPromise.then(() => {
        return exec(command);
    });
});

commandPromise.catch((err) => {
    winston.error('Error setting up keychain', err);
});

// Put the provisioning profiles in place
program.provisioningProfiles && program.provisioningProfiles.forEach((profile) => {
    let name = path.basename(profile, path.extname(profile));
    cpr(profile, `~/Library/MobileDevice/Provisioning\ Profiles/${name}.mobileprovision`, {
        overwrite: true
    }, (err) => {
        winston.error('Error copying profiles', err);
    })
});
