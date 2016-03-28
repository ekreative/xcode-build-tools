# iOS build tools

**WARNING: This package has been renamed as [xcode-build-tools](https://www.npmjs.com/package/xcode-build-tools) to better reflect its general usefulness**

A few scripts for our CI server

## Env vars

* `$APP_NAME` - Name of the app to build eg "Kidslox"
* `$PROVISIONING_PROFILE_NAME` - Name of the provisioning profile eg "a2a9039c-05c6-470b-ad13-a19e5a63b6f1"
* `$PROVISIONING_PROFILE` - Location of provisioning profile
* `$APPLE_CER` - Location of the apple wwdr cert
* `$APP_CER` - Location of your signing cert
* `$APP_KEY` - Location of the matching key
* `$KEY_PASSWORD` - Password to the signing key
* `$DEVELOPER_NAME` - Name of the developer eg 'iPhone Distribution: Kidslox Limited'
* `$TEST_BUILD_ROCKS_KEY` - API key for testbuild.rocks to upload
* `$PROJECT_ID` - Project id for testbuild.rocks
