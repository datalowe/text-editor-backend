process.env.NODE_ENV = 'test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import chai from 'chai';
import chaiHttp from 'chai-http';
import assert from 'assert';

import { server } from '../app.mjs';
import { sendDocToCollection } from '../src/db-functions.mjs';

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

describe('Editor API', () => {
  describe('GET /editor-api/document', () => {
      it(
        'should return an empty JSON-formatted array of documents before being populated', 
        (done) => {
          chai.request(server)
              .get("/editor-api/document")
              .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.an("array");
                  res.body.length.should.be.below(1);
                  done();
              });
      });
  });

  describe('POST /editor-api/document', () => {
      it(
        'should return a single object representing created document', 
        (done) => {
          const testDoc = {
            'title': 'Pocahontas',
            'body': 'Wind, leaves and water'
          }
          chai.request(server)
              .post("/editor-api/document")
              .type('application/json')
              .send(testDoc)
              .end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.an("object");
                  res.body._id.should.be.an('string');
                  res.body.title.should.equal(testDoc.title);
                  res.body.body.should.equal(testDoc.body);

                  done();
              });
      });
  });

  describe('GET /editor-api/document/:id', () => {
    it(
      'should return object with error message if id is invalid', 
      (done) => {
        chai.request(server)
            .get(`/editor-api/document/4300`)
            .end((err, res) => {
                res.body.should.be.an('object');
                res.body.error.should.be.an('string');
                done();
            });
    });
  });

  describe('GET /editor-api/document/:id', () => {
    it(
      'should return object with corresponding _id since passed id is valid', 
      async () => {
        const testDoc = {
            'title': 'Pocahontas',
            'body': 'Wind, leaves and water'
        }
        const testIdObj = await sendDocToCollection('fauxDsn', 'editorDocs', testDoc);

        const res = await chai.request(server).get(`/editor-api/document/${testIdObj._id}`)
        res.body.should.be.an('object');
        res.body.title.should.equal(testDoc.title);
        res.body.body.should.equal(testDoc.body);
    });
  });

  describe('GET /editor-api/document/:id', () => {
    it(
      'should return object with error message if id is 24 chars but has no matching doc', 
      (done) => {
        chai.request(server)
            .get(`/editor-api/document/012345678901234567890123`)
            .end((err, res) => {
                res.body.should.be.an('object');
                res.body.error.should.be.an('string');
                done();
            });
    });
  });

  describe('PUT /editor-api/document/:id', () => {
    it(
      'should return updated object with corresponding _id since passed id is valid ' +
      'and correct new title/body are included', 
      async () => {
        const testDoc = {
            'title': 'Pocahontas',
            'body': 'Wind, leaves and water'
        }
        const testIdObj = await sendDocToCollection('fauxDsn', 'editorDocs', testDoc);

        testDoc.title = 'newtitle';
        testDoc.body = 'newbody';
        const res = await chai.request(server)
          .put(`/editor-api/document/${testIdObj._id}`)
          .type('application/json')
          .send(testDoc);
        res.body.should.be.an('object');
        res.body.title.should.equal(testDoc.title);
        res.body.body.should.equal(testDoc.body);
    });
  });

});