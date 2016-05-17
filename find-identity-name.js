#!/usr/bin/env node
'use strict';

const winston = require('winston'),
    program = require('commander'),

    find = require('./lib/find-identity-name');

program
    .version(require('./package.json').version)
    .option('-k, --keychain-name <name>', 'Keychain Name - default APP_NAME', process.env.APP_NAME || 'build-tools')
    .parse(process.argv);

find(program.keychainName)
    .then((name) => {
        process.stdout.write(name);
    })
    .catch((err) => {
        winston.error('Error finding name', err);
        process.exit(1);
    });
