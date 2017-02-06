import * as Hapi from "hapi"
import * as opn from "opn"
import * as Sequelize from "sequelize"
import * as bcrypt from "bcryptjs"
import * as pify from "pify"

const server = new Hapi.Server()
const port = 3000
server.connection({
  port
})

server.route({
  method: "GET",
  path: "/",
  handler: function (request, reply) {
    reply("Hello")
  }
})

server.start(error => {
  if (error) {
    console.error(error)
  } else {
    const address = `http://localhost:${port}`
    console.log(`🚀 Server running ${address}`)
    opn(address)
  }
})

const connection = new Sequelize("apollo_schema", "root", "")

interface UserAttributes {
  username: string,
  password: string
}

interface UserInstance extends Sequelize.Instance<UserAttributes> {
  dataValues: UserAttributes
}

const User = connection.define<UserInstance, UserAttributes>("user", {
  username: {
    type: Sequelize.STRING
  },
  password: { 
    type: Sequelize.TEXT
  }
}, {
  hooks: {
    beforeCreate (user)  {
      const genSalt = pify(bcrypt.genSalt)
      const hash = pify(bcrypt.hash)
      // Asynchronously hash the password before saving it
      return genSalt(10).then(function (salt) {
        return hash(user.dataValues.password, salt).then(function (hash) {
          user.dataValues.password = hash
        })
      })
    }
  }
})

connection.sync({
  force: true
}).then(function () {
  return User.create({
    username: "username",
    password: "password"
  })
}).then(function (user) {
})