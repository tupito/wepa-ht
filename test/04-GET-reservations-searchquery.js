const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)
let token = ''

describe('GET /reservations?start&end', () => {
  before(async () => { // runs once before the first test in this block, get Authorization token
    const loginCredentials = { username: 'bob', password: 'blackLodge' }
    const res = await chai.request(server).post('/login').set('content-type', 'application/x-www-form-urlencoded').send(loginCredentials)
    token = `Bearer ${res.body.token}`
  })

  it('should fail without Authorization token', async () => {
    const res = await chai.request(server).get('/reservations?start=2020-09-29 19:00:00&end=2020-09-30 13:00:00')

    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(401)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('name')
    expect(res.body.name).to.equal('UnauthorizedError')
    expect(res.body).to.have.property('message')
    expect(res.body.message).to.equal('No authorization token was found')
  })

  it('should return 3 entries with time period 2020-09-29 19:00:00 - 2020-09-30 13:00:00', async () => {
    const res = await chai.request(server).get('/reservations?start=2020-09-29 19:00:00&end=2020-09-30 13:00:00').set('Authorization', token)
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
  it('should return 2 entries with time period 2020-09-29 19:00:00 - 2020-09-29 21:00:00', async () => {
    const res = await chai.request(server).get('/reservations?start=2020-09-29 19:00:00&end=2020-09-29 21:00:00').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(2)
  })
  it('should return 1 entries with time period 2020-09-29 19:00:00 - 2020-09-29 20:00:00', async () => {
    const res = await chai.request(server).get('/reservations?start=2020-09-29 19:00:00&end=2020-09-29 20:00:00').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(1)
  })
  it('should return 0 entries with time period 2020-09-29 15:00:00 - 2020-09-29 15:00:00', async () => {
    const res = await chai.request(server).get('/reservations?start=2020-09-29 15:00:00&end=2020-09-29 15:00:00').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(0)
  })
  it('should return error if only start search param is used', async () => {
    const res = await chai.request(server).get('/reservations?start=2020-09-29 15:00:00').set('Authorization', token)
    expect(res.status).to.equal(400) // 200 OK
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Time query needs both start and end values')
  })
  it('should return error if only end search param is used', async () => {
    const res = await chai.request(server).get('/reservations?end=2020-09-29 15:00:00').set('Authorization', token)
    expect(res.status).to.equal(400) // 200 OK
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Time query needs both start and end values')
  })
  it('should return 3 entries with serviceproviderid 1', async () => {
    const res = await chai.request(server).get('/reservations?spid=1').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
  it('should return 2 entries with serviceproviderid 1 and time period 2020-09-29 19:00:00 - 2020-09-29 21:00:00', async () => {
    const res = await chai.request(server).get('/reservations?spid=1&start=2020-09-29 19:00:00&end=2020-09-29 21:00:00').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
  it('should return 2 entries with clientid 1', async () => {
    const res = await chai.request(server).get('/reservations?cid=1').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(2)
  })
  it('should return 1 entries with clientid 2', async () => {
    const res = await chai.request(server).get('/reservations?cid=2').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(1)
  })
  it('should return 2 entries with clientid 1, serviceproviderid 1, between 2020-2021', async () => {
    const res = await chai.request(server).get('/reservations?cid=1&spid=1&start=2020-01-01 00:00:00&end=2021-01-01 00:00:00').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(2)
  })
  it('should return 0 entries with serviceproviderid 9999999', async () => {
    const res = await chai.request(server).get('/reservations?spid=9999999').set('Authorization', token)
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(0)
  })
  it('should not accept wrong parameters', async () => {
    const res = await chai.request(server).get('/reservations?asdf=1&qwer=2').set('Authorization', token)
    expect(res.status).to.equal(400) // 200 OK
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Unaccepted parameter used')
  })
})
