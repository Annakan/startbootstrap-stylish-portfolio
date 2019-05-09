"use strict";
// Library loads
const path = require('path');

// Load plugins
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const del = require("del");
const gulp = require("gulp");
const header = require("gulp-header");
const merge = require("merge-stream");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");


// Load package.json for banner
const pkg = require('./package.json');

// useful assets and output paths
const theme_path = path.join(path.dirname(__dirname));
const assets_path = path.join(theme_path, 'assets');
const src_path = path.join(theme_path, 'src');
const src_scss_path = path.join(src_path, 'scss');
const src_js_path = path.join(src_path, 'js');

// const output_path = path.join(assets_path, 'static', 'gen');

// source patterns
const scss_src_pattern = path.join(src_scss_path, "/**/*.scss");
const js_src_pattern = [
      path.join(src_js_path, "/**/*.js"),
      '!'+path.join(src_path, "./js/**/*.min.js") // but we should never have .min.js file there ....
    ];

const js_dest = path.join(assets_path, 'js');
const css_dest = path.join(assets_path, 'css');
const html_dest = join(assets_path, 'html');


// Set the banner content
const banner = ['/*!\n',
  ' * Adapted from  Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return del(["./vendor/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap
  const bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
    .pipe(gulp.dest('./vendor/bootstrap'));
  // Font Awesome
  const fontAwesome = gulp.src('./node_modules/@fortawesome/**/*')
    .pipe(gulp.dest('./vendor'));
  // jQuery Easing
  const jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest('./vendor/jquery-easing'));
  // jQuery
  const jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./vendor/jquery'));
  // Simple Line Icons
  const simpleLineIconsFonts = gulp.src('./node_modules/simple-line-icons/fonts/**')
    .pipe(gulp.dest('./vendor/simple-line-icons/fonts'));
  const simpleLineIconsCSS = gulp.src('./node_modules/simple-line-icons/css/**')
    .pipe(gulp.dest('./vendor/simple-line-icons/css'));
  return merge(bootstrap, fontAwesome, jquery, jqueryEasing, simpleLineIconsFonts, simpleLineIconsCSS);
}

// CSS task
function css() {
  return gulp
    .src(scss__pattern)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest(css_dest))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(css_dest))
    .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src(js_src_pattern)
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(js_dest))
    .pipe(browsersync.stream());
}

// Watch files
function watchFiles() {
  gulp.watch(scss_src_pattern, css);
  gulp.watch(js_src_pattern, js);
  gulp.watch("./**/*.html", browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(css, js));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
