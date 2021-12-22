'use strict';

import { MongoMemoryServer } from 'mongodb-memory-server';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';

import { server } from '../dist/app.js';
import { sendDocToCollection, createUser } from '../dist/src/db/db-functions.js';

const genericUserName = 'genericUser';
const genericUserPassword = 'genericPassword';
const genericUserId = '615f496217969eef62fac69d';

const genericUser = {
  'username': genericUserName,
  'password': genericUserPassword
};

const genericUserToken = jwt.sign(
  genericUser,
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const genericDoc = {
  'title': 'Pocahontas',
  'body': 'Wind, leaves and water',
  'ownerId': genericUserId,
  'editorIds': []
};

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

describe('invalid URL', () => {
  it('returns a JSON object in body with error information', (done) => {
    chai.request(server)
      .get('/incorrect-url')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.an('object');
        done();
      });
  });
});

describe('Editor API', () => {
  describe('GET /editor-api/graphql', () => {
      it(
        'returns an error if x-access-token is missing', 
        async () => {
          const res = await chai.request(server)
              .get("/editor-api/graphql");
          res.body.should.be.an('object');
          res.body.should.have.property('authentication_error');
      });

      it(
        'returns an error if x-access-token is invalid', 
        async () => {
          const res = await chai.request(server)
              .get("/editor-api/graphql")
              .set('x-access-token', 'invalid');
          res.body.should.be.an('object');
          res.body.should.have.property('authentication_error');
      });

      it(
        'returns all editors if token is valid', 
        async () => {
          await createUser('fauxDsn', genericUser);
          const reqObj = {
            query: `{
            editors {
                username
                id
            }
          }`}
          const reqBody = JSON.stringify(reqObj);
          const res = await chai.request(server)
              .get("/editor-api/graphql")
              .send(reqBody)
              .type('application/json')
              .set('x-access-token', genericUserToken);

          res.body.should.be.an('object');
          res.body.should.have.property('data');
          expect(res.body.data.editors.length).to.equal(1);
      });
  });

  describe("GET /editor-api/document/:id/pdf", () => {
    it('returns an error if a nonexisting document is requested', async () => {
      const genUserId = await createUser('fauxDsn', genericUser);

      const genUToken = jwt.sign(
        {...genericUser, userId: genUserId},
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const res = await chai.request(server)
          .get(`/editor-api/document/1/pdf`)
          .set('x-access-token', genUToken);

      res.body.should.be.an('object');
      res.body.should.have.property('error');
    });

    it('returns a PDF if valid document is requested', async () => {
      const genUserId = await createUser('fauxDsn', genericUser);
      const generD = {
        ...genericDoc,
        ownerId: genUserId
      }
      const generatedId = await sendDocToCollection('fauxDsn', 'editorDocs', generD);

      const genUToken = jwt.sign(
        {...genericUser, userId: genUserId},
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const res = await chai.request(server)
          .get(`/editor-api/document/${generatedId}/pdf`)
          .set('x-access-token', genUToken);

      res.body.should.be.an('object');
      expect(res).to.have.header('content-type', 'application/pdf');
    })
  });
});
