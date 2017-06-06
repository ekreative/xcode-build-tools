'use strict'

var exec = require('./exec')

module.exports = function (keyChainName) {
  var commandPromise = exec('security find-identity -v "' + keyChainName + '.keychain" || :')

  return commandPromise.then(function (out) {
    var matches = out.stdout.match(/1\) .+? "(.+?)"/)
    if (matches && matches[1]) {
      return matches[1]
    }
    throw new Error('No valid identities')
  })
}
