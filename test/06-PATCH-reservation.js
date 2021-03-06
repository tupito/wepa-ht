const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

const endpoint = '/reservation/1'
let token = ''

describe('PATCH /reservation', () => {
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

  it('should not accept wrong parameters', async () => {
    const faultyReservation = {
      asdf: '2020-10-03 11:00',
      end: '2020-10-03 09:00',
      clientid: 1,
      serviceproviderid: 1,
    }

    /* eslint semi: ["error", "never"] */
    const res = await chai.request(server).patch(endpoint).send(faultyReservation).set('Authorization', token)
    expect(res.status).to.equal(400)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Unaccepted parameter used')
  })

  it('should not accept PATCH resrevation for non-existing reservation id', async () => {
    const reservationAccept = {
      start: '2020-02-01 18:00:00',
      end: '2020-02-01 19:00:00',
      clientid: 1,
      serviceproviderid: 1,
    }

    const res = await chai.request(server).patch('/reservation/9999').send(reservationAccept).set('Authorization', token)
    expect(res.status).to.equal(404) // 201 created
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('debugMsg')
    expect(res.body.debugMsg).to.equal('NOK - Reservation not found')
  })

  it('should not accept PATCH reservation when start is greater than end', async () => {
    const reservationDeny = {
      start: '2021-10-03 11:00:00',
      clientid: 1,
    }
    const res = await chai.request(server).patch(endpoint).send(reservationDeny).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('start should not be greater then end')
  })

  it('should accept PATCH reservation when serviceprovider is free', async () => {
    const reservationAccept = {
      start: '2020-02-01 18:00:00',
      end: '2020-02-01 19:00:00',
      clientid: 1,
      serviceproviderid: 1,
    }

    const res = await chai.request(server).patch(endpoint).send(reservationAccept).set('Authorization', token)
    expect(res.status).to.equal(201) // 201 created
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('debugMsg')
    expect(res.body.debugMsg).to.equal('PATCH success!')
  })

  it('should not accept PATCH reservation when serviceprovider is booked', async () => {
    const reservationDeny = {
      start: '2020-09-30 12:30:00',
      end: '2020-09-30 13:30:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).patch(endpoint).send(reservationDeny).set('Authorization', token)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Client or serviceprovider are booked!')
  })
})
