require('dotenv').config();

const { spawn } = require('child_process');
const express = require('express');
const helmet = require('helmet');
const os = require('os');
const publicIp = require('public-ip');
const si = require('systeminformation');
const WebSocket = require('ws');

let info = {};

// run webserver

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/info', (req, res) => {
	res.json(info);
});

app.use((req, res) => {
    return res.status(404).json({ errors: [{ msg: 'Not found' }] });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    return res.status(500).json({ errors: [{ msg: 'Internal server error' }] });
});

const server = app.listen(port, () => console.log(`Server listening on port ${ port }...`));

const wss = new WebSocket.Server({ server });

// build static info object

info.hostname = os.hostname();

if (process.env.HIDE_IP !== 'true') {
	publicIp.v4().then(ip => {
		info.ip = ip;
	});
}

si.osInfo(o => {
	info.arch = o.arch;
	info.distro = o.distro;
	info.release = o.release;
	info.kernel = o.kernel;
});

// build dynamic data object

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