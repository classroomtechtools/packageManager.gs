# packageManager.gs
A complete development toolchain for Google App Scripting. No command line required. Oh and unit testing with assertions!

## Quick Start
Make a copy of [this project](https://script.google.com/a/igbis.edu.my/d/1ClAoUIZdC5VJ0nM3_1NIYwW-sr-LLXT_9rLc9B0Tj5SikYWwBuFucyRu/edit) and follow the instructions in th packageManager.gs field. (Or read it from this repo [here](https://github.com/classroomtechtools/packageManager.gs/blob/master/packageManager.gs).)

## What is this?
Use Package Manager to be able to bring the following to Google App Scripting development environment:
* Write modular libraries that are published on github
* Incorporate these libraries from github by downloading it into a target project
* Write libraries that can be tested with unittests i.e. assertTrue, assertArrayEquals, assertThrows
* Libraries can declare dependencies, which also get incorporated into the project
* Write applications that utilize these libraries but does not add any significant technical debt
* Manage all these dependencies with a simple import process
* Provide a way to namespace these dependencies in a conventional way
* Use gists to version control both libraries and applications

## Features
Modular Libraries:
* Use Package Manager to create a templated project that provides boilerplate code
* All libraries follow the convention of using the global "pkg" namespace, and adding namespaces on that global
* Applications (i.e. not libraries) can use the "app" namespace, for clarity and convenience for the developer
* Libraries are "imported" into target code very simply like this: `var libA = pkg.libA();`
* Use Package Manager to bring in the libraries into the target project as downloaded from github
* You do not *need* to use Package Manager to bring in libraries. The boilerplate code provided works just as well if it was lifted and placed into an existing project. Good old copy and paste works too. (But you'd still have to also bring in the dependencies yourself.)

Declare dependencies, even for just the dev environment:
* A special file "setup.gs" contains declarations of other libraries it depends upon. Package Manager detects this and brings them into the target project as well
* Applications that use such libraries are declared in the same way
* If a dependency has a dependency in order to implement unittest code (for example, a library that creates temporary spreadsheets to test an interface for SpreadsheetApp) you can use the "dev.gs" file to declare development-only dependencies
* Dependencies and unittests that are not relevant to implementation of the core library code are not incorporated into the target project

Source versioning:
* To save a commit made in the target project, use the toolchain "push" to update the gist
* Only files that are relevant to your particular project are uploaded to the gist
* The Package Manager knows which to upload and which to skip by the file names; for this reason files all follow a specific naming scheme: pkg|app.namespace.\* Only those that match this are uploaded.

Unittests:
* When Package Manager creates a templated project, it includes a file called "unittests.gs" which has boilerplate code to get started with teseting with assertions.
* The assertions are implemented with the [utgs library](https://gist.github.com/brainysmurf/07eaf09769b450f1e0e7b6ae043c2ba5), specifically written for this purpose
* The utgs library is automatically included into the target project (via a declaration in "setup.gs"!) 
* Whenever you push, all unittests are automatically run with the testRunner, which prevents from introducing bugs. (If you need to override, this, you can do so by commenting out the call to the test runner!)

## Verbose Explanation
1. The idea is that Project Manager is a project which you make a copy of and bring into your domain. This "mother" project creates "child" scripts (the target library/app) which knows how to call home in order to be updated on its behalf. In addition, the child script is set up to have boilerplate code that allows us to do namespacing and import libraries. When we push and pull to and from the gists, we connect to the Package Manager which knows how to resolve dependencies and include them. As an added bonus, the utgs library allows us to test our code with assertions. As long as we stick to the conventions (which are established with the boilerplate software), we have a toolchain!
2. Setup-wise, you have to enable Drive and App Script APIs, and enter your github username/password into the "secrets" file which is used to authenticate to the github api. You also need to deploy as a web service and deploy as executable. The former is needed because a get request is performed from the child script to obtain mother's OAuth token, and the latter is needed to make the Execution API work. The mother's OAuth token is needed, rather than the child's, in order for commands on the mother to be launched.
3. When you want to write a new library, you run a toolchain command (initLibrary) from the Project Manager that creates a blank project and creates a new gist. When you want to write an application (i.e. a project that is not intended to be reused but uses other libraries), you use a different toolchain command (initApplication). 
4. When you want to declare a dependency, you edit the setup file to include the correct namespace that will be accessible via pkg.namespace, and the corresponding gist ID. Then you push the project, which calls home and updates the gist. Then you pull, which calls home and updates the project according to the new setup file information.
5. Naming scheme for files in the project is important, because that is the crux on which all this works. Files have to have names that clearly denote where they came from, so that Package Manager only uploads to the gist the ones that are associated to that project.
6. Namespaces are important ([deserving of its own explanation](https://github.com/classroomtechtools/packageManager.gs/blob/master/namespaces.md)), because that also is the crux on which all this works. Every library attaches itself to the pkg namespace. For applications, you can optionally use the app namespace. These namespaces not enforced by the Package Manager, but the boilerplate template code provides the secret sauce to get namespaces to work right.

## Why gists and not full-fledged repos?
The two major differences between a gist and a regular github repo is that the former cannot be forked, and you can't do pull requests.
This is unfortunate. But there are several compelling reasons to use gists over full repos:
* Gists have a flat file structure, same as GAS
* Gists have a cleaner online interface, and since we're working in the online editor anyway...
* There is less technical debt with gists (no need to even understand what a repo is)
* Copying and pasting from a gist is a lot easier than from a repo
* Gists have a commenting feature, which is probably good enough

While the current project is implemented with gists instead of a full repo, nonetheless a further version of this project could be modified using the github apis.

## Known "limitations"
The Package Manager can create standalone scripts, but cannot create container-bound scripts. This is not a major limitation, however. The libraries you (or others) write with Package Manager can still be incorporated into such scripts, via copy'n'paste.
