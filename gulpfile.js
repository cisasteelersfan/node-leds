var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
gulp.task('serve', function(){
    return nodemon({
        script: 'app.js',
        ext: 'js html css',
        env: {'NODE_ENV': 'development'}
    }).on('restart', function(){
        console.log("Restarted server");
    });
});
