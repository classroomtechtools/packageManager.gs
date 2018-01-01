/*
 * PackageManager  © Adam Morris classroomtechtools.ctt@gmail.com
 * A toolchain solution for test-driven development and package management
 * What it does:
 *    - Provides boilerplate code to make modular packages publishable as gists
 *    - Define and adds all those dependencies to the project so that there are completely modular
 *    - Access them in your own code with "pgk.namespace" where the namespace is defined in the dependency setup file
 *    - Test the modules with TDD practices!
 * To set up:
 *    - Make a copy: https://script.google.com/a/igbis.edu.my/d/1ClAoUIZdC5VJ0nM3_1NIYwW-sr-LLXT_9rLc9B0Tj5SikYWwBuFucyRu/edit)
 *    - Change your timezone details in sample manfiest (https://developers.google.com/apps-script/reference/base/session#getScriptTimeZone())
 *    - Enable the Drive API in the Console (in Advanced Services)
 *    - Enable the App Script API int he Console (in Advanced Services)
 *    - Deploy as a Web App, with "Me" permissions
 *    - Deploy API executable, also with "Me" permissions
 * To write a new library:
 *    - Use Package Manager to create the templated project and gist 
 *        1) In _toolchain, manually input your namespace for the module 
 *        2) run "initLibrary" and find new project in Drive -> Recents, and new gist on github
 *        3) Go to pkg.namespace.namespace and find boilerplate code that allows you to write library
 *        4) Write tests in pkg.namespaces.unittests
 *        5) To publish the library, to to _toolchain: "push" and make it a public gist
 * To write an app that uses other libraries
 *    - Discover gists online and use Package Manager to create a new app
 *        1) In _toolchain, manually input desired namespace
 *        2) run "initApplication" and find new project in Drive -> Recents, and new gist on github
 *        3) Define dependency on other library in setup.gs file
 *           3a) When adding a dependency, you write it in setup.gs and then...
 *           3b) _toolchain "push" and then "pull"
 *           3c) Probably best to refresh by reloading the project with the browsers reload button
 *        4) Use the library with the pkg.namespace moniker
 *        5) Write application body in app.namespace.namespace or any other file that beings with "app.namespace"
 *        6) _toolchain -> "push" will public a secret gist to github
 * To copy/test/fork a library:
 *     - Use Package Manager to create a templated project
 *        1) In _toolchain run "keepBuildingFromGist" with the appropriate gist ID and name (these need to be the same as published)
 *        2) Mod as necessary, make sure the tests all pass
 *        3) _toolchain push, then pull
 */


