var fs = require('fs'),
    path = require('path'),
    pajo = path.join,
    gulp = require('gulp'),
    cssPrefixer = require('gulp-autoprefixer')
    sass = require('gulp-sass'),
    spawn = require('child_process').spawn;

//Start of restart the local servers
var devServers;
gulp.task('servers', function() {
  if(devServers) devServers.kill();

  devServers = spawn('node', [pajo(__dirname, 'local_servers.js')], {stdio: 'inherit'});

  devServers.on('close', function (code) {
    if(code === 8) {
      gulp.log('Error detected, waiting for changes...'.red);
    }
  });
});

var scssFiles = pajo(process.env.SCSS_PATH, '/**/!(_)*.scss');
gulp.task('scss', function() {
    fs.writeFileSync(pajo(process.env.SCSS_PATH, '_env.scss'), 
      "$cdn: '" + (process.env.CDN_URL || '/') + "';\n" +
      "$project: '" + (process.env.REXO_PROJECT || 'no_project') + "';",
      "utf8");

    gulp.src(scssFiles)
      .pipe(sass({
        outputStyle: 'compressed'
      }))
      .pipe(cssPrefixer())
      .pipe(gulp.dest(process.env.CSS_PATH));
});

gulp.task('build', ['scss']);

gulp.task('dev', ['build', 'servers'], function() {
  gulp.watch(
    pajo(process.env.SCSS_PATH, '/**/*.scss'), 
    ['scss']);

  gulp.watch([
      pajo(process.env.TEMPLATE_PATH, '/**/*.njk'),
      pajo(__dirname, 'local_servers.js'),
      pajo(__dirname, 'gulpfile.js')
    ],['servers']);
});

process.on('exit', function() {
  if(devServers) devServers.kill();
});