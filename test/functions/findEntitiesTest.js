// https://github.com/mikhail-angelov/mongo-unit

var assert = require('assert');
const expect = require('chai').expect;

var findEntities = require('../../functions/find-entities').findAllEntities;
var testData = require('../../test/testData').findEntities;
var testEntities = require('../../test/testData').testEntities;


const mongoose = require('mongoose')
const testMongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/test'
mongoose.connect(testMongoUrl)

const mongoUnit = require('mongo-unit')

const EntityDB = require( '../../db/entities' );

async function testFind (name) {
    var x = await new Promise( resolve => { EntityDB.find({'credentials.name': name}).exec( (err, res) => resolve(res) ) } );
    console.log(x);
    return x
}

describe('Find Entities', () => {

 beforeEach(() => mongoUnit.initDb(testMongoUrl, testEntities))
 afterEach(() => mongoUnit.drop())

 // before(() => mongoUnit.start()
 //    .then(url=>daoUT=dao(url))
 //    .then(()=>mongoUnit.load(testData)))
 //
 //  after(() => mongoUnit.drop())

 // it('finds all entities', () => {
 //   return findEntities(testData,'vxiZ8ctagtmsz1gdvnAABt')
 //     .then(entities => {
 //       expect(entities.length).to.equal(1)
 //       expect(entities[0].credentials.fullId).to.equal("Walther Blake #2121")
 //     })
 // })

 it('finds all entities', () => {
   return testFind("Walther Blake")
     .then(entities => {
       expect(entities.length).to.equal(1)
       expect(entities[0].credentials.fullId).to.equal("Walther Blake #2121")
     })
 })

})
