const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

let token = '' // needed for api calls after successfull authentication

// should accept api calls after authentication

describe('authentication', () => {
  it('should not accept /authtest without authentication', async () => {
    const res = await chai.request(server).get('/authtest')
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(401)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('name')
    expect(res.body.name).to.equal('UnauthorizedError')
    expect(res.body).to.have.property('message')
    expect(res.body.message).to.equal('No authorization token was found')
    /*
    TODO: TEST EVERY ROUTE
    */
  })

  it('should not accept /login with wrong credentials', async () => {
    const wrongCredentials = {
      username: 'bob',
      password: 'whiteLodge',
    }
    const res = await chai.request(server).post('/login').set('content-type', 'application/x-www-form-urlencoded').send(wrongCredentials)
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(401)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('success')
    expect(res.body.success).to.equal(false)
    expect(res.body).to.have.property('token')
    expect(res.body.token).to.equal(null)
    expect(res.body).to.have.property('err')
    expect(res.body.err).to.equal('Username or password is incorrect')
  })

  it('should accept /login with right credentials', async () => {
    const rightCredentials = {
      username: 'bob',
      password: 'blackLodge',
    }
    const res = await chai.request(server).post('/login').set('content-type', 'application/x-www-form-urlencoded').send(rightCredentials)
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('success')
    expect(res.body.success).to.equal(true)
    expect(res.body).to.have.property('token')
    expect(res.body.token).to.not.equal(null)
    expect(res.body).to.have.property('err')
    expect(res.body.err).to.equal(null)
    token = `Bearer ${res.body.token}`
  })

  it('should accept /authtest after successfull authentication', async () => {
    const res = await chai.request(server).get('/authtest').set('Authorization', token)
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200)
    expect(res.text).to.equal('You are authenticated')
  })
})
