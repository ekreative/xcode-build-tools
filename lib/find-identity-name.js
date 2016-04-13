'use strict';

const exec = require('./exec');

module.exports = (keyChainName) => {
    let commandPromise = exec(`security find-identity -v "${keyChainName}.keychain" || :`);

    return commandPromise.then((out) => {
        let matches = out.stdout.match(/1\) .+? "(.+?)"/);
        if (matches && matches[1]) {
            return matches[1];
        }
        throw new Error("No valid identities");
    });
};
