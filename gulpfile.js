/*
 * Version 2 beta
 *
 */

var ASSETS_FOLDER = '_assets';
var DEST = 'assets';

var gulp = require('gulp');

var filter = require('gulp-filter');
var rename = require('gulp-rename');
var del = require("del");

//var fs = require("fs");
//var path = require("path");

var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');

//var svgSprite = require("gulp-svg-sprite");
//var svg2png = require('gulp-svg2png');
//var spritesmith = require('gulp.spritesmith');
var imageresize = require('gulp-image-resize');
var imagemin = require('gulp-imagemin');

//var to5 = require('gulp-6to5');

//var babel = require('gulp-babel');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var uglify = require('gulp-uglify');
var mainBowerFiles = require('main-bower-files');
var concat = require('gulp-concat');



gulp.task('js:bower', function() {

	var jsFilter = filter('**/*.js');
	var sassFilter = filter('**/*.scss');

	return gulp.src(mainBowerFiles())
		.pipe(jsFilter)
		.pipe(concat('vendor.js'))
		.pipe(uglify())
		.pipe(gulp.dest(DEST + '/js'))
		.pipe(jsFilter.restore())
		.pipe(sassFilter)
		.pipe(gulp.dest(DEST + '/scss/vendor'));
});

gulp.task('js:bowerdebug', function() {

	var jsFilter = filter('**/*.js');
	var sassFilter = filter('**/*.scss');

	return gulp.src(mainBowerFiles())
		.pipe(jsFilter)
		.pipe(concat('vendor.js'))
		.pipe(gulp.dest(DEST + '/js'))
		.pipe(jsFilter.restore())
		.pipe(sassFilter)
		.pipe(gulp.dest(DEST + '/scss/vendor'));
});


function JScompile(watch) {

	var bundler = false;
	if(watch){
		bundler = watchify(browserify('./_assets/js/client.js', { debug: true }).transform(babelify.configure({ modules: 'common' })));
	}else{
		bundler = browserify('./_assets/js/client.js', { debug: true }).transform(babelify.configure({ modules: 'common' }));
	}

	function rebundle() {
		bundler.bundle()
		.on('error', function(err) { console.error(err); this.emit('end'); })
		.pipe(source('build.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(DEST + '/js'));
	}

	if (watch) {
		bundler.on('update', function() {
			console.log('-> bundling...');
			rebundle();
		});
	}

	rebundle();
}

function JSwatch() {
	return JScompile(true);
};



/*
 *  SASS tasks
 */

gulp.task('sass', function() {
	return gulp.src('_assets/scss/*.scss')
		.pipe(sass({ outputStyle: 'compressed' }))
		.pipe(autoprefixer(
		//	{ browsers: ['last 5 versions'] }
		))
		.pipe(gulp.dest(DEST + '/css'));
});




/*
 *  Image tasks
 */


gulp.task('build:images', function() {

	// Copy and optimise images except sprites to public assets

	gulp.src(['_assets/images/**/*', '!assets/images/sprites-{*,*/**}'])
		.pipe(imagemin({
			progressive: true
		}))
		.pipe(gulp.dest(DEST + '/images'));
});



/*
 *  General tasks
 */


gulp.task('watch', function() {

	/*browserSync({
		proxy: ADDRESS,
		host: IPADDRESS
	});*/

	//gulp.watch('assets/images/sprites-svg/**/*', ['svg', 'sass']);

	//gulp.watch('assets/images/sprites-png/2x/*', ['png']);

	//gulp.watch('assets/js/**/*.js', ['js']);

	//gulp.watch('app/views/**/*.php', reload);

	gulp.watch('_assets/scss/**/*.scss', function(event) {
		console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
		gulp.start('sass');
	});
});


gulp.task('build:clean', function(cb) {

	// Delete all images and javascript from output directory

	del([
		//DEST + '/images/**/*',
		DEST + '/js/**/*'
	], cb);
});



gulp.task('build:js', ['build:clean'], function() {

	// Don't optimise or concat separate scripts such as modernizr

	gulp.src('assets/js/standalone/*.js')
		.pipe(gulp.dest(DEST + '/js'));

	//

	gulp.start('js:bower');
	JScompile(false);
	//gulp.start('js');
});


gulp.task('js:watch', function() { return JSwatch(); });



gulp.task('build:css', ['svg', 'png'], function() {
	gulp.start('sass');
});



gulp.task('rev', function() {

	var rev = require('gulp-rev');
	var path = require('path');

	return gulp.src([DEST + '/css/*.css', DEST + '/js/{bundle,vendor}.js'], {base: path.join(process.cwd(), DEST)})
	.pipe(rev())
	.pipe(gulp.dest(DEST))
	.pipe(rev.manifest())
	.pipe(gulp.dest(DEST));
});



gulp.task('build', ['build:images', 'build:js', 'build:css']);


gulp.task('default', ['js:watch', 'watch']);


// Workaround for https://github.com/gulpjs/gulp/issues/71
var origSrc = gulp.src;
gulp.src = function () {
	return fixPipe(origSrc.apply(this, arguments));
};
function fixPipe(stream) {
	var origPipe = stream.pipe;
	stream.pipe = function (dest) {
		arguments[0] = dest.on('error', function (error) {
			var nextStreams = dest._nextStreams;
			if (nextStreams) {
				nextStreams.forEach(function (nextStream) {
					nextStream.emit('error', error);
				});
			} else if (dest.listeners('error').length === 1) {
				throw error;
			}
		});
		var nextStream = fixPipe(origPipe.apply(this, arguments));
		(this._nextStreams || (this._nextStreams = [])).push(nextStream);
		return nextStream;
	};
	return stream;
}
