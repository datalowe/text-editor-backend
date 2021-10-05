'use strict';

import { MongoMemoryServer } from 'mongodb-memory-server';
import chai from 'chai';
import chaiHttp from 'chai-http';

import { server } from '../dist/app.js';
import { sendDocToCollection, createUser } from '../dist/src/db-functions.js';

let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
});

after(async () => {
    await mongoServer.stop();
});

chai.should();

chai.use(chaiHttp);

describe('user API', () => {
    describe('POST /user/create', () => {
      it(
        'should create a new user when username is >2 chars long and password is >5 chars long', 
        async () => {
          const testUser = {
            'username': 'Pocahontas',
            'password': 'disney'
          };
  
          const res = await chai.request(server)
            .post('/user/register')
            .type('application/json')
            .send(testUser);
          res.body.should.be.an('boolean');
        }
      );
  
      it(
        'should return an error message when username is <3 chars long', 
        async () => {
          const testUser = {
            'username': 'Po',
            'password': 'disney'
          };
  
          const res = await chai.request(server)
            .post('/user/register')
            .type('application/json')
            .send(testUser);
          res.body.should.be.an('object');
          res.body.should.have.property('error');
        }
      );
  
      it(
        'should return an error message when password is <6 chars long', 
        async () => {
          const testUser = {
            'username': 'Pocahontas',
            'password': 'dis'
          };
  
          const res = await chai.request(server)
            .post('/user/register')
            .type('application/json')
            .send(testUser);
          res.body.should.be.an('object');
          res.body.should.have.property('error');
        }
      );
    });
  
    describe('POST /user/login', () => {
      it(
        'should return a JSON token when valid credentials are sent', 
        async () => {
          const testUser = {
            'username': 'Pocahontas',
            'password': 'disney'
          };
  
          await createUser('fauxDsn', testUser);
  
          const res = await chai.request(server)
            .post('/user/login')
            .type('application/json')
            .send(testUser);
  
          res.body.should.be.an('object');
          res.body.should.have.property('token');
        }
      );
    });
  });