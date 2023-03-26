![Build Anything Fast](/branding/reactory-logo.png)
# Upgrades & Versioning

The reactory client and server follow [semver MAJOR.MINOR.PATCH](https://semver.org)

Upgrades between minor version should be seemless and only require minor rework.
Upgrades between major versions will contain breaking changes and will require code modifications.

Where possible, reactory will pusblish code mod scripts to automatically safely update your code, else descriptions will be provided with details on what code you need to modify in order for a version update.

## Upgrading from v0.9.x to v1.0.0
There isn't any formal upgrade process for the closed beta users and each project is upgraded manually. Future updates will support scripts and code mods.

### ❗Breaking Changes
Version 1 of reactory has several breaking changes from the v0.9 implementation. These are all with the view of making the platform more flexible and robust in 
implementation and application solution design.

Themes:
------
Reactory v1 is moving to multi rendering engine support and ships with the material-ui / mui theme as the default setup.

Material UI
------

#### Reactory Client

*Routing* - There are breaking changes in the update to the new react router library. 
