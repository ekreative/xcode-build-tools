#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),
    cpr = require('cpr'),
    path = require('path'),

    exec = require('./lib/exec'),

    list = (val) => val ? val.split(',') : [];

program
    .version(require('./package.json').version)
    .option('-k, --keychain-name <name>', 'Keychain Name', process.env.APP_NAME || 'build-tools')
    .option('--timeout <timeout>', 'Keychain password timeout', parseInt, 3600)
    .option('--apple-cert <cert>', 'App sigining certificate', process.env.APPLE_CERT)
    .option('--app-certs <cert>', 'App sigining certificates', list, list(process.env.APP_CERT))
    .option('--app-keys <key>', 'App sigining keys', list, list(process.env.APP_KEY))
    .option('--app-key-password <pass>', 'App sigining key password', process.env.KEY_PASSWORD)
    .option('--provisioning-profiles <profile>', 'Provisioning profiles', list, list(process.env.PROVISIONING_PROFILE))
    .option('--codesign <programs>', 'Programs that should be able to use the certificates', list, [
        '/usr/bin/codesign',
        '/usr/bin/productbuild'
    ])
    .parse(process.argv);

const commands = [
        // delete existing keychain
        `security delete-keychain "${program.keychainName}.keychain" || :`,
        // Create a custom keychain
        `security create-keychain -p gitlab "${program.keychainName}.keychain"`,
        // Add it to the list
        `security list-keychains -s "${program.keychainName}.keychain"`,
        // Make the custom keychain default, so xcodebuild will use it for signing
        `security default-keychain -s "${program.keychainName}.keychain"`,
        // Unlock the keychain
        `security unlock-keychain -p gitlab "${program.keychainName}.keychain"`,
        // Set keychain timeout to 1 hour for long builds
        `security set-keychain-settings -t ${program.timeout} -l "${program.keychainName}.keychain"`
    ],
    codesign = program.codesign.map((p) => `-T "${p}"`).join(' ');

// Add the Apple developer root cert
if (program.appleCert) {
    commands.push(`security import "${program.appleCert}" -k "${program.keychainName}.keychain" ${codesign}`);
} else {
    commands.push(
        'curl "https://developer.apple.com/certificationauthority/AppleWWDRCA.cer" > apple.cer',
        `security import apple.cer -k "${program.keychainName}.keychain" ${codesign}`,
        `rm apple.cer`
    );
}

// Add certificates to keychain and allow codesign to access them
program.appCerts && program.appCerts.forEach((appCert) => {
    commands.push(
        `security import "${appCert}" -k "${program.keychainName}.keychain" ${codesign}`
    );
});

program.appKeys && program.appKeys.forEach((appKey) => {
    if (program.appKeyPassword) {
        commands.push(
            `security import "${appKey}" -k "${program.keychainName}.keychain" -P "${program.appKeyPassword}" ${codesign}`
        );
    } else {
        commands.push(
            `security import "${appKey}" -k "${program.keychainName}.keychain" ${codesign}`
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
    process.exit(1);
});

// Put the provisioning profiles in place
program.provisioningProfiles && program.provisioningProfiles.forEach((profile) => {
    let name = path.basename(profile, path.extname(profile));
    cpr(profile, `~/Library/MobileDevice/Provisioning\ Profiles/${name}.mobileprovision`, {
        overwrite: true
    }, (err) => {
        if (err) {
            winston.error('Error copying profiles', err);
            process.exit(1);
        }
    })
});
