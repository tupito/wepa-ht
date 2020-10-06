const chai = require('chai')
const chaiHttp = require('chai-http')
const { expect } = require('chai')
const server = require('../app')

chai.use(chaiHttp)

const endpoint = '/reservations'

let res

describe('GET /reservations', () => {
  before(async () => { // runs once before the first test in this block
    res = await chai.request(server).get(endpoint)
  })

  it('should return all reservations (3 x demoreservations)', () => {
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })
})
