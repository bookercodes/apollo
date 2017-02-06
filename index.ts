import * as Hapi from "hapi"
import * as opn from "opn"
import * as Sequelize from "sequelize"

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