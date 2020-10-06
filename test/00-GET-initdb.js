// https://www.chaijs.com/api/bdd/ (Chai Assertion Library docs)
// https://mochajs.org/ (eg. describe(), it() conventions)
// https://devhints.io/chai (Chai.js cheatseet)
const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

const endpoint = '/initdb'

let res

// OBS!!!: TODO: /initdb will crash if executed twice in the same session
describe('GET /initdb', () => {
  before(async () => { // runs once before the first test in this block
    res = await chai.request(server).get(endpoint)
  })

  it('should return object array with length of 3', () => {
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
    expect(res.body[0]).to.have.property('debugMsg', 'OK - Tested DB')
    expect(res.body[1]).to.have.property('debugMsg', 'OK - Synchronized models')
    expect(res.body[2]).to.have.property('debugMsg', 'OK - Inserted example data to DB')
  })

  it('should return object array with exact key/value pairs', () => {
    /* eslint semi: ["error", "never"] */
    expect(res.body[0]).to.have.property('debugMsg', 'OK - Tested DB')
    expect(res.body[1]).to.have.property('debugMsg', 'OK - Synchronized models')
    expect(res.body[2]).to.have.property('debugMsg', 'OK - Inserted example data to DB')
  })
})
