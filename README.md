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
* Libraries are "imported" into target code very simply like this: var libA = pkg.libA();
* Use Package Manager to bring in the libraries into the target project as downloaded from github
* You do not *need* to use Package Manager to bring in libraries. The boilerplate code provided works just as well if it was lifted and placed into an existing project. Good old copy and paste works too. (But you'd still have to also bring in the dependencies yourself.)

Write libraries that can have dependencies:
* A special file "setup.gs" contains declarations of other libraries it depends upon. Package Manager detects this and brings them into the target project as well
* If a library has a dependency in order to implement unittest code (for example, a library that creates temporary spreadsheets to test an interface for SpreadsheetApp) you can use the "dev.gs" file to declare development-only dependencies
* Dependencies and unittests that are not relevant to implementation of the core library code are not incorporated into the target project

Unittests:
* When Package Manager creates a templated project, it includes a file called "unittests.gs" which has boilerplate code to get started with teseting with assertions.
* The assertions are implemented with the [utgs library](https://gist.github.com/brainysmurf/07eaf09769b450f1e0e7b6ae043c2ba5), specifically written for this purpose
* The utgs library is automatically included into the target project (via a declaration in "setup.gs"!) 

## Technical
The idea is that Project Manager is a project which you make a copy of and bring into your domain. 
You enter your github username/password into the "secrets" file which is used to authenticate to the github api. 
When you want to write a new library, you run a toolchain command from the Project Manager that creates a blank project and creates a new gist. 
It does this by using the github API to download the files and the Drive API to write a templated project.
Then you write the library, include the unit tests, and from the target library project, run another toolchain command "push" which will then save that projects files to the gits.
That works by connecting (via Execution API) to the original Project Manager project and asking it to update the target project.
If you want to write an application or a library that has a dependency, you declare that in the special file setup.gs, and then in the toolchain on the target project execute a push and then a pull.
This will update the gist with that declaration, and on the pull will download the new libraries and include them in the project.
Again, that latter connection is established via the Execution API.

In other words, to put it more simply, the "mother" script (Package Manager) creates "child" scripts (the target library/app) which knows how to call home in order to be updated on its own behalf. As long as we stick to the conventions (which are established with the boilerplate software), we have a toolchain!

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
