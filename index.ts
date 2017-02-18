import * as Hapi from "hapi"
import * as opn from "opn"
import * as Sequelize from "sequelize"
import * as bcrypt from "bcryptjs"
import * as promisify from "pify"
import * as chalk from "chalk"
import * as httpStatusCode from "http-status-codes"
import * as fs from "fs"
import * as dotenv from "dotenv"
import AWS = require("aws-sdk")

AWS.config.update({
  region: 'us-east-1',
  signatureVersion: 'v4',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
})

const s3 = new AWS.S3()

dotenv.config()


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
      console.log(file)
      const contentType = file.hapi.headers['content-type'];
      s3
        .upload({
          Bucket: process.env.BUCKET,
          Key: `${username}/${file.hapi.filename}`,
          Body: file,
          ContentType: contentType
        })
        .promise()
        .catch(err => {
          console.error(err)
          reply(httpStatusCode.INTERNAL_SERVER_ERROR)
        }).then(() => {
          reply(httpStatusCode.OK)
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