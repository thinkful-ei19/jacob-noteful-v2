'use strict';

/**
 * DISCLAIMER:
 * The examples shown below are superficial tests which only check the API responses.
 * They do not verify the responses against the data in the database. We will learn
 * how to crosscheck the API responses against the database in a later exercise.
 */
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const knex = require('../knex');
const seedData = require('../db/seed');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Reality Check', () => {

  it('true should be true', () => {
    expect(true).to.be.true;
  });

  it('2 + 2 should equal 4, unless it is 1984 ;-)', () => {
    expect(2 + 2).to.equal(4);
  });

});

describe('Environment', () => {

  it('NODE_ENV should be "test"', () => {
    expect(process.env.NODE_ENV).to.equal('test');
  });

  it('connection should be test database', () => {
    expect(knex.client.connectionSettings.database).to.equal('noteful-test');
  });

});

describe('Basic Express setup', () => {

  describe('Express static', () => {

    it('GET request "/" should return the index page', () => {
      return chai.request(app)
        .get('/')
        .then(function (res) {
          expect(res).to.exist;
          expect(res).to.have.status(200);
          expect(res).to.be.html;
        });
    });

  });

  describe('404 handler', () => {

    it('should respond with 404 when given a bad path', () => {
      return chai.request(app)
        .get('/bad/path')
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });
});

describe('Noteful API', function () {
  before(function () {
    // noop
  });

  beforeEach(function () {
    return seedData();
  });

  afterEach(function () {
    // noop
  });

  after(function () {
    return knex.destroy(); // destroy the connection
  });



  describe('GET /v2/notes', function () {

    it('should return the default of 10 Notes ', function () {
      let count;
      return knex.count()
        .from('notes')
        .then(([result]) => {
          count = Number(result.count);
          return chai.request(app).get('/v2/notes');
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(count);
        });
    });

    it('should return a list with the correct fields', function () {
      const apiPromise = chai.request(app).get('/v2/notes');

      const dbPromise = knex.select().from('notes');
				
      return Promise.all([dbPromise, apiPromise])
        .then(function ([data, res]) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(10);
          expect(data).to.be.a('array');
          expect(data).to.have.length(10);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.include.keys('id', 'title', 'content');
          });
          let iterable = 0;
          data.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.include.keys('id', 'title', 'content');
            expect(item.id).to.equal(res.body[iterable].id);
            expect(item.title).to.equal(res.body[iterable].title);
            expect(item.content).to.equal(res.body[iterable].content);
            iterable++;
          });
        });
    });


    it('should return correct search results for a searchTerm query', function () {
      let res;
      return chai.request(app).get('/v2/notes?searchTerm=gaga')
        .then(function (_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.be.an('object');
          return knex.select().from('notes').where('title', 'like', '%gaga%');
        })
        .then(data => {
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });


    it('should search by folder id', function () {
      const dataPromise = knex.select()
        .from('notes')
        .where('folder_id', 103)
        .orderBy('notes.id');

      const apiPromise = chai.request(app)
        .get('/v2/notes?folderId=103');

      return Promise.all([dataPromise, apiPromise])
        .then(function ([data, res]) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(2);
          expect(res.body[0]).to.be.an('object');
          expect(res.body[0].id).to.equal(data[0].id);
        });
    });


    it('should return an empty array for an incorrect query', function () {
      const apiPromise = chai.request(app)
        .get('/v2/notes?searchTerm=Not%20a%20Valid%20Search');
				
      const dataPromise = knex.select('title').from('notes').where('title', 'Not a Valid Search');
      return Promise.all([dataPromise, apiPromise])
        .then(function ([data, res]) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(0);
          expect(data).to.be.a('array');
          expect(data).to.have.length(0);
        });
    });

  });

  describe('GET /v2/notes/:id', function () {

    it('should return correct notes', function () {
      const dataPromise = knex.select('id').from('notes').where('id', 1000);
      const apiPromise = chai.request(app)
        .get('/v2/notes/1000');
      Promise.all([apiPromise, dataPromise]).then(function ([data, res]) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.keys('id', 'title', 'content');
        expect(res.body.id).to.equal(1000);
        expect(res.body.title).to.equal('5 life lessons learned from cats');
        expect(data).to.be.an('object');
        expect(data).to.include.keys('id', 'title', 'content');
        expect(data.id).to.equal(res.body.id);
        expect(data.title).to.equal(res.body.title);
      });
    });
  });

  describe('POST /v2/notes', function () {

    it('should create and return a new item when provided valid data', function () {
      const newItem = {
        'title': 'The best article about cats ever!',
        'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
        'tags': []
      };
      let body;
      return chai.request(app)
        .post('/v2/notes')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.include.keys('id', 'title', 'content');
          return knex.select().from('notes').where('id', body.id);
        });
    });

    it('should return an error when missing "title" field', function () {
      const newItem = {
        'foo': 'bar'
      };
      // const apiPromise = chai.request(app)
      //   .post('/v2/notes')
      //   .send(newItem)
      //   .catch(err => err.response);
				
      // const dataPromise = knex.insert(newItem).into('notes').catch(err => err.response);

      // Promise.all([apiPromise, dataPromise]).then(([data, res]) => {
      //   expect(res).to.have.status(400);
      //   expect(res).to.be.json;
      //   expect(res.body).to.be.a('object');
      //   console.log(`THE DATA SHOULD BE HERE:${data}`);
      //   expect(res.body.message).to.equal('Missing `title` in request body');
      //   expect(data).to.have.status(500);
      //   expect(data).to.be.a('object');
      //   expect(data.message).to.equal('Missing `title` in request body');
      // });
      return chai.request(app)
        .post('/v2/notes')
        .send(newItem)
        .catch(err => err.response)
        .then(res => {
		  	  expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  describe('PUT /v2/notes/:id', function () {

    it('should update the note', function () {
      const updateItem = {
        'title': 'What about dogs?!',
        'content': 'woof woof',
        'tags': []
      };
      return chai.request(app)
        .put('/v2/notes/1005')
        .send(updateItem)
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'title', 'content');

          expect(res.body.id).to.equal(1005);
          expect(res.body.title).to.equal(updateItem.title);
          expect(res.body.content).to.equal(updateItem.content);
        });
    });

    it('should return an error when missing "title" field', function () {
      const updateItem = {
        'foo': 'bar'
      };
      return chai.request(app)
        .put('/v2/notes/9999')
        .send(updateItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });

  });

  describe('DELETE  /v2/notes/:id', function () {

    it('should delete an item by id', function () {
      return chai.request(app)
        .delete('/v2/notes/1005')
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });
    
  });

});