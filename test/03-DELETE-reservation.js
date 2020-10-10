const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)
let token = ''

describe('DELETE/:id', () => {
  before(async () => { // runs once before the first test in this block, get Authorization token
    const loginCredentials = { username: 'bob', password: 'blackLodge' }
    const res = await chai.request(server).post('/login').set('content-type', 'application/x-www-form-urlencoded').send(loginCredentials)
    token = `Bearer ${res.body.token}`
  })

  it('should fail without Authorization token', async () => {
    const res = await chai.request(server).delete('/reservation/4')

    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(401)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('name')
    expect(res.body.name).to.equal('UnauthorizedError')
    expect(res.body).to.have.property('message')
    expect(res.body.message).to.equal('No authorization token was found')
  })

  it('should DELETE a reservation with given id (the reservation created by "npm test" before)', async () => {
    const res = await chai.request(server).delete('/reservation/4').set('Authorization', token)
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('debugMsg')
    expect(res.body.debugMsg).to.equal('DELETE success!')
  })

  it('should not DELETE a reservation with non-existing id)', async () => {
    const res = await chai.request(server).delete('/reservation/1000').set('Authorization', token)
    expect(res.status).to.equal(404) // 404 Not Found
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Nothing to DELETE!')
  })

  it('should not accept string as a parameter)', async () => {
    const res = await chai.request(server).delete('/reservation/asdf').set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('type of asdf is not number')
  })
})
