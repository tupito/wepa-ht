const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

const endpoint = '/reservation/1'

describe('PUT /reservation', () => {
  it('should not accept PUT reservation without start', async () => {
    const faultyReservation = {
      end: '2020-10-03 11:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).put(endpoint).send(faultyReservation)
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('start undefined')
  })

  it('should not accept PUT reservation without end', async () => {
    const faultyReservation = {
      start: '2020-10-03 11:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).put(endpoint).send(faultyReservation)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('end undefined')
  })

  it('should not accept PUT reservation without clientid', async () => {
    const faultyReservation = {
      start: '2020-10-03 09:00',
      end: '2020-10-03 11:00',
      serviceproviderid: 1,
    }
    const res = await chai.request(server).put(endpoint).send(faultyReservation)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('clientid undefined')
  })

  it('should not accept PUT reservation without serviceproviderid', async () => {
    const faultyReservation = {
      start: '2020-10-03 09:00',
      end: '2020-10-03 11:00',
      clientid: 1,
    }
    const res = await chai.request(server).put(endpoint).send(faultyReservation)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('serviceproviderid undefined')
  })

  it('should not accept PUT reservation when start is greater than end', async () => {
    const reservationDeny = {
      start: '2020-10-03 11:00',
      end: '2020-10-03 09:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).put(endpoint).send(reservationDeny)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('start should not be greater then end')
  })

  it('should accept PUT reservation when serviceprovider is free', async () => {
    const reservationAccept = {
      start: '2020-01-01 18:00:00',
      end: '2020-01-01 19:00:00',
      clientid: 1,
      serviceproviderid: 1,
    }

    const res = await chai.request(server).put(endpoint).send(reservationAccept)
    expect(res.status).to.equal(201) // 201 created
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('debugMsg')
    expect(res.body.debugMsg).to.equal('PUT success!')
  })

  it('should not accept PUT reservation when serviceprovider is booked', async () => {
    const reservationDeny = {
      start: '2020-09-29 19:30:00',
      end: '2020-09-29 20:30:00',
      clientid: 2,
      serviceproviderid: 1,
    }
    const res = await chai.request(server).put(endpoint).send(reservationDeny)
    expect(res.status).to.equal(400) // 400 Bad request
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('errorMsg')
    expect(res.body.errorMsg).to.equal('Client or serviceprovider are booked!')
  })
})
