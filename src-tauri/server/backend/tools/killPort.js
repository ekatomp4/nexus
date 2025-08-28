const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function killPort(port) {
    try {
        // Find all PIDs listening on the port
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        if (!stdout) return;

        const lines = stdout.trim().split('\n');
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[4]; // PID is the last column
            console.log(`Killing process ${pid} on port ${port}`);
            try {
                await execAsync(`taskkill /F /PID ${pid}`);
            } catch (err) {
                console.error(`Failed to kill PID ${pid}:`, err.message);
            }
        }
    } catch (err) {
        // No process found, ignore
    }
}

module.exports = killPort;
