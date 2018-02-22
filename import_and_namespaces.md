## ON IMPORTING MODULAR LIBARIES in APPS SCRIPTS

In the Google Apps Scripting environment, how to do the following:
1. Write a block of code (library) that is accessible from anywhere else in the project, i.e. make a namespace `pkg`
2. Be able to namespace upon that namespace, i.e. `pkg.namespace` which is the entry point for creating a reference to that library with `var lib = pkg.library();`
3. Be able to namespace the namespaced namespaces, i.e. `pkg.library.utils`

### Part 1: Building on the global namespace with top-level self-invoking function

Google Apps Script global environment contains all the built-in variables, such as `SpreadsheetApp` and whatnot. You can inspect it for yourself with this block of code:

Code.gs:
```js
(function TopLevelSelfInvokingFunction (global) {
  Logger.log(global);
})(this);
```

How does that work? The ```this``` keyword in the top-level context (i.e. the "global" context) represents the global environment, which gets passed to TopLevelSelfInvokingFunction, as the ```global``` parameter; this means we can build upon it, like this:

Code.gs:
```js
(function Package_ (global) {
  global.pkg = {};
  pkg.library = {sayHi: function () { return 'hi'; } };
})(this);
Logger.log(pkg.library.sayHi());
```

We've now added our own built-in, so to speak: ```pkg``` and we added a library namespace onto it. Notice that the name ```TopLevelSelfInvokingFunction``` to ```Package``` because it represents what it's doing, which is packaging (loading) the librarie into the global namespace. However, this pattern still won't let us have more than one library. Consider:

Code1.gs
```js
(function Package_ (global) {
  global.pkg = {};      // no!
  pkg.library = {};
})(this);
```

Code2.gs
```js
(function Package_ (global) {
  global.pkg = {};     // no!
  pkg.anotherLibrary = {};
})(this);
```
We will have just overwritten one or the other, but if we just use this trick …

Code1.gs
```js
(function Package_ (global) {
  global.pkg = global.pkg || {};       // ah...
  pkg.library = {};
})(this);
```

Code2.gs
```js
(function Package_ (global) {
  global.pkg = global.pkg || {};       // ah...
  pkg.anotherLibrary = {}; 
})(this);
```
… we will not overwrite the ```pkg``` variable.

## Part 2: FACTORY PATTERN

So now we know how to package code into the global namespace effectively, instead of returning objects, let's graduate to the next level of abstraction: returning functions.

```js
(function Package_ (global) {
  global.pkg = global.pkg || {};
  pkg.library = function () { return function (config) { return "Hello, " + config.who; } };
})(this);
```

This let's us do the following:

```js
var lib = pkg.library();
var greeting = lib({who: 'world'});
Logger.log(lib);  // "Hello, world"
```

The above allows us to get a reference to a library, which can instantiate an object with a configuration local to that object.  This is the desired pattern: The reference to the library itself needs to be retrieved with a function call since we want to define nested namespaces such as ```pkg.namespace.namespace```. Now, let's make this a bit neater:

```js
(function Package_ (global, factory) {
  global.pkg = global.pkg || {};
  pkg.library = function () { return function () { return factory.apply(factory, arguments); }; };
})(this,

function Factory_(config) {  // gets passed to factory, above
  return "Hello, " + config.who;
}

);
```

The main advantage to this pattern is that it moves most of the boilerplate code to the top of the file, allowing the developer to define the function code in one stand-out place. Notice that the ```Factory_``` method is passed to ```Package_``` as the second parameter. Deploying this trick again, we can pass the name of the library to ```Package_``` as well and have it a bit more dynamic:

```js
(function Package_ (global, name, factory) {
  global.pkg = global.pkg || {};
  pkg[name] = function () { return function () { return factory.apply(factory, arguments); }; };
})(this, 

'library',  // gets passed to name, above

function Factory_(config) {
  return "Hello, " + config.who;
}

);
```

So far, so good, but I want to give the ```pkg``` namespace a better name and an import functionality. This is what we want to be able to do with it:

```js
var lib = Import('library');         // or, Import.library
var greeting = lib({who: 'world'});  // "Hello, world"
```

We can get that by redefining the ```pkg``` object as a function, instead of an object, and the factory line will need one less function definition:

```js
(function Package_ (global, libraryName, factory) {
  global.Import = global.pkg || function (libs) { 
    if (typeof libs === 'string') return global.Import[libs];
    else return libs.reduce(function (acc, lib) { 
      acc[lib] = global.Import[lib];
      return acc;
    }, {});
  };
  Import[libraryName] = function () { return factory.apply(factory, arguments); };
})(this,

'library',

function Factory_(config) {
  return {
    output: "Hello, " + config.who;
  }
}

);
```

And that gets our desired behaviour!


## Part 3: NESTED NAMESPACES

So far, we have a means to "import" a library as a namespace, call it to get objects that

```js
(function Package (global, libraryName, factory) {  
  global.Import = global.Import || function (libs) { 
    if (typeof libs === 'string') return global.Import[libs];
    else return libs.reduce(function (acc, lib) { 
      acc[lib] = global.Import[lib];
      return acc;
    }, {});
  };
  global.Import[libraryName] = function Wrapper (extensions) { 
    var wrapped = function () { return factory.apply(Factory, arguments); } 
    for (i in extensions) { wrapped[i] = extensions[i]; }
    return wrapped;
  }
  /* end of Wrapper function, now call it with Extensions object */
  ({
    utils: {
      reverse: function (str) { return str.split("").reverse().join(""); },
    },
  });
})
/* end of Package function, now call it */
(this, 'library',

function Factory_(config) {   //  (this function gets passed as Factory arg above)
  return {
    output: function () { 
      switch (config.lang) {
        case "eng":
          return "Hello, world!";
        case "chi":
          return "大家好!";
      }
    },
    log: function (options) {
      options = options || {};
      options.reverse = options.reverse || false;
      if (options.reverse)
        Logger.log(Import.library.utils.reverse(this.output()));
      else
        Logger.log(this.output());
    },
  }
}

);
```
