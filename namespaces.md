## on namespaces, importing libraries in GAS

In the Google Apps Scripting environment, how to do the following:
1. Write a block of code (library) that is accessible from anywhere else in the project, i.e. make a namespace `pkg`
2. Be able to namespace upon that namespace, i.e. `pkg.namespace` which is the entry point for creating a reference to that library with `var lib = pkg.library();`
3. Be able to namespace the namespaced namespaces, i.e. `pkg.library.utils`

### Part 1: The 'this'

Google Apps Script global environment contains all the built-in variables, such as `SpreadsheetApp` and whatnot. You can inspect it for yourself with this block of code:

Code.gs:
```js
(function (global) {
  Logger.log(global);
})(this);
```

How does that work? The "this" keyword represents the global environment, which gets passed to a self-invoking, anonymous function, as the "global" parameter. 
This is an interesting construct in JavaScript for lots of reasons, but in this case what it is doing is giving us a variable the is a reference 
to the global namespace as a variable, which means we can build upon it.

Code.gs:
```js
(function (global) {
  global.pkg = {};
  pkg.library = {sayHi: function () { return 'hi'; } };
})(this);
Logger.log(pkg.library.sayHi());
```

We've now added our own built-in, so to speak: "pkg" and we added a library namespace onto it. 
However, this pattern still won't let us have more than one library. Consider:

Code1.gs
```js
(function (global) {
  global.pkg = {};      // no!
  pkg.library = {};
})(this);
```

Code2.gs
```js
(function (global) {
  global.pkg = {};     // no!
  pkg.anotherLibrary = {};
})(this);
```
We will have just overwritten one or the other, but if we just use this trick: 

Code1.gs
```js
(function (global) {
  global.pkg = global.pkg || {};       // ah...
  pkg.libarary = {};
})(this);
```

Code2.gs
```js
(function (global) {
  global.pkg = global.pkg || {};       // ah...
  pkg.anotherLibrary = {}; 
})(this);
```

## Part 2: Nested namespaces

Explanation is coming soon, but here is the result:

```js
(function (global, Factory) {  
  global.pkg = global.pkg || {};
  global.pkg.library = (function wrapper (args) { 
      var wrapped = function () { return Factory.apply(Factory, arguments); } 
      for (i in args) { wrapped[i] = args[i]; }
      return wrapped;
  }  // end of wrapper
  ( /* below object can build nested namespaces */
    {
      utils: {
        sayHi: function () { return 'hi'; },
      }
    }
  )
  );  // end global.pkg.library self-invoking function
})(this,    // execute top function

/**
  *  This is your main package code; returns object which app will use for operations
  */
function Package(config) {   //  (this function gets passed as Factory arg above)
  return {
  }
}

);      
```
