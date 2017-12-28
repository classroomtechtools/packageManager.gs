function initLibrary() {
  Init_("NameOfLibraryHere", 'pkg.');
}

function initApplication() {
  Init_("NameOfAppHere", 'app.');
}

function Init_(namespace, prefix) {
  var targetScriptId, gistId, namespace, source, installer, apiValues, files;
  gistId = createNewGist_(namespace).id;
  targetScriptId = createNewProject_(prefix, namespace, gistId).id; 
  installer = gistInstaller(getCredentials(), {prefix: prefix, scriptId: targetScriptId});
  installer.push();
  installer.pull();
}

function keepBuildingFromGist() {
  var gistId, name;
  gistId = '';  // enter id
  name = 'Library';  // manually enter it
  var scriptId = createEmptyProject_(gistId).id;
  pullToScriptFromGist(scriptId, gistId);
}

/*
  FIXME: This re-uses a lot of code already present in PM
*/
function createNewGist_(namespace) {
  var headers, response, payload, credentials;
  namespace = namespace.replace(' ', '_');
  payload = {
    //description: namespace,
    public: false,
    files: {
      "readme.txt": {
        content: namespace
      },
    }
  };
  credentials = getCredentials().credentials;
  response = UrlFetchApp.fetch('https://api.github.com/gists', {
    method: 'post',
    payload: JSON.stringify(payload),
    headers: {
        'Authorization': 
          'Basic ' + Utilities.base64Encode(credentials.github_username + ":" + credentials.github_password),
        'User-Agent': credentials.github_username,
    },
    contentType: 'application/json',
    muteHttpExceptions: true
  });
  return JSON.parse(response.getContentText());
}

function testNewGist_() {
  var apiValues, installer, response;
  apiValues = {credentials: credentials};
  installer = gistInstaller(apiValues, {scriptId: ''})
  response = createNewGist_(installer, 'newGist');
  var headers = response.resp.getAllHeaders();
  Logger.log(response);
}

function createEmptyProject_(gistId) {
  var requestBody, resource, blob, files;
  
  files = templatesToFiles_(
    ['pkg._toolchain', 'setup', 'dev', 'testRunner'],
    'pkg.', 'namespace', gistId);
  
  requestBody =  {
    "files": files
  };
  resource = {
    "title": 'New Module',
  };
  blob = Utilities.newBlob(JSON.stringify(requestBody), "application/vnd.google-apps.script+json");
  return Drive.Files.insert(resource, blob, {"convert":"true"});
}

function createNewProject_(prefix, namespace, gistId) {
  prefix = prefix || 'pkg.';
  namespace = namespace || 'newModule';
  namespace = namespace.replace(' ', '_');
  gistId = gistId || '';
  var files, requestBody, resource, blob, response;
   
  files = templatesToFiles_(
    ['pkg._toolchain', prefix + 'boilerplate', 'setup', 'dev', 'unittests', 'testRunner'],
    prefix, namespace, gistId
    );
  
  requestBody =  {
    "files": files
  };
  resource = {
    "title": namespace,
  };
  blob = Utilities.newBlob(JSON.stringify(requestBody), "application/vnd.google-apps.script+json");

  try {
    return Drive.Files.insert(resource, blob, {"convert":"true"});
  } catch (err) {
    throw Error("You need to enable the Drive API in the console.");
  }
}

function templatesToFiles_(which, prefix, namespace, gistId, defaultList) {
  defaultList = defaultList || [];
  return which.reduce(function (files, file) {
    var template, source;
    template = HtmlService.createTemplateFromFile(file);
    template.data = {
      scriptId: ScriptApp.getScriptId(),
      webAppUrl: ScriptApp.getService().getUrl(),
      gistId: gistId,
      namespace: namespace.replace(" ", "_"),
      prefix: prefix,
      prefixNoDot: prefix.slice(0, prefix.length-1),
    };
    if (file.indexOf('.boilerplate') == file.length - '.boilerplate'.length) file = prefix + namespace + '.' + namespace[0].toUpperCase() + namespace.slice(1);
    if (file == 'unittests') file = prefix + namespace + '.unittests';
    source = template.evaluate().getContent();
    files.push({name: file, type: 'server_js', source: source});
    return files;
  }, defaultList);
}
