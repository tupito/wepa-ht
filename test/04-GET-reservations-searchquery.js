const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

describe('GET /reservations2?start&end', () => {
  it('should return 3 entries with time period 2020-09-29 19:00:00 - 2020-09-30 13:00:00', async () => {
    const res = await chai.request(server).get('/reservations2?start=2020-09-29 19:00:00&end=2020-09-30 13:00:00')
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
  it('should return 2 entries with time period 2020-09-29 19:00:00 - 2020-09-29 21:00:00', async () => {
    const res = await chai.request(server).get('/reservations2?start=2020-09-29 19:00:00&end=2020-09-29 21:00:00')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(2)
  })
  it('should return 1 entries with time period 2020-09-29 19:00:00 - 2020-09-29 20:00:00', async () => {
    const res = await chai.request(server).get('/reservations2?start=2020-09-29 19:00:00&end=2020-09-29 20:00:00')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(1)
  })
  it('should return 0 entries with time period 2020-09-29 15:00:00 - 2020-09-29 15:00:00', async () => {
    const res = await chai.request(server).get('/reservations2?start=2020-09-29 15:00:00&end=2020-09-29 15:00:00')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(0)
  })
  it('should return error if only start search param is used', async () => {
    const res = await chai.request(server).get('/reservations2?start=2020-09-29 15:00:00')
    expect(res.status).to.equal(400) // 200 OK
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Time query needs both start and end values')
  })
  it('should return error if only end search param is used', async () => {
    const res = await chai.request(server).get('/reservations2?end=2020-09-29 15:00:00')
    expect(res.status).to.equal(400) // 200 OK
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Time query needs both start and end values')
  })
  it('should return 3 entries with serviceproviderid 1', async () => {
    const res = await chai.request(server).get('/reservations2?spid=1')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
  it('should return 2 entries with serviceproviderid 1 and time period 2020-09-29 19:00:00 - 2020-09-29 21:00:00', async () => {
    const res = await chai.request(server).get('/reservations2?spid=1&start=2020-09-29 19:00:00&end=2020-09-29 21:00:00')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
  it('should return 2 entries with clientid 1', async () => {
    const res = await chai.request(server).get('/reservations2?cid=1')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(2)
  })
  it('should return 1 entries with clientid 2', async () => {
    const res = await chai.request(server).get('/reservations2?cid=2')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(1)
  })
  it('should return 2 entries with clientid 1, serviceproviderid 1, between 2020-2021', async () => {
    const res = await chai.request(server).get('/reservations2?cid=1&spid=1&start=2020-01-01 00:00:00&end=2021-01-01 00:00:00')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(2)
  })
  it('should return 0 entries with serviceproviderid 9999999', async () => {
    const res = await chai.request(server).get('/reservations2?spid=9999999')
    expect(res.status).to.equal(200) // 200 OK
    expect(res.body).to.be.an('array').to.have.lengthOf(0)
  })
  it('should not accept wrong parameters', async () => {
    const res = await chai.request(server).get('/reservations2?asdf=1&qwer=2')
    expect(res.status).to.equal(400) // 200 OK
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Unaccepted parameter used')
  })
})
