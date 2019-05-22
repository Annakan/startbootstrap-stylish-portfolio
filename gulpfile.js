"use strict";
// Library loads
const path = require('path');
const Fiber = require('fibers');

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
const sourcemaps = require('gulp-sourcemaps');
const gdebug = require('gulp-debug');

// Load package.json for banner
const pkg = require('./package.json');

// useful assets and output paths
const theme_path = __dirname;
const assets_path = path.join(theme_path, 'assets');
const src_path = path.join(theme_path, 'src');
const src_scss_path = path.join(src_path, 'scss');
const src_js_path = path.join(src_path, 'js');
const vendor_path = path.join(assets_path, 'vendor');

// const output_path = path.join(assets_path, 'static', 'gen');

// source patterns
const scss_src_pattern = path.join(src_scss_path, "/**/*.scss");
const js_src_pattern = [
      path.join(src_js_path, "/**/*.js"),
      '!'+path.join(src_path, "./js/**/*.min.js") // but we should never have .min.js file there ....
    ];

const js_dest = path.join(assets_path, 'js');
const css_dest = path.join(assets_path, 'css');
const html_dest = path.join(assets_path, 'html');
const font_dest = path.join(assets_path, 'fonts');

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
  console.log("**** cleaning *****", vendor_path);
  return del([vendor_path]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap
  console.log("**** modules *****", vendor_path);
  const bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
    .pipe(gulp.dest(path.join(vendor_path, './bootstrap')));
  // Font Awesome
  const fontAwesome = gulp.src('./node_modules/@fortawesome/**/*')
    .pipe(rename(function (path) {
        path.dirname = path.dirname.replace(/fontawesome-(free|pro)/,"fontawesome");
        path.basename = path.basename.replace(/some-(free|pro)$/,"some");
     }))
    .pipe(gulp.dest(vendor_path));
  // jQuery Easing
  const jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest(path.join(vendor_path, './jquery-easing')));
  // jQuery
  const jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest(path.join(vendor_path, './jquery')));
  // Simple Line Icons
  const simpleLineIconsFonts = gulp.src('./node_modules/simple-line-icons/fonts/**')
    .pipe(gulp.dest(path.join(vendor_path, './simple-line-icons/fonts')));
  const simpleLineIconsCSS = gulp.src('./node_modules/simple-line-icons/css/**')
    .pipe(gulp.dest(path.join(vendor_path, './simple-line-icons/css')));
  return merge(bootstrap, fontAwesome, jquery, jqueryEasing, simpleLineIconsFonts, simpleLineIconsCSS);
}

// CSS task
function css() {
  const step1 = gulp
    .src(scss_src_pattern)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }))
    .on("error", sass.logError);
  const save_base_css =  step1.pipe(gulp.dest(css_dest));
  const step2 = save_base_css.pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }));
  const step3 =  step2  // .pipe(header(banner, {
    //   pkg: pkg
    // }))
    .pipe(gulp.dest(css_dest))
    .pipe(rename({
      suffix: ".min"
    }));
  const clean_css = step3.pipe(gulp.dest(css_dest));
  const output = clean_css.pipe(gulp.dest(css_dest));
  return output
  // return output.pipe(browsersync.stream());
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
  // gulp.watch("./**/*.html", browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(css, js));
const fastbuild = gulp.series(gulp.parallel(css, js));
// const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));
const watch = gulp.series(build, gulp.parallel(watchFiles));

// Export tasks
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.fastbuild = fastbuild;
exports.default = build;
