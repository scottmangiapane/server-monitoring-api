require('dotenv').config();
require('express-async-errors');

const { spawn } = require('child_process');
const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const os = require('os');
const session = require('express-session');
const si = require('systeminformation');
const swaggerUI = require('swagger-ui-express');
const WebSocket = require('ws');
const YAML = require('yamljs');

const RateLimiter = require('./api/utils/rate-limiter');
const { blocker, punisher } = new RateLimiter({
    maxTokens: 60,
    seconds: 60
});

const { redisClient } = require('./api/utils/redis');
const RedisStore = require('connect-redis')(session);

const basePath = `/${ process.env.BASE_PATH || '' }`.replace(/\/+/g, '/');
const port = process.env.PORT || 3000;

const app = express();
const router = express.Router();
const swagger = YAML.load('./swagger.yaml');

swagger.servers = [{ url: basePath }];

app.use(helmet());

// run webserver

app.set('trust proxy', true);
app.use(session({
    cookie: {
        httpOnly: true,
        maxAge: 10 * 60 * 1000,
        secure: process.env.DEVELOPMENT !== 'true',
        sameSite: process.env.DEVELOPMENT !== 'true'
    },
    name: 'session',
    resave: false,
    rolling: true,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: new RedisStore({ client: redisClient })
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger('dev'));

router.use('/', swaggerUI.serve);
router.get('/', swaggerUI.setup(swagger, {
    customCss: '.swagger-ui .topbar { display: none }'
}));

router.use(blocker, punisher);

router.use('/accounts', require('./api/routes/accounts'));
router.use('/auth', require('./api/routes/auth'));
router.use('/info', require('./api/routes/info'));

app.use(basePath, router);

app.use((req, res) => {
    return res.status(404).json({ errors: [{ msg: 'Not found' }] });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    return res.status(500).json({ errors: [{ msg: 'Internal server error' }] });
});

const server = app.listen(port, () => console.log(`Server is running...`));

// build dynamic data object

const wss = new WebSocket.Server({ server });

const data = {
	cpu: {
		cores: [],
		loadavg: [],
		nodes: [],
		temp: null
	},
	memory: {
		memTotal: null,
		memUsed: null,
		swapTotal: null,
		swapUsed: null
	}
};

setInterval(() => {
	// CPU
	data.cpu.cores = os.cpus().map(c => c.speed);
	data.cpu.loadavg = os.loadavg();
	spawn('sh', [
		'-c',
		'top -bn1 | '
			+ 'grep "Cpu(s)" | '
			+ 'sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | '
			+ 'awk "{print 100 - \\$1}"'
	]).stdout.on('data', o => {
		while (data.cpu.nodes.length >= 60) {
			data.cpu.nodes.shift();
		}
		data.cpu.nodes.push(parseFloat(o));
	});
	si.cpuTemperature(o => {
		data.cpu.temp = Math.round(o.main);
	});
	// memory
	si.mem(o => {
		data.memory.memUsed = Math.round(o.active / 1000000);
		data.memory.memTotal = Math.round(o.total / 1000000);
		data.memory.swapUsed = Math.round(o.swapused / 1000000);
		data.memory.swapTotal = Math.round(o.swaptotal / 1000000);
	});
	// send data to clients
	wss.clients.forEach(client => {
		client.send(JSON.stringify(data));
	});
}, 1000);
