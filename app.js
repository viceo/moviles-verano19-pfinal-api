var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/usuarios');
var cursosRouter = require('./routes/cursos');
var catalogosRouter = require('./routes/catalogos');
var actividadesCursoRouter = require('./routes/actividades');
var asistentesCursoRouter = require('./routes/asistentes');
var asistenciasCursoRouter = require('./routes/asistencias');
var salonesRouter = require('./routes/salones');

var AccesoMiddleware = require('./middlewares/Acceso');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/usuarios', AccesoMiddleware.Autorizar, usersRouter);
app.use('/cursos',   AccesoMiddleware.Autorizar ,cursosRouter);
app.use('/salones',  AccesoMiddleware.Autorizar, salonesRouter);
app.use('/catalogos', AccesoMiddleware.Autorizar, catalogosRouter);
app.use('/cursos/:id/actividades', AccesoMiddleware.Autorizar, actividadesCursoRouter);
app.use('/cursos/:id/asistentes' , AccesoMiddleware.Autorizar, asistentesCursoRouter);
app.use('/cursos/:id/asistencias', AccesoMiddleware.Autorizar, asistenciasCursoRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