(function (global) {
  var installer, PREFIX = 'pkg.';
  function _getPrefix(options) {
    return options.prefix || PREFIX;  
  }
  
  installer = function(_api, _options) {
    var _prefix;
    _options = _options || {};
    _prefix = _getPrefix(_options);
    _options.oauthToken = _options.oauthToken || ScriptApp.getOAuthToken();
    _options.scriptId = _options.scriptId || ScriptApp.getScriptId();
    _options.projectSideReminder = _options.projectSideReminder || '/*!*/';
    _options.hardCodedLibraries = _options.hardCodedLibraries || [];
    _options.setupFileName = _options.setupFileName || 'setup';
    _options.devFileName = _options.devFileName || 'dev';
    _options.urls = _options.urls || [];
    _api =                     _api || {};
    _api.url =                 _api.url || '';  // must be blank to work in subclasses
    _api.file =                _api.file || {};
    _api.file.fileName =       _api.file.fileName || 'filename';
    _api.file.content =        _api.file.content || 'content';
    _api.file.source =         _api.file.source || 'source';
    _api.file.language =       _api.file.language || 'language';
    _api.file.javaScriptType = _api.file.javaScriptType || 'JavaScript';
    _api.file.htmlType =       _api.file.htmlType || 'HTML';
    _api.file.rawUrl =         _api.file.raw_url || 'raw_url';
    
    return {
      getPrefix: function () {
        return _prefix;
      },
      
      pull: function (defaultItems) {
        var projectPackage, files, items, devSetup;
        defaultItems = defaultItems || [];
        projectPackage = defaultItems;
        devSetup = this.getSetupObjFromProjectFile(_options.devFileName);
        for (var key in devSetup.self) {   // import package defined in self with passed-in prefix
          projectPackage.push({
            prefix: _prefix,
            name: key,
            value: devSetup.self[key],
            import: "Imported from self in dev.gs",
            dev: false,
          });
        }
        items = this.readin(_options.setupFileName).concat(this.readin(_options.devFileName)).concat(projectPackage);
        if (items.length == 0) return;
        files = this.getFiles(items);
        this.merge(files);
        this.updateProject(files);
        return {urls: _options.urls};
      },
      
      push: function () {
        var items, setupObj, keys, item;
        setupObj = this.getSetupObjFromProjectFile(_options.devFileName);
        if (!setupObj.self) return;
        keys = Object.keys(setupObj.self);
        if (keys.length != 1) return;
        for (var k in setupObj.self) {
          item = {name: k, value: setupObj.self[k]};
        }
        var projectFiles, gistFiles, longName, found, src, uploadFiles = {};
        
        projectFiles = this.getProjectFiles(_options.scriptId);

        // add files that in the repo and changed, or delete obselete ones
        gistFiles = this.fetch.call(this, _api.url + item.value, 'get', {}, this.headers()).files;
        for (var file in gistFiles) {
          longName = _prefix + item.name + '.' + file.slice(0, file.length-3);  // minus 3 b/c ext
          found = projectFiles.filter(function (f) {
            return f.name == longName;
          });
          if (found.length != 1) {
            // delete it
            uploadFiles[file] = null;
          } else {
            uploadFiles[file] = {content: found[0].source};
          }
        };
        
        // add files that are not in the gist
        projectFiles.forEach(function (file) {
          if (file.name.indexOf('.') == -1) return;
          var splitted = file.name.split('.');
          var ext = {'server_js': '.gs', 'html': '.html'}[file.type]
          if (!ext) return;
          if (splitted.length == 1) return;
          if (splitted[0]+'.' != _prefix) return;
          if (splitted[splitted.length-2] != item.name) return;
          var shortname = splitted[splitted.length-1] + ext;
          if (!(shortname in uploadFiles)) uploadFiles[shortname] = {content: file.source};
        });
        [_options.setupFileName, _options.devFileName].forEach(function (extraFile) {
          var found;
          found = projectFiles.filter(function (f) {
            return f.name == extraFile;
          });
          if (found.length != 1) return;
          uploadFiles[extraFile+'.gs'] = {content: found[0].source};
        });
        this.pushFiles(uploadFiles, item.value);
      },
            
      pushFiles: function (uploadFiles, gistId) {
        var response, url, input, headers;
        url = _api.url + gistId;
        input = JSON.stringify({files: uploadFiles});
        response = this.fetch.call(this, url, 'patch', input, this.headers());
        Logger.log(response);
      },
            
      getFiles: function (items) {
        var items, files = [];
        for (var i=0; i<items.length; i++) {
          var item;
          item = items[i];
          files = this.download(item).concat(files);
        }
        return files;
      },

      /*
       * Inspects the file and sees if it is a package specifier
       */
      processFile: function (file, item) {
        var setupObj, files = [];
        if (file[_api.file.fileName] == _options.setupFileName + '.gs') {
          setupObj = this.getSetupObjFromFile(file);
          if (!setupObj.packages) return files;
          for (var p = 0; p < setupObj.packages.length; p++) {
            for (var k in setupObj.packages[p]) {
              if (k === "") continue;
              files = this.download({
                prefix: item.prefix,
                name: k,
                value: setupObj.packages[p][k],
                import: item.import + ' -> ' + k,
                dev: item.dev == true ? true : false,
              }).concat(files);
            }
          }
        }
        return files;
      },
      
      /*
       * Download the package, allowing for possibility to discover and download additional packages
       * @return file objects
       */
      download: function (item) {
        var url, response, me = this;
        url = this.buildUrl(item.value);
        if (_options.urls.indexOf(url) != -1) return [];  // prevent packages from being re-processed
        _options.urls.push(url);
        response = this.fetch.call(this, url, 'get', {}, this.headers());
        if (response.message && response.message == "Bad credentials") throw Error("Bad credentials for github username/password");
        return Object.keys(response.files).reduce(function (files, key) {
          var file, obj;
          file = response.files[key];
          files = me.processFile(file, item).concat(files);
          var obj = me.buildFileObj(file, item);
          if (obj != null) files.push(obj); // buildFileObj returns null if should not be added
          return files;
        }, []);
      },

      buildUrl: function (value) {
        return _api.url + value;
      },
      
      getFileType: function (file) {
        var fullname, ext, js, html;
        fullname = file[_api.file.fileName].split('.');
        ext = fullname[fullname.length-1];
        js = 'server_js';
        html = 'html';
        var ret = null;
        switch (ext) {
          case 'gs':
          case 'GS':
          case 'js':
          case 'JS':
            ret = js
            break;
          case 'html':
          case 'HTML':
            ret = html;
            break
        }
        if (ret != null) return ret;
        switch (file[_api.file.type]) {
          case _api.file.javaScriptType:
            ret = js;
            break;
          case _api.file.htmlType:
            ret = html;
            break;
        }
        return ret;
      },
            
      headers: function () {
        return {};
      },
      
      getSetupObjFromProjectFile: function (fileName) {
        var setupFile = this.getProjectFiles(_options.scriptId, function (file) {
          return file.name == fileName;
        });
        if (setupFile.length != 1) return {};
        return eval(setupFile[0].source);
      },
      
      getSetupObjFromFile: function (file) {
        return eval(file[_api.file.content]);
      },
      
      /* 
       * Reads in from setup.gs and dev.gs
       * TODO: Store self info for search and replace in future version
       * @returns [{name: '', value: ''}]
       */ 
      readin: function (fileName, keyword) {
        keyword = keyword || 'packages';
        var includeHardCodedLibraries, setupObj, allItems;        

        // FIXME: includeHardCodedLibraries block is run more than once at the moment, but since I haven't decided
        // how to do this properly, or if we even need this, I'm just leaving this here for now as a FIXME
        includeHardCodedLibraries = Object.keys(_options.hardCodedLibraries).reduce(function (items, key) {
          items.push({
            prefix: PREFIX,
            name: key.slice(PREFIX.length),
            value: _options.hardCodedLibraries[key],
            import: "Imported via hard coded library " + key,
            dev: true,
          });
          return items;
        }, []);

        setupObj = this.getSetupObjFromProjectFile(fileName);
        if (!setupObj[keyword]) return includeHardCodedLibraries;

        return setupObj[keyword].reduce(function (items, item, i) {
          var objs;
          objs = Object.keys(item).reduce(function (itms, k) {
            if (!k) return itms;
            var name, value;
            name = k;
            value = setupObj[keyword][i][k];
            itms.push({
              prefix: PREFIX,
              name: name,
              value: value,
              import: "Imported via " + fileName + ".gs",
              dev: fileName == _options.devFileName,
            });
            return itms;
          }, []);
          items = items.concat(objs);
          return items;
        }, includeHardCodedLibraries);
      },

      getProjectFiles: function (scriptId, fltr) {
        var url, response;
        fltr = fltr || function () { return true; };
        url = 'https://script.google.com/feeds/download/export?id=' + scriptId +  '&format=json';
        response = this.fetch(url, 'get', {}, {'Authorization': 'Bearer ' + _options.oauthToken});
        return response.files.filter(fltr);
      },
      
      /*
       * Combine the projects files
       */
      merge: function (files) {
        var projectFiles, found;
        projectFiles = this.getProjectFiles(_options.scriptId);
        
        for (var f=0; f<projectFiles.length; f++) {
          var thisFile = projectFiles[f];
          found = files.filter(function (file) { return file.name == thisFile.name; });
          if (found.length == 1) {
            found[0].id = thisFile.id;  // can only be one since they must be unique names
          } else {
            files.push({id:thisFile.id});
          }
        }
      },
      
      updateProject: function (files) {
        var url, resource, blob;
        url = 'https://www.googleapis.com/drive/v2/files/' + _options.scriptId;
        blob = Utilities.newBlob(JSON.stringify({files: files}), 'application/json');
        resource = this.fetch.call(this, url, 'get', {}, {'Authorization': 'Bearer ' + _options.oauthToken});
        try {
          Drive.Files.update(resource, _options.scriptId, blob);
        } catch (e) {
          Logger.log(files);
          throw Error("Bad request? Inspect logs to see if source has syntax error: " + e.message); 
        }
      },
      
      buildFileObj: function (file, item) {
        var fullname, filename, ext, content, obj;
        fullname = file.filename.split('.');
        filename = fullname[0];
        ext = fullname[1];
        
        obj = {
          name: (item.prefix + item.name + '.' + filename).replace(' ', '_'),
          type: this.getFileType(file),
          source: file[_api.file.content],  // FIXME: adding import will just double up later on '/*\n' + item.import + '\n */\n\n'
        }
        
        // Exclusions -- to ensure a seperate development environment
        var excludedIfEndsWith, endsWith;
        if (typeof obj.type == 'undefined') {
          Logger.log('Skipping this file as type could not be determined: ' + obj.name + ' ' + file[_api.file.language]);
          return null;  // indicates this should be skipped
        }
        excludedIfEndsWith = ['.setup', '.dev'];
        for (var i = 0; i < excludedIfEndsWith.length; i++) {
          endsWith = excludedIfEndsWith[i];
          if (obj.name.indexOf(endsWith) == obj.name.length - endsWith.length)
            return null;  // gets skipped
        }
        if ((obj.name.indexOf('.unittests') != -1) && item.dev) {
          // excludes unittests files of imported packages, but keeps the ones that are included for the target library
          // pattern it looks for is "contains .unittests" in the filename that way developer can have multiple test files
          // the item.dev is needed to distinguish between unittests as a part of the target project and those imported
          return null;
        }
        return obj;
      },

      /**
        *  Detect what the convention was in the file and replace it with the defined one in the setup/dev area
        *  Left here for FIXME
        */
      replaceSource: function (source, item) {
        // FIXME: not a very sophisticated way to achieve this
        var match, namespace;
        match = source.match(new RegExp("global." + _prefix + "([a-zA-Z]*)"));
        if (!match) { return source; }
        namespace = match[1];
        source.replace(_prefix + namespace, _prefix + item.name);
        return source;
      },
        
      /*
       * Convenience function for UrlFetchApp
       */
      fetch: function (url, method, payload, headers) {
        var e, res;
        if (method == 'patch') {
          method = 'post';
          url = url + "?_HttpMethod=PATCH"
        }
        try {
          res = UrlFetchApp.fetch(url, {
            method: method,
            payload: payload,
            headers: headers,
            muteHttpExceptions: true
          });
        } catch (error) {
          e = error;
          throw new Error("Package Installer requires scope: https://www.googleapis.com/auth/drive.scripts " + e.message);
        }
        if (res.getResponseCode() == 404) {
          throw Error("No packages installed, as this package is not found: " + url);
        }
        try {
          r = JSON.parse(res.getContentText());
        } catch (error) {
          e = error;
          r = res.getContentText();
        }
        return r;
      }
    }
  };
 
  global.gistInstaller = function (_api, _options) {
    var me, _prefix;
    me = installer(_api, _options);
    if (!_api.credentials) throw Error("Init with your github credentials, please");
    if (!_api.credentials.github_username) throw Error("Init with your github username, please");
    if (!_api.credentials.github_password) throw Error("Init with your github password, please");
    _api.url = 'https://api.github.com/gists/';
    _prefix = _getPrefix(_options);
    parent_processFile = me.processFile;

    me.headers = function (value) {
      return {
        'Authorization': 
          'Basic ' + Utilities.base64EncodeWebSafe(_api.credentials.github_username + ":" + _api.credentials.github_password)
      };
    };
    
    me.processFile = function (file, item) {
      if (file.truncated) {
        // according to gist api, you have to download via raw_url
        file[_api.file.content] = this.fetch(file[_api.file.rawUrl], 'get', {}, this.headers());
      }
      return parent_processFile.call(me, file, item);
    };
    
    return me;
  };
 
})(this);
