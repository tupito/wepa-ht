const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

const endpoint = '/reservations'
let token = ''

describe('GET /reservations', () => {
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

  it('should return all reservations (3 x demoreservations)', async () => {
    const res = await chai.request(server).get(endpoint).set('Authorization', token)
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
})
