import * as Hapi from "hapi"
import * as opn from "opn"
import * as Sequelize from "sequelize"
import * as bcrypt from "bcryptjs"
import * as promisify from "pify"
import * as chalk from "chalk"
import * as httpStatusCode from "http-status-codes"
import * as fs from "fs"

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

server.route({
  method: "POST",
  path: "/api/users",
  handler: async function (request, reply) {
    try {
      await User.create({
        ...request.payload
      })
      reply(httpStatusCode.CREATED)
    } catch (error) {
      reply(httpStatusCode.BAD_REQUEST)
    }
  }
})

server.route({
  method: "POST",
  path: "/{username}/files",
  config: {
    payload: {
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    handler: async function (request, reply) {
      if (!request.payload) {
        return reply("payload is empty").code(httpStatusCode.BAD_REQUEST)
      }
      const {file} = request.payload
      if(!file){
        return reply("no key file").code(httpStatusCode.BAD_REQUEST)
      }
      const {username} = request.params
      const path = `${__dirname}/uploads/${username}/`
      if (!fs.existsSync(path)){
        fs.mkdirSync(path)
      }
      const stream = fs.createWriteStream(`${path}/${file.hapi.filename}`);
      file.on('error', function (error) { 
        console.error(`Oh no! An occured when writing file: ${chalk.bgRed(error)}`)
      })
      file.pipe(stream)
      file.on('end', function (err) { 
        if (err) {
          return reply(400)
        }
        reply(201)
      })
    }
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
    type: Sequelize.STRING,
    unique: true
  },
  password: {
    type: Sequelize.TEXT
  }
}, {
    hooks: {
      async beforeCreate(user) {
        const hash = await promisify(bcrypt.hash)(user.dataValues.password, 10)
        user.dataValues.password = hash
      }
    }
  })

connection.sync({
  force: true
})

process.on("unhandledRejection", reason => {
  console.error(`Oh no! An unhandled promise rejection occured: ${chalk.bgRed(reason)}`)
})