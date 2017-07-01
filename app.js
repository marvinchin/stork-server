import express from 'express';
import path from 'path';
import Debug from 'debug';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import validator from './middleware/validator';
import session from './middleware/session';
import cors from './middleware/cors';
import authenticator from './middleware/authenticator';
import assertAdmin from './middleware/assert-admin';
import config from './config';
import index from './routes/index';
import users from './routes/users';
import books from './routes/books';
import genres from './routes/genres';
import authentication from './routes/authentication';
import admin from './routes/admin';
import trades from './routes/trades';

const debug = Debug('stork-server:app');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
app.use(cors);
app.use(validator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session());
app.use(authenticator);
app.use('/admin', assertAdmin);

app.use('/', index);
app.use('/admin', admin);
app.use('/users', users);
app.use('/books', books);
app.use('/genres', genres);
app.use('/trades', trades);
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
