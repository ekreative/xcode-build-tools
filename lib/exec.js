'use strict'

var exec = require('child_process').exec

var logger = require('./logger')

module.exports = function (cmd, options) {
  return new Promise(function (resolve, reject) {
    logger.info(cmd)
    exec(cmd, options, function (err, stdout, stderr) {
      if (err) {
        reject(err)
        return
      }
      resolve({ stdout: stdout, stderr: stderr })
    })
  })
}
