
var gulp = require('gulp'),
	sass = require('gulp-sass');

gulp.task('sass', function() {
  gulp.src('sass/screen.scss')
  .pipe(sass({style: 'expanded'}))
    .on('error', console.error.bind(console))
  .pipe(gulp.dest('application/public/static/css/'))
});
