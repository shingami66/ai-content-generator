const dns = require('dns');

const hostname = 'cluster524.lmxwqmv.mongodb.net';
const srvName = '_mongodb._tcp.' + hostname;

console.log(`Resolving SRV record for: ${srvName}`);

dns.resolveSrv(srvName, (err, addresses) => {
    if (err) {
        console.error('❌ SRV Resolution Error:', err);

        console.log('Trying generic resolve...');
        dns.resolve(hostname, (err2, addresses2) => {
            if (err2) {
                console.error('❌ Generic Resolution Error:', err2);
            } else {
                console.log('✅ Generic Resolution Success:', addresses2);
            }
        });
    } else {
        console.log('✅ SRV Resolution Success:', addresses);
    }
});
