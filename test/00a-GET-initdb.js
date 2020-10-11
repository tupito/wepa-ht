// https://www.chaijs.com/api/bdd/ (Chai Assertion Library docs)
// https://mochajs.org/ (eg. describe(), it() conventions)
// https://devhints.io/chai (Chai.js cheatsheet)
// https://www.digitalocean.com/community/tutorials/test-a-node-restful-api-with-mocha-and-chai

// https://restfulapi.net/http-status-codes/
// https://www.restapitutorial.com/httpstatuscodes.html
const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

const endpoint = '/initdb'
const token = ''

// OBS!!!: TODO: /initdb will crash if executed twice in the same session
describe('GET /initdb', () => {
  it('should return object array with exact key/value pairs', async () => {
    const res = await chai.request(server).get(endpoint).set('Authorization', token)
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
    expect(res.body[0]).to.have.property('debugMsg', 'OK - Tested DB')
    expect(res.body[1]).to.have.property('debugMsg', 'OK - Synchronized models')
    expect(res.body[2]).to.have.property('debugMsg', 'OK - Inserted example data to DB')
  })
})
