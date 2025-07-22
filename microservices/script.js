const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of service directories (you can also dynamically read them from the current directory)
const services = ['iam', 'inventory', 'logistics', 'sales', 'warehouse'];

services.forEach(service => {
    const servicePath = path.join(__dirname, service, 'app.js');

    // Check if app.js exists in the folder
    if (fs.existsSync(servicePath)) {
        console.log(`Starting nodemon for ${service}...`);

        const proc = spawn('npx', ['nodemon', 'app.js'], {
            cwd: path.join(__dirname, service),
            stdio: 'inherit', // Inherit output so you see logs in the terminal
            shell: true, // Needed on some systems for npx to work correctly
        });

        proc.on('error', (err) => {
            console.error(`Failed to start ${service}:`, err);
        });

        proc.on('exit', (code) => {
            console.log(`${service} exited with code ${code}`);
        });

    } else {
        console.warn(`app.js not found in ${service}, skipping...`);
    }
});
