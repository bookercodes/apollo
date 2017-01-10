import * as Hapi from "hapi"
import * as opn from "opn"

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