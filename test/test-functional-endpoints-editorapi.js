'use strict';

import { MongoMemoryServer } from 'mongodb-memory-server';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';

import { server } from '../dist/app.js';
import { sendDocToCollection, createUser } from '../dist/src/db/db-functions.js';

const genericUserName = 'genericUser';
const genericUserId = 'genericId1488242kn2342';
const genericUserName2 = 'genericUser2';
const genericUserId2 = 'genericId2lkn2341lk';

const genericUserToken = jwt.sign(
  { username: genericUserName, userId: genericUserId },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

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
  it('should return a JSON object in body with error information', (done) => {
    chai.request(server)
      .get('/incorrect-url')
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.an('object');
        done();
      });
  });
});

// describe('Editor API', () => {
//   describe('GET /editor-api/document', () => {
//       it(
//         'should return an empty JSON-formatted array of documents before being populated', 
//         (done) => {
//           chai.request(server)
//               .get("/editor-api/document")
//               .set('x-access-token', genericUserToken)
//               .end((err, res) => {
//                   res.should.have.status(200);
//                   res.body.should.be.an("array");
//                   res.body.length.should.be.below(1);
//                   done();
//               });
//       });
//   });

//   describe('POST /editor-api/document', () => {
//       it(
//         'should return a single object representing created document', 
//         (done) => {
//           const testDoc = {
//             'title': 'Pocahontas',
//             'body': 'Wind, leaves and water',
//             'ownerId': genericUserId,
//             'editorIds': [genericUserId2]
//           }

//           chai.request(server)
//               .post("/editor-api/document")
//               .type('application/json')
//               .set('x-access-token', genericUserToken)
//               .send(testDoc)
//               .end((err, res) => {
//                   res.should.have.status(200);
//                   res.body.should.be.an("object");
//                   res.body.id.should.be.an('string');
//                   res.body.title.should.equal(testDoc.title);
//                   res.body.body.should.equal(testDoc.body);

//                   done();
//               });
//       });
//   });

//   describe('GET /editor-api/document/:id', () => {
//     it(
//       'should return object with error message if id is invalid', 
//       (done) => {
//         chai.request(server)
//             .get(`/editor-api/document/4300`)
//             .set('x-access-token', genericUserToken)
//             .end((err, res) => {
//                 res.body.should.be.an('object');
//                 res.body.error.should.be.an('string');
//                 done();
//             });
//     });
//   });

//   describe('GET /editor-api/document/:id', () => {
//     it(
//       'should return object with corresponding id since passed id is valid', 
//       async () => {
//         const testDoc = {
//           'title': 'Pocahontas',
//           'body': 'Wind, leaves and water',
//           'ownerId': genericUserId2,
//           'editorIds': [genericUserId]
//         }
//         const generatedId = await sendDocToCollection('fauxDsn', 'editorDocs', testDoc);

//         const res = await chai.request(server)
//           .get(`/editor-api/document/${generatedId}`)
//           .set('x-access-token', genericUserToken);
//         res.body.should.be.an('object');
//         res.body.title.should.equal(testDoc.title);
//         res.body.body.should.equal(testDoc.body);
//     });
//   });

//   describe('GET /editor-api/document/:id', () => {
//     it(
//       'should return object with error message if id is 24 chars but has no matching doc', 
//       (done) => {
//         chai.request(server)
//             .get(`/editor-api/document/012345678901234567890123`)
//             .set('x-access-token', genericUserToken)
//             .end((err, res) => {
//                 res.body.should.be.an('object');
//                 res.body.error.should.be.an('string');
//                 done();
//             });
//     });
//   });

//   describe('PUT /editor-api/document/:id', () => {
//     it(
//       'should return updated object with corresponding id since passed id is valid ' +
//       'and correct new title/body are included', 
//       async () => {
//         const testDoc = {
//           'title': 'Pocahontas',
//           'body': 'Wind, leaves and water',
//           'ownerId': genericUserId,
//           'editorIds': [genericUserId2]
//         }
//         const generatedId = await sendDocToCollection('fauxDsn', 'editorDocs', testDoc);

//         testDoc.title = 'newtitle';
//         testDoc.body = 'newbody';
//         const res = await chai.request(server)
//           .put(`/editor-api/document/${generatedId}`)
//           .set('x-access-token', genericUserToken)
//           .type('application/json')
//           .send(testDoc);
//         res.body.should.be.an('object');
//         res.body.title.should.equal(testDoc.title);
//         res.body.body.should.equal(testDoc.body);
//     });
//   });
// });
