function doGet() {
  var token;
  token = ScriptApp.getOAuthToken(); 
  return ContentService.createTextOutput(token);
}

function remotePull(scriptId, prefix) {
  prefix = prefix || 'pkg.';
  gistInstaller(getCredentials(), {prefix: prefix, scriptId: scriptId})
    .pull();
}

function remotePush(scriptId, prefix) {
  prefix = prefix || 'pkg.';
  return gistInstaller(getCredentials(), {prefix: prefix, scriptId: scriptId})
    .push();
}

function pullToScriptFromGist(scriptId, gistId) {
  gistInstaller(getCredentials(), {scriptId: scriptId})
    .pull();
}

function pullToScriptFromGist(scriptId, gistId) {
  gistInstaller(getCredentials(), {scriptId: scriptId})
    .pull([{name: 'testing', value: gistId}]);
}
