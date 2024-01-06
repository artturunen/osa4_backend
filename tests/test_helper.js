const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

const doLogin = async newLogin => {
    const loginRes = await api
        .post('/api/login')
        .send(newLogin)
    return token = 'Bearer ' + loginRes.body.token
}

module.exports = {
    usersInDb,
    doLogin
}