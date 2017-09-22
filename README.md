# Xcode build tools

A few scripts for our CI server

[![Version](https://img.shields.io/npm/v/xcode-build-tools.svg)](https://www.npmjs.com/package/xcode-build-tools)
[![License](https://img.shields.io/npm/l/xcode-build-tools.svg)](https://www.npmjs.com/package/xcode-build-tools)
[![Build Status](https://travis-ci.org/ekreative/xcode-build-tools.svg?branch=master)](https://travis-ci.org/ekreative/xcode-build-tools)

Install with `npm install xcode-build-tools`

## `add-keys`

    Usage: add-keys [options]
    
    Creates a new Keychain and sets as the default. Imports keys and certificates to it and enables build tool access
    
    WARNING: Changes your default keychain
    
    Options:
    
    -h, --help                         output usage information
    -V, --version                      output the version number
    -k, --keychain-name <name>         Keychain Name - default APP_NAME
    --timeout <timeout>                Keychain password timeout - default 1 hour
    --apple-cert <cert>                Apple WWDR certificate - default download from apple
    --app-certs <cert>                 List of app sigining certificates - default APP_CER
    --app-keys <key>                   List app sigining keys - default APP_KEY
    --app-key-passwords <pass>         App sigining key password or list of passwords - default KEY_PASSWORD
    --provisioning-profiles <profile>  Provisioning profiles - default PROVISIONING_PROFILE
    --codesign <programs>              Programs that should be able to use the certificates - default codesign, productbuild
    
## `remove-keys`

    Usage: remove-keys [options]
    
    Delete a keychain and provisioning profiles
    
    Options:
    
    -h, --help                         output usage information
    -V, --version                      output the version number
    -k, --keychain-name <name>         Keychain Name - default APP_NAME
    --provisioning-profiles <profile>  Provisioning profiles - default PROVISIONING_PROFILE
    
## `create-ipa`
    
    Usage: create-ipa [options]
    
    Create an .ipa file from an .app
    
    Options:
    
    -h, --help                        output usage information
    -V, --version                     output the version number
    -k, --keychain-name <name>        Keychain Name - default APP_NAME
    --developer-name <name>           Developer name to use - CODE_SIGN_IDENTITY
    --ipa <name>                      Ipa file to create - default build/Release-iphoneos/$APP_NAME.ipa
    --app <name>                      App file to convert - default build/Release-iphoneos/$APP_NAME.app
    --provisioning-profile <profile>  Provisioning profile - default PROVISIONING_PROFILE

## `upload-ipa`

    Usage: upload-ipa [options]
    
    Upload ipa file to testbuild.rocks and (optional) send a link to slack
    
    Options:
    
    -h, --help                     output usage information
    -V, --version                  output the version number
    -p, --project-id <id>          Project Id - default PROJECT_ID
    --server <name>                Alternative server address
    --ipa <name>                   Ipa file to upload - default build/Release-iphoneos/$APP_NAME.ipa
    --key <key>                    Test build rocks key - default TEST_BUILD_ROCKS_KEY
    -s, --slack-hook <hook>        Slack Hook - default SLACK_URL
    -c, --slack-channel <channel>  Slack Channel - default SLACK_CHANNEL
    -m, --message <message>        Test build rocks message
    
## `upload-apk`

    Usage: upload-apk [options]
    
    Upload apk file to testbuild.rocks and (optional) send a link to slack
    
    Options:
    
    -h, --help                     output usage information
    -V, --version                  output the version number
    -p, --project-id <id>          Project Id - default PROJECT_ID
    --apk <name>                   Apk file to upload - default app/build/outputs/apk/app-release.apk
    --key <key>                    Test build rocks key - defaul tTEST_BUILD_ROCKS_KEY
    -s, --slack-hook <hook>        Slack Hook - default SLACK_URL
    -c, --slack-channel <channel>  Slack Channel - default SLACK_CHANNEL
    -m, --message <message>        Test build rocks message

## `create-release`

    Usage: create-release [options]
    
    Create a new release on GitLab
    
    Options:
    
    -h, --help           output usage information
    -V, --version        output the version number
    --server <server>    GitLab server
    --token <token>      Api key
    --project-id <id>    Project Id
    --tag-name <tag>     Tag name
    --ref <ref>          Git ref
    -n, --notes <notes>  Release notes

## Summary of env vars

* `APP_NAME` - Name of the app to build eg "Kidslox"

To install keys

* `PROVISIONING_PROFILE` - Location of provisioning profile
* `APP_CER` - Location of your signing cert
* `APP_KEY` - Location of the matching key
* `KEY_PASSWORD` - Password to the signing key
* `CODE_SIGN_IDENTITY` - Name of the developer eg 'iPhone Distribution: Developer'

Upload builds

* `TEST_BUILD_ROCKS_KEY` - API key for testbuild.rocks to upload
* `PROJECT_ID` - Project id for testbuild.rocks

Get slack notifications

* `SLACK_URL` - Slack hook to notify of upload (or `SLACK_HOOK`)
* `SLACK_CHANNEL` - Override the hook channel

Create  release

* `GITLAB_API_TOKEN` - Token that gives access to the GitLab API to create a new release

GitLab CI Variables used

* `CI_PROJECT_ID` - GitLab project id
* `CI_PROJECT_URL` - GitLab project url
* `CI_COMMIT_SHA` - Current git commit
* `CI_JOB_ID` - Current job number
* `CI_COMMIT_REF_SLUG` - Current branch name (url friendly)
