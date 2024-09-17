import engines from 'consolidate';
import express from 'express';
import cors from 'cors';

import { renderCheckout } from './controllers/checkout.js';
import { getClientToken } from './controllers/client-token.js';
import { createTransaction } from './controllers/transaction.js';

export function configureServer(app) {
  app.engine('html', engines.mustache);
  app.set('view engine', 'html');
  app.set('views', '../shared/views');

  app.enable('strict routing');

  app.use(cors());
  app.use(express.json());

  app.get('/', renderCheckout);
  app.get('/client-token', getClientToken);
  app.post('/transaction', createTransaction);

  app.use(express.static('../../client/html/src'));
}
