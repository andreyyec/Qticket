
var gulp = require('gulp'),
	sass = require('gulp-sass');

gulp.task('sass', function() {
  gulp.src('sass/main.scss')
  .pipe(sass({style: 'expanded'}))
    .on('error', gutil.log)
  .pipe(gulp.dest('public/static/css/main.css'))
});
