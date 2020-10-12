const { spawn } = require('child_process');
const os = require('os');
const publicIp = require('public-ip');
const si = require('systeminformation');

const static = {
    arch: null,
    distro: null,
    hostname: null,
    ip: null,
    kernel: null,
    release: null
};

const dynamic = {
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
    },
    time: {
        uptime: null
    }
};

const buildStaticObject = async () => {
    static.hostname = os.hostname();
    if (process.env.HIDE_IP !== 'true') {
        publicIp.v4().then(ip => {
            static.ip = ip;
        });
    }
    si.osInfo(o => {
        static.arch = o.arch;
        static.distro = o.distro;
        static.release = o.release;
        static.kernel = o.kernel;
    });
}

const buildDynamicObject = () => {
    // CPU
    dynamic.cpu.cores = os.cpus().map(c => c.speed);
    dynamic.cpu.loadavg = os.loadavg();
    spawn('sh', [
        '-c',
        'top -bn1 | '
            + 'grep "Cpu(s)" | '
            + 'sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | '
            + 'awk "{print 100 - \\$1}"'
    ]).stdout.on('data', o => {
        while (dynamic.cpu.nodes.length >= 60) {
            dynamic.cpu.nodes.shift();
        }
        dynamic.cpu.nodes.push(parseFloat(o));
    });
    si.cpuTemperature(o => {
        dynamic.cpu.temp = Math.round(o.main);
    });
    // memory
    si.mem(o => {
        dynamic.memory.memUsed = Math.round(o.active / 1000000);
        dynamic.memory.memTotal = Math.round(o.total / 1000000);
        dynamic.memory.swapUsed = Math.round(o.swapused / 1000000);
        dynamic.memory.swapTotal = Math.round(o.swaptotal / 1000000);
    });
    // uptime
    dynamic.time.uptime = si.time().uptime;
}

buildStaticObject();
setInterval(() => buildDynamicObject(), 750);

module.exports = {
    getDynamic: async (req, res) => {
        return res.json(dynamic)
    },
    getStatic: async (req, res) => {
        return res.json(static)
    }
};