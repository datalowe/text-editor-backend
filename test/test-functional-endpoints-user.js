'use strict';

import { MongoMemoryServer } from 'mongodb-memory-server';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';

import { server } from '../dist/app.js';
import { sendDocToCollection, createUser } from '../dist/src/db/db-functions.js';

let mongoServer;

const genericUserName = 'genericUser';
const genericUserId = 'genericId1488242kn2342';

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
    describe('POST /user/register', () => {
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
          res.body.should.be.an('object');
          res.body.should.have.property('success');
        }
      );

      it(
        'produces error if request has invalid invitation token', 
        async () => {
          const testUser = {
            'username': 'Pocahontas',
            'password': 'disney'
          };
  
          const res = await chai.request(server)
            .post('/user/register')
            .type('application/json')
            .send({...testUser, 'invitation_code': '33'});
          res.body.should.be.an('object');
          res.body.should.have.property('error');
        }
      );

      it(
        'creates user if request has valid invitation token', 
        async () => {
          const testUser = {
            'username': 'Pocahontas',
            'password': 'disney'
          };
          const testDoc = {
            'title': 'Pocahontas',
            'body': 'Wind, leaves and water',
            'ownerId': genericUserId,
            'editorIds': []
          }
          const generatedId = await sendDocToCollection('fauxDsn', 'editorDocs', testDoc);
          const invitationCode = jwt.sign(
            {
                inviterId: genericUserId,
                inviteeEmail: 'foo@bar.com',
                docId: generatedId
            },
            process.env.DOC_INVITE_SECRET,
            { expiresIn: '7d' }
          );
  
          const res = await chai.request(server)
            .post('/user/register')
            .type('application/json')
            .send({...testUser, 'invitation_code': invitationCode});
          res.body.should.be.an('object');
          res.body.should.have.property('success');
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

      it(
        'should return an error when invalid credentials are sent', 
        async () => {
          const testUser = {
            'username': 'foo',
            'password': 'bar'
          };
  
          const res = await chai.request(server)
            .post('/user/login')
            .type('application/json')
            .send(testUser);
  
          res.body.should.be.an('object');
          res.body.should.have.property('error');
        }
      );

      it(
        'should return an error when non-existent username/password are sent', 
        async () => {
          const testUser = {
            'username': 'foofoo',
            'password': 'barbar'
          };
  
          const res = await chai.request(server)
            .post('/user/login')
            .type('application/json')
            .send(testUser);
  
          res.body.should.be.an('object');
          res.body.should.have.property('error');
        }
      );
    });

    describe('GET /user/list', () => {
      it('produces error if user has no token header',
      async () => {
        const testUser = {
          'username': 'foofoo',
          'password': 'barbar'
        };

        const res = await chai.request(server)
          .get('/user/list')
          .type('application/json')
          .send(testUser);

        res.body.should.be.an('object');
        res.body.should.have.property('authentication_error');
      });

      it('produces error if user has invalid token header',
      async () => {
        const testUser = {
          'username': 'foofoo',
          'password': 'barbar'
        };

        const res = await chai.request(server)
          .get('/user/list')
          .set('x-access-token', 'invalid token')
          .type('application/json')
          .send(testUser);

        res.body.should.be.an('object');
        res.body.should.have.property('authentication_error');
      });

      it('returns all usernames if user has valid token header',
      async () => {
        const testUser = {
          'username': 'Pocahontas',
          'password': 'disney'
        };

        await createUser('fauxDsn', testUser);

        const loginRes = await chai.request(server)
          .post('/user/login')
          .type('application/json')
          .send(testUser);

        const res = await chai.request(server)
          .get('/user/list')
          .set('x-access-token', loginRes.body.token)
          .type('application/json')
          .send(testUser);

        res.body.should.be.an('object');
        res.body.should.have.property('usernames');
      });
    });
  });