![Build Anything Fast](/branding/reactory-logo.png)
# Reactory Documents
Welcome to Reactory Documents. This is a starting point for your journey with Reactory. This project will only contain documentation, samples and links to resources for further reading.

## What is Reactory?
Reactory is a RAD (Rapid Application Development) framework that consists of several components that allows for the rapid prototyping and development of enterprise grade web and native react applications. This is achieved through the three C's approach. Convention, Configuration and Customization.

The framework has a server and a SPA web client.  A React Native client is currently under construction.

Reactory follows the following principle in software design.
- **Convention**: The system should follow convention first, this means data structres can be interpreted by the system and the system will provide the best possible interface based on the data structure and meta data.
- **Configuration**: When convention fails to provide the best possible interface, configuration will provide extended capabilities for presentation and data acquisition.
- **Customization**: When neither convention or configuration can provide the best user interface we do full customization. 

This approach gives us the best possible velocity for the given task at hand. Some tasks can be done adequitely by the system, where others will require developer or user intervention to improve the solution.

### Reactory Server
Reactory Server (open source) is an express node js application that is highly configurable and extensible.  
It comes built in with core features around: 
* multi tennancy
* dynamic user interfaces 
* users 
* organisations
* business units 
* memberships with RBAC (Role Based Access Control) 
* teams
* theming
* plugin and extension
* JIT compilation and distribution of modules
* file management
* devops

and several other domain areas that are common to most enterprises. The forms provides schematic approaches to data fetching, binding, pdf generations, excel exports and more.

The primary API is configured for GraphQL based API interaction. There are some REST apis and you can extend the application with additional REST apis should you have a need for REST based interaction with some of your components.

The server can be used on its own without the Reactory Client and will function as a customizable and extensible GraphQL api that has a very low overhead.

The server can perform additional graph calls on behalf of the user to other graph services as well as call internal graph calls.

The server is capable of delivering a rich client interface dynamically at runtime, by using JIT compilation and deployment and auto recompilication when source modules changes.

### Reactory Web Client
Reactory Web Client (open source) is a react based SPA app. The client makes user of the material ui or mui web toolkit as default.  Additional view providers will be available in future versions (bootstrap, blueprint etc).

The client has a forms engine ReactoryFormComponent that is provided a schema and it is able to produce very complex user interactions, through schema binding to pre-built and custom components. The engine can be configured to use different component renderers.

This is ideal for enterprise where wide accessibility is key, without having to be concerned about device compatibility.  The SPA app provides majority of the features the native application can provide and is the recommended client.

### Reactory Native Client
Reactory Native Client (licensed per app / enterprise) is a react native application that provides the same functionality as the web application, but in a react native application. Currently under development and not publically available. 

A free version of the app will be available on the app store where the application can be configured to connect to your API and will provide basic features with ads enabled. A licensable white labeled version of the app will be available to enterprise and pro customers.

### Further Reading
Find a below a list for getting started with Reactory.

* [Installing Reactory](install.md)
* [Developing](development/index.md)
* [Roadmap](roadmap/overview.md)
* [Funding](funding/overview.md)
