#!/usr/bin/env node

'use strict';

var winston = require('winston'),
    program = require('commander'),
    cpr = require('cpr'),
    path = require('path'),
    os = require('os'),
    exec = require('./lib/exec'),
    list = require('./lib/list');

program.version(require('./package.json').version).description('Creates a new Keychain and sets as the default. Imports keys and certificates to it and enables build tool access.\n    \n  WARNING: Changes your default keychain.\n  This can cause problems for Graphic CI environments where git using osxkeychain. This can be solved by disabling this feature\n  git config --system --unset credential.helper').option('-k, --keychain-name <name>', 'Keychain Name - default APP_NAME', process.env.APP_NAME || 'build-tools').option('--timeout <timeout>', 'Keychain password timeout - default 1 hour', parseInt, 3600).option('--apple-cert <cert>', 'Apple WWDR certificate - default download from apple', process.env.APPLE_CERT).option('--app-certs <cert>', 'List of app sigining certificates - default APP_CER', list, list(process.env.APP_CERT)).option('--app-keys <key>', 'List app sigining keys - default APP_KEY', list, list(process.env.APP_KEY)).option('--app-key-passwords <pass>', 'App sigining key password or list of passwords - default KEY_PASSWORD', list, list(process.env.KEY_PASSWORD)).option('--provisioning-profiles <profile>', 'Provisioning profiles - default PROVISIONING_PROFILE', list, list(process.env.PROVISIONING_PROFILE)).option('--codesign <programs>', 'Programs that should be able to use the certificates - default codesign, productbuild', list, ['/usr/bin/codesign', '/usr/bin/productbuild']).parse(process.argv);

var commands = [
// delete existing keychain
        'security delete-keychain "' + program.keychainName + '.keychain" || :',
// Create a custom keychain
        'security create-keychain -p gitlab "' + program.keychainName + '.keychain"',
// Add it to the list
        'security list-keychains -s "' + program.keychainName + '.keychain"',
// Make the custom keychain default, so xcodebuild will use it for signing
        'security default-keychain -s "' + program.keychainName + '.keychain"',
// Unlock the keychain
        'security unlock-keychain -p gitlab "' + program.keychainName + '.keychain"',
// Set keychain timeout to 1 hour for long builds
        'security set-keychain-settings -t ' + program.timeout + ' -l "' + program.keychainName + '.keychain"'],
    codesign = program.codesign.map(function (p) {
        return '-T "' + p + '"';
    }).join(' ');

// Add the Apple developer root cert
if (program.appleCert) {
    commands.push('security import "' + program.appleCert + '" -k "' + program.keychainName + '.keychain" ' + codesign);
} else {
    commands.push('curl "https://developer.apple.com/certificationauthority/AppleWWDRCA.cer" > apple.cer', 'security import apple.cer -k "' + program.keychainName + '.keychain" ' + codesign, 'rm apple.cer');
}

// Add certificates to keychain and allow codesign to access them
program.appCerts && program.appCerts.forEach(function (appCert) {
    commands.push('security import "' + appCert + '" -k "' + program.keychainName + '.keychain" ' + codesign);
});

program.appKeys && program.appKeys.forEach(function (appKey, idx) {
    var password = program.appKeyPasswords[idx] || program.appKeyPasswords[0];
    if (password) {
        commands.push('security import "' + appKey + '" -k "' + program.keychainName + '.keychain" -P "' + password + '" ' + codesign);
    } else {
        commands.push('security import "' + appKey + '" -k "' + program.keychainName + '.keychain" ' + codesign);
    }
});

var commandPromise = exec(commands.shift());

commands.forEach(function (command) {
    commandPromise = commandPromise.then(function () {
        return exec(command);
    }).catch(function (err) {
        // Ignore errors for existing items
        if (!/item already exists/.test(err)) {
            throw err;
        }
    });
});

commandPromise.catch(function (err) {
    winston.error('Error setting up keychain', err);
    process.exit(1);
});

// Put the provisioning profiles in place
program.provisioningProfiles && program.provisioningProfiles.forEach(function (profile) {
    var name = path.basename(profile, path.extname(profile));
    cpr(profile, os.homedir() + '/Library/MobileDevice/Provisioning Profiles/' + name + '.mobileprovision', {
        overwrite: true
    }, function (err) {
        if (err) {
            winston.error('Error copying profiles', err);
            process.exit(1);
        }
    });
});
