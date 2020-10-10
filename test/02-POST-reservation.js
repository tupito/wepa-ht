const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

const endpoint = '/reservation'
let token = ''

describe('POST /reservation', () => {
  before(async () => { // runs once before the first test in this block, get Authorization token
    const loginCredentials = { username: 'bob', password: 'blackLodge' }
    const res = await chai.request(server).post('/login').set('content-type', 'application/x-www-form-urlencoded').send(loginCredentials)
    token = `Bearer ${res.body.token}`
  })

  it('should fail without Authorization token', async () => {
    const reservationAccept = {
      start: '2020-10-03 08:00',
      end: '2020-10-03 10:00',
      clientid: 1,
      serviceproviderid: 1,
    }

    const res = await chai.request(server).post(endpoint).send(reservationAccept)

    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(401)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('name')
    expect(res.body.name).to.equal('UnauthorizedError')
    expect(res.body).to.have.property('message')
    expect(res.body.message).to.equal('No authorization token was found')
  })

  it('should not accept POST reservation without start', async () => {
    const faultyReservation = {
      end: '2020-10-03 11:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).post(endpoint).send(faultyReservation).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('start undefined')
  })

  it('should not accept POST reservation without end', async () => {
    const faultyReservation = {
      start: '2020-10-03 11:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).post(endpoint).send(faultyReservation).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('end undefined')
  })

  it('should not accept POST reservation without clientid', async () => {
    const faultyReservation = {
      start: '2020-10-03 09:00',
      end: '2020-10-03 11:00',
      serviceproviderid: 1,
    }
    const res = await chai.request(server).post(endpoint).send(faultyReservation).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('clientid undefined')
  })

  it('should not accept POST reservation without serviceproviderid', async () => {
    const faultyReservation = {
      start: '2020-10-03 09:00',
      end: '2020-10-03 11:00',
      clientid: 1,
    }
    const res = await chai.request(server).post(endpoint).send(faultyReservation).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('serviceproviderid undefined')
  })

  it('should not accept POST reservation when start is greater than end', async () => {
    const reservationDeny = {
      start: '2020-10-03 11:00',
      end: '2020-10-03 09:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).post(endpoint).send(reservationDeny).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('start should not be greater then end')
  })

  it('should accept POST reservation when serviceprovider is free', async () => {
    const reservationAccept = {
      start: '2020-10-03 08:00',
      end: '2020-10-03 10:00',
      clientid: 1,
      serviceproviderid: 1,
    }

    const res = await chai.request(server).post(endpoint).send(reservationAccept).set('Authorization', token)
    expect(res.status).to.equal(201) // 201 created
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('debugMsg')
    expect(res.body.debugMsg).to.equal('INSERT success!')
  })

  it('should not accept POST reservation when serviceprovider is booked', async () => {
    const reservationDeny = {
      start: '2020-10-03 09:00',
      end: '2020-10-03 11:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).post(endpoint).send(reservationDeny).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Client or serviceprovider are booked!')
  })
})
