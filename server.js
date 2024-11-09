// Import required modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Joi = require('joi');
const winston = require('winston');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Initialize the Express application
const app = express();

// Setup Redis client for caching
const client = redis.createClient();
client.on('error', (err) => {
    console.log('Redis error: ' + err);
});

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(helmet()); // Secure HTTP headers

// Setup Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ],
});

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all requests
app.use(limiter);

// Swagger API Documentation Setup
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Bharat DeFi API',
            description: 'API for suggesting government schemes',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:5000',
            },
        ],
    },
    apis: ['./server.js'], // Path to the API docs
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Sample data for government schemes (mocked data for now)
const schemes = [
    {
        "name": "Pradhan Mantri Awas Yojana",
        "description": "Affordable housing for low-income groups",
        "minAge": 18,
        "maxAge": 60,
        "minIncome": 0,
        "maxIncome": 500000,
        "state": "All"
    },
    {
        "name": "Mudra Yojana",
        "description": "Provides financial support for small businesses",
        "minAge": 18,
        "maxAge": 50,
        "minIncome": 100000,
        "maxIncome": 1000000,
        "state": "All"
    },
    {
        "name": "PM Kisan Yojana",
        "description": "Financial assistance to farmers",
        "minAge": 18,
        "maxAge": 70,
        "minIncome": 0,
        "maxIncome": 500000,
        "state": "All"
    }
];

// Define a schema for validating the user input
const schemeValidationSchema = Joi.object({
    age: Joi.number().integer().min(18).max(100).required(),
    income: Joi.number().integer().min(0).required(),
    state: Joi.string().min(2).max(50).required(),
});

/**
 * @swagger
 * /suggest-scheme:
 *   post:
 *     description: Suggest government schemes based on user details.
 *     parameters:
 *       - in: body
 *         name: body
 *         description: User information.
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - age
 *             - income
 *             - state
 *           properties:
 *             age:
 *               type: integer
 *               example: 25
 *             income:
 *               type: integer
 *               example: 500000
 *             state:
 *               type: string
 *               example: "Delhi"
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid input
 */

// Endpoint to suggest schemes based on age, income, and state
app.post('/suggest-scheme', (req, res) => {
    logger.info('Received a request to suggest schemes');
    
    // Validate user input
    const { error } = schemeValidationSchema.validate(req.body);
    if (error) {
        logger.error(`Invalid input: ${error.details[0].message}`);
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { age, income, state } = req.body;
    const cacheKey = `scheme_${age}_${income}_${state}`;

    // Check if the response is cached
    client.get(cacheKey, (err, cachedResponse) => {
        if (cachedResponse) {
            logger.info('Returning cached response');
            return res.json(JSON.parse(cachedResponse)); // Return the cached response
        }

        // If not cached, compute the response and store it in cache
        const matchingSchemes = schemes.filter(scheme => {
            const isAgeValid = age >= scheme.minAge && age <= scheme.maxAge;
            const isIncomeValid = income >= scheme.minIncome && income <= scheme.maxIncome;
            const isStateValid = scheme.state === "All" || state === scheme.state;

            return isAgeValid && isIncomeValid && isStateValid;
        });

        const response = matchingSchemes.length > 0
            ? { success: true, schemes: matchingSchemes }
            : { success: false, message: "No matching scheme found for the provided details." };

        // Cache the result for 1 minute
        client.setex(cacheKey, 60, JSON.stringify(response));

        logger.info(`Found ${matchingSchemes.length} matching schemes`);
        res.json(response);
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
