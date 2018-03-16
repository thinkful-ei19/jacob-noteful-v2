'use strict';

const express = require('express');

const knex = require('../knex');

// Create an router instance (aka "mini-app")
const router = express.Router();

router.get('/folders', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

/* ========== GET/READ SINGLE FOLDERS ========== */
router.get('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  
  knex
    .select()
    .from('folders')
    .first()
    .where(function () {
      if(folderId) {
        this.where('id', folderId);
      } else {
        next();
      }
    })
    .then(folder => {
      res.json(folder);
    })
    .catch(err => next(err));
});
  

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/folders/:id', (req, res, next) => {
  const foldersId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  
  updateObj.name = req.body.name;
  /***** Never trust users - validate input *****/
  if (!req.body.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  knex
    .select()
    .from('folders')
    .where(function () {
      if(foldersId) {
        this.where('id', foldersId);
      } else {
        return next();
      }
    })
    .update(updateObj)
    .returning('name')
    .then(folder => {
      res.json(folder);
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE ITEM ========== */
router.post('/folders', (req, res, next) => {
  const { name } = req.body;
    
  const newItem = { name };
  /***** Never trust users - validate input *****/
  if (!newItem.name) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  knex
    .insert(newItem)
    .into('folders')
    .then(
      res.location(`http://${req.headers.host}/folders/${newItem.id}`).status(201).json(newItem)
    )
    .catch(err => next(err));
});
  
/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;
  
  knex
    .select()
    .from('folders')
    .where(function () {
      if(id) {
        this.where('id', id);
      } else {
        return next();
      }
    })
    .del()
    .then(function () {
      res.status(204).end();
    })
    .catch(err => next(err));
});

module.exports = router;