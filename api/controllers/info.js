const os = require('os');
const publicIp = require('public-ip');
const si = require('systeminformation');

let info = {};

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

const getStatic = async (req, res) => {
    return res.json(info);
};

module.exports = {
    getStatic
};