var pajo = require('path').join,
    figgs = require('figgs');

var Project = function() {};

Project.prototype.load = function() {
  var cwd = process.cwd(),
      figg = figgs.load(pajo(cwd, 'config.json'));

  for(var prop in figg) {
    this[prop] = figg[prop];
  }

  for(var envar in figg.env) {
    if(envar.indexOf("_PATH") > 1) {
      this.env[envar] = pajo(cwd, figg.env[envar]);
    }
  }

  process.env.REXO_PROJECT = 
    this.PROJECT_NAME_URL_SAFE = figg.PROJECT_NAME_URL_SAFE || 
      this.PROJECT_NAME.toLowerCase().replace(' ', '_');
};

var proj = new Project();
proj.load();

module.exports = proj;