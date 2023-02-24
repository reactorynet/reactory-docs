# Upgrading BETA plugin to V1.
Copy the dependencies, devDepencies and peerDependencies from package.json in reactory-client-core/package.json. These are the base requirements for compiling 
a client plugin. 

Copy tsconfig.js from reactory-client-core 

Delete the following items
* rm rf node_modules/
* rm package-lock.json
* rm .bashrc

Update the rollup.config to match the same as reactory-client-core\rollup.config.js and ensure that your outputFile is set correctly

run `npm install`
run `npm run rollup`

Your library should build to the configured outputFile location.