'use strict';
const express = require('express');

const knex = require('../knex');

const router = express.Router();

/* ========== GET/READ ALL TAGS ========== */
router.get('/tags', (req, res, next) => {
  knex.select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

/* ========== GET/READ SINGLE TAGS ========== */
router.get('/tags/:id', (req, res, next) => {
  const tagId = req.params.id;
    
  knex
    .select()
    .from('tags')
    .first()
    .where(function () {
      if(tagId) {
        this.where('id', tagId);
      } else {
        next();
      }
    })
    .then(tag => {
      res.json(tag);
    })
    .catch(err => next(err));
});

/* ========== POST/CREATE ITEM ========== */
router.post('/tags', (req, res, next) => {
  const { name } = req.body;
  
  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  
  const newItem = { name };
  
  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/tags/:id', (req, res, next) => {
  const tagsId = req.params.id;
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
    .from('tags')
    .where(function () {
      if(tagsId) {
        this.where('id', tagsId);
      } else {
        return next();
      }
    })
    .update(updateObj)
    .returning('name')
    .then(tag => {
      res.json(tag);
    })
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/tags/:id', (req, res, next) => {
  const id = req.params.id;
    
  knex
    .select()
    .from('tags')
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