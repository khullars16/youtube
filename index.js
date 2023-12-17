// const sequelize = new Sequelize('ball_bucket', 'root', 'Qwerty@123', {
//   host: 'localhost',
//   dialect: 'mysql',
// });

const Hapi = require('@hapi/hapi');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with MySQL
const sequelize = new Sequelize('ball_bucket', 'root', 'Qwerty@123', {
  host: 'localhost',
  dialect: 'mysql',
});

// Define Sequelize models
const Bucket = sequelize.define('Bucket', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  volume: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  emptyVolume: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

const Ball = sequelize.define('Ball', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  volume: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

const BucketBall = sequelize.define('BucketBall', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// // Establish associations
// Bucket.belongsToMany(Ball, { through: BucketBall });
// Ball.belongsToMany(Bucket, { through: BucketBall });

// Set up Hapi server
const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  // Define routes
  server.route({
    method: 'POST',
    path: '/buckets',
    handler: createBucketHandler,
  });

  server.route({
    method: 'POST',
    path: '/balls',
    handler: createBallHandler,
  });

  server.route({
    method: 'POST',
    path: '/place-balls',
    handler: placeBallsInBucketHandler,
  });

  server.route({
    method: 'GET',
    path: '/buckets-info',
    handler: getBucketsInfoHandler,
  });
  await sequelize.sync();
  // Start the server
  await server.start();
  console.log('Server running on %s', server.info.uri);
};

// Handle requests to create a bucket
const createBucketHandler = async (request, h) => {
  try {
    const { name, volume } = request.payload;
    const bucket = await Bucket.create({ name, volume, emptyVolume: volume });
    return bucket;
  } catch (error) {
    return h.response(error).code(500);
  }
};

// Handle requests to create a ball
const createBallHandler = async (request, h) => {
  try {
    const { name, volume, quantity } = request.payload;
    const ball = await Ball.create({ name, volume, quantity });
    return ball;
  } catch (error) {
    return h.response(error).code(500);
  }
};

// Handle requests to place balls in a bucket
const placeBallsInBucketHandler = async (request, h) => {
  try {
    const { bucketId, ballId } = request.payload;
    const bucket = await Bucket.findByPk(bucketId);
    const ball = await Ball.findByPk(ballId);

    if (!bucket || !ball) {
      return h.response('Bucket or Ball not found').code(404);
    }

    if (bucket.emptyVolume >= ball.quantity) {
      // Create or update the BucketBall entry
      const [bucketBall, created] = await BucketBall.findOrCreate({
        where: { BucketId: bucketId, BallId: ballId },
        defaults: { quantity: ball.quantity },
      });

      // Reduce empty volume in the bucket
      await bucket.update({ emptyVolume: bucket.emptyVolume - ball.quantity });

      // Fetch the updated state of the buckets and balls
      const updatedBucket = await Bucket.findByPk(bucketId, { include: [BucketBall] });
      const updatedBalls = await Ball.findAll();

      return {
        message: `Placed ${ball.quantity} balls in Bucket ${bucketId}.`,
        updatedBucket,
        updatedBalls,
      };
    } else {
      return 'Not enough space in the bucket.';
    }
  } catch (error) {
    return h.response(error).code(500);
  }
};

// Handle requests to get information about balls in each bucket
const getBucketsInfoHandler = async (request, h) => {
  try {
    // Fetch all buckets with associated ball information
    const bucketsInfo = await Bucket.findAll({
      include: [
        {
          model: Ball,
          attributes: ['id', 'name', 'quantity'],
          through: { attributes: ['quantity'] },
        },
      ],
    });

    return bucketsInfo;
  } catch (error) {
    return h.response(error).code(500);
  }
};

// Initialize the server
init();
