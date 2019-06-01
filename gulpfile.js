"use strict";

const MAIN_PORT = 3000;

const PHP_PORT = 8001;

const gulp = require("gulp"),
  plumber = require("gulp-plumber"),
  browsersync = require("browser-sync"),
  sourcemaps = require("gulp-sourcemaps");

const phpConnect = require("gulp-connect-php");

const sass = require("gulp-sass");

const postcss = require("gulp-postcss"),
  postcssPresetEnv = require("postcss-preset-env"),
  lost = require("lost"),
  cssnano = require("cssnano"),
  rucksack = require("rucksack-css"),
  mqpacker = require("css-mqpacker");

const Buffer = require("vinyl-buffer"),
  source = require("vinyl-source-stream"),
  babelify = require("babelify"),
  browserify = require("browserify"),
  uglify = require("gulp-uglify");

const globals = {
  distDir: "./dist",
  js: {
    src: "src/js/script.js",
    watch: "src/js/**.*js",
    dest: "dist/assets/js"
  },
  css: {
    src: "src/sass/styles.scss",
    watch: "src/sass/**/*.scss",
    dest: "dist/assets/css/"
  },
  postcssPlugins: [
    postcssPresetEnv({
      autoprefixer: {
        browsers: ["> 1%", "last 2 versions", "IE 10"]
      }
    }),
    rucksack(),
    lost(),
    mqpacker(),
    cssnano()
  ]
};

function styles() {
  return gulp
    .src(globals.css.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
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
    transform: [
      babelify.configure({
        presets: ["@babel/preset-env"]
      })
    ]
  });

  return (
    b
      .bundle()
      .pipe(source("script.js"))
      .pipe(Buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      // Add transformation tasks to the pipeline here.
      .pipe(uglify())
      .on("error", console.error.bind(console))
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest(globals.js.dest))
      .pipe(browsersync.stream())
  );
}

function browserSync(done) {
  phpConnect.server(
    {
      base: globals.distDir,
      port: PHP_PORT
    },
    () => {
      browsersync({
        proxy: `http://localhost:${PHP_PORT}`,
        notify: false,
        open: true,
        port: MAIN_PORT
      });
      done();
    }
  );
}

function watchFiles() {
  gulp.watch("dist/**/*.html").on("change", browsersync.reload);
  gulp.watch("dist/**/*.php").on("change", browsersync.reload);
  gulp.watch(globals.js.watch, scripts);
  gulp.watch(globals.css.watch, styles);
}

gulp.task("css", styles);
gulp.task("js", scripts);

gulp.task("browser-sync", browserSync);
gulp.task("build", gulp.parallel("js", "css"));

gulp.task("watch", watchFiles);

gulp.task("default", gulp.series("build", "browser-sync", "watch"));
