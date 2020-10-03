// https://www.chaijs.com/api/bdd/ (Chai Assertion Library docs)
// https://mochajs.org/ (eg. describe(), it() conventions)
// https://devhints.io/chai (Chai.js cheatseet)
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

  it('should return array with length of 3 (example data)', () => {
    /* eslint semi: ["error", "never"] */
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array').to.have.lengthOf(3)
  })

  it('should have array items with right properties', () => {
    /* eslint semi: ["error", "never"] */

    res.body.forEach((item) => {
      // TODO: poor implementation, refactor to use model
      expect(item).to.have.keys(['id', 'start', 'end', 'clientid', 'serviceproviderid', 'createdAt', 'updatedAt', 'clientId', 'serviceProviderId', 'client', 'serviceProvider'])
    })
  })
})
