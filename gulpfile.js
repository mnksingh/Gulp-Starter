/* eslint-env node */
"use strict";

const gulp = require("gulp"),
      plumber = require("gulp-plumber"),
      browsersync = require("browser-sync").create(),
      sourcemaps = require("gulp-sourcemaps");

const postcss = require("gulp-postcss"),
      postcssPresetEnv = require("postcss-preset-env"),
      lost = require("lost"),
      cssnano = require('cssnano'),
      precss = require("precss"),
      atImport = require("postcss-import"),
      autoprefixer = require("autoprefixer"),
      rucksack = require('rucksack-css'),
      mqpacker = require("css-mqpacker");

const Buffer = require("vinyl-buffer"),
      source = require("vinyl-source-stream"),
      babelify = require("babelify"),
      browserify = require("browserify"),
      uglify = require("gulp-uglify");

const globals = {
  js: {
    src: "src/js/script.js",
    watch: "src/js/**.*js",
    dest: "dist/assets/js"
  },
  css: {
    src: "src/postcss/main.css",
    watch: "src/postcss/**/*.css",
    dest: "dist/assets/css/"
  },
  postcssPlugins: [
      atImport(),
      postcssPresetEnv({
        autoprefixer: {
          browsers: ['IE >= 9']
        }
      }),
      precss(),
      rucksack(),
      lost(),
      mqpacker(),
      cssnano()
  ]
}

function styles () {
  return gulp
    .src(globals.css.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(postcss(globals.postcssPlugins))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest(globals.css.dest))
    .pipe(browsersync.stream());
}

gulp.task("images", function() {
  gulp
    .src("src/img/**/*.*")
    .pipe(plumber())
    .pipe(gulp.dest("dist/assets/img"));
});

function scripts() {
  const b = browserify({
    entries: globals.js.src,
    debug: true,
    // defining transforms here will avoid crashing your stream
    transform: [babelify.configure({
      presets: ['env']
    })]
  });

  return b.bundle()
     .pipe(source('script.js'))
     .pipe(Buffer())
     .pipe(sourcemaps.init({loadMaps: true}))
         // Add transformation tasks to the pipeline here.
         .pipe(uglify())
         .on('error',  console.error.bind(console))
     .pipe(sourcemaps.write('.'))
     .pipe(gulp.dest(globals.js.dest))
     .pipe(browsersync.stream());
}

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./dist",
      online: false,
    },
    port: 3000
  });
  done();
}

function browserSyncReload(done) {
  browsersync.reload();
}

gulp.task('css', styles);
gulp.task('js', scripts);
gulp.task("browser-sync", browserSync);
gulp.task('build', gulp.parallel('js', 'css'));

function watchFiles() {
  gulp.watch("dist/**/*.html").on("change", browserSyncReload);
  gulp.watch(globals.js.watch, scripts);
  gulp.watch(globals.css.watch, styles);
}

gulp.task("watch", watchFiles);

gulp.task('default', gulp.series('build', 'browser-sync', 'watch'));
