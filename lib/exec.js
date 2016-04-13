'use strict';

const exec = require('child_process').exec;

module.exports = (cmd, options) => {
    return new Promise((resolve, reject) => {
        exec(cmd, options, (err, stdout, stderr) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({stdout, stderr});
        });
    });
};
