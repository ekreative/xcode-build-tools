'use strict'

var winston = require('winston')

var exec = require('child_process').exec

module.exports = function (cmd, options) {
  return new Promise(function (resolve, reject) {
    winston.info(cmd)
    exec(cmd, options, function (err, stdout, stderr) {
      if (err) {
        reject(err)
        return
      }
      resolve({ stdout: stdout, stderr: stderr })
    })
  })
}
