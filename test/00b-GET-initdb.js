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
let token = ''

// OBS!!!: TODO: /initdb will crash if executed twice in the same session
describe('GET /initdb', () => {
  before(async () => { // runs once before the first test in this block, get Authorization token
    const loginCredentials = { username: 'bob', password: 'blackLodge' }
    const res = await chai.request(server).post('/login').set('content-type', 'application/x-www-form-urlencoded').send(loginCredentials)
    token = `Bearer ${res.body.token}`
  })

  it('should fail without Authorization token', async () => {
    const res = await chai.request(server).get(endpoint)
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(401)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('name')
    expect(res.body.name).to.equal('UnauthorizedError')
    expect(res.body).to.have.property('message')
    expect(res.body.message).to.equal('No authorization token was found')
  })

  it('should return object array with exact key/value pairs', async () => {
    const res = await chai.request(server).get(endpoint).set('Authorization', token)
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
    expect(res.body[0]).to.have.property('debugMsg', 'OK - Tested DB')
    expect(res.body[1]).to.have.property('debugMsg', 'OK - Synchronized models')
    expect(res.body[2]).to.have.property('debugMsg', 'OK - Inserted example data to DB')
  })
})
