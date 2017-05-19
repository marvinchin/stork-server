import express from 'express';
import path from 'path';
import Debug from 'debug';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import validator from './middleware/validator';
import session from './middleware/session';
import config from './config';
import index from './routes/index';
import users from './routes/users';
import authentication from './routes/authentication';

const debug = Debug('stork-server:app');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// connect to db
mongoose.connect(config.DB_CONNECTION_STRING, {}, (err) => {
  if (err) {
    debug('Error connecting to mongodb');
  } else {
    debug('Connected to db');
  }
});

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session());

app.use('/', index);
app.use('/users', users);
app.use('/authentication', authentication);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
