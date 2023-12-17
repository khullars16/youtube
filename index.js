const Hapi = require('@hapi/hapi');

// Create a new server instance
const server = Hapi.server({
    port: 3000, // You can change this port as needed
    host: 'localhost',
});

// Define a route
server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        return 'Hello, Hapi!';
    },
});

// Start the server
const start = async () => {
    try {
        await server.start();
        console.log(`Server running at: ${server.info.uri}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// Initialize the server
start();
